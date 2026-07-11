import type { ReportColumn, ReportDocument } from "@/lib/export";
import { COMPANY_NAME, getLogoDataUrl, formatGeneratedAt, slugify, triggerDownload } from "@/lib/reportBranding";

type RowRecord = Record<string, string | number>;

const BRAND_RED_ARGB = "FFCC141A";
const GRAY_ARGB = "FF6B7280";
const MUTED_ARGB = "FF9CA3AF";

export async function generateExcel(doc: ReportDocument): Promise<Blob> {
    const ExcelJS = (await import("exceljs")).default;

    const workbook = new ExcelJS.Workbook();
    workbook.creator = COMPANY_NAME;
    workbook.created = new Date();

    const sheet = workbook.addWorksheet((doc.title || "Report").slice(0, 31) || "Report");

    let currentRow = 1;
    let logoEmbedded = false;
    try {
        const logoDataUrl = await getLogoDataUrl();
        if (logoDataUrl) {
            const base64 = logoDataUrl.split(",")[1];
            const imageId = workbook.addImage({ base64, extension: "png" });
            sheet.addImage(imageId, { tl: { col: 0, row: 0 }, ext: { width: 40, height: 40 } });
            logoEmbedded = true;
        }
    } catch (err) {
        console.error("Excel logo embed failed, falling back to text header:", err);
    }

    sheet.getRow(currentRow).height = 26;
    const companyCell = sheet.getCell(currentRow, logoEmbedded ? 2 : 1);
    companyCell.value = COMPANY_NAME;
    companyCell.font = { bold: true, color: { argb: BRAND_RED_ARGB }, size: 11 };
    currentRow += 1;

    sheet.getCell(currentRow, 1).value = doc.title;
    sheet.getCell(currentRow, 1).font = { bold: true, size: 14 };
    currentRow += 1;

    if (doc.subtitle) {
        sheet.getCell(currentRow, 1).value = doc.subtitle;
        sheet.getCell(currentRow, 1).font = { italic: true, color: { argb: GRAY_ARGB } };
        currentRow += 1;
    }

    const metaParts = [doc.meta?.map(m => `${m.label}: ${m.value}`).join("  |  "), `Generated ${formatGeneratedAt()}`].filter(Boolean);
    sheet.getCell(currentRow, 1).value = metaParts.join("  |  ");
    sheet.getCell(currentRow, 1).font = { size: 9, color: { argb: MUTED_ARGB } };
    currentRow += 2;

    const writeTable = (columns: ReportColumn[], rows: RowRecord[], startRow: number): number => {
        const headerRow = sheet.getRow(startRow);
        columns.forEach((c, i) => {
            const c1 = headerRow.getCell(i + 1);
            c1.value = c.label;
            c1.font = { bold: true, color: { argb: "FFFFFFFF" } };
            c1.fill = { type: "pattern", pattern: "solid", fgColor: { argb: BRAND_RED_ARGB } };
        });
        headerRow.commit();

        rows.forEach((r, ri) => {
            const row = sheet.getRow(startRow + 1 + ri);
            columns.forEach((c, ci) => {
                row.getCell(ci + 1).value = r[c.key] ?? "";
            });
            row.commit();
        });

        columns.forEach((c, i) => {
            const maxLen = Math.max(c.label.length, ...rows.map(r => String(r[c.key] ?? "").length), 0);
            const col = sheet.getColumn(i + 1);
            col.width = Math.min(Math.max(maxLen + 2, 10), 40);
        });

        return startRow + 1 + rows.length;
    };

    if (doc.columns && doc.rows) {
        writeTable(doc.columns, doc.rows, currentRow);
    } else if (doc.sections) {
        for (const section of doc.sections) {
            if (section.heading) {
                sheet.getCell(currentRow, 1).value = section.heading;
                sheet.getCell(currentRow, 1).font = { bold: true, size: 12 };
                currentRow += 1;
            }
            if (section.kind === "table") {
                currentRow = writeTable(section.columns, section.rows, currentRow) + 1;
            } else if (section.kind === "keyvalue") {
                for (const f of section.fields) {
                    sheet.getCell(currentRow, 1).value = f.label;
                    sheet.getCell(currentRow, 1).font = { bold: true, color: { argb: GRAY_ARGB } };
                    sheet.getCell(currentRow, 2).value = f.value;
                    currentRow += 1;
                }
                currentRow += 1;
            } else {
                sheet.getCell(currentRow, 1).value = section.text;
                sheet.getCell(currentRow, 1).alignment = { wrapText: true };
                currentRow += 2;
            }
        }
    }

    const buffer = await workbook.xlsx.writeBuffer();
    return new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export async function downloadExcel(doc: ReportDocument): Promise<void> {
    const blob = await generateExcel(doc);
    triggerDownload(blob, `${slugify(doc.title)}.xlsx`);
}

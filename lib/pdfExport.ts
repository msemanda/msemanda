import type { ReportColumn, ReportDocument } from "@/lib/export";
import { COMPANY_NAME, BRAND_RED_RGB, BRAND_GRAY_RGB, getLogoDataUrl, formatGeneratedAt, slugify, triggerDownload } from "@/lib/reportBranding";

type RowRecord = Record<string, string | number>;

export async function generatePDF(doc: ReportDocument): Promise<Blob> {
    const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
    ]);

    const pdf = new JsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 40;
    let cursorY = 40;

    const logo = await getLogoDataUrl();
    if (logo) {
        try {
            pdf.addImage(logo, "PNG", marginX, cursorY, 28, 28);
        } catch (err) {
            console.error("PDF logo embed failed:", err);
        }
    }
    pdf.setFontSize(9);
    pdf.setTextColor(...BRAND_RED_RGB);
    pdf.setFont("helvetica", "bold");
    pdf.text(COMPANY_NAME.toUpperCase(), marginX + (logo ? 36 : 0), cursorY + 18);

    cursorY += 48;
    pdf.setTextColor(17, 24, 39);
    pdf.setFontSize(16);
    pdf.text(doc.title, marginX, cursorY);
    cursorY += 18;

    if (doc.subtitle) {
        pdf.setFontSize(10);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...BRAND_GRAY_RGB);
        pdf.text(doc.subtitle, marginX, cursorY);
        cursorY += 14;
    }

    const metaParts = [doc.meta?.map(m => `${m.label}: ${m.value}`).join("  ·  "), `Generated ${formatGeneratedAt()}`].filter(Boolean);
    pdf.setFontSize(8.5);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(156, 163, 175);
    pdf.text(metaParts.join("  ·  "), marginX, cursorY);
    cursorY += 18;

    const drawTable = (columns: ReportColumn[], rows: RowRecord[], startY: number): number => {
        autoTable(pdf, {
            startY,
            margin: { left: marginX, right: marginX },
            head: [columns.map(c => c.label)],
            body: rows.length
                ? rows.map(r => columns.map(c => String(r[c.key] ?? "")))
                : [columns.map(() => "")],
            styles: { fontSize: 8.5, cellPadding: 6, textColor: [17, 24, 39] },
            headStyles: { fillColor: BRAND_RED_RGB, textColor: [255, 255, 255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: [250, 250, 250] },
        });
        // jspdf-autotable v5 stamps this on the doc instance after each call.
        return (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    };

    if (doc.columns && doc.rows) {
        drawTable(doc.columns, doc.rows, cursorY);
    } else if (doc.sections) {
        for (const section of doc.sections) {
            if (cursorY > pageHeight - 80) {
                pdf.addPage();
                cursorY = 40;
            }
            if (section.heading) {
                pdf.setFontSize(11);
                pdf.setFont("helvetica", "bold");
                pdf.setTextColor(17, 24, 39);
                pdf.text(section.heading, marginX, cursorY);
                cursorY += 16;
            }
            if (section.kind === "table") {
                cursorY = drawTable(section.columns, section.rows, cursorY) + 16;
            } else if (section.kind === "keyvalue") {
                pdf.setFontSize(9);
                for (const f of section.fields) {
                    pdf.setFont("helvetica", "bold");
                    pdf.setTextColor(...BRAND_GRAY_RGB);
                    pdf.text(`${f.label}:`, marginX, cursorY);
                    pdf.setFont("helvetica", "normal");
                    pdf.setTextColor(17, 24, 39);
                    pdf.text(f.value, marginX + 120, cursorY, { maxWidth: pageWidth - marginX * 2 - 120 });
                    cursorY += 14;
                }
                cursorY += 10;
            } else {
                pdf.setFontSize(9);
                pdf.setFont("helvetica", "normal");
                pdf.setTextColor(17, 24, 39);
                const lines = pdf.splitTextToSize(section.text, pageWidth - marginX * 2) as string[];
                pdf.text(lines, marginX, cursorY);
                cursorY += lines.length * 12 + 10;
            }
        }
    }

    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(156, 163, 175);
        pdf.text(`${COMPANY_NAME} · Page ${i} of ${pageCount}`, marginX, pageHeight - 24);
    }

    return pdf.output("blob");
}

export async function downloadPDF(doc: ReportDocument): Promise<void> {
    const blob = await generatePDF(doc);
    triggerDownload(blob, `${slugify(doc.title)}.pdf`);
}

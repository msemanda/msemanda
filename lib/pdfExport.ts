import type { ReportColumn, ReportDocument } from "@/lib/export";
import { COMPANY_NAME, COMPANY_POSSESSIVE, SLOGAN, BRAND_RED_RGB, BRAND_GRAY_RGB, getLogoDataUrl, formatGeneratedAt, slugify, triggerDownload } from "@/lib/reportBranding";

type RowRecord = Record<string, string | number>;

const BOX_FILL: [number, number, number] = [250, 250, 250];
const BOX_BORDER: [number, number, number] = [229, 231, 235];
const TEXT_DARK: [number, number, number] = [17, 24, 39];
const MUTED: [number, number, number] = [156, 163, 175];

export async function generatePDF(doc: ReportDocument): Promise<Blob> {
    const [{ default: JsPDF }, { default: autoTable }] = await Promise.all([
        import("jspdf"),
        import("jspdf-autotable"),
    ]);

    const pdf = new JsPDF({ unit: "pt", format: "a4" });
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    const marginX = 40;
    const contentWidth = pageWidth - marginX * 2;
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
    pdf.text(COMPANY_NAME.toUpperCase(), marginX + (logo ? 36 : 0), cursorY + 12);
    pdf.setFontSize(7);
    pdf.setFont("helvetica", "normal");
    pdf.setTextColor(...MUTED);
    // English line only — jsPDF's built-in Helvetica font has no Ethiopic/Ge'ez
    // glyphs, so the logo's translated line ("ንሕና ንሕክም ኣምላኹ ይምሕር") would render
    // as blank boxes here. The preview, print, and Excel outputs all show both
    // lines since browsers/Excel have proper Unicode font fallback.
    pdf.text(SLOGAN, marginX + (logo ? 36 : 0), cursorY + 22);

    // Letterhead divider — matches the print/preview header rule.
    cursorY += 38;
    pdf.setDrawColor(...BRAND_RED_RGB);
    pdf.setLineWidth(1.5);
    pdf.line(marginX, cursorY, pageWidth - marginX, cursorY);

    cursorY += 22;
    pdf.setTextColor(...TEXT_DARK);
    pdf.setFontSize(16);
    pdf.setFont("helvetica", "bold");
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
    pdf.setTextColor(...MUTED);
    pdf.text(metaParts.join("  ·  "), marginX, cursorY);
    cursorY += 20;

    const ensureSpace = (needed: number) => {
        if (cursorY + needed > pageHeight - 60) {
            pdf.addPage();
            cursorY = 40;
        }
    };

    const drawTable = (columns: ReportColumn[], rows: RowRecord[], startY: number): number => {
        autoTable(pdf, {
            startY,
            margin: { left: marginX, right: marginX },
            theme: "grid",
            head: [columns.map(c => c.label)],
            body: rows.length
                ? rows.map(r => columns.map(c => String(r[c.key] ?? "")))
                : [columns.map(() => "")],
            styles: { fontSize: 8.5, cellPadding: 6, textColor: TEXT_DARK, lineColor: BOX_BORDER, lineWidth: 0.75 },
            headStyles: { fillColor: BRAND_RED_RGB, textColor: [255, 255, 255], fontStyle: "bold" },
            alternateRowStyles: { fillColor: BOX_FILL },
        });
        // jspdf-autotable v5 stamps this on the doc instance after each call.
        return (pdf as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
    };

    /** Draws a bordered "card" behind a keyvalue block or free text — the segmented look that makes a document read as distinct zones. */
    const drawBoxedKeyValue = (heading: string | undefined, fields: { label: string; value: string }[]): number => {
        const padding = 10;
        const headingH = heading ? 14 : 0;
        const rowH = 15;
        const boxH = padding * 2 + headingH + fields.length * rowH;
        ensureSpace(boxH + 12);
        const y = cursorY;

        pdf.setFillColor(...BOX_FILL);
        pdf.setDrawColor(...BOX_BORDER);
        pdf.setLineWidth(0.75);
        pdf.roundedRect(marginX, y, contentWidth, boxH, 4, 4, "FD");

        let ty = y + padding + 8;
        if (heading) {
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(...MUTED);
            pdf.text(heading.toUpperCase(), marginX + padding, ty);
            ty += headingH;
        }
        pdf.setFontSize(9);
        for (const f of fields) {
            pdf.setFont("helvetica", "normal");
            pdf.setTextColor(...BRAND_GRAY_RGB);
            pdf.text(f.label, marginX + padding, ty);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(...TEXT_DARK);
            pdf.text(f.value, pageWidth - marginX - padding, ty, { align: "right", maxWidth: contentWidth * 0.55 });
            ty += rowH;
        }
        return y + boxH;
    };

    const drawBoxedText = (heading: string | undefined, text: string): number => {
        const padding = 10;
        const headingH = heading ? 14 : 0;
        const lines = pdf.splitTextToSize(text, contentWidth - padding * 2) as string[];
        const boxH = padding * 2 + headingH + lines.length * 12;
        ensureSpace(boxH + 12);
        const y = cursorY;

        pdf.setFillColor(...BOX_FILL);
        pdf.setDrawColor(...BOX_BORDER);
        pdf.setLineWidth(0.75);
        pdf.roundedRect(marginX, y, contentWidth, boxH, 4, 4, "FD");

        let ty = y + padding + 8;
        if (heading) {
            pdf.setFontSize(8);
            pdf.setFont("helvetica", "bold");
            pdf.setTextColor(...MUTED);
            pdf.text(heading.toUpperCase(), marginX + padding, ty);
            ty += headingH;
        }
        pdf.setFontSize(9);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...TEXT_DARK);
        pdf.text(lines, marginX + padding, ty);
        return y + boxH;
    };

    if (doc.columns && doc.rows) {
        drawTable(doc.columns, doc.rows, cursorY);
    } else if (doc.sections) {
        for (const section of doc.sections) {
            if (section.kind === "table") {
                if (section.heading) {
                    ensureSpace(30);
                    pdf.setFontSize(8);
                    pdf.setFont("helvetica", "bold");
                    pdf.setTextColor(...MUTED);
                    pdf.text(section.heading.toUpperCase(), marginX, cursorY);
                    cursorY += 12;
                }
                cursorY = drawTable(section.columns, section.rows, cursorY) + 14;
            } else if (section.kind === "keyvalue") {
                cursorY = drawBoxedKeyValue(section.heading, section.fields) + 14;
            } else {
                cursorY = drawBoxedText(section.heading, section.text) + 14;
            }
        }
    }

    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setDrawColor(...BOX_BORDER);
        pdf.setLineWidth(0.5);
        pdf.line(marginX, pageHeight - 40, pageWidth - marginX, pageHeight - 40);
        pdf.setFontSize(8);
        pdf.setFont("helvetica", "normal");
        pdf.setTextColor(...MUTED);
        pdf.text(`${COMPANY_NAME} · Page ${i} of ${pageCount}`, marginX, pageHeight - 26);
        pdf.setFontSize(6.5);
        pdf.setTextColor(209, 213, 219);
        pdf.text(`This is a system-generated document from ${COMPANY_POSSESSIVE} e-Health platform.`, marginX, pageHeight - 16);
    }

    return pdf.output("blob");
}

export async function downloadPDF(doc: ReportDocument): Promise<void> {
    const blob = await generatePDF(doc);
    triggerDownload(blob, `${slugify(doc.title)}.pdf`);
}

import { COMPANY_NAME, COMPANY_POSSESSIVE, LOGO_PATH, PRINT_STYLES, SLOGAN, SLOGAN_TRANSLATION, formatGeneratedAt, slugify, triggerDownload } from "@/lib/reportBranding";

export interface ReportColumn {
    key: string;
    label: string;
}

export interface ReportMetaItem {
    label: string;
    value: string;
}

export interface ReportKeyValueField {
    label: string;
    value: string;
}

export type ReportSection =
    | { kind: "table"; heading?: string; columns: ReportColumn[]; rows: Record<string, string | number>[] }
    | { kind: "keyvalue"; heading?: string; fields: ReportKeyValueField[] }
    | { kind: "text"; heading?: string; text: string };

/** A report is either simple tabular data (columns/rows) or a richer multi-section document (e.g. a single lab/radiology record). */
export interface ReportDocument {
    title: string;
    subtitle?: string;
    meta?: ReportMetaItem[];
    columns?: ReportColumn[];
    rows?: Record<string, string | number>[];
    sections?: ReportSection[];
}

/** Alias kept for backward compatibility — existing call sites pass {title, subtitle, columns, rows}, which is a valid ReportDocument. */
export type ReportData = ReportDocument;

function cell(v: string | number | undefined): string {
    if (v === undefined || v === null) return "";
    return String(v);
}

function csvEscape(v: string): string {
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
}

function csvRow(values: string[]): string {
    return values.map(csvEscape).join(",");
}

function tableToCsvLines(columns: ReportColumn[], rows: Record<string, string | number>[]): string[] {
    return [csvRow(columns.map(c => c.label)), ...rows.map(r => csvRow(columns.map(c => cell(r[c.key]))))];
}

function sectionsToCsvLines(sections: ReportSection[]): string[] {
    const lines: string[] = [];
    for (const section of sections) {
        if (section.heading) lines.push(csvRow([section.heading]));
        if (section.kind === "table") {
            lines.push(...tableToCsvLines(section.columns, section.rows));
        } else if (section.kind === "keyvalue") {
            for (const f of section.fields) lines.push(csvRow([f.label, f.value]));
        } else {
            lines.push(csvRow([section.text]));
        }
        lines.push("");
    }
    return lines;
}

export function downloadCSV(doc: ReportDocument): void {
    const lines: string[] = [];
    if (doc.columns && doc.rows) {
        lines.push(...tableToCsvLines(doc.columns, doc.rows));
    } else if (doc.sections) {
        lines.push(...sectionsToCsvLines(doc.sections));
    }
    const csv = [csvRow([doc.title]), "", ...lines].join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    triggerDownload(blob, `${slugify(doc.title)}.csv`);
}

function escapeHtml(v: string): string {
    return v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function tableToHtml(columns: ReportColumn[], rows: Record<string, string | number>[]): string {
    const theadCells = columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join("");
    const bodyRows = rows
        .map(r => `<tr>${columns.map(c => `<td>${escapeHtml(cell(r[c.key]))}</td>`).join("")}</tr>`)
        .join("");
    return `<table><thead><tr>${theadCells}</tr></thead><tbody>${bodyRows || `<tr><td colspan="${columns.length}" style="text-align:center;color:#9ca3af;padding:20px;">No data</td></tr>`}</tbody></table>`;
}

function sectionsToHtml(sections: ReportSection[]): string {
    return sections
        .map(section => {
            const heading = section.heading ? `<p class="section-heading">${escapeHtml(section.heading)}</p>` : "";
            let body: string;
            if (section.kind === "table") {
                body = tableToHtml(section.columns, section.rows);
            } else if (section.kind === "keyvalue") {
                const rows = section.fields
                    .map(f => `<div class="kv-row"><span class="kv-label">${escapeHtml(f.label)}</span><span class="kv-value">${escapeHtml(f.value)}</span></div>`)
                    .join("");
                body = `<div class="kv-grid">${rows}</div>`;
            } else {
                body = `<p class="section-text">${escapeHtml(section.text)}</p>`;
            }
            return `<div class="section-box">${heading}${body}</div>`;
        })
        .join("");
}

/** Single shared print/PDF-via-browser template — replaces the previously divergent print implementations. */
export function printReportDocument(doc: ReportDocument): void {
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) return;

    const generatedAt = formatGeneratedAt();
    const metaLine = doc.meta?.length
        ? doc.meta.map(m => `${m.label}: ${m.value}`).join(" · ") + " · "
        : "";

    const body = doc.columns && doc.rows
        ? `<div class="section-box">${tableToHtml(doc.columns, doc.rows)}</div>`
        : doc.sections
            ? sectionsToHtml(doc.sections)
            : "";

    win.document.write(`
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(doc.title)}</title>
<style>${PRINT_STYLES}</style>
</head>
<body>
    <div class="report-header">
        <img src="${LOGO_PATH}" alt="${escapeHtml(COMPANY_NAME)}" />
        <div>
            <div class="report-company">${escapeHtml(COMPANY_NAME)}</div>
            <div class="report-slogan">${escapeHtml(SLOGAN)}</div>
            <div class="report-slogan-translation">${escapeHtml(SLOGAN_TRANSLATION)}</div>
        </div>
    </div>
    <h1>${escapeHtml(doc.title)}</h1>
    ${doc.subtitle ? `<p class="subtitle">${escapeHtml(doc.subtitle)}</p>` : ""}
    <p class="meta">${escapeHtml(metaLine)}Generated ${escapeHtml(generatedAt)}</p>
    ${body}
    <div class="report-footer">
        <div>${escapeHtml(COMPANY_NAME)} · Generated ${escapeHtml(generatedAt)}</div>
        <div class="report-footer-disclaimer">This is a system-generated document from ${escapeHtml(COMPANY_POSSESSIVE)} e-Health platform.</div>
    </div>
</body>
</html>
    `);
    win.document.close();
    win.focus();
    win.onload = () => win.print();
    // Fallback in case onload doesn't fire (already-loaded blank doc in some browsers)
    setTimeout(() => win.print(), 300);
}

/** @deprecated use printReportDocument — kept as a thin alias in case of untracked call sites. */
export const printReport = printReportDocument;

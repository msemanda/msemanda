export interface ReportColumn {
    key: string;
    label: string;
}

export interface ReportData {
    title: string;
    subtitle?: string;
    columns: ReportColumn[];
    rows: Record<string, string | number>[];
}

function cell(v: string | number | undefined): string {
    if (v === undefined || v === null) return "";
    return String(v);
}

function csvEscape(v: string): string {
    if (/[",\n]/.test(v)) return `"${v.replace(/"/g, '""')}"`;
    return v;
}

export function downloadCSV({ title, columns, rows }: ReportData): void {
    const header = columns.map(c => csvEscape(c.label)).join(",");
    const lines = rows.map(r => columns.map(c => csvEscape(cell(r[c.key]))).join(","));
    const csv = [header, ...lines].join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${slugify(title)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export function printReport({ title, subtitle, columns, rows }: ReportData): void {
    const win = window.open("", "_blank", "width=900,height=1000");
    if (!win) return;

    const generatedAt = new Date().toLocaleString();
    const escapeHtml = (v: string) =>
        v.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

    const theadCells = columns.map(c => `<th>${escapeHtml(c.label)}</th>`).join("");
    const bodyRows = rows
        .map(r => `<tr>${columns.map(c => `<td>${escapeHtml(cell(r[c.key]))}</td>`).join("")}</tr>`)
        .join("");

    win.document.write(`
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<title>${escapeHtml(title)}</title>
<style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #111827; margin: 32px; }
    h1 { font-size: 20px; font-weight: 800; margin: 0 0 2px; }
    p.subtitle { font-size: 12px; color: #6b7280; margin: 0 0 4px; }
    p.meta { font-size: 11px; color: #9ca3af; margin: 0 0 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10px; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding: 8px 10px; }
    td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
    tr:nth-child(even) td { background: #fafafa; }
    @media print { body { margin: 12mm; } }
</style>
</head>
<body>
    <h1>${escapeHtml(title)}</h1>
    ${subtitle ? `<p class="subtitle">${escapeHtml(subtitle)}</p>` : ""}
    <p class="meta">Generated ${escapeHtml(generatedAt)}</p>
    <table>
        <thead><tr>${theadCells}</tr></thead>
        <tbody>${bodyRows || `<tr><td colspan="${columns.length}" style="text-align:center;color:#9ca3af;padding:20px;">No data</td></tr>`}</tbody>
    </table>
</body>
</html>
    `);
    win.document.close();
    win.focus();
    win.onload = () => win.print();
    // Fallback in case onload doesn't fire (already-loaded blank doc in some browsers)
    setTimeout(() => win.print(), 300);
}

function slugify(s: string): string {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "report";
}

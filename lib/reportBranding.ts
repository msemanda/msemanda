export const COMPANY_NAME = "RHD Medical Services";
export const LOGO_PATH = "/imgs/logo-mark.png";

// Sampled from app/globals.css brand tokens (jsPDF/exceljs need raw hex/RGB, not CSS vars).
export const BRAND_RED = "#cc141a";
export const BRAND_RED_RGB: [number, number, number] = [204, 20, 26];
export const BRAND_TEAL = "#40697d";
export const BRAND_TEAL_RGB: [number, number, number] = [64, 105, 125];
export const BRAND_GRAY_RGB: [number, number, number] = [107, 114, 128];

let cachedLogoDataUrl: Promise<string | null> | null = null;

/** Fetches the app logo and memoizes it as a base64 data URL for embedding in PDF/Excel exports. */
export function getLogoDataUrl(): Promise<string | null> {
    if (!cachedLogoDataUrl) {
        cachedLogoDataUrl = fetch(LOGO_PATH)
            .then((res) => {
                if (!res.ok) throw new Error(`Logo fetch failed: ${res.status}`);
                return res.blob();
            })
            .then(
                (blob) =>
                    new Promise<string>((resolve, reject) => {
                        const reader = new FileReader();
                        reader.onloadend = () => resolve(reader.result as string);
                        reader.onerror = reject;
                        reader.readAsDataURL(blob);
                    })
            )
            .catch((err) => {
                console.error("Failed to load logo for report export:", err);
                return null;
            });
    }
    return cachedLogoDataUrl;
}

export function formatGeneratedAt(date: Date = new Date()): string {
    return date.toLocaleString();
}

export function slugify(s: string): string {
    return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "report";
}

export function triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

export const PRINT_STYLES = `
    * { box-sizing: border-box; }
    body { font-family: -apple-system, Segoe UI, Roboto, sans-serif; color: #111827; margin: 32px; }
    .report-header { display: flex; align-items: center; gap: 12px; margin-bottom: 18px; }
    .report-header img { height: 40px; width: 40px; border-radius: 9999px; object-fit: cover; }
    .report-company { font-size: 11px; font-weight: 800; color: ${BRAND_RED}; text-transform: uppercase; letter-spacing: 0.06em; }
    h1 { font-size: 20px; font-weight: 800; margin: 0 0 2px; }
    p.subtitle { font-size: 12px; color: #6b7280; margin: 0 0 4px; }
    p.meta { font-size: 11px; color: #9ca3af; margin: 0 0 20px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; margin-bottom: 16px; }
    th { text-align: left; text-transform: uppercase; letter-spacing: 0.04em; font-size: 10px; color: #6b7280; border-bottom: 1px solid #e5e7eb; padding: 8px 10px; }
    td { padding: 8px 10px; border-bottom: 1px solid #f3f4f6; }
    tr:nth-child(even) td { background: #fafafa; }
    .section-heading { font-size: 13px; font-weight: 800; margin: 18px 0 8px; color: #111827; }
    .kv-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 6px 24px; margin-bottom: 16px; }
    .kv-row { font-size: 12px; display: flex; gap: 6px; }
    .kv-label { color: #6b7280; font-weight: 600; }
    .kv-value { color: #111827; }
    .section-text { font-size: 12px; white-space: pre-wrap; margin-bottom: 16px; }
    .report-footer { margin-top: 24px; font-size: 10px; color: #9ca3af; }
    @media print {
        body { margin: 12mm; }
        .no-print { display: none !important; }
    }
`;

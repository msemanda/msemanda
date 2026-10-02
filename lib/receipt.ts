import type { ReportDocument, ReportSection } from "@/lib/export";
import { fmtDateTime } from "@/lib/ts";
import { CURRENCY, generateReceiptNo } from "@/helpers/constants";
import { COMPANY_NAME } from "@/lib/reportBranding";

export interface ReceiptLineItem {
    description: string;
    category?: string;
    amount: number;
}

export interface ReceiptInput {
    title: string;
    receiptNo?: string;
    patientName?: string;
    /** One or more billed items — a single-item array renders identically to the old flat-field receipt; multiple items render as a proper itemized bill. */
    items: ReceiptLineItem[];
    paymentMethod?: string;
    recordedBy?: string;
    date?: unknown;
    notes?: string;
}

/**
 * Shared receipt shape for cashier/reception/fee modules — segmented into the
 * same zones a real receipt has (receipt info, billed-to, itemized lines,
 * payment, notes) rather than one flat list, and rendered through the same
 * ReportPreviewModal (logo, segmented section cards, PDF/Excel/CSV/Print) as
 * every other report in the app.
 */
export function buildReceiptDocument(input: ReceiptInput): ReportDocument {
    const receiptNo = input.receiptNo || generateReceiptNo();
    const total = input.items.reduce((sum, item) => sum + item.amount, 0);

    const sections: ReportSection[] = [
        {
            kind: "keyvalue",
            heading: "Receipt Details",
            fields: [
                { label: "Receipt No.", value: receiptNo },
                { label: "Date", value: fmtDateTime(input.date ?? new Date()) },
            ],
        },
    ];

    if (input.patientName) {
        sections.push({
            kind: "keyvalue",
            heading: "Billed To",
            fields: [{ label: "Patient", value: input.patientName }],
        });
    }

    sections.push({
        kind: "table",
        heading: input.items.length > 1 ? `Items (${input.items.length})` : "Item",
        columns: [
            { key: "description", label: "Description" },
            { key: "category", label: "Category" },
            { key: "amount", label: "Amount" },
        ],
        rows: input.items.map(item => ({
            description: item.description,
            category: item.category || "—",
            amount: `${CURRENCY} ${item.amount.toLocaleString()}`,
        })),
    });

    const paymentFields = [{ label: "Total Paid", value: `${CURRENCY} ${total.toLocaleString()}` }];
    if (input.paymentMethod) paymentFields.push({ label: "Payment Method", value: input.paymentMethod.replace(/_/g, " ") });
    if (input.recordedBy) paymentFields.push({ label: "Issued By", value: input.recordedBy });
    sections.push({ kind: "keyvalue", heading: "Payment", fields: paymentFields });

    if (input.notes) sections.push({ kind: "text", heading: "Notes", text: input.notes });

    sections.push({
        kind: "text",
        text: `Thank you for choosing ${COMPANY_NAME}. This is a system-generated receipt and does not require a signature or stamp to be valid.`,
    });

    return {
        title: input.title,
        meta: [{ label: "Receipt No.", value: receiptNo }],
        sections,
    };
}

import type { ReportDocument, ReportSection } from "@/lib/export";
import { fmtDateTime } from "@/lib/ts";
import { CURRENCY, generateReceiptNo } from "@/helpers/constants";

export interface ReceiptInput {
    title: string;
    receiptNo?: string;
    patientName?: string;
    description: string;
    category?: string;
    amount: number;
    paymentMethod?: string;
    recordedBy?: string;
    date?: unknown;
    notes?: string;
}

/**
 * Shared receipt shape for cashier/reception/fee modules — segmented into the
 * same zones a real receipt has (receipt info, billed-to, itemized line,
 * payment, notes) rather than one flat list, and rendered through the same
 * ReportPreviewModal (logo, segmented section cards, PDF/Excel/CSV/Print) as
 * every other report in the app.
 */
export function buildReceiptDocument(input: ReceiptInput): ReportDocument {
    const receiptNo = input.receiptNo || generateReceiptNo();
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
        heading: "Item",
        columns: [
            { key: "description", label: "Description" },
            { key: "category", label: "Category" },
            { key: "amount", label: "Amount" },
        ],
        rows: [{
            description: input.description,
            category: input.category || "—",
            amount: `${CURRENCY} ${input.amount.toLocaleString()}`,
        }],
    });

    const paymentFields = [{ label: "Total Paid", value: `${CURRENCY} ${input.amount.toLocaleString()}` }];
    if (input.paymentMethod) paymentFields.push({ label: "Payment Method", value: input.paymentMethod.replace(/_/g, " ") });
    if (input.recordedBy) paymentFields.push({ label: "Issued By", value: input.recordedBy });
    sections.push({ kind: "keyvalue", heading: "Payment", fields: paymentFields });

    if (input.notes) sections.push({ kind: "text", heading: "Notes", text: input.notes });

    sections.push({
        kind: "text",
        text: "Thank you for choosing RHD Medical Services. This is a system-generated receipt and does not require a signature or stamp to be valid.",
    });

    return {
        title: input.title,
        meta: [{ label: "Receipt No.", value: receiptNo }],
        sections,
    };
}

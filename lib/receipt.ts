import type { ReportDocument, ReportKeyValueField, ReportSection } from "@/lib/export";
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

/** Shared receipt shape for cashier/reception/fee modules — renders via the same ReportPreviewModal (logo, PDF/Excel/CSV/Print) as everything else exported in the app. */
export function buildReceiptDocument(input: ReceiptInput): ReportDocument {
    const fields: ReportKeyValueField[] = [
        { label: "Receipt No.", value: input.receiptNo || generateReceiptNo() },
        { label: "Date", value: fmtDateTime(input.date ?? new Date()) },
    ];
    if (input.patientName) fields.push({ label: "Patient", value: input.patientName });
    fields.push({ label: "Description", value: input.description });
    if (input.category) fields.push({ label: "Category", value: input.category });
    fields.push({ label: "Amount", value: `${CURRENCY} ${input.amount.toLocaleString()}` });
    if (input.paymentMethod) fields.push({ label: "Payment Method", value: input.paymentMethod.replace(/_/g, " ") });
    if (input.recordedBy) fields.push({ label: "Issued By", value: input.recordedBy });

    const sections: ReportSection[] = [{ kind: "keyvalue", fields }];
    if (input.notes) sections.push({ kind: "text", heading: "Notes", text: input.notes });

    return { title: input.title, sections };
}

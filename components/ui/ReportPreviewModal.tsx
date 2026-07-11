"use client";

import { useState } from "react";
import { FileSpreadsheet, FileText, Printer, Loader2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Table, TableHead, TableRow, TableHeaderCell, TableBody, TableCell, TableEmptyState } from "@/components/ui/Table";
import { Button } from "@/components/ui/Button";
import { Logo } from "@/components/ui/Logo";
import { downloadCSV, printReportDocument, type ReportDocument } from "@/lib/export";

interface ReportPreviewModalProps {
    open: boolean;
    onClose: () => void;
    data: ReportDocument;
}

type ExportFormat = "csv" | "excel" | "pdf" | "print";

/** Wraps a section's content in the same bordered "card" the PDF/print output uses, so a document reads as distinct zones (billed-to, line items, payment, notes...) rather than one long list. */
function SectionBox({ heading, children }: { heading?: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            {heading && <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2.5">{heading}</p>}
            {children}
        </div>
    );
}

export function ReportPreviewModal({ open, onClose, data }: ReportPreviewModalProps) {
    const [busy, setBusy] = useState<ExportFormat | null>(null);

    const runExport = async (format: ExportFormat) => {
        setBusy(format);
        try {
            if (format === "csv") downloadCSV(data);
            else if (format === "print") printReportDocument(data);
            else if (format === "pdf") (await import("@/lib/pdfExport")).downloadPDF(data);
            else if (format === "excel") (await import("@/lib/excelExport")).downloadExcel(data);
        } catch (err) {
            console.error(`Export (${format}) failed:`, err);
        } finally {
            setBusy(null);
        }
    };

    const metaLine = [
        data.meta?.map(m => `${m.label}: ${m.value}`).join(" · "),
        `Generated ${new Date().toLocaleString()}`,
    ].filter(Boolean).join(" · ");

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Export preview"
            size="xl"
            footer={
                <>
                    <Button variant="outline" size="sm" onClick={() => runExport("csv")} disabled={busy !== null}>
                        {busy === "csv" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-green-600" />}
                        <span className="ml-1.5">CSV</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => runExport("excel")} disabled={busy !== null}>
                        {busy === "excel" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileSpreadsheet className="h-3.5 w-3.5 text-blue-700" />}
                        <span className="ml-1.5">Excel</span>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => runExport("print")} disabled={busy !== null}>
                        {busy === "print" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Printer className="h-3.5 w-3.5" />}
                        <span className="ml-1.5">Print</span>
                    </Button>
                    <Button variant="primary" size="sm" onClick={() => runExport("pdf")} disabled={busy !== null}>
                        {busy === "pdf" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
                        <span className="ml-1.5">PDF</span>
                    </Button>
                </>
            }
        >
            <div className="rounded-2xl border border-gray-100 p-6 bg-white">
                <div className="flex items-center gap-2.5 pb-4 mb-4 border-b-2 border-blue-600">
                    <Logo size={32} />
                    <div>
                        <p className="text-[11px] font-black text-blue-700 uppercase tracking-wider leading-none">RHD Medical Services</p>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mt-1">Official Document</p>
                    </div>
                </div>
                <h3 className="text-base font-black text-gray-900">{data.title}</h3>
                {data.subtitle && <p className="text-xs text-gray-500 mt-0.5">{data.subtitle}</p>}
                <p className="text-[11px] text-gray-400 mt-1 mb-4">{metaLine}</p>

                <div className="space-y-3">
                    {data.columns && data.rows && (
                        <SectionBox>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        {data.columns.map(c => <TableHeaderCell key={c.key}>{c.label}</TableHeaderCell>)}
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {data.rows.length === 0
                                        ? <TableEmptyState colSpan={data.columns.length} />
                                        : data.rows.map((r, i) => (
                                            <TableRow key={i}>
                                                {data.columns!.map(c => <TableCell key={c.key}>{String(r[c.key] ?? "")}</TableCell>)}
                                            </TableRow>
                                        ))}
                                </TableBody>
                            </Table>
                        </SectionBox>
                    )}

                    {data.sections?.map((section, si) => (
                        <SectionBox key={si} heading={section.heading}>
                            {section.kind === "table" && (
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            {section.columns.map(c => <TableHeaderCell key={c.key}>{c.label}</TableHeaderCell>)}
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {section.rows.length === 0
                                            ? <TableEmptyState colSpan={section.columns.length} />
                                            : section.rows.map((r, ri) => (
                                                <TableRow key={ri}>
                                                    {section.columns.map(c => <TableCell key={c.key}>{String(r[c.key] ?? "")}</TableCell>)}
                                                </TableRow>
                                            ))}
                                    </TableBody>
                                </Table>
                            )}
                            {section.kind === "keyvalue" && (
                                <div className="divide-y divide-dashed divide-gray-200">
                                    {section.fields.map((f, fi) => (
                                        <div key={fi} className="flex items-center justify-between gap-3 py-1.5 text-xs">
                                            <span className="font-semibold text-gray-500 shrink-0">{f.label}</span>
                                            <span className="font-bold text-gray-900 text-right">{f.value}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {section.kind === "text" && (
                                <p className="text-xs text-gray-700 whitespace-pre-wrap leading-relaxed">{section.text}</p>
                            )}
                        </SectionBox>
                    ))}
                </div>

                <div className="mt-5 pt-3 border-t border-gray-100 text-center">
                    <p className="text-[10px] text-gray-400">RHD Medical Services</p>
                    <p className="text-[9px] text-gray-300 italic mt-0.5">This is a system-generated document from RHD Medical Services&apos; e-Health platform.</p>
                </div>
            </div>
        </Modal>
    );
}

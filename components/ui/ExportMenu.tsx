"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { ReportPreviewModal } from "@/components/ui/ReportPreviewModal";
import type { ReportData } from "@/lib/export";

interface ExportMenuProps {
    data: ReportData;
    className?: string;
    variant?: "button" | "icon";
    label?: string;
}

export function ExportMenu({ data, className = "", variant = "button", label = "Export" }: ExportMenuProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            {variant === "icon" ? (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    aria-label={label}
                    className={`h-8 w-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-500 hover:text-blue-700 transition-colors ${className}`}
                >
                    <Download className="h-3.5 w-3.5" />
                </button>
            ) : (
                <button
                    type="button"
                    onClick={() => setOpen(true)}
                    className={`h-10 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold flex items-center gap-2 transition-colors shadow-sm ${className}`}
                >
                    <Download className="h-4 w-4" /> {label}
                </button>
            )}
            <ReportPreviewModal open={open} onClose={() => setOpen(false)} data={data} />
        </>
    );
}

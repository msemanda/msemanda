"use client";

import { useEffect, useRef, useState } from "react";
import { Download, FileSpreadsheet, Printer, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { downloadCSV, printReport, type ReportData } from "@/lib/export";

interface ExportMenuProps {
    data: ReportData;
    className?: string;
}

export function ExportMenu({ data, className = "" }: ExportMenuProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    return (
        <div ref={ref} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="h-10 px-4 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
            >
                <Download className="h-4 w-4" /> Export <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
            </button>
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                        className="absolute right-0 z-50 top-full mt-1.5 w-56 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden"
                    >
                        <button
                            type="button"
                            onClick={() => { downloadCSV(data); setOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            <FileSpreadsheet className="h-4 w-4 text-green-600 shrink-0" />
                            CSV <span className="text-gray-400 font-normal">(Excel-compatible)</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => { printReport(data); setOpen(false); }}
                            className="w-full flex items-center gap-2.5 px-3.5 py-2.5 text-left text-xs font-bold text-gray-700 hover:bg-gray-50 transition-colors border-t border-gray-50"
                        >
                            <Printer className="h-4 w-4 text-red-500 shrink-0" />
                            Print <span className="text-gray-400 font-normal">/ Save as PDF</span>
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

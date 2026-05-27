"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Search, Download, FileText } from "lucide-react";

const reports = [
    { id: "RPT001", patient: "Alice Nakirya", pid: "P006", tests: ["CBC", "CRP", "ESR"], completedAt: "2026-05-27 06:45", doctor: "Dr. Bwire", reportedBy: "Lab Tech Namata", summary: "Anaemia with elevated inflammatory markers. CRP significantly raised." },
    { id: "RPT002", patient: "John Mwesiga", pid: "P001", tests: ["HbA1c", "Fasting Glucose", "Lipid Profile"], completedAt: "2026-05-26 14:30", doctor: "Dr. Katongo", reportedBy: "Lab Tech Ssali", summary: "HbA1c 8.4% — poorly controlled diabetes. LDL elevated at 4.2 mmol/L." },
    { id: "RPT003", patient: "Grace Nakato", pid: "P002", tests: ["Troponin-I", "BNP"], completedAt: "2026-05-25 11:00", doctor: "Dr. Ssekibala", reportedBy: "Lab Tech Namata", summary: "Troponin elevated at 0.8 ng/mL. BNP 480 pg/mL — suggestive of cardiac stress." },
    { id: "RPT004", patient: "Robert Mugisha", pid: "P007", tests: ["Electrolytes", "Renal Function"], completedAt: "2026-05-24 09:15", doctor: "Dr. Katongo", reportedBy: "Lab Tech Ssali", summary: "Na+ 128 mEq/L (low), Creatinine 180 µmol/L. Hyponatraemia with mild AKI." },
];

export default function LabReportsPage() {
    const [search, setSearch] = useState("");
    const filtered = reports.filter(r =>
        r.patient.toLowerCase().includes(search.toLowerCase()) ||
        r.tests.some(t => t.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-amber-600" /> Lab Reports
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{reports.length} finalized reports</p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Search patient or test..." />
            </div>

            <div className="space-y-3">
                {filtered.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center">
                                    <FileText className="h-4 w-4 text-amber-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900">{r.patient}</p>
                                    <p className="text-xs text-gray-400">{r.doctor} · {r.completedAt}</p>
                                </div>
                            </div>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                <Download className="h-3.5 w-3.5" /> PDF
                            </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-3">
                            {r.tests.map(t => (
                                <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">{t}</span>
                            ))}
                        </div>
                        <p className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3">{r.summary}</p>
                        <p className="text-[10px] text-gray-400 mt-2">Reported by {r.reportedBy}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

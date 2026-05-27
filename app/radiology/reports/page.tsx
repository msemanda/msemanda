"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileImage, Search, Download } from "lucide-react";

const reports = [
    { id: "RD003", patient: "James Okello", modality: "X-RAY", bodyPart: "Chest PA", reportedAt: "2026-05-27 09:45", radiologist: "Dr. Lubega", findings: "Bilateral hyperinflation. Flattened hemidiaphragms. No consolidation or effusion.", impression: "Features consistent with COPD. No acute change." },
    { id: "RD007", patient: "John Mwesiga", modality: "CT", bodyPart: "Abdomen", reportedAt: "2026-05-26 15:00", radiologist: "Dr. Lubega", findings: "Liver mildly enlarged. No biliary dilatation. Both kidneys normal size. No free fluid.", impression: "Hepatomegaly — likely fatty liver disease in context of DM." },
    { id: "RD008", patient: "Agnes Nantale", modality: "ULTRASOUND", bodyPart: "Thyroid", reportedAt: "2026-05-25 11:30", radiologist: "Dr. Nalumansi", findings: "Diffusely enlarged hypoechoic thyroid gland. No discrete nodule. Increased vascularity on Doppler.", impression: "Findings suggestive of Hashimoto's thyroiditis." },
];

const MODALITY_COLOR: Record<string, string> = {
    "X-RAY": "bg-blue-50 text-blue-700", CT: "bg-purple-50 text-purple-700",
    MRI: "bg-indigo-50 text-indigo-700", ULTRASOUND: "bg-teal-50 text-teal-700",
};

export default function RadiologyReportsPage() {
    const [search, setSearch] = useState("");
    const filtered = reports.filter(r => r.patient.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <FileImage className="h-6 w-6 text-violet-600" /> Radiology Reports
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{reports.length} finalized reports</p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Search patient..." />
            </div>

            <div className="space-y-4">
                {filtered.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl ${MODALITY_COLOR[r.modality]}`}>{r.modality}</span>
                                <div>
                                    <p className="text-sm font-black text-gray-900">{r.patient} — {r.bodyPart}</p>
                                    <p className="text-xs text-gray-400">{r.radiologist} · {r.reportedAt}</p>
                                </div>
                            </div>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                <Download className="h-3.5 w-3.5" /> PDF
                            </button>
                        </div>
                        <div className="space-y-3">
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Findings</p>
                                <p className="text-xs text-gray-700">{r.findings}</p>
                            </div>
                            <div className="bg-blue-50 rounded-xl p-3">
                                <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider mb-1">Impression</p>
                                <p className="text-xs text-blue-800 font-semibold">{r.impression}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

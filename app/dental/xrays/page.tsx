"use client";

import { motion } from "framer-motion";
import { Scan, Calendar } from "lucide-react";

const xrays = [
    { id: "XR001", patient: "Alice Nakirya", type: "Periapical", tooth: "#36 (Lower left molar)", date: "2026-05-27", tech: "Radiographer Ssali", findings: "Periapical lucency consistent with apical abscess. Pulp space visible.", status: "REPORTED" },
    { id: "XR002", patient: "James Okello", type: "Panoramic (OPG)", tooth: "Full mouth", date: "2026-05-20", tech: "Radiographer Ssali", findings: "Horizontal bone loss #36-#37. No impacted teeth visible.", status: "REPORTED" },
    { id: "XR003", patient: "Fatuma Nakayiza", type: "Periapical", tooth: "#38 (Wisdom tooth)", date: "2026-05-25", tech: "Radiographer Ssali", findings: "Horizontally impacted lower wisdom tooth. Adjacent tooth root not involved.", status: "REPORTED" },
    { id: "XR004", patient: "Robert Mugisha", type: "Bitewing", tooth: "Posterior bilateral", date: "2026-05-10", tech: "Radiographer Ssali", findings: "Interproximal caries #15 and #25. No periapical pathology.", status: "REPORTED" },
];

const TYPE_COLOR: Record<string, string> = {
    "Periapical": "bg-pink-50 text-pink-700",
    "Panoramic (OPG)": "bg-purple-50 text-purple-700",
    "Bitewing": "bg-blue-50 text-blue-700",
    "CBCT": "bg-indigo-50 text-indigo-700",
};

export default function DentalXrays() {
    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Scan className="h-6 w-6 text-pink-600" /> Dental X-Rays
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{xrays.length} radiographs on file</p>
            </div>
            <div className="space-y-3">
                {xrays.map((x, i) => (
                    <motion.div key={x.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center">
                                    <Scan className="h-5 w-5 text-pink-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900">{x.patient}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="h-3 w-3" />{x.date} · {x.tech}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${TYPE_COLOR[x.type] || "bg-gray-50 text-gray-600"}`}>{x.type}</span>
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700">{x.status}</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-500 mb-2">Tooth/Region: <span className="font-semibold text-gray-700">{x.tooth}</span></p>
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Radiographic Findings</p>
                            <p className="text-xs text-gray-700">{x.findings}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

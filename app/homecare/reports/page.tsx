"use client";

import { motion } from "framer-motion";
import { ClipboardList, Calendar } from "lucide-react";

const reports = [
    { id: "VR001", patient: "Agnes Kiwanuka", date: "2026-05-27", nurse: "HC Nurse Ssali", vitals: { bp: "110/70", hr: 78, temp: 36.8, spo2: 96 }, findings: "Patient alert but fatigued. Pain well controlled on current morphine dose. Wound on left leg clean, no signs of infection.", plan: "Continue current pain regimen. Next visit 2026-05-29." },
    { id: "VR002", patient: "Robert Sembuya", date: "2026-05-26", nurse: "HC Nurse Nakato", vitals: { bp: "135/85", hr: 82, temp: 37.1, spo2: 97 }, findings: "RBG 9.2 mmol/L — slightly elevated. Wound granulating well. Patient compliant with dressings.", plan: "Reinforce dietary education. Reduce simple carbs. Review insulin dose with Dr. Katongo." },
    { id: "VR003", patient: "John Mwesiga", date: "2026-05-25", nurse: "HC Nurse Nakato", vitals: { bp: "140/90", hr: 75, temp: 36.6, spo2: 98 }, findings: "Physiotherapy exercises completed. Gait improving — walking 30m with stick. BP slightly elevated.", plan: "Increase exercise sessions. Notify Dr. Katongo re BP. Continue antihypertensives." },
];

export default function VisitReports() {
    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-teal-600" /> Visit Reports
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{reports.length} recent visit reports</p>
            </div>
            <div className="space-y-4">
                {reports.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-black text-gray-900">{r.patient}</p>
                                <p className="text-xs text-gray-400">{r.nurse} · <Calendar className="h-3 w-3 inline" /> {r.date}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2 mb-4">
                            {[{ label: "BP", value: r.vitals.bp }, { label: "HR", value: `${r.vitals.hr} bpm` }, { label: "Temp", value: `${r.vitals.temp}°C` }, { label: "SpO₂", value: `${r.vitals.spo2}%` }].map(v => (
                                <div key={v.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                                    <p className="text-[10px] text-gray-400 uppercase tracking-wider">{v.label}</p>
                                    <p className="text-xs font-bold text-gray-800 mt-0.5">{v.value}</p>
                                </div>
                            ))}
                        </div>
                        <div className="space-y-2">
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Findings</p>
                                <p className="text-xs text-gray-700">{r.findings}</p>
                            </div>
                            <div className="bg-teal-50 rounded-xl p-3">
                                <p className="text-[10px] font-black text-teal-500 uppercase tracking-wider mb-1">Plan</p>
                                <p className="text-xs text-gray-700">{r.plan}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

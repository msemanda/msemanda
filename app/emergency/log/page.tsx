"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Search, Calendar } from "lucide-react";

const logs = [
    { id: "L001", date: "2026-05-27", time: "09:05", patient: "Unknown Male, 45y", type: "Cardiac Emergency", action: "CPR initiated, IV access, 12-lead ECG — STEMI confirmed. Cath lab alerted.", outcome: "ADMITTED — CCU", staff: "Dr. Bwire, Nurse Atim" },
    { id: "L002", date: "2026-05-27", time: "09:20", patient: "Grace Nakabuye, 28y", type: "RTA", action: "Cervical collar applied, IV fluids, GCS monitored. CT head ordered — no bleed.", outcome: "ADMITTED — Surgical Ward", staff: "Dr. Bwire, Nurse Ssali" },
    { id: "L003", date: "2026-05-27", time: "10:15", patient: "Joshua Byaruhanga, 8y", type: "Febrile Seizure", action: "IV diazepam 0.3mg/kg. Fever managed. Post-ictal — now conscious.", outcome: "ADMITTED — Pediatrics", staff: "Dr. Katongo, Nurse Atim" },
    { id: "L004", date: "2026-05-26", time: "22:40", patient: "Annet Nabwire, 34y", type: "Anaphylaxis", action: "Adrenaline 0.5mg IM, IV hydrocortisone, antihistamines. O2 therapy.", outcome: "DISCHARGED — observed 4hrs", staff: "Dr. Ssekibala, Nurse Nakayiza" },
    { id: "L005", date: "2026-05-26", time: "18:10", patient: "Fred Kalyebara, 62y", type: "Hypoglycaemia", action: "50% Dextrose IV 50mL. RBS rose from 1.8 to 6.4 mmol/L. Family notified.", outcome: "DISCHARGED — DM education given", staff: "Dr. Namubiru, Nurse Ssali" },
];

export default function IncidentLog() {
    const [search, setSearch] = useState("");
    const filtered = logs.filter(l => l.patient.toLowerCase().includes(search.toLowerCase()) || l.type.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-red-600" /> Incident Log
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Emergency department incident records</p>
            </div>
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20"
                    placeholder="Search patient or incident type..." />
            </div>
            <div className="space-y-3">
                {filtered.map((l, i) => (
                    <motion.div key={l.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <p className="text-sm font-black text-gray-900">{l.type}</p>
                                <p className="text-xs text-gray-500">{l.patient}</p>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                                <p className="text-xs font-bold text-gray-700 flex items-center gap-1 justify-end"><Calendar className="h-3 w-3" />{l.date}</p>
                                <p className="text-[10px] text-gray-400">{l.time}</p>
                            </div>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-3 mb-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Actions Taken</p>
                            <p className="text-xs text-gray-700">{l.action}</p>
                        </div>
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] text-gray-400">Staff: {l.staff}</p>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{l.outcome}</span>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

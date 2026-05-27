"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CheckSquare, Search, AlertCircle } from "lucide-react";

const pending = [
    { id: "LB002", patient: "Grace Nakato", pid: "P002", tests: [{ name: "Blood Culture", value: "", unit: "CFU/mL", ref: "No growth", flag: "" }, { name: "Procalcitonin", value: "", unit: "ng/mL", ref: "< 0.5", flag: "" }], doctor: "Dr. Ssekibala", orderedAt: "08:30", priority: "STAT" },
    { id: "LB005", patient: "James Okello", pid: "P005", tests: [{ name: "ABG pH", value: "", unit: "", ref: "7.35-7.45", flag: "" }, { name: "pCO2", value: "", unit: "mmHg", ref: "35-45", flag: "" }, { name: "Electrolytes Na+", value: "", unit: "mEq/L", ref: "135-145", flag: "" }], doctor: "Dr. Katongo", orderedAt: "09:30", priority: "URGENT" },
];
const completed = [
    { id: "LB006", patient: "Alice Nakirya", tests: [{ name: "CBC Hb", value: "9.2", unit: "g/dL", ref: "12-16", flag: "LOW" }, { name: "CRP", value: "45", unit: "mg/L", ref: "< 5", flag: "HIGH" }, { name: "ESR", value: "85", unit: "mm/hr", ref: "< 20", flag: "HIGH" }], doctor: "Dr. Bwire", priority: "ROUTINE" },
];

const FLAG_STYLE: Record<string, string> = {
    HIGH: "text-red-600 font-bold",
    LOW: "text-amber-600 font-bold",
    CRITICAL: "text-red-700 font-black",
    NORMAL: "text-green-600",
    "": "text-gray-400",
};
const PRIORITY_BADGE: Record<string, string> = { STAT: "badge-red", URGENT: "badge-yellow", ROUTINE: "badge-blue" };

export default function ResultsEntryPage() {
    const [values, setValues] = useState<Record<string, string>>({});
    const [search, setSearch] = useState("");

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <CheckSquare className="h-6 w-6 text-amber-600" /> Results Entry
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{pending.length} orders awaiting results</p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Search patient..." />
            </div>

            <div className="space-y-4">
                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Awaiting Results</p>
                {pending.filter(o => o.patient.toLowerCase().includes(search.toLowerCase())).map((o, i) => (
                    <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-black text-gray-900">{o.patient}</p>
                                <p className="text-xs text-gray-400">{o.doctor} · {o.orderedAt}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${PRIORITY_BADGE[o.priority]}`}>{o.priority}</span>
                        </div>
                        <div className="space-y-3">
                            {o.tests.map(t => (
                                <div key={t.name} className="flex items-center gap-3">
                                    <p className="text-xs font-semibold text-gray-700 w-36 shrink-0">{t.name}</p>
                                    <input
                                        placeholder="Enter value"
                                        value={values[`${o.id}-${t.name}`] || ""}
                                        onChange={e => setValues(prev => ({ ...prev, [`${o.id}-${t.name}`]: e.target.value }))}
                                        className="flex-1 px-3 py-1.5 text-sm border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                    <span className="text-[10px] text-gray-400 w-12 shrink-0">{t.unit}</span>
                                    <span className="text-[10px] text-gray-400 shrink-0">Ref: {t.ref}</span>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-end mt-4">
                            <button className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition-colors">
                                Submit Results
                            </button>
                        </div>
                    </motion.div>
                ))}

                <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-6">Completed Results</p>
                {completed.map((o, i) => (
                    <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div>
                                <p className="text-sm font-black text-gray-900">{o.patient}</p>
                                <p className="text-xs text-gray-400">{o.doctor}</p>
                            </div>
                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700">COMPLETED</span>
                        </div>
                        <div className="space-y-2">
                            {o.tests.map(t => (
                                <div key={t.name} className="flex items-center gap-3 text-xs">
                                    <p className="font-semibold text-gray-700 w-36 shrink-0">{t.name}</p>
                                    <p className={`font-bold ${FLAG_STYLE[t.flag]}`}>{t.value} {t.unit}</p>
                                    {t.flag && t.flag !== "NORMAL" && <AlertCircle className="h-3.5 w-3.5 text-red-500" />}
                                    <span className="text-gray-400 ml-auto">Ref: {t.ref}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

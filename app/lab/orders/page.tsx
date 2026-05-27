"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Search, Clock, CheckCircle2, AlertCircle } from "lucide-react";

const orders = [
    { id: "LB001", patient: "John Mwesiga", pid: "P001", tests: ["CBC", "LFTs", "RFTs", "HbA1c"], priority: "URGENT", doctor: "Dr. Katongo", orderedAt: "08:15", ward: "A-01", status: "IN_PROGRESS" },
    { id: "LB002", patient: "Grace Nakato", pid: "P002", tests: ["Blood Culture x2", "Procalcitonin"], priority: "STAT", doctor: "Dr. Ssekibala", orderedAt: "08:30", ward: "A-02", status: "PENDING" },
    { id: "LB003", patient: "Patrick Ssemanda", pid: "P003", tests: ["HbA1c", "Lipid Profile", "Fasting Glucose"], priority: "ROUTINE", doctor: "Dr. Namubiru", orderedAt: "09:00", ward: "B-01", status: "PENDING" },
    { id: "LB004", patient: "Sarah Namutebi", pid: "P004", tests: ["D-Dimer", "Troponin-I", "BNP"], priority: "STAT", doctor: "Dr. Bwire", orderedAt: "09:10", ward: "B-03", status: "PENDING" },
    { id: "LB005", patient: "James Okello", pid: "P005", tests: ["ABG", "Electrolytes", "Serum Creatinine"], priority: "URGENT", doctor: "Dr. Katongo", orderedAt: "09:30", ward: "C-02", status: "PENDING" },
    { id: "LB006", patient: "Alice Nakirya", pid: "P006", tests: ["CBC", "CRP", "ESR"], priority: "ROUTINE", doctor: "Dr. Bwire", orderedAt: "06:00", ward: "C-04", status: "COMPLETED" },
];

const PRIORITY: Record<string, string> = { STAT: "badge-red", URGENT: "badge-yellow", ROUTINE: "badge-blue" };
const STATUS: Record<string, string> = { PENDING: "badge-yellow", IN_PROGRESS: "badge-blue", COMPLETED: "badge-green" };

export default function LabOrdersPage() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");

    const filtered = orders.filter(o => {
        const matchSearch = o.patient.toLowerCase().includes(search.toLowerCase()) || o.id.toLowerCase().includes(search.toLowerCase());
        const matchFilter = filter === "ALL" || o.status === filter || o.priority === filter;
        return matchSearch && matchFilter;
    });

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><FlaskConical className="h-6 w-6 text-amber-600" /> Lab Test Orders</h1>
                <p className="text-sm text-gray-500 mt-0.5">{orders.filter(o => o.status !== "COMPLETED").length} pending orders</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Search..." />
                    </div>
                    <div className="flex gap-1.5">
                        {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED", "STAT", "URGENT"].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                                {f.replace("_", " ")}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="divide-y divide-gray-50">
                    {filtered.map((o, i) => (
                        <motion.div key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                            className="px-5 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-700 font-black text-sm">{o.patient.charAt(0)}</div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{o.patient} <span className="text-gray-400 text-xs font-normal">({o.ward})</span></p>
                                        <p className="text-xs text-gray-400">{o.doctor} &bull; <span className="flex items-center gap-0.5 inline-flex"><Clock className="h-3 w-3" /> {o.orderedAt}</span></p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY[o.priority]}`}>{o.priority}</span>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS[o.status]}`}>{o.status.replace("_", " ")}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 ml-11">
                                <div className="flex flex-wrap gap-1.5">
                                    {o.tests.map(t => (
                                        <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">{t}</span>
                                    ))}
                                </div>
                                {o.status !== "COMPLETED" && (
                                    <button className="ml-auto shrink-0 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                        {o.status === "IN_PROGRESS" ? "Enter Results" : "Start"}
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Search, CheckCircle2 } from "lucide-react";

const orders = [
    { id: "NO001", patient: "John Mwesiga", bed: "A-01", order: "IV Fluids — Normal Saline 1L over 8hrs", doctor: "Dr. Katongo", time: "07:00", status: "PENDING", priority: "ROUTINE" },
    { id: "NO002", patient: "Grace Nakato", bed: "A-02", order: "Metoprolol 50mg PO BD — monitor HR", doctor: "Dr. Ssekibala", time: "07:15", status: "ACKNOWLEDGED", priority: "URGENT" },
    { id: "NO003", patient: "Sarah Namutebi", bed: "B-03", order: "O2 therapy 4L/min via nasal cannula", doctor: "Dr. Bwire", time: "06:30", status: "IN_PROGRESS", priority: "URGENT" },
    { id: "NO004", patient: "Patrick Ssemanda", bed: "B-01", order: "Wound dressing change — daily", doctor: "Dr. Namubiru", time: "08:00", status: "COMPLETED", priority: "ROUTINE" },
    { id: "NO005", patient: "James Okello", bed: "C-02", order: "Nebulization — Salbutamol 2.5mg q4h", doctor: "Dr. Katongo", time: "08:30", status: "PENDING", priority: "URGENT" },
    { id: "NO006", patient: "Alice Nakirya", bed: "C-04", order: "Fluid restriction 800ml/24hrs", doctor: "Dr. Bwire", time: "09:00", status: "ACKNOWLEDGED", priority: "ROUTINE" },
];

const STATUS_BADGE: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    ACKNOWLEDGED: "bg-blue-50 text-blue-700",
    IN_PROGRESS: "bg-purple-50 text-purple-700",
    COMPLETED: "bg-green-50 text-green-700",
};
const PRIORITY_BADGE: Record<string, string> = {
    ROUTINE: "bg-gray-50 text-gray-600",
    URGENT: "bg-red-50 text-red-600",
};

export default function NursingOrdersPage() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");
    const filtered = orders.filter(o => {
        const matchS = o.patient.toLowerCase().includes(search.toLowerCase()) || o.order.toLowerCase().includes(search.toLowerCase());
        const matchF = filter === "ALL" || o.status === filter;
        return matchS && matchF;
    });

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-green-600" /> Nursing Orders
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {orders.filter(o => o.status === "PENDING").length} orders awaiting acknowledgement
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Search patient or order..." />
                    </div>
                    <div className="flex gap-1.5">
                        {["ALL", "PENDING", "ACKNOWLEDGED", "IN_PROGRESS", "COMPLETED"].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filter === f ? "bg-green-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                                {f.replace("_", " ")}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="divide-y divide-gray-50">
                    {filtered.map((o, i) => (
                        <motion.div key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                            className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-green-50 flex items-center justify-center text-green-700 font-black text-sm shrink-0">
                                        {o.patient.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{o.patient}
                                            <span className="ml-2 text-xs font-semibold text-blue-600">Bed {o.bed}</span>
                                        </p>
                                        <p className="text-xs text-gray-700 mt-0.5">{o.order}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{o.doctor} · {o.time}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[o.priority]}`}>{o.priority}</span>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[o.status]}`}>{o.status.replace("_", " ")}</span>
                                    {o.status === "PENDING" && (
                                        <button className="text-xs font-bold text-white bg-green-600 hover:bg-green-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Acknowledge
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

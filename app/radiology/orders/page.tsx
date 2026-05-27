"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Search } from "lucide-react";

const orders = [
    { id: "RD001", patient: "Sarah Namutebi", bed: "B-03", modality: "CT", bodyPart: "Chest + Abdomen", priority: "STAT", doctor: "Dr. Bwire", orderedAt: "09:10", status: "PENDING", indication: "Pneumonia — rule out PE" },
    { id: "RD002", patient: "Robert Mugisha", bed: "D-02", modality: "MRI", bodyPart: "Brain", priority: "URGENT", doctor: "Dr. Katongo", orderedAt: "09:45", status: "IN_PROGRESS", indication: "Cardiac arrhythmia workup — exclude stroke" },
    { id: "RD003", patient: "James Okello", bed: "C-02", modality: "X-RAY", bodyPart: "Chest (PA)", priority: "ROUTINE", doctor: "Dr. Katongo", orderedAt: "10:00", status: "COMPLETED", indication: "COPD follow-up" },
    { id: "RD004", patient: "Grace Nakato", bed: "A-02", modality: "ULTRASOUND", bodyPart: "Abdomen + Pelvis", priority: "URGENT", doctor: "Dr. Ssekibala", orderedAt: "10:30", status: "PENDING", indication: "Hypertension workup — renal assessment" },
    { id: "RD005", patient: "Agnes Nantale", bed: "E-01", modality: "X-RAY", bodyPart: "Right Knee AP+Lat", priority: "ROUTINE", doctor: "Dr. Namubiru", orderedAt: "11:00", status: "PENDING", indication: "Joint pain assessment" },
];

const MODALITY_COLOR: Record<string, string> = {
    "X-RAY": "bg-blue-50 text-blue-700", CT: "bg-purple-50 text-purple-700",
    MRI: "bg-indigo-50 text-indigo-700", ULTRASOUND: "bg-teal-50 text-teal-700",
    PET: "bg-pink-50 text-pink-700", MAMMOGRAPHY: "bg-rose-50 text-rose-700",
};
const PRIORITY_BADGE: Record<string, string> = { STAT: "badge-red", URGENT: "badge-yellow", ROUTINE: "badge-blue" };
const STATUS_BADGE: Record<string, string> = { PENDING: "badge-yellow", IN_PROGRESS: "badge-blue", COMPLETED: "badge-green" };

export default function RadiologyOrdersPage() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");
    const filtered = orders.filter(o => {
        const matchS = o.patient.toLowerCase().includes(search.toLowerCase()) || o.modality.toLowerCase().includes(search.toLowerCase());
        const matchF = filter === "ALL" || o.status === filter || o.priority === filter;
        return matchS && matchF;
    });

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-violet-600" /> Imaging Orders
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{orders.filter(o => o.status === "PENDING").length} orders pending</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Search patient or modality..." />
                    </div>
                    <div className="flex gap-1.5">
                        {["ALL", "PENDING", "IN_PROGRESS", "COMPLETED"].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filter === f ? "bg-violet-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
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
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-[10px] font-black shrink-0 ${MODALITY_COLOR[o.modality]}`}>{o.modality}</div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{o.patient} <span className="text-gray-400 text-xs font-normal">Bed {o.bed}</span></p>
                                        <p className="text-xs text-gray-600 mt-0.5">{o.bodyPart}</p>
                                        <p className="text-[10px] text-gray-400 mt-1">{o.doctor} · {o.orderedAt} · {o.indication}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-3">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[o.priority]}`}>{o.priority}</span>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[o.status]}`}>{o.status.replace("_", " ")}</span>
                                    {o.status === "PENDING" && <button className="text-xs font-bold text-violet-600 hover:bg-violet-50 px-3 py-1.5 rounded-lg transition-colors">Accept</button>}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

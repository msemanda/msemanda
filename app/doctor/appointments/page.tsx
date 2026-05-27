"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Search, Clock, CheckCircle2, XCircle } from "lucide-react";

const appointments = [
    { id: "A001", patient: "John Mwesiga", age: 45, type: "Follow-up", date: "2026-05-27", time: "09:00", status: "SCHEDULED", notes: "DM review, HbA1c results" },
    { id: "A002", patient: "Grace Nakato", age: 67, type: "Consultation", date: "2026-05-27", time: "09:30", status: "COMPLETED", notes: "BP management review" },
    { id: "A003", patient: "Patrick Ssemanda", age: 32, type: "Post-op", date: "2026-05-27", time: "10:00", status: "SCHEDULED", notes: "Wound check post-appendectomy" },
    { id: "A004", patient: "Sarah Namutebi", age: 29, type: "Consultation", date: "2026-05-27", time: "10:30", status: "CANCELLED", notes: "" },
    { id: "A005", patient: "James Okello", age: 55, type: "Follow-up", date: "2026-05-28", time: "08:00", status: "SCHEDULED", notes: "COPD spirometry results" },
    { id: "A006", patient: "Alice Nakirya", age: 38, type: "Routine", date: "2026-05-28", time: "09:00", status: "SCHEDULED", notes: "Kidney function tests review" },
    { id: "A007", patient: "Robert Mugisha", age: 61, type: "Consultation", date: "2026-05-29", time: "11:00", status: "SCHEDULED", notes: "ECG follow-up" },
];

const STATUS_BADGE: Record<string, string> = {
    SCHEDULED: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-500",
};
const TYPE_COLOR: Record<string, string> = {
    "Follow-up": "bg-amber-50 text-amber-700",
    "Consultation": "bg-purple-50 text-purple-700",
    "Post-op": "bg-teal-50 text-teal-700",
    "Routine": "bg-gray-50 text-gray-600",
};

export default function AppointmentsPage() {
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");
    const filtered = appointments.filter(a => {
        const matchS = a.patient.toLowerCase().includes(search.toLowerCase());
        const matchF = filter === "ALL" || a.status === filter;
        return matchS && matchF;
    });

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <CalendarDays className="h-6 w-6 text-blue-600" /> My Appointments
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {appointments.filter(a => a.status === "SCHEDULED").length} upcoming appointments
                </p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Search patient..." />
                    </div>
                    <div className="flex gap-1.5">
                        {["ALL", "SCHEDULED", "COMPLETED", "CANCELLED"].map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                                {f}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {["Patient", "Type", "Date", "Time", "Notes", "Status"].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((a, i) => (
                                <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                                    className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-bold text-gray-900">{a.patient}</p>
                                        <p className="text-xs text-gray-400">{a.age}y</p>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${TYPE_COLOR[a.type] || "bg-gray-50 text-gray-600"}`}>{a.type}</span>
                                    </td>
                                    <td className="px-4 py-3 text-xs font-semibold text-gray-700">{a.date}</td>
                                    <td className="px-4 py-3">
                                        <span className="text-xs text-gray-600 flex items-center gap-1"><Clock className="h-3 w-3" />{a.time}</span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px] truncate">{a.notes || "—"}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[a.status]}`}>{a.status}</span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

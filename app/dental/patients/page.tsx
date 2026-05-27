"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Search } from "lucide-react";

const patients = [
    { id: "D001", name: "Grace Nakato", age: 35, gender: "F", lastVisit: "2026-05-20", nextAppt: "2026-06-10", concern: "Dental caries — upper right molar", status: "FOLLOW_UP" },
    { id: "D002", name: "James Okello", age: 28, gender: "M", lastVisit: "2026-05-15", nextAppt: "2026-05-29", concern: "Orthodontic review — braces", status: "ACTIVE" },
    { id: "D003", name: "Alice Nakirya", age: 42, gender: "F", lastVisit: "2026-04-30", nextAppt: "2026-05-27", concern: "Root canal — lower left premolar", status: "IN_TREATMENT" },
    { id: "D004", name: "Robert Mugisha", age: 61, gender: "M", lastVisit: "2026-05-10", nextAppt: "2026-06-05", concern: "Partial denture fitting", status: "ACTIVE" },
    { id: "D005", name: "Fatuma Nakayiza", age: 19, gender: "F", lastVisit: "2026-05-25", nextAppt: null, concern: "Wisdom tooth extraction — impacted #38", status: "POST_OP" },
];

const STATUS_BADGE: Record<string, string> = {
    ACTIVE: "bg-blue-50 text-blue-700",
    FOLLOW_UP: "bg-amber-50 text-amber-700",
    IN_TREATMENT: "bg-purple-50 text-purple-700",
    POST_OP: "bg-green-50 text-green-700",
};

export default function DentalPatients() {
    const [search, setSearch] = useState("");
    const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-pink-600" /> Dental Patients
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{filtered.length} patients</p>
            </div>
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20"
                    placeholder="Search patient..." />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Patient", "Age/Gender", "Chief Concern", "Last Visit", "Next Appointment", "Status"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((p, i) => (
                                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                                    className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-lg bg-pink-50 flex items-center justify-center text-pink-700 font-black text-xs">{p.name.charAt(0)}</div>
                                            <span className="text-sm font-bold text-gray-900">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600">{p.age}y / {p.gender}</td>
                                    <td className="px-4 py-3 text-xs text-gray-700 max-w-[180px]">{p.concern}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{p.lastVisit}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{p.nextAppt || "—"}</td>
                                    <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[p.status]}`}>{p.status.replace("_", " ")}</span></td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

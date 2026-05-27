"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Search } from "lucide-react";

const enrollments = [
    { patient: "John Mwesiga", program: "Diabetes Prevention Program", enrolledOn: "2026-04-02", attendance: "9/12 sessions", progress: "GOOD", status: "ACTIVE" },
    { patient: "Grace Nakato", program: "Cardiac Rehab Program", enrolledOn: "2026-05-03", attendance: "4/8 sessions", progress: "FAIR", status: "ACTIVE" },
    { patient: "Alice Nakirya", program: "Diabetes Prevention Program", enrolledOn: "2026-04-05", attendance: "11/12 sessions", progress: "EXCELLENT", status: "ACTIVE" },
    { patient: "Robert Mugisha", program: "Mental Health & Mindfulness", enrolledOn: "2026-04-17", attendance: "6/10 sessions", progress: "GOOD", status: "ACTIVE" },
    { patient: "Agnes Nantale", program: "Maternal Nutrition Program", enrolledOn: "2026-05-16", attendance: "2/4 sessions", progress: "FAIR", status: "ACTIVE" },
    { patient: "James Okello", program: "Cardiac Rehab Program", enrolledOn: "2026-05-02", attendance: "8/8 sessions", progress: "EXCELLENT", status: "COMPLETED" },
];

const PROGRESS_BADGE: Record<string, string> = {
    EXCELLENT: "bg-green-50 text-green-700",
    GOOD: "bg-blue-50 text-blue-700",
    FAIR: "bg-amber-50 text-amber-700",
    POOR: "bg-red-50 text-red-500",
};

export default function WellnessEnrollments() {
    const [search, setSearch] = useState("");
    const filtered = enrollments.filter(e => e.patient.toLowerCase().includes(search.toLowerCase()) || e.program.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-violet-600" /> Enrollments
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{enrollments.filter(e => e.status === "ACTIVE").length} active enrollments</p>
            </div>
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20"
                    placeholder="Search patient or program..." />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>{["Patient", "Program", "Enrolled", "Attendance", "Progress", "Status"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map((e, i) => (
                            <motion.tr key={`${e.patient}-${e.program}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 text-sm font-bold text-gray-900">{e.patient}</td>
                                <td className="px-4 py-3 text-xs text-gray-600">{e.program}</td>
                                <td className="px-4 py-3 text-xs text-gray-500">{e.enrolledOn}</td>
                                <td className="px-4 py-3 text-xs font-semibold text-gray-700">{e.attendance}</td>
                                <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${PROGRESS_BADGE[e.progress]}`}>{e.progress}</span></td>
                                <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${e.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>{e.status}</span></td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

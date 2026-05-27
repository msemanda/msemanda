"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Search } from "lucide-react";

const patients = [
    { id: "E001", name: "Unknown Male", age: 45, complaint: "Chest pain â€” possible MI", arrived: "09:05", doctor: "Dr. Bwire", nurse: "Nurse Atim", disposition: "ADMITTED â€” CCU", status: "IN_TREATMENT", triage: "IMMEDIATE" },
    { id: "E002", name: "Grace Nakabuye", age: 28, complaint: "RTA â€” head injury", arrived: "09:20", doctor: "Dr. Bwire", nurse: "Nurse Ssali", disposition: "CT scan ordered â€” neurosurgery consult", status: "IN_TREATMENT", triage: "IMMEDIATE" },
    { id: "E003", name: "Peter Ssekitoleko", age: 55, complaint: "Severe abdominal pain", arrived: "09:45", doctor: null, nurse: null, disposition: "Awaiting surgical review", status: "WAITING", triage: "URGENT" },
    { id: "E004", name: "Fatuma Nakiryowa", age: 22, complaint: "High fever + rigors", arrived: "10:00", doctor: null, nurse: null, disposition: "Awaiting assessment", status: "WAITING", triage: "URGENT" },
    { id: "E005", name: "Joshua Byaruhanga", age: 8, complaint: "Febrile convulsion", arrived: "10:15", doctor: "Dr. Katongo", nurse: "Nurse Atim", disposition: "Stabilised â€” pediatric admission likely", status: "IN_TREATMENT", triage: "URGENT" },
    { id: "E006", name: "Agnes Tumusiime", age: 65, complaint: "COPD exacerbation", arrived: "10:30", doctor: null, nurse: null, disposition: "Awaiting assessment", status: "WAITING", triage: "LESS_URGENT" },
    { id: "E007", name: "John Mwebe", age: 30, complaint: "Hand laceration", arrived: "10:50", doctor: "Dr. Namubiru", nurse: "Nurse Ssali", disposition: "Minor surgery â€” sutures", status: "IN_TREATMENT", triage: "NON_URGENT" },
];

const TRIAGE_COLOR: Record<string, string> = {
    IMMEDIATE: "bg-red-50 text-red-700", URGENT: "bg-orange-50 text-orange-700",
    LESS_URGENT: "bg-yellow-50 text-yellow-700", NON_URGENT: "bg-green-50 text-green-700",
};

export default function EDPatients() {
    const [search, setSearch] = useState("");
    const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-red-600" /> ED Patients
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{patients.length} patients in emergency today</p>
            </div>
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20"
                    placeholder="Search patient..." />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto rounded-xl">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>{["Patient", "Complaint", "Arrived", "Triage", "Team", "Disposition", "Status"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map((p, i) => (
                            <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3">
                                    <p className="text-sm font-bold text-gray-900">{p.name}</p>
                                    <p className="text-[10px] text-gray-400">{p.age}y</p>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-600 max-w-[140px]">{p.complaint}</td>
                                <td className="px-4 py-3 text-xs text-gray-500">{p.arrived}</td>
                                <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TRIAGE_COLOR[p.triage]}`}>{p.triage.replace("_", " ")}</span></td>
                                <td className="px-4 py-3 text-[10px] text-gray-500">{p.doctor || "â€”"}<br />{p.nurse || ""}</td>
                                <td className="px-4 py-3 text-xs text-gray-600 max-w-[160px]">{p.disposition}</td>
                                <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${p.status === "IN_TREATMENT" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>{p.status.replace("_", " ")}</span></td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table></div>
            </div>
        </div>
    );
}

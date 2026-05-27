"use client";

import { motion } from "framer-motion";
import { BedDouble, Search, Filter } from "lucide-react";
import { useState } from "react";

const patients = [
    { id: "P001", name: "John Mwesiga", bed: "A-01", ward: "General Medicine", age: 45, gender: "M", doctor: "Dr. Katongo", admitted: "2026-05-22", diagnosis: "Type 2 DM + Hypertension", status: "STABLE" },
    { id: "P002", name: "Grace Nakato", bed: "A-02", ward: "General Medicine", age: 67, gender: "F", doctor: "Dr. Ssekibala", admitted: "2026-05-23", diagnosis: "Hypertensive crisis", status: "MONITOR" },
    { id: "P003", name: "Patrick Ssemanda", bed: "B-01", ward: "Surgical", age: 32, gender: "M", doctor: "Dr. Namubiru", admitted: "2026-05-24", diagnosis: "Post-op appendectomy", status: "STABLE" },
    { id: "P004", name: "Sarah Namutebi", bed: "B-03", ward: "Surgical", age: 29, gender: "F", doctor: "Dr. Bwire", admitted: "2026-05-25", diagnosis: "Pneumonia + Sepsis", status: "CRITICAL" },
    { id: "P005", name: "James Okello", bed: "C-02", ward: "Medical", age: 55, gender: "M", doctor: "Dr. Katongo", admitted: "2026-05-24", diagnosis: "COPD exacerbation", status: "STABLE" },
    { id: "P006", name: "Alice Nakirya", bed: "C-04", ward: "Medical", age: 38, gender: "F", doctor: "Dr. Bwire", admitted: "2026-05-25", diagnosis: "Renal failure", status: "MONITOR" },
];

const STATUS = { STABLE: "badge-green", MONITOR: "badge-yellow", CRITICAL: "badge-red" };

export default function WardPatientsPage() {
    const [search, setSearch] = useState("");
    const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.bed.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><BedDouble className="h-6 w-6 text-blue-600" /> Ward Patients</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{filtered.length} patients currently admitted</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-blue-500/20" placeholder="Search patient or bed..." />
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-100 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                        <Filter className="h-3.5 w-3.5" /> Filter
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {["Bed", "Patient", "Age/Gender", "Ward", "Doctor", "Diagnosis", "Admitted", "Status"].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((p, i) => (
                                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-black text-blue-600">{p.bed}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 font-black text-xs">{p.name.charAt(0)}</div>
                                            <span className="text-sm font-bold text-gray-900">{p.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-600 font-semibold">{p.age}y / {p.gender}</td>
                                    <td className="px-4 py-3 text-xs text-gray-600">{p.ward}</td>
                                    <td className="px-4 py-3 text-xs text-gray-600 font-semibold">{p.doctor}</td>
                                    <td className="px-4 py-3 text-xs text-gray-700 max-w-[160px] truncate">{p.diagnosis}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400">{p.admitted}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${(STATUS as any)[p.status]}`}>{p.status}</span>
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

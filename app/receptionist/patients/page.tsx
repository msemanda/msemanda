"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Search, Phone, CalendarDays } from "lucide-react";

const patients = [
    { id: "P001", name: "John Mwesiga", age: 45, gender: "M", phone: "+256 701 234 567", email: "j.mwesiga@email.com", admittedOn: "2026-05-22", doctor: "Dr. Katongo", status: "ADMITTED", ward: "A-01" },
    { id: "P002", name: "Grace Nakato", age: 67, gender: "F", phone: "+256 702 345 678", email: "g.nakato@email.com", admittedOn: "2026-05-23", doctor: "Dr. Ssekibala", status: "ADMITTED", ward: "A-02" },
    { id: "P003", name: "Patrick Ssemanda", age: 32, gender: "M", phone: "+256 703 456 789", email: "p.ssemanda@email.com", admittedOn: "2026-05-24", doctor: "Dr. Namubiru", status: "ADMITTED", ward: "B-01" },
    { id: "P004", name: "Sarah Namutebi", age: 29, gender: "F", phone: "+256 704 567 890", email: "s.namutebi@email.com", admittedOn: "2026-05-25", doctor: "Dr. Bwire", status: "ADMITTED", ward: "B-03" },
    { id: "P007", name: "Robert Mugisha", age: 61, gender: "M", phone: "+256 707 890 123", email: "r.mugisha@email.com", admittedOn: "2026-05-18", doctor: "Dr. Katongo", status: "DISCHARGED", ward: "—" },
    { id: "P008", name: "Agnes Nantale", age: 44, gender: "F", phone: "+256 708 901 234", email: "a.nantale@email.com", admittedOn: "2026-05-15", doctor: "Dr. Namubiru", status: "DISCHARGED", ward: "—" },
];

const STATUS_BADGE: Record<string, string> = {
    ADMITTED: "bg-blue-50 text-blue-700",
    DISCHARGED: "bg-green-50 text-green-700",
    REGISTERED: "bg-amber-50 text-amber-700",
};

export default function PatientSearch() {
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");
    const filtered = patients.filter(p => {
        const matchS = p.name.toLowerCase().includes(search.toLowerCase()) || p.phone.includes(search) || p.id.toLowerCase().includes(search.toLowerCase());
        const matchF = statusFilter === "ALL" || p.status === statusFilter;
        return matchS && matchF;
    });

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Search className="h-6 w-6 text-indigo-600" /> Patient Search
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Search all registered patients</p>
            </div>
            <div className="flex gap-3 items-center flex-wrap">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Search by name, phone, or patient ID..." />
                </div>
                <div className="flex gap-1.5">
                    {["ALL", "ADMITTED", "REGISTERED", "DISCHARGED"].map(f => (
                        <button key={f} onClick={() => setStatusFilter(f)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${statusFilter === f ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                            {f}
                        </button>
                    ))}
                </div>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>{["Patient", "Contact", "Doctor", "Ward", "Admitted", "Status"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map((p, i) => (
                            <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3">
                                    <p className="text-sm font-bold text-gray-900">{p.name}</p>
                                    <p className="text-[10px] text-gray-400">{p.id} · {p.age}y / {p.gender}</p>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-500">
                                    <p className="flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</p>
                                </td>
                                <td className="px-4 py-3 text-xs text-gray-600">{p.doctor}</td>
                                <td className="px-4 py-3 text-xs font-semibold text-blue-600">{p.ward}</td>
                                <td className="px-4 py-3 text-xs text-gray-400 flex items-center gap-1"><CalendarDays className="h-3 w-3" />{p.admittedOn}</td>
                                <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[p.status]}`}>{p.status}</span></td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

"use client";

import { motion } from "framer-motion";
import { BedDouble, Search, Filter, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";

interface WardPatient {
    id: string;
    name: string;
    bed: string;
    ward: string;
    age?: number;
    gender?: string;
    doctor: string;
    admitted: string;
    diagnosis: string;
    status: string;
}

const STATUS: Record<string, string> = {
    STABLE: "badge-green",
    MONITOR: "badge-yellow",
    CRITICAL: "badge-red",
    ACTIVE: "badge-blue",
    ADMITTED: "badge-blue",
};

export default function WardPatientsPage() {
    const [patients, setPatients] = useState<WardPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [wardFilter, setWardFilter] = useState("All");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(
                query(collection(db, "ipdAdmissions"), where("status", "!=", "DISCHARGED"))
            );
            setPatients(snap.docs.map(d => {
                const r = d.data();
                const admittedDate = toDate(r.admittedAt);
                return {
                    id: d.id,
                    name: (r.patientName as string) ?? "—",
                    bed: (r.bedNumber as string) ?? "—",
                    ward: ((r.wardName ?? r.ward) as string) ?? "—",
                    age: r.age as number | undefined,
                    gender: r.gender as string | undefined,
                    doctor: (r.doctorName as string) ?? "—",
                    admitted: admittedDate ? admittedDate.toLocaleDateString("en-CA") : "—",
                    diagnosis: (r.diagnosis as string) ?? "—",
                    status: (r.status as string) ?? "ADMITTED",
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const wards = ["All", ...Array.from(new Set(patients.map(p => p.ward))).filter(Boolean)];

    const filtered = patients.filter(p =>
        (wardFilter === "All" || p.ward === wardFilter) &&
        (p.name.toLowerCase().includes(search.toLowerCase()) ||
         p.bed.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <BedDouble className="h-6 w-6 text-blue-600" /> Ward Patients
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${filtered.length} patients currently admitted`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-blue-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Search patient or bed..."
                        />
                    </div>
                    <div className="relative">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                        <select value={wardFilter} onChange={e => setWardFilter(e.target.value)}
                            className="pl-8 pr-3 py-2 rounded-xl border border-gray-100 text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors bg-white appearance-none outline-none focus:ring-2 focus:ring-blue-500/20">
                            {wards.map(w => <option key={w} value={w}>{w === "All" ? "All Wards" : w}</option>)}
                        </select>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-500 rounded-full" />
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">
                        {search ? "No patients match your search" : "No admitted patients"}
                    </p>
                ) : (
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
                                    <motion.tr
                                        key={p.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-4 py-3 text-sm font-black text-blue-600">{p.bed}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-700 font-black text-xs">
                                                    {p.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-gray-900">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600 font-semibold">
                                            {p.age ? `${p.age}y` : "—"}{p.gender ? ` / ${p.gender}` : ""}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">{p.ward}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600 font-semibold">{p.doctor}</td>
                                        <td className="px-4 py-3 text-xs text-gray-700 max-w-[160px] truncate">{p.diagnosis}</td>
                                        <td className="px-4 py-3 text-xs text-gray-400">{p.admitted}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS[p.status] ?? "bg-gray-50 text-gray-600"}`}>
                                                {p.status}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}

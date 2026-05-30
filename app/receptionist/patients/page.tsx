"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Phone, CalendarDays, Mail, Loader2, RefreshCw } from "lucide-react";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PatientRecord {
    id: string;
    patientName: string;
    patientEmail: string;
    phone: string;
    problem: string;
    doctor?: string;
    ward?: string;
    admittedAt: string;
    status: string;
}

const STATUS_BADGE: Record<string, string> = {
    ADMITTED:   "bg-blue-50 text-blue-700",
    DISCHARGED: "bg-green-50 text-green-700",
};

const FILTERS = ["ALL", "ADMITTED", "DISCHARGED"];

export default function PatientSearch() {
    const [records, setRecords] = useState<PatientRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const load = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, "admissions"), orderBy("admittedAt", "desc")));
            setRecords(snap.docs.map(d => {
                const data = d.data() as Record<string, string>;
                return {
                    id: d.id,
                    patientName: data.patientName || "—",
                    patientEmail: data.patientEmail || "",
                    phone: data.phone || "",
                    problem: data.problem || "",
                    doctor: data.doctor || "",
                    ward: data.ward || "",
                    admittedAt: data.admittedAt || data.registeredAt || "",
                    status: data.status || "REGISTERED",
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, []);

    const filtered = records.filter(p => {
        const q = search.toLowerCase();
        const matchS = !q ||
            p.patientName.toLowerCase().includes(q) ||
            p.phone.includes(q) ||
            p.patientEmail.toLowerCase().includes(q) ||
            p.id.toLowerCase().includes(q);
        const matchF = statusFilter === "ALL" || p.status === statusFilter;
        return matchS && matchF;
    });

    const counts = FILTERS.reduce<Record<string, number>>((acc, f) => {
        acc[f] = f === "ALL" ? records.length : records.filter(r => r.status === f).length;
        return acc;
    }, {});

    const formatDate = (iso: string) => {
        if (!iso) return "—";
        try { return new Date(iso).toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" }); }
        catch { return iso; }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Search className="h-6 w-6 text-indigo-600" /> Patient Search
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Search all admitted patients</p>
                </div>
                <button onClick={load} disabled={loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-gray-50 text-gray-500 hover:bg-gray-100 transition-colors disabled:opacity-50">
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                </button>
            </div>

            {/* Search + filters */}
            <div className="flex gap-3 items-center flex-wrap">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                        placeholder="Search by name, phone, or email..." />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {FILTERS.map(f => (
                        <button key={f} onClick={() => setStatusFilter(f)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${statusFilter === f ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                            {f}
                            {counts[f] > 0 && (
                                <span className={`ml-1.5 text-[9px] px-1.5 py-0.5 rounded-full font-black ${statusFilter === f ? "bg-white/20 text-white" : "bg-gray-200 text-gray-500"}`}>
                                    {counts[f]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16 gap-2 text-gray-400 text-sm">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading patients...
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-16 text-gray-400 text-sm">
                        {search || statusFilter !== "ALL" ? "No patients match your search." : "No patients registered yet."}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {["Patient", "Contact", "Doctor / Ward", "Reason for Visit", "Registered", "Status"].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((p, i) => (
                                    <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                        className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-bold text-gray-900">{p.patientName}</p>
                                            <p className="text-[10px] text-gray-400 font-mono">{p.id.slice(0, 14)}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 space-y-0.5">
                                            {p.phone && <p className="flex items-center gap-1"><Phone className="h-3 w-3 shrink-0" />{p.phone}</p>}
                                            {p.patientEmail && <p className="flex items-center gap-1"><Mail className="h-3 w-3 shrink-0" />{p.patientEmail}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">
                                            {p.doctor
                                                ? <><p className="font-semibold text-gray-700">{p.doctor}</p><p className="text-blue-600 font-bold">{p.ward || "—"}</p></>
                                                : <span className="text-gray-300 italic">Not yet assigned</span>
                                            }
                                        </td>
                                        <td className="px-4 py-3 max-w-[180px]">
                                            <p className="text-xs text-gray-600 truncate" title={p.problem}>{p.problem || "—"}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-400">
                                            <span className="flex items-center gap-1 whitespace-nowrap">
                                                <CalendarDays className="h-3 w-3 shrink-0" />{formatDate(p.admittedAt)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[p.status] ?? "bg-gray-50 text-gray-500"}`}>
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

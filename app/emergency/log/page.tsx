"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ClipboardList, Search, Calendar, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";

interface EmergencyLog {
    id: string;
    date: string;
    time: string;
    patient: string;
    type: string;
    action: string;
    outcome: string;
    staff: string;
}

export default function IncidentLog() {
    const [logs, setLogs] = useState<EmergencyLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "emergencyLogs"));
            setLogs(snap.docs.map(d => {
                const r = d.data();
                const dt = toDate(r.incidentAt ?? r.date);
                return {
                    id: d.id,
                    date: dt ? dt.toLocaleDateString("en-CA") : ((r.date as string) ?? "—"),
                    time: dt
                        ? dt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                        : ((r.time as string) ?? "—"),
                    patient: ((r.patientName ?? r.patient) as string) ?? "—",
                    type: (r.type as string) ?? "—",
                    action: (r.action as string) ?? "—",
                    outcome: (r.outcome as string) ?? "—",
                    staff: (r.staff as string) ?? "—",
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = logs.filter(l =>
        l.patient.toLowerCase().includes(search.toLowerCase()) ||
        l.type.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-red-600" /> Incident Log
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Emergency department incident records</p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-red-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20"
                    placeholder="Search patient or incident type..." />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-red-100 border-t-red-500 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">
                    {search ? "No records match your search" : "No incident logs found"}
                </p>
            ) : (
                <div className="space-y-3">
                    {filtered.map((l, i) => (
                        <motion.div key={l.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="text-sm font-black text-gray-900">{l.type}</p>
                                    <p className="text-xs text-gray-500">{l.patient}</p>
                                </div>
                                <div className="text-right shrink-0 ml-3">
                                    <p className="text-xs font-bold text-gray-700 flex items-center gap-1 justify-end"><Calendar className="h-3 w-3" />{l.date}</p>
                                    <p className="text-[10px] text-gray-400">{l.time}</p>
                                </div>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 mb-2">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Actions Taken</p>
                                <p className="text-xs text-gray-700">{l.action}</p>
                            </div>
                            <div className="flex items-center justify-between">
                                <p className="text-[10px] text-gray-400">Staff: {l.staff}</p>
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700">{l.outcome}</span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

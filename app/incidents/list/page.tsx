"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AnimatePresence, motion } from "framer-motion";
import { AlertOctagon, Search, RefreshCw, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import Link from "next/link";

interface Incident {
    id: string;
    title: string;
    incidentType: string;
    location: string;
    severity: "low" | "medium" | "high" | "critical";
    status: "open" | "investigating" | "closed";
    reportedBy: string;
    date: string;
    description?: string;
    createdAt?: any;
}

const SEVERITY_COLOR: Record<string, string> = {
    critical: "bg-red-50 text-red-600 border-red-100",
    high:     "bg-amber-50 text-amber-700 border-amber-100",
    medium:   "bg-blue-50 text-blue-600 border-blue-100",
    low:      "bg-gray-50 text-gray-500 border-gray-100",
};
const STATUS_CONFIG: Record<Incident["status"], { label: string; color: string; icon: any }> = {
    open:          { label: "Open",          color: "bg-red-50 text-red-600 border-red-100",    icon: AlertOctagon },
    investigating: { label: "Investigating", color: "bg-amber-50 text-amber-700 border-amber-100", icon: Clock },
    closed:        { label: "Closed",        color: "bg-green-50 text-green-700 border-green-100", icon: CheckCircle2 },
};

export default function IncidentsListPage() {
    const [incidents, setIncidents] = useState<Incident[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<"all" | "open" | "investigating" | "closed">("all");

    useEffect(() => { fetchIncidents(); }, []);

    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "incidents"));
            setIncidents(snap.docs.map(d => ({ id: d.id, ...d.data() } as Incident)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const updateStatus = async (id: string, status: Incident["status"]) => {
        setUpdating(id);
        try {
            await updateDoc(doc(db, "incidents", id), { status, updatedAt: serverTimestamp() });
            setIncidents(prev => prev.map(i => i.id === id ? { ...i, status } : i));
        } catch(e) { console.error(e); }
        finally { setUpdating(null); }
    };

    const filtered = incidents.filter(i => {
        const matchTab = tab === "all" || i.status === tab;
        const matchSearch = !search || i.title.toLowerCase().includes(search.toLowerCase()) ||
            i.location.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">All Incidents</h1>
                    <p className="text-sm text-gray-500 mt-0.5">View and manage reported incidents</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchIncidents} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <Link href="/incidents/report" className="h-10 px-5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <AlertOctagon className="h-4 w-4" /> Report
                    </Link>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-white rounded-xl border border-gray-100 p-1.5 flex gap-1">
                    {(["all", "open", "investigating", "closed"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${tab === t ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                            {t}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input placeholder="Search incidents..." value={search} onChange={e => setSearch(e.target.value)}
                        className="h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
                </div>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <AlertOctagon className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No incidents found</p>
                    <p className="text-xs text-gray-400">No incidents match the current filter.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((inc, i) => {
                            const s = STATUS_CONFIG[inc.status];
                            const StatusIcon = s.icon;
                            return (
                                <motion.div key={inc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-black text-gray-900">{inc.title}</p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${SEVERITY_COLOR[inc.severity]}`}>{inc.severity}</span>
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${s.color}`}>
                                                    <StatusIcon className="h-3 w-3" /> {s.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">{inc.incidentType} · {inc.location} · {inc.date}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">By {inc.reportedBy}</p>
                                            {inc.description && <p className="text-xs text-gray-500 mt-1 line-clamp-2">{inc.description}</p>}
                                        </div>
                                        <div className="flex gap-2">
                                            {inc.status === "open" && (
                                                <button onClick={() => updateStatus(inc.id, "investigating")} disabled={!!updating}
                                                    className="h-8 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors flex items-center gap-1">
                                                    <PlayCircle className="h-3.5 w-3.5"/> Investigate
                                                </button>
                                            )}
                                            {inc.status === "investigating" && (
                                                <button onClick={() => updateStatus(inc.id, "closed")} disabled={!!updating}
                                                    className="h-8 px-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold transition-colors flex items-center gap-1">
                                                    {updating === inc.id ? <div className="animate-spin h-3 w-3 border border-green-400 border-t-transparent rounded-full"/> : <><CheckCircle2 className="h-3.5 w-3.5"/> Close</>}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

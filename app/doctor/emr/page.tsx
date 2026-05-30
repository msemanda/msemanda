"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
    FileText, Search, RefreshCw, Pill, CalendarDays,
    Clock, Loader2, ChevronRight,
} from "lucide-react";

interface PatientSummary {
    key: string;
    name: string;
    email: string;
    lastVisit: string;
    visitCount: number;
}

const STATUS_BADGE: Record<string, string> = {
    SCHEDULED:  "bg-gray-50 text-gray-500",
    CALLED:     "bg-purple-50 text-purple-700",
    COMPLETED:  "bg-green-50 text-green-700",
    CANCELLED:  "bg-red-50 text-red-500",
};

const ORDER_TYPE_COLOR: Record<string, string> = {
    MEDICATION: "bg-blue-50 text-blue-700",
    LAB:        "bg-amber-50 text-amber-700",
    RADIOLOGY:  "bg-purple-50 text-purple-700",
    NURSING:    "bg-teal-50 text-teal-700",
    DIET:       "bg-green-50 text-green-700",
    PROCEDURE:  "bg-rose-50 text-rose-700",
};

export default function EMRPage() {
    const { profile } = useAuth();
    const [patients, setPatients]     = useState<PatientSummary[]>([]);
    const [loading, setLoading]       = useState(true);
    const [selected, setSelected]     = useState<PatientSummary | null>(null);
    const [visits, setVisits]         = useState<any[]>([]);
    const [orders, setOrders]         = useState<any[]>([]);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [search, setSearch]         = useState("");

    const loadPatients = async () => {
        if (!profile?.uid) return;
        setLoading(true);
        try {
            const snap = await getDocs(query(
                collection(db, "appointments"),
                where("doctorId", "==", profile.uid),
                orderBy("date", "desc"),
            ));

            const map = new Map<string, PatientSummary>();
            snap.docs.forEach(d => {
                const data = d.data() as Record<string, string>;
                const key = data.patientEmail || data.patientName;
                if (!key) return;
                if (map.has(key)) {
                    map.get(key)!.visitCount++;
                } else {
                    map.set(key, {
                        key,
                        name: data.patientName || "Unknown",
                        email: data.patientEmail || "",
                        lastVisit: data.date || "",
                        visitCount: 1,
                    });
                }
            });
            setPatients(Array.from(map.values()));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const selectPatient = async (p: PatientSummary) => {
        setSelected(p);
        setLoadingDetail(true);
        try {
            const [visitSnap, orderSnap] = await Promise.all([
                getDocs(query(
                    collection(db, "appointments"),
                    where("doctorId", "==", profile?.uid),
                    where("patientEmail", "==", p.email),
                    orderBy("date", "desc"),
                )),
                getDocs(query(
                    collection(db, "cpoeOrders"),
                    where("patientEmail", "==", p.email),
                    orderBy("createdAt", "desc"),
                )),
            ]);
            setVisits(visitSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setOrders(orderSnap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 10));
        } catch (e) { console.error(e); }
        finally { setLoadingDetail(false); }
    };

    useEffect(() => { loadPatients(); }, [profile?.uid]);

    const filtered = patients.filter(p => {
        const q = search.toLowerCase();
        return !q || p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
    });

    const formatDate = (iso: string) => {
        if (!iso) return "—";
        try { return new Date(iso + "T00:00:00").toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" }); }
        catch { return iso; }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-blue-600" /> Electronic Medical Records
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Patient visit history and clinical orders under your care</p>
                </div>
                <button onClick={loadPatients} disabled={loading}
                    className="h-9 w-9 rounded-xl border border-gray-100 bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[70vh]">
                {/* Patient list */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-lg border-0 outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Search patient..." />
                        </div>
                    </div>

                    <div className="flex-1 divide-y divide-gray-50 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-20 gap-2 text-gray-400 text-sm">
                                <Loader2 className="h-5 w-5 animate-spin" /> Loading patients…
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-20 text-center text-gray-400 text-sm px-4">
                                {search ? "No patients match your search." : "No patients found yet. Appointments will appear here."}
                            </div>
                        ) : filtered.map(p => (
                            <button key={p.key} onClick={() => selectPatient(p)}
                                className={`w-full text-left px-4 py-3.5 hover:bg-blue-50/50 transition-colors flex items-center gap-3 ${selected?.key === p.key ? "bg-blue-50 border-r-2 border-blue-600" : ""}`}>
                                <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center font-black text-blue-700 text-sm shrink-0">
                                    {p.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                                    <p className="text-xs text-gray-400">
                                        {p.visitCount} visit{p.visitCount !== 1 ? "s" : ""} · Last: {formatDate(p.lastVisit)}
                                    </p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* EMR detail */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto">
                    {!selected ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 text-gray-400">
                            <FileText className="h-12 w-12 mb-3 opacity-20" />
                            <p className="font-semibold">Select a patient to view their EMR</p>
                            <p className="text-xs mt-1 text-gray-300">Visit history and clinical orders will appear here</p>
                        </div>
                    ) : loadingDetail ? (
                        <div className="h-full flex items-center justify-center gap-2 text-gray-400 text-sm">
                            <Loader2 className="h-5 w-5 animate-spin" /> Loading records…
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 space-y-5">
                            {/* Patient header */}
                            <div className="flex items-start gap-3 pb-4 border-b border-gray-50">
                                <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center font-black text-blue-700 text-lg shrink-0">
                                    {selected.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h2 className="text-lg font-black text-gray-900">{selected.name}</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">{selected.email}</p>
                                    <div className="flex items-center gap-3 mt-1.5">
                                        <span className="text-xs text-gray-500">{selected.visitCount} visit{selected.visitCount !== 1 ? "s" : ""} under your care</span>
                                        <span className="text-xs text-blue-600 font-semibold">Last: {formatDate(selected.lastVisit)}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Visit history */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <CalendarDays className="h-3.5 w-3.5" /> Visit History ({visits.length})
                                </h3>
                                {visits.length === 0 ? (
                                    <p className="text-xs text-gray-400 py-2">No visit records found.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {visits.slice(0, 5).map(v => (
                                            <div key={v.id} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-bold text-gray-900">{formatDate(v.date)}</span>
                                                        {v.time && (
                                                            <span className="text-xs text-gray-400 flex items-center gap-0.5">
                                                                <Clock className="h-3 w-3" />{v.time}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {v.notes && <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[220px]">{v.notes}</p>}
                                                </div>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${STATUS_BADGE[v.status] || "bg-gray-50 text-gray-500"}`}>
                                                    {v.status}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Clinical orders */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Pill className="h-3.5 w-3.5" /> Clinical Orders ({orders.length})
                                </h3>
                                {orders.length === 0 ? (
                                    <p className="text-xs text-gray-400 py-2">No CPOE orders placed for this patient yet.</p>
                                ) : (
                                    <div className="space-y-2">
                                        {orders.map(o => (
                                            <div key={o.id} className="flex items-start justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-0.5">
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${ORDER_TYPE_COLOR[o.orderType] || "bg-gray-100 text-gray-500"}`}>
                                                            {o.orderType}
                                                        </span>
                                                        {o.priority && o.priority !== "ROUTINE" && (
                                                            <span className={`text-[10px] font-black ${o.priority === "STAT" ? "text-red-600" : "text-amber-600"}`}>
                                                                {o.priority}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs font-bold text-gray-900 truncate">{o.detail}</p>
                                                    {o.notes && <p className="text-xs text-gray-400 mt-0.5">{o.notes}</p>}
                                                </div>
                                                <div className="text-right shrink-0 ml-3">
                                                    {o.amount > 0 && (
                                                        <p className="text-xs font-black text-gray-700">UGX {o.amount?.toLocaleString()}</p>
                                                    )}
                                                    <p className="text-[10px] text-gray-400 mt-0.5">{o.status?.replace(/_/g, " ")}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

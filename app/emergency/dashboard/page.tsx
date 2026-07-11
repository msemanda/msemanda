"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, orderBy, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Ambulance, Users, AlertCircle, Clock, Activity, ArrowRight, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonStatCard } from "@/components/ui/Skeleton";

interface EDPatient {
    id: string;
    patientName: string;
    age?: number;
    complaint: string;
    triageLevel: string;
    status: string;
    arrivalTime: string;
    assignedDoctor?: string;
}

const TRIAGE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
    IMMEDIATE:  { label: "IMMEDIATE",   color: "text-red-700",   bg: "bg-red-50",   border: "border-red-200",   dot: "bg-red-500"   },
    URGENT:     { label: "URGENT",      color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
    LESS_URGENT:{ label: "LESS URGENT", color: "text-blue-700",  bg: "bg-blue-50",  border: "border-blue-200",  dot: "bg-blue-500"  },
    NON_URGENT: { label: "NON-URGENT",  color: "text-green-700", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
};

function timeAgo(iso: string): string {
    if (!iso) return "—";
    const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (diff < 1)  return "just now";
    if (diff < 60) return `${diff} min ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}min ago`;
}

export default function EmergencyDashboard() {
    const { profile }  = useAuth();
    const [patients, setPatients] = useState<EDPatient[]>([]);
    const [loading, setLoading]   = useState(true);
    const [filter, setFilter]     = useState("ALL");

    async function load() {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, "emergencyCases"), orderBy("arrivalTime", "desc")));
            setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() } as EDPatient)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }

    useEffect(() => { load(); }, []);

    const active   = patients.filter(p => p.status !== "DISCHARGED");
    const filtered = filter === "ALL" ? active : active.filter(p => p.triageLevel === filter);

    const stats = [
        { label: "In ED Now",       value: String(active.length),                                              icon: Users,     color: "text-blue-600",  bg: "bg-blue-50"  },
        { label: "Immediate",       value: String(active.filter(p => p.triageLevel === "IMMEDIATE").length),   icon: AlertCircle, color: "text-red-600", bg: "bg-red-50"   },
        { label: "Waiting",         value: String(active.filter(p => p.status === "WAITING").length),          icon: Clock,     color: "text-amber-600", bg: "bg-amber-50" },
        { label: "In Treatment",    value: String(active.filter(p => p.status === "IN_TREATMENT").length),     icon: Ambulance, color: "text-green-600", bg: "bg-green-50" },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Activity className="h-6 w-6 text-red-600" /> Emergency Department
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Real-time triage board &bull; <span className="font-bold text-red-600">{profile?.name}</span>
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={load} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors">
                        <RefreshCw className={`h-4 w-4 text-gray-600 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-100">
                        <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-xs font-black text-red-700">ED ACTIVE</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
                    : stats.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <Card key={s.label} variant="interactive" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="p-6">
                                <div className={`inline-flex p-2.5 rounded-xl ${s.bg} mb-3`}><Icon className={`h-5 w-5 ${s.color}`} /></div>
                                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                                <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
                            </Card>
                        );
                    })}
            </div>

            <div className="flex gap-2 flex-wrap">
                {["ALL", "IMMEDIATE", "URGENT", "LESS_URGENT", "NON_URGENT"].map((t) => (
                    <button key={t} onClick={() => setFilter(t)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            filter === t
                                ? t === "ALL" ? "bg-gray-900 text-white" : `${TRIAGE_CONFIG[t]?.bg} ${TRIAGE_CONFIG[t]?.color} border ${TRIAGE_CONFIG[t]?.border}`
                                : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
                        }`}
                    >
                        {t === "ALL" ? "All Patients" : TRIAGE_CONFIG[t]?.label}
                        {t !== "ALL" && (
                            <span className="ml-1.5 opacity-70">
                                ({active.filter(p => p.triageLevel === t).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="space-y-2">
                {loading && <div className="py-8 text-center text-sm text-gray-400">Loading emergency cases…</div>}
                {!loading && filtered.length === 0 && (
                    <div className="py-8 text-center text-sm text-gray-400">No active emergency cases</div>
                )}
                <AnimatePresence>
                    {filtered.map((p, i) => {
                        const cfg = TRIAGE_CONFIG[p.triageLevel] ?? TRIAGE_CONFIG.NON_URGENT;
                        return (
                            <motion.div key={p.id}
                                initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ delay: i * 0.04 }}
                                className={`bg-white rounded-xl border ${cfg.border} p-4 flex items-center gap-4 hover:shadow-sm transition-all`}
                            >
                                <div className="flex items-center gap-2 w-28 shrink-0">
                                    <div className={`h-2.5 w-2.5 rounded-full ${cfg.dot} animate-pulse`} />
                                    <span className={`text-[10px] font-black ${cfg.color}`}>{cfg.label}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-sm font-bold text-gray-900">{p.patientName}</p>
                                        {p.age && <span className="text-xs text-gray-400">{p.age}y</span>}
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{p.complaint}</p>
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                                    <Clock className="h-3.5 w-3.5" /> {timeAgo(p.arrivalTime)}
                                </div>
                                <div className="w-28 text-xs text-gray-600 shrink-0">
                                    {p.assignedDoctor
                                        ? <span className="font-semibold">{p.assignedDoctor}</span>
                                        : <span className="text-amber-500 font-semibold">Unassigned</span>}
                                </div>
                                <Badge variant={p.status === "IN_TREATMENT" ? "blue" : "yellow"} className="shrink-0">{p.status?.replace("_", " ")}</Badge>
                                <button className="shrink-0 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                    View <ArrowRight className="h-3 w-3" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}

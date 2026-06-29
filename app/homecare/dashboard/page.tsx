"use client";

import { motion } from "framer-motion";
import { Home, Users, CalendarDays, MapPin, CheckCircle2, Clock, ArrowRight, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";
import { HomeCareVisit } from "@/types";

type VisitRow = HomeCareVisit & { address?: string; distance?: string; scheduledTime?: string };

function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

function visitDateKey(v: VisitRow): string {
    const d = toDate(v.visitDate);
    return d ? d.toISOString().slice(0, 10) : "";
}

function visitTimeStr(v: VisitRow): string {
    if (v.scheduledTime) return v.scheduledTime;
    const d = toDate(v.visitDate);
    return d ? d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—";
}

export default function HomeCareDashboard() {
    const { profile } = useAuth();
    const [allVisits, setAllVisits] = useState<VisitRow[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "homeCareVisits"));
            setAllVisits(snap.docs.map(d => ({ id: d.id, ...d.data() } as VisitRow)));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const today = todayKey();
    const todayVisits = allVisits.filter(v => visitDateKey(v) === today);
    const completedToday = todayVisits.filter(v => v.status === "COMPLETED").length;
    const upcomingToday = todayVisits.filter(v => v.status === "SCHEDULED").length;
    const activePatients = new Set(
        allVisits.filter(v => v.status === "SCHEDULED" || v.status === "COMPLETED").map(v => v.patientId)
    ).size;

    const stats = [
        { label: "Active Home Patients", value: loading ? "…" : String(activePatients), icon: Users,        color: "text-blue-600",  bg: "bg-blue-50"  },
        { label: "Visits Today",         value: loading ? "…" : String(todayVisits.length), icon: CalendarDays, color: "text-green-600", bg: "bg-green-50" },
        { label: "Completed",            value: loading ? "…" : String(completedToday),    icon: CheckCircle2, color: "text-teal-600",  bg: "bg-teal-50"  },
        { label: "Upcoming",             value: loading ? "…" : String(upcomingToday),     icon: Clock,        color: "text-amber-600", bg: "bg-amber-50" },
    ];

    const sortedVisits = [...todayVisits].sort((a, b) =>
        (toDate(a.visitDate)?.getTime() ?? 0) - (toDate(b.visitDate)?.getTime() ?? 0)
    );

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Home className="h-6 w-6 text-blue-600" /> Home Care
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Welcome, <span className="font-bold text-blue-600">{profile?.name}</span> &bull; Today&apos;s Visit Schedule
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={load} className="text-gray-400 hover:text-blue-600 transition-colors">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100">
                        <MapPin className="h-4 w-4 text-blue-600" />
                        <span className="text-xs font-bold text-blue-700">Kampala Zone</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div
                            key={s.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="stat-card"
                        >
                            <div className={`inline-flex p-2.5 rounded-xl ${s.bg} mb-3`}>
                                <Icon className={`h-5 w-5 ${s.color}`} />
                            </div>
                            <p className="text-2xl font-black text-gray-900">{s.value}</p>
                            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="font-bold text-gray-900">Today&apos;s Visits</h2>
                    <span className="text-xs text-gray-400 font-semibold">{todayVisits.length} scheduled</span>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-500 rounded-full" />
                    </div>
                ) : sortedVisits.length === 0 ? (
                    <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No visits scheduled today</p>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {sortedVisits.map((v, i) => (
                            <motion.div
                                key={v.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: i * 0.05 }}
                                className="px-5 py-4 hover:bg-gray-50 transition-colors"
                            >
                                <div className="flex items-start gap-4">
                                    <div className="text-sm font-black text-blue-600 w-14 shrink-0 pt-0.5">
                                        {visitTimeStr(v)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-sm font-bold text-gray-900">{v.patientName ?? "—"}</p>
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${v.status === "COMPLETED" ? "badge-green" : "badge-blue"}`}>
                                                {v.status}
                                            </span>
                                        </div>
                                        {v.address && (
                                            <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
                                                <MapPin className="h-3 w-3" /> {v.address}{v.distance ? ` · ${v.distance}` : ""}
                                            </div>
                                        )}
                                        <div className="flex flex-wrap gap-1.5">
                                            {(v.services ?? []).map(s => (
                                                <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">{s}</span>
                                            ))}
                                        </div>
                                    </div>
                                    {v.status === "SCHEDULED" && (
                                        <button className="shrink-0 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                            Start <ArrowRight className="h-3 w-3" />
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

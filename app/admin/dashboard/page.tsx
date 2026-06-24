"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { tsMs, fmtDateTime } from "@/lib/ts";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
    Users,
    Stethoscope,
    Calendar,
    CreditCard,
    TrendingUp,
    Search,
    Bell,
    Activity,
    RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function AdminDashboard() {
    const { profile } = useAuth();

    const [stats, setStats] = useState([
        { name: "Total Patients",   value: "...", icon: Users,       color: "text-cyan-600",   bg: "bg-cyan-50"   },
        { name: "Verified Doctors", value: "...", icon: Stethoscope, color: "text-teal-600",   bg: "bg-teal-50"   },
        { name: "Appointments",     value: "...", icon: Calendar,    color: "text-sky-600",    bg: "bg-sky-50"    },
        { name: "Total Revenue",    value: "...", icon: CreditCard,  color: "text-indigo-600", bg: "bg-indigo-50" },
    ]);
    const [statsLoading, setStatsLoading] = useState(true);

    // Recent login sessions
    const [sessions, setSessions]     = useState<any[]>([]);
    const [sessionsLoading, setSessionsLoading] = useState(true);

    // System health (DB latency + active users)
    const [health, setHealth] = useState<{ latencyMs: number; activeSessions: number } | null>(null);
    const [healthLoading, setHealthLoading] = useState(true);

    // ── stats ──────────────────────────────────────────────────────────────
    useEffect(() => {
        const run = async () => {
            setStatsLoading(true);
            try {
                const [patientsSnap, doctorsSnap, apptSnap, txSnap] = await Promise.all([
                    getDocs(query(collection(db, "users"), where("role", "==", "PATIENT"))),
                    getDocs(query(collection(db, "users"), where("role", "==", "DOCTOR"), where("approved", "==", true))),
                    getDocs(collection(db, "appointments")),
                    getDocs(collection(db, "transactions")),
                ]);
                let revenue = 0;
                txSnap.forEach(d => { revenue += (d.data().type === "INCOME" ? d.data().amount : 0) || 0; });
                setStats([
                    { name: "Total Patients",   value: patientsSnap.size.toString(),       icon: Users,       color: "text-cyan-600",   bg: "bg-cyan-50"   },
                    { name: "Verified Doctors", value: doctorsSnap.size.toString(),         icon: Stethoscope, color: "text-teal-600",   bg: "bg-teal-50"   },
                    { name: "Appointments",     value: apptSnap.size.toString(),            icon: Calendar,    color: "text-sky-600",    bg: "bg-sky-50"    },
                    { name: "Total Revenue",    value: `UGX ${revenue.toLocaleString()}`,  icon: CreditCard,  color: "text-indigo-600", bg: "bg-indigo-50" },
                ]);
            } catch (e) { console.error(e); }
            finally { setStatsLoading(false); }
        };
        run();
    }, []);

    // ── recent sessions ────────────────────────────────────────────────────
    const fetchSessions = useCallback(async () => {
        setSessionsLoading(true);
        try {
            const snap = await getDocs(
                query(collection(db, "sessions"), orderBy("timestamp", "desc"), limit(5))
            );
            setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch (e) { console.error(e); }
        finally { setSessionsLoading(false); }
    }, []);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    // ── system health ──────────────────────────────────────────────────────
    const fetchHealth = useCallback(async () => {
        setHealthLoading(true);
        try {
            const res = await fetch("/api/health");
            if (res.ok) setHealth(await res.json());
        } catch (e) { console.error(e); }
        finally { setHealthLoading(false); }
    }, []);

    useEffect(() => {
        fetchHealth();
        const id = setInterval(fetchHealth, 30_000);
        return () => clearInterval(id);
    }, [fetchHealth]);

    const latency      = health?.latencyMs ?? 0;
    const activeUsers  = health?.activeSessions ?? 0;
    // Latency bar: 0ms = 0%, 200ms = 100%
    const latencyPct   = Math.min(100, Math.round((latency / 200) * 100));
    // Active users bar: cap at 50 users = 100%
    const activeUsersPct = Math.min(100, Math.round((activeUsers / 50) * 100));

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Rhona Medical Center &mdash; system overview</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="h-9 w-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-slate-400 hover:text-cyan-600 transition-all shadow-sm">
                        <Search className="h-4 w-4" />
                    </button>
                    <button className="h-9 w-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-slate-400 hover:text-cyan-600 transition-all shadow-sm relative">
                        <Bell className="h-4 w-4" />
                        <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-cyan-500 rounded-full" />
                    </button>
                    <div className="h-9 px-4 rounded-xl bg-slate-900 text-cyan-400 font-black text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Live
                    </div>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.name}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 group hover:border-cyan-100 transition-all cursor-default"
                        >
                            <div className="flex flex-col gap-3">
                                <div className={cn(stat.bg, stat.color, "h-9 w-9 rounded-xl flex items-center justify-center shadow-sm shrink-0")}>
                                    <Icon className="h-4 w-4" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.name}</p>
                                    <p className="text-xl font-black text-slate-900">{statsLoading ? "..." : stat.value}</p>
                                </div>
                                <div className="flex items-center text-[10px] font-bold text-teal-600 bg-teal-50 w-fit px-2 py-1 rounded-lg">
                                    <TrendingUp className="h-2.5 w-2.5 mr-1" /> Live
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Network Activity = recent logins */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-900">Recent Network Activity</h2>
                        <div className="flex items-center gap-3">
                            <button onClick={fetchSessions} className="text-gray-400 hover:text-cyan-600 transition-colors">
                                <RefreshCw className={cn("h-3.5 w-3.5", sessionsLoading && "animate-spin")} />
                            </button>
                            <Link href="/admin/sessions" className="text-xs font-bold text-cyan-600 hover:underline">View all</Link>
                        </div>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 space-y-1">
                            {sessionsLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin h-6 w-6 border-[3px] border-cyan-100 border-t-cyan-500 rounded-full" />
                                </div>
                            ) : sessions.length === 0 ? (
                                <p className="text-center text-gray-400 py-8 text-xs font-bold uppercase tracking-widest">No Recent Activity</p>
                            ) : (
                                sessions.map((s) => (
                                    <div key={s.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-cyan-50 flex items-center justify-center font-black text-cyan-600 text-xs shadow-sm shrink-0">
                                                {(s.email ?? "?").charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-gray-900 truncate">{s.email}</p>
                                                <p className="text-[10px] text-gray-400 font-bold truncate">{fmtDateTime(s.timestamp)}</p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-teal-50 text-teal-700 shrink-0 ml-2">
                                            Login
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* System Performance — real data */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-900">System Performance</h2>
                        <button onClick={fetchHealth} className="text-gray-400 hover:text-cyan-600 transition-colors">
                            <RefreshCw className={cn("h-3.5 w-3.5", healthLoading && "animate-spin")} />
                        </button>
                    </div>
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Activity className="h-24 w-24" />
                        </div>
                        <div className="relative z-10 flex flex-col gap-4">
                            <div>
                                <h3 className="text-base font-black mb-0.5">Live Nodes</h3>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Central Processing</p>
                            </div>

                            <div className="space-y-4">
                                {/* DB Latency */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                        <span>Database Latency</span>
                                        <span>{healthLoading ? "..." : `${latency}ms`}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${latencyPct}%` }}
                                            transition={{ duration: 0.6 }}
                                            className={cn("h-full rounded-full", latency < 50 ? "bg-teal-400" : latency < 120 ? "bg-cyan-400" : "bg-red-400")}
                                        />
                                    </div>
                                </div>

                                {/* Active users (24h) */}
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                        <span>Active Users (24h)</span>
                                        <span>{healthLoading ? "..." : activeUsers}</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${activeUsersPct}%` }}
                                            transition={{ duration: 0.6 }}
                                            className="h-full bg-cyan-400 rounded-full"
                                        />
                                    </div>
                                </div>

                                <Link href="/admin/sessions">
                                    <Button className="w-full bg-white text-gray-900 hover:bg-cyan-50 h-10 rounded-xl shadow-md text-xs font-bold">
                                        Open Health Console
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

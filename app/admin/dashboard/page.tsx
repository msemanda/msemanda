"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { cn } from "@/lib/utils";
import { toDate } from "@/lib/ts";
import {
    Users,
    Stethoscope,
    Calendar,
    CreditCard,
    Activity,
    RefreshCw,
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { SkeletonStatCard } from "@/components/ui/Skeleton";
import { TrendChart } from "@/components/charts/TrendChart";
import { DonutChart } from "@/components/charts/DonutChart";
import { BarChart } from "@/components/charts/BarChart";
import Link from "next/link";

interface Appointment {
    date?: string;
    status?: string;
}

interface Transaction {
    type?: string;
    category?: string;
    amount?: number;
    date?: unknown;
}

const STATUS_COLORS: Record<string, string> = {
    SCHEDULED:       "#5d93ac",
    CONFIRMED:       "#5d93ac",
    PENDING_PAYMENT: "#f59e0b",
    COMPLETED:       "#22c55e",
    CANCELLED:       "#e92027",
};

function last14Days(): { key: string; label: string }[] {
    const days: { key: string; label: string }[] = [];
    for (let i = 13; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push({
            key: d.toISOString().slice(0, 10),
            label: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
        });
    }
    return days;
}

export default function AdminDashboard() {
    const [stats, setStats] = useState([
        { name: "Total Patients",   value: "...", icon: Users,       color: "text-cyan-600",   bg: "bg-cyan-50"   },
        { name: "Verified Doctors", value: "...", icon: Stethoscope, color: "text-teal-600",   bg: "bg-teal-50"   },
        { name: "Appointments",     value: "...", icon: Calendar,    color: "text-sky-600",    bg: "bg-sky-50"    },
        { name: "Total Revenue",    value: "...", icon: CreditCard,  color: "text-indigo-600", bg: "bg-indigo-50" },
    ]);
    const [statsLoading, setStatsLoading] = useState(true);

    // Chart data
    const [apptTrend, setApptTrend] = useState<{ categories: string[]; values: number[] }>({ categories: [], values: [] });
    const [statusBreakdown, setStatusBreakdown] = useState<{ label: string; value: number; color: string }[]>([]);
    const [revenueByCategory, setRevenueByCategory] = useState<{ label: string; value: number }[]>([]);

    // System health (DB latency + active users)
    const [health, setHealth] = useState<{ latencyMs: number; activeSessions: number } | null>(null);
    const [healthLoading, setHealthLoading] = useState(true);

    // ── stats + charts ────────────────────────────────────────────────────
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

                // Appointments trend — last 14 days
                const appointments = apptSnap.docs.map(d => d.data() as Appointment);
                const days = last14Days();
                const countByDay = new Map(days.map(d => [d.key, 0]));
                for (const a of appointments) {
                    if (a.date && countByDay.has(a.date)) {
                        countByDay.set(a.date, (countByDay.get(a.date) ?? 0) + 1);
                    }
                }
                setApptTrend({
                    categories: days.map(d => d.label),
                    values: days.map(d => countByDay.get(d.key) ?? 0),
                });

                // Appointment status breakdown
                const statusCounts: Record<string, number> = { SCHEDULED: 0, CONFIRMED: 0, PENDING_PAYMENT: 0, COMPLETED: 0, CANCELLED: 0 };
                for (const a of appointments) {
                    if (a.status && a.status in statusCounts) statusCounts[a.status]++;
                }
                setStatusBreakdown(
                    Object.entries(statusCounts)
                        .filter(([, v]) => v > 0)
                        .map(([label, value]) => ({ label: label.charAt(0) + label.slice(1).toLowerCase(), value, color: STATUS_COLORS[label] }))
                );

                // Revenue by category — this month, income only
                const now = new Date();
                const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
                const byCategory = new Map<string, number>();
                for (const doc of txSnap.docs) {
                    const t = doc.data() as Transaction;
                    if (t.type !== "INCOME") continue;
                    const ts = toDate(t.date)?.getTime() ?? 0;
                    if (ts < monthStart) continue;
                    const cat = t.category || "Other";
                    byCategory.set(cat, (byCategory.get(cat) ?? 0) + (t.amount || 0));
                }
                setRevenueByCategory(
                    Array.from(byCategory.entries())
                        .map(([label, value]) => ({ label, value }))
                        .sort((a, b) => b.value - a.value)
                        .slice(0, 6)
                );
            } catch (e) { console.error(e); }
            finally { setStatsLoading(false); }
        };
        run();
    }, []);

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
                    <p className="text-sm text-slate-500 mt-0.5">RHD Medical Services &mdash; system overview</p>
                </div>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {statsLoading
                    ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
                    : stats.map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <Card
                                key={stat.name}
                                variant="interactive"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.08 }}
                                className="p-4"
                            >
                                <div className="flex flex-col gap-3">
                                    <div className={cn(stat.bg, stat.color, "h-9 w-9 rounded-xl flex items-center justify-center shadow-sm shrink-0")}>
                                        <Icon className="h-4 w-4" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.name}</p>
                                        <p className="text-xl font-black text-slate-900">{stat.value}</p>
                                    </div>
                                </div>
                            </Card>
                        );
                    })}
            </div>

            {/* Appointments trend */}
            <Card className="p-5">
                <h2 className="text-sm font-black text-gray-900 mb-4">Appointments &mdash; Last 14 Days</h2>
                {statsLoading ? (
                    <div className="h-[220px] flex items-center justify-center text-xs text-gray-400">Loading…</div>
                ) : (
                    <TrendChart
                        categories={apptTrend.categories}
                        series={[{ label: "Appointments", values: apptTrend.values, color: "#5d93ac" }]}
                    />
                )}
            </Card>

            {/* Status breakdown, revenue by category, system performance */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-5">
                    <h2 className="text-sm font-black text-gray-900 mb-4">Appointment Status</h2>
                    {statsLoading ? (
                        <div className="h-[180px] flex items-center justify-center text-xs text-gray-400">Loading…</div>
                    ) : (
                        <DonutChart data={statusBreakdown} size={140} />
                    )}
                </Card>

                <Card className="p-5">
                    <h2 className="text-sm font-black text-gray-900 mb-4">Revenue by Category (This Month)</h2>
                    {statsLoading ? (
                        <div className="h-[180px] flex items-center justify-center text-xs text-gray-400">Loading…</div>
                    ) : (
                        <BarChart data={revenueByCategory} formatValue={v => `UGX ${v.toLocaleString()}`} />
                    )}
                </Card>

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
                                <h3 className="text-base font-black mb-0.5">System Health</h3>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Live Metrics</p>
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

                                <Link href="/admin/config">
                                    <Button className="w-full bg-white text-gray-900 hover:bg-cyan-50 h-10 rounded-xl shadow-md text-xs font-bold">
                                        Open System Logs
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

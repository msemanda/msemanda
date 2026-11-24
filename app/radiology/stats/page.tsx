"use client";

import { motion } from "framer-motion";
import { BarChart3, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";
import { CPOEOrder } from "@/types";

const PRIORITY_CONFIG: Record<string, { label: string; color: string }> = {
    ROUTINE: { label: "Routine", color: "bg-gray-400" },
    URGENT:  { label: "Urgent",  color: "bg-amber-500" },
    STAT:    { label: "STAT",    color: "bg-red-500" },
};

const MONTH_LABELS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export default function RadiologyStatsPage() {
    const [orders, setOrders] = useState<CPOEOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, "cpoeOrders"), where("orderType", "==", "RADIOLOGY")));
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as CPOEOrder)));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const now = new Date();
    const thisMonth = now.getMonth();
    const thisYear  = now.getFullYear();

    const mtdOrders = orders.filter(o => {
        const d = toDate(o.createdAt);
        return d && d.getFullYear() === thisYear && d.getMonth() === thisMonth;
    });
    const pending = orders.filter(o => o.status === "PENDING" || o.status === "IN_PROGRESS").length;

    const completedWithTAT = orders.filter(o => o.status === "COMPLETED" && o.createdAt && o.reportedAt);
    const avgTATMin = completedWithTAT.length > 0
        ? Math.round(
            completedWithTAT.reduce((sum, o) => {
                const start = toDate(o.createdAt)?.getTime() ?? 0;
                const end   = toDate(o.reportedAt)?.getTime() ?? 0;
                return sum + (end - start) / 60000;
            }, 0) / completedWithTAT.length
          )
        : 0;

    const reportsDue = orders.filter(o => {
        if (o.status !== "IN_PROGRESS") return false;
        const d = toDate(o.createdAt);
        return d && d.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
    }).length;

    const priorityCount: Record<string, number> = {};
    for (const o of orders) {
        priorityCount[o.priority] = (priorityCount[o.priority] ?? 0) + 1;
    }
    const total = Object.values(priorityCount).reduce((s, n) => s + n, 0) || 1;
    const priorityStats = Object.entries(priorityCount)
        .sort((a, b) => b[1] - a[1])
        .map(([p, count]) => ({
            label: PRIORITY_CONFIG[p]?.label ?? p,
            count,
            color: PRIORITY_CONFIG[p]?.color ?? "bg-gray-400",
            pct:   Math.round((count / total) * 100),
        }));

    const monthlyBuckets: Record<number, number> = {};
    for (const o of orders) {
        const d = toDate(o.createdAt);
        if (d && d.getFullYear() === thisYear) {
            const m = d.getMonth();
            monthlyBuckets[m] = (monthlyBuckets[m] ?? 0) + 1;
        }
    }
    const presentMonths = Array.from({ length: thisMonth + 1 }, (_, i) => ({
        month: MONTH_LABELS[i],
        count: monthlyBuckets[i] ?? 0,
    }));
    const maxMonthly = Math.max(...presentMonths.map(m => m.count), 1);

    const statCards = [
        { label: "This Month", value: loading ? "…" : String(mtdOrders.length), sub: "studies"    },
        { label: "Pending",    value: loading ? "…" : String(pending),           sub: "orders"     },
        { label: "Avg TAT",    value: loading ? "…" : (avgTATMin ? `${avgTATMin} min` : "—"),  sub: "turnaround" },
        { label: "Reports Due",value: loading ? "…" : String(reportsDue),        sub: "today"      },
    ];

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-violet-600" /> Radiology Statistics
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Imaging volume and performance metrics</p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-violet-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s, i) => (
                    <motion.div
                        key={s.label}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center"
                    >
                        <p className="text-3xl font-black text-gray-900">{s.value}</p>
                        <p className="text-xs text-gray-400 mt-1">{s.label} {s.sub}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-black text-gray-900 mb-4">Studies by Priority (MTD)</h2>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin h-5 w-5 border-[3px] border-violet-100 border-t-violet-500 rounded-full" />
                        </div>
                    ) : priorityStats.length === 0 ? (
                        <p className="text-center text-gray-400 py-8 text-xs">No data yet</p>
                    ) : (
                        <div className="space-y-3">
                            {priorityStats.map(s => (
                                <div key={s.label}>
                                    <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                                        <span>{s.label}</span><span>{s.count}</span>
                                    </div>
                                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <motion.div
                                            initial={{ width: 0 }}
                                            animate={{ width: `${s.pct}%` }}
                                            transition={{ delay: 0.3, duration: 0.6 }}
                                            className={`h-full rounded-full ${s.color}`}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-black text-gray-900 mb-4">Monthly Volume ({thisYear})</h2>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin h-5 w-5 border-[3px] border-violet-100 border-t-violet-500 rounded-full" />
                        </div>
                    ) : (
                        <div className="flex items-end gap-3 h-32">
                            {presentMonths.map(m => (
                                <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                    <span className="text-[10px] font-bold text-gray-500">{m.count || ""}</span>
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${(m.count / maxMonthly) * 100}%` }}
                                        transition={{ delay: 0.4, duration: 0.5 }}
                                        className="w-full bg-violet-500 rounded-t-lg min-h-[4px]"
                                    />
                                    <span className="text-[10px] text-gray-400">{m.month}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

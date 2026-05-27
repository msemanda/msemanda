"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { Home, CheckCircle2, Clock, AlertCircle, RefreshCw } from "lucide-react";
import Link from "next/link";

export default function HousekeepingDashboard() {
    const [stats, setStats] = useState({ pending: 0, inProgress: 0, completed: 0, overdue: 0 });
    const [recent, setRecent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const snap = await getDocs(collection(db, "hkTasks"));
                const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                const now = Date.now() / 1000;
                setStats({
                    pending: all.filter(t => t.status === "pending").length,
                    inProgress: all.filter(t => t.status === "in_progress").length,
                    completed: all.filter(t => t.status === "completed").length,
                    overdue: all.filter(t => t.status !== "completed" && t.dueAt?.seconds && t.dueAt.seconds < now).length,
                });
                setRecent(all.filter(t => t.status !== "completed").slice(0, 8));
            } catch(e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const cards = [
        { label: "Pending", value: stats.pending, icon: Clock, color: "bg-gray-50 text-gray-500", border: "border-gray-100", href: "/housekeeping/tasks" },
        { label: "In Progress", value: stats.inProgress, icon: RefreshCw, color: "bg-blue-50 text-blue-600", border: "border-blue-100", href: "/housekeeping/tasks" },
        { label: "Completed Today", value: stats.completed, icon: CheckCircle2, color: "bg-green-50 text-green-600", border: "border-green-100", href: "/housekeeping/completed" },
        { label: "Overdue", value: stats.overdue, icon: AlertCircle, color: "bg-red-50 text-red-500", border: "border-red-100", href: "/housekeeping/tasks" },
    ];

    const PRIORITY_BADGE: Record<string, string> = {
        high: "bg-red-50 text-red-600 border-red-100",
        medium: "bg-amber-50 text-amber-700 border-amber-100",
        low: "bg-gray-50 text-gray-500 border-gray-100",
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Housekeeping Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Cleaning and sanitation task management</p>
                </div>
                <Link href="/housekeeping/tasks" className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                    <Home className="h-4 w-4" /> New Task
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((c, i) => {
                    const Icon = c.icon;
                    return (
                        <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className={`bg-white rounded-2xl border ${c.border} shadow-sm p-5`}>
                            <div className={`h-10 w-10 rounded-xl ${c.color} flex items-center justify-center mb-3`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <p className="text-2xl font-black text-gray-900">{loading ? "—" : c.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5 font-medium">{c.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                    <p className="text-sm font-black text-gray-900">Active Tasks</p>
                    <Link href="/housekeeping/tasks" className="text-xs font-bold text-blue-600 hover:underline">View all</Link>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-14"><div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full"/></div>
                ) : recent.length === 0 ? (
                    <div className="py-14 text-center">
                        <Home className="h-10 w-10 text-gray-200 mx-auto mb-3"/>
                        <p className="text-sm font-black text-gray-900">No active tasks</p>
                        <p className="text-xs text-gray-400 mt-1">Assign cleaning tasks from the Tasks page.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recent.map(t => (
                            <div key={t.id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{t.title}</p>
                                    <p className="text-xs text-gray-400">{t.location} · Assigned to {t.assignedTo}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${PRIORITY_BADGE[t.priority] || "bg-gray-50 text-gray-500 border-gray-100"}`}>
                                    {t.priority || "normal"}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

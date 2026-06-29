"use client";

import { motion } from "framer-motion";
import { Sparkles, Users, TrendingUp, Heart, ArrowRight, RefreshCw } from "lucide-react";
import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import Link from "next/link";

interface WellnessProgram {
    id: string;
    name: string;
    category: string;
    enrolled: number;
    sessions: string;
    duration: string;
    status: string;
    facilitator: string;
}

const CATEGORY_COLORS: Record<string, string> = {
    CHRONIC_DISEASE: "bg-red-50 text-red-700 border-red-100",
    FITNESS: "bg-blue-50 text-blue-700 border-blue-100",
    MENTAL_HEALTH: "bg-purple-50 text-purple-700 border-purple-100",
    NUTRITION: "bg-green-50 text-green-700 border-green-100",
    PREVENTIVE: "bg-teal-50 text-teal-700 border-teal-100",
};

export default function WellnessDashboard() {
    const [programs, setPrograms] = useState<WellnessProgram[]>([]);
    const [enrolledCount, setEnrolledCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [progSnap, enrollSnap] = await Promise.all([
                getDocs(query(collection(db, "wellnessPrograms"), where("status", "==", "ACTIVE"))),
                getDocs(collection(db, "wellnessEnrollments")),
            ]);
            setPrograms(progSnap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    name: ((r.name ?? r.programName) as string) ?? "—",
                    category: (r.category as string) ?? "OTHER",
                    enrolled: Number(r.enrolled ?? r.enrolledCount ?? 0),
                    sessions: ((r.sessions ?? r.schedule) as string) ?? "—",
                    duration: (r.duration as string) ?? "—",
                    status: (r.status as string) ?? "ACTIVE",
                    facilitator: ((r.facilitator ?? r.doctorName) as string) ?? "—",
                };
            }));
            setEnrolledCount(
                enrollSnap.docs.filter(d => d.data().status === "ACTIVE").length
            );
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const statCards = [
        { label: "Active Programs",  value: loading ? "…" : String(programs.length), icon: Sparkles,   color: "text-purple-600", bg: "bg-purple-50" },
        { label: "Enrolled Members", value: loading ? "…" : String(enrolledCount),   icon: Users,       color: "text-blue-600",   bg: "bg-blue-50"   },
        { label: "Improved Health",  value: "—",                                      icon: TrendingUp,  color: "text-green-600",  bg: "bg-green-50"  },
        { label: "Satisfaction",     value: "—",                                      icon: Heart,       color: "text-red-500",    bg: "bg-red-50"    },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Sparkles className="h-6 w-6 text-purple-600" /> Wellness Hub
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Preventive health &amp; wellness programs management</p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-purple-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {statCards.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
                            <div className={`inline-flex p-2.5 rounded-xl ${s.bg} mb-3`}><Icon className={`h-5 w-5 ${s.color}`} /></div>
                            <p className="text-2xl font-black text-gray-900">{s.value}</p>
                            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="font-bold text-gray-900">Active Wellness Programs</h2>
                    <Link href="/wellness/programs" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        Manage <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-5 w-5 border-[3px] border-purple-100 border-t-purple-500 rounded-full" />
                    </div>
                ) : programs.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-xs">No active wellness programs</p>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {programs.map((p, i) => (
                            <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                                className="px-5 py-4 hover:bg-gray-50 transition-colors flex items-center gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="text-sm font-bold text-gray-900">{p.name}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${CATEGORY_COLORS[p.category] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>
                                            {p.category.replace(/_/g, " ")}
                                        </span>
                                    </div>
                                    <p className="text-xs text-gray-400">{p.sessions} &bull; {p.duration} &bull; {p.facilitator}</p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-lg font-black text-blue-600">{p.enrolled}</p>
                                    <p className="text-[10px] text-gray-400">enrolled</p>
                                </div>
                                <div className="flex items-center gap-1.5 shrink-0">
                                    <div className="h-2 w-2 rounded-full bg-green-500" />
                                    <span className="text-xs font-semibold text-green-600">Active</span>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

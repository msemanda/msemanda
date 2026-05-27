"use client";

import { motion } from "framer-motion";
import { Users, CalendarDays, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const stats = [
    { label: "Active Patients", value: "16", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Sessions Today", value: "8", icon: CalendarDays, color: "text-green-600", bg: "bg-green-50" },
    { label: "Improving", value: "12", icon: TrendingUp, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Discharged (Week)", value: "3", icon: CheckCircle2, color: "text-gray-600", bg: "bg-gray-50" },
];

const todaySessions = [
    { id: "PT001", name: "John Mwesiga", time: "09:00", condition: "Post-stroke rehab", session: 8, progress: "IMPROVING" },
    { id: "PT002", name: "Grace Nakato", time: "10:00", condition: "Lower back pain", session: 3, progress: "IMPROVING" },
    { id: "PT003", name: "Patrick Ssemanda", time: "11:00", condition: "ACL rehabilitation", session: 12, progress: "STABLE" },
    { id: "PT004", name: "Sarah Namutebi", time: "14:00", condition: "Shoulder impingement", session: 5, progress: "STABLE" },
    { id: "PT005", name: "James Okello", time: "15:30", condition: "COPD exercise therapy", session: 20, progress: "IMPROVING" },
];

const PROGRESS_CLASS: Record<string, string> = {
    IMPROVING: "badge-green",
    STABLE: "badge-blue",
    DECLINING: "badge-red",
};

export default function PhysioDashboard() {
    const { profile } = useAuth();

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">
                    Good morning, <span className="text-blue-600">{profile?.name?.split(" ")[0]}</span>
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">You have {todaySessions.length} physiotherapy sessions scheduled today</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => {
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
                    <h2 className="font-bold text-gray-900">Today&apos;s Sessions</h2>
                    <Link href="/physiotherapy/sessions" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        View all <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
                <div className="divide-y divide-gray-50">
                    {todaySessions.map((s) => (
                        <div key={s.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                            <div className="text-sm font-black text-blue-600 w-14 shrink-0">{s.time}</div>
                            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-700 text-sm shrink-0">
                                {s.name.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{s.name}</p>
                                <p className="text-xs text-gray-400">{s.condition} &bull; Session {s.session}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${PROGRESS_CLASS[s.progress]}`}>{s.progress}</span>
                            <button className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                Start
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

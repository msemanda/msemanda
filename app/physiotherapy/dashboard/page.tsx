"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Users, CalendarDays, TrendingUp, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { SkeletonStatCard, SkeletonRow } from "@/components/ui/Skeleton";

interface PhysioSession {
    id: string;
    patientName: string;
    appointmentTime: string;
    notes?: string;
    sessionNumber?: number;
    progress?: string;
    status: string;
}

const PROGRESS_VARIANT: Record<string, BadgeVariant> = {
    IMPROVING: "green",
    STABLE:    "blue",
    DECLINING: "red",
};

export default function PhysioDashboard() {
    const { profile } = useAuth();
    const [sessions, setSessions] = useState<PhysioSession[]>([]);
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        getDocs(query(
            collection(db, "appointments"),
            where("consultationType", "==", "Physiotherapy Session"),
            orderBy("appointmentTime", "asc"),
        ))
            .then(snap => setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() } as PhysioSession))))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const todaySessions = sessions.filter(s => {
        if (!s.appointmentTime) return false;
        const d = new Date(s.appointmentTime);
        const now = new Date();
        return d.toDateString() === now.toDateString();
    });

    const improving  = sessions.filter(s => s.progress === "IMPROVING").length;
    const discharged = sessions.filter(s => s.status === "DISCHARGED").length;

    const stats = [
        { label: "Active Patients",    value: String(sessions.length), icon: Users,        color: "text-blue-600",  bg: "bg-blue-50"  },
        { label: "Sessions Today",     value: String(todaySessions.length), icon: CalendarDays, color: "text-green-600", bg: "bg-green-50" },
        { label: "Improving",          value: String(improving),        icon: TrendingUp,   color: "text-teal-600",  bg: "bg-teal-50"  },
        { label: "Discharged (Week)",  value: String(discharged),       icon: CheckCircle2, color: "text-gray-600",  bg: "bg-gray-50"  },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">
                    Good morning, <span className="text-blue-600">{profile?.name?.split(" ")[0]}</span>
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    You have {loading ? "…" : todaySessions.length} physiotherapy session{todaySessions.length !== 1 ? "s" : ""} scheduled today
                </p>
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

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="font-bold text-gray-900">Today&apos;s Sessions</h2>
                    <Link href="/physiotherapy/sessions" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        View all <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
                <div className="divide-y divide-gray-50">
                    {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
                    {!loading && todaySessions.length === 0 && (
                        <div className="px-5 py-8 text-center text-sm text-gray-400">No physiotherapy sessions scheduled today</div>
                    )}
                    {todaySessions.map((s) => (
                        <div key={s.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                            <div className="text-sm font-black text-blue-600 w-14 shrink-0">
                                {s.appointmentTime ? new Date(s.appointmentTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}
                            </div>
                            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-700 text-sm shrink-0">
                                {s.patientName?.charAt(0) ?? "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{s.patientName}</p>
                                <p className="text-xs text-gray-400">
                                    {s.notes || "Physiotherapy Session"}
                                    {s.sessionNumber ? ` · Session ${s.sessionNumber}` : ""}
                                </p>
                            </div>
                            {s.progress && <Badge variant={PROGRESS_VARIANT[s.progress] ?? "blue"}>{s.progress}</Badge>}
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

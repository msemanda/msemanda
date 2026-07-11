"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
    Users, Clock, Send, CheckCircle2, ArrowRight,
    UserPlus, CalendarDays, RefreshCw
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SkeletonStatCard, SkeletonRow } from "@/components/ui/Skeleton";

interface StatCard {
    label: string;
    value: string;
    icon: any;
    color: string;
    bg: string;
}

interface RecentAdmission {
    id: string;
    patientName: string;
    patientEmail: string;
    problem: string;
    inviteSent: boolean;
    status: string;
    admittedAt: any;
}

export default function ReceptionistDashboard() {
    const { profile } = useAuth();
    const [stats, setStats] = useState<StatCard[]>([
        { label: "Today's Admissions", value: "—", icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50" },
        { label: "Invites Sent", value: "—", icon: Send, color: "text-teal-600", bg: "bg-teal-50" },
        { label: "Pending Queue", value: "—", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Registered Today", value: "—", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    ]);
    const [recent, setRecent] = useState<RecentAdmission[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    const loadDashboard = async () => {
        setLoading(true);
        try {
            const todayStart = new Date();
            todayStart.setHours(0, 0, 0, 0);

            const admissionsSnap = await getDocs(
                query(collection(db, "admissions"),
                    where("admittedAt", ">=", todayStart),
                    limit(50))
            );
            const admissions = admissionsSnap.docs.map(d => ({ id: d.id, ...d.data() } as RecentAdmission));

            const invitesSent = admissions.filter(a => a.inviteSent).length;
            const pending = admissions.filter(a => a.status === "ADMITTED").length;
            const registered = admissions.filter(a => a.status === "REGISTERED").length;

            setStats([
                { label: "Today's Admissions", value: admissions.length.toString(), icon: UserPlus, color: "text-blue-600", bg: "bg-blue-50" },
                { label: "Invites Sent", value: invitesSent.toString(), icon: Send, color: "text-teal-600", bg: "bg-teal-50" },
                { label: "Pending Queue", value: pending.toString(), icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
                { label: "Registered Today", value: registered.toString(), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
            ]);

            setRecent(admissions.slice(0, 8));
        } catch (err) {
            console.error("Dashboard load error:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Reception Desk</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Welcome back, {profile?.name} — manage patient admissions and invitations</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={loadDashboard}
                        className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <Link href="/receptionist/admit"
                        className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm shadow-blue-600/20">
                        <UserPlus className="h-4 w-4" /> Admit Patient
                    </Link>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
                    : stats.map((stat, idx) => {
                        const Icon = stat.icon;
                        return (
                            <Card
                                key={stat.label}
                                variant="interactive"
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.08 }}
                                className="p-5"
                            >
                                <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center mb-3", stat.bg)}>
                                    <Icon className={cn("h-5 w-5", stat.color)} />
                                </div>
                                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                                <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mt-1">{stat.label}</p>
                            </Card>
                        );
                    })}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Link href="/receptionist/admit"
                    className="bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-2xl p-5 flex items-center justify-between group hover:shadow-lg transition-all">
                    <div>
                        <p className="text-xs font-bold text-blue-200 uppercase tracking-wider mb-1">Quick Action</p>
                        <p className="text-base font-black">Admit Walk-in</p>
                    </div>
                    <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <UserPlus className="h-5 w-5" />
                    </div>
                </Link>
                <Link href="/receptionist/invites"
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between group hover:border-teal-200 hover:shadow-md transition-all">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Invitations</p>
                        <p className="text-base font-black text-gray-900">Manage Invites</p>
                    </div>
                    <div className="h-10 w-10 bg-teal-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Send className="h-5 w-5 text-teal-600" />
                    </div>
                </Link>
                <Link href="/receptionist/queue"
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between group hover:border-amber-200 hover:shadow-md transition-all">
                    <div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Today</p>
                        <p className="text-base font-black text-gray-900">Patient Queue</p>
                    </div>
                    <div className="h-10 w-10 bg-amber-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                        <CalendarDays className="h-5 w-5 text-amber-600" />
                    </div>
                </Link>
            </div>

            {/* Recent admissions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="text-base font-black text-gray-900">Recent Admissions</h2>
                    <Link href="/receptionist/patients" className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1">
                        View all <ArrowRight className="h-3 w-3" />
                    </Link>
                </div>

                {loading ? (
                    <div className="divide-y divide-gray-50">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
                ) : recent.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                        <Users className="h-10 w-10 text-gray-200 mb-3" />
                        <p className="text-sm font-black text-gray-900 mb-1">No admissions today</p>
                        <p className="text-xs text-gray-400">Patients you admit will appear here</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recent.map((admission) => (
                            <div key={admission.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-600 text-xs shrink-0">
                                        {admission.patientName?.charAt(0) || "?"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-gray-900 truncate">{admission.patientName}</p>
                                        <p className="text-xs text-gray-400 truncate">{admission.patientEmail} · {admission.problem}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0 ml-4">
                                    <Badge variant={admission.inviteSent ? "teal" : "yellow"}>
                                        {admission.inviteSent ? "Invite Sent" : "No Invite"}
                                    </Badge>
                                    <Badge variant={admission.status === "REGISTERED" ? "green" : "neutral"}>
                                        {admission.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

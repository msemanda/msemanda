"use client";

import { useState, useEffect, useCallback } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Users, CalendarDays, Activity, CheckCircle2, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { SkeletonStatCard, SkeletonRow } from "@/components/ui/Skeleton";

interface PhysioSession {
    id: string;
    patient: string;
    time: string;
    therapist: string;
    status: string;
}

const STATUS_VARIANT: Record<string, BadgeVariant> = {
    SCHEDULED:   "neutral",
    IN_PROGRESS: "blue",
    COMPLETED:   "green",
};

export default function PhysioDashboard() {
    const { profile } = useAuth();
    const [sessions, setSessions] = useState<PhysioSession[]>([]);
    const [loading, setLoading]   = useState(true);
    const [advancing, setAdvancing] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "physiotherapySessions"));
            setSessions(snap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    patient: ((r.patientName ?? r.patient) as string) ?? "—",
                    time: (r.time as string) ?? "—",
                    therapist: ((r.therapist ?? r.therapistName) as string) ?? "—",
                    status: (r.status as string) ?? "SCHEDULED",
                };
            }));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleAdvance = async (session: PhysioSession) => {
        const next = session.status === "SCHEDULED" ? "IN_PROGRESS" : "COMPLETED";
        setAdvancing(session.id);
        try {
            await updateDoc(doc(db, "physiotherapySessions", session.id), { status: next });
            setSessions(prev => prev.map(s => s.id === session.id ? { ...s, status: next } : s));
        } catch (e) { console.error(e); }
        finally { setAdvancing(null); }
    };

    const scheduled  = sessions.filter(s => s.status === "SCHEDULED").length;
    const inProgress = sessions.filter(s => s.status === "IN_PROGRESS").length;
    const completed  = sessions.filter(s => s.status === "COMPLETED").length;
    const active = sessions.filter(s => s.status !== "COMPLETED");

    const stats = [
        { label: "Total Sessions",  value: String(sessions.length), icon: Users,        color: "text-blue-600",  bg: "bg-blue-50"  },
        { label: "Scheduled",       value: String(scheduled),       icon: CalendarDays, color: "text-gray-600",  bg: "bg-gray-50"  },
        { label: "In Progress",     value: String(inProgress),      icon: Activity,     color: "text-teal-600",  bg: "bg-teal-50"  },
        { label: "Completed",       value: String(completed),       icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">
                    Good morning, <span className="text-blue-600">{profile?.name?.split(" ")[0]}</span>
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    You have {loading ? "…" : active.length} active physiotherapy session{active.length !== 1 ? "s" : ""}
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
                    <h2 className="font-bold text-gray-900">Active Sessions</h2>
                    <Link href="/physiotherapy/sessions" className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1">
                        View all <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
                <div className="divide-y divide-gray-50">
                    {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
                    {!loading && active.length === 0 && (
                        <div className="px-5 py-8 text-center text-sm text-gray-400">No active physiotherapy sessions</div>
                    )}
                    {active.map((s) => (
                        <div key={s.id} className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                            <div className="text-sm font-black text-blue-600 w-16 shrink-0">{s.time}</div>
                            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-700 text-sm shrink-0">
                                {s.patient?.charAt(0) ?? "?"}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 truncate">{s.patient}</p>
                                <p className="text-xs text-gray-400">{s.therapist}</p>
                            </div>
                            <Badge variant={STATUS_VARIANT[s.status] ?? "neutral"}>{s.status.replace("_", " ")}</Badge>
                            <button onClick={() => handleAdvance(s)} disabled={advancing === s.id}
                                className="text-xs font-bold text-blue-600 hover:bg-blue-50 disabled:opacity-50 px-3 py-1.5 rounded-lg transition-colors">
                                {advancing === s.id ? "…" : s.status === "SCHEDULED" ? "Start" : "Complete"}
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

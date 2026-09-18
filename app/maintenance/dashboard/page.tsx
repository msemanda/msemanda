"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Wrench, AlertCircle, CheckCircle2, Clock, RefreshCw } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { SkeletonStatCard, SkeletonRow } from "@/components/ui/Skeleton";

const PRIORITY_VARIANT: Record<string, BadgeVariant> = {
    urgent: "red",
    high: "yellow",
};

export default function MaintenanceDashboard() {
    const [stats, setStats] = useState({ equipment: 0, pending: 0, inProgress: 0, completed: 0, alerts: 0 });
    const [recentRequests, setRecentRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [eqSnap, reqSnap, alertSnap] = await Promise.all([
                    getDocs(collection(db, "maintEquipment")),
                    getDocs(collection(db, "maintRequests")),
                    getDocs(collection(db, "maintAlerts")),
                ]);
                const requests = reqSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                setStats({
                    equipment: eqSnap.size,
                    pending: requests.filter(r => r.status === "pending").length,
                    inProgress: requests.filter(r => r.status === "in_progress").length,
                    completed: requests.filter(r => r.status === "completed").length,
                    alerts: alertSnap.size,
                });
                setRecentRequests(requests.filter(r => r.status !== "completed").slice(0, 6));
            } catch(e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const cards = [
        { label: "Registered Equipment", value: stats.equipment, icon: Wrench, color: "bg-blue-50 text-blue-600", border: "border-blue-100", href: "/maintenance/equipment" },
        { label: "Pending Requests", value: stats.pending, icon: Clock, color: "bg-gray-50 text-gray-500", border: "border-gray-100", href: "/maintenance/requests" },
        { label: "In Progress", value: stats.inProgress, icon: RefreshCw, color: "bg-amber-50 text-amber-600", border: "border-amber-100", href: "/maintenance/requests" },
        { label: "Resolved", value: stats.completed, icon: CheckCircle2, color: "bg-green-50 text-green-600", border: "border-green-100", href: "/maintenance/history" },
        { label: "Active Alerts", value: stats.alerts, icon: AlertCircle, color: "bg-red-50 text-red-500", border: "border-red-100", href: "/maintenance/alerts" },
    ];

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Machine Maintenance</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Equipment registry, maintenance requests, and alerts</p>
                </div>
                <Link href="/maintenance/requests" className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                    <Wrench className="h-4 w-4" /> New Request
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {loading
                    ? Array.from({ length: 5 }).map((_, i) => <SkeletonStatCard key={i} />)
                    : cards.map((c, i) => {
                        const Icon = c.icon;
                        return (
                            <Card key={c.label} variant="interactive" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="p-5">
                                <div className={`h-10 w-10 rounded-xl ${c.color} flex items-center justify-center mb-3`}>
                                    <Icon className="h-5 w-5" />
                                </div>
                                <p className="text-2xl font-black text-gray-900">{c.value}</p>
                                <p className="text-xs text-gray-500 mt-0.5 font-medium">{c.label}</p>
                            </Card>
                        );
                    })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                    <p className="text-sm font-black text-gray-900">Active Maintenance Requests</p>
                    <Link href="/maintenance/requests" className="text-xs font-bold text-blue-600 hover:underline">View all</Link>
                </div>
                {loading ? (
                    <div className="divide-y divide-gray-50">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
                ) : recentRequests.length === 0 ? (
                    <div className="py-14 text-center">
                        <Wrench className="h-10 w-10 text-gray-200 mx-auto mb-3"/>
                        <p className="text-sm font-black text-gray-900">No active requests</p>
                        <p className="text-xs text-gray-400 mt-1">Submit a maintenance request when equipment needs service.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recentRequests.map(r => (
                            <div key={r.id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{r.equipmentName}</p>
                                    <p className="text-xs text-gray-400">{r.issue} · {r.location}</p>
                                </div>
                                <Badge variant={PRIORITY_VARIANT[r.priority] ?? "neutral"}>{r.priority}</Badge>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

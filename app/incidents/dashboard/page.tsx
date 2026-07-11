"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { AlertOctagon, CheckCircle2, Clock } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { SkeletonStatCard, SkeletonRow } from "@/components/ui/Skeleton";

export default function IncidentsDashboard() {
    const [stats, setStats] = useState({ total: 0, open: 0, investigating: 0, closed: 0 });
    const [recent, setRecent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const snap = await getDocs(collection(db, "incidents"));
                const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                setStats({
                    total: all.length,
                    open: all.filter(i => i.status === "open").length,
                    investigating: all.filter(i => i.status === "investigating").length,
                    closed: all.filter(i => i.status === "closed").length,
                });
                setRecent(all.slice(0, 6));
            } catch(e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const cards = [
        { label: "Total Incidents", value: stats.total, icon: AlertOctagon, color: "bg-gray-50 text-gray-600", border: "border-gray-100", href: "/incidents/list" },
        { label: "Open", value: stats.open, icon: AlertOctagon, color: "bg-red-50 text-red-500", border: "border-red-100", href: "/incidents/list" },
        { label: "Under Investigation", value: stats.investigating, icon: Clock, color: "bg-amber-50 text-amber-600", border: "border-amber-100", href: "/incidents/list" },
        { label: "Closed", value: stats.closed, icon: CheckCircle2, color: "bg-green-50 text-green-600", border: "border-green-100", href: "/incidents/list" },
    ];

    const SEVERITY_VARIANT: Record<string, BadgeVariant> = {
        critical: "red",
        high:     "yellow",
        medium:   "blue",
        low:      "neutral",
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Incident Reporting</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Safety incidents, near-misses, and adverse events</p>
                </div>
                <Link href="/incidents/report" className="h-10 px-5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                    <AlertOctagon className="h-4 w-4" /> Report Incident
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
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
                    <p className="text-sm font-black text-gray-900">Recent Incidents</p>
                    <Link href="/incidents/list" className="text-xs font-bold text-blue-600 hover:underline">View all</Link>
                </div>
                {loading ? (
                    <div className="divide-y divide-gray-50">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
                ) : recent.length === 0 ? (
                    <div className="py-14 text-center">
                        <AlertOctagon className="h-10 w-10 text-gray-200 mx-auto mb-3"/>
                        <p className="text-sm font-black text-gray-900">No incidents reported</p>
                        <p className="text-xs text-gray-400 mt-1">Report a safety incident using the button above.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recent.map(i => (
                            <div key={i.id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{i.title}</p>
                                    <p className="text-xs text-gray-400">{i.incidentType} · {i.location}</p>
                                </div>
                                <Badge variant={SEVERITY_VARIANT[i.severity] ?? "neutral"}>{i.severity}</Badge>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

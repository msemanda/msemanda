"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ShieldCheck, AlertTriangle, ClipboardList } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { SkeletonStatCard, SkeletonRow } from "@/components/ui/Skeleton";

const AUDIT_STATUS_VARIANT: Record<string, BadgeVariant> = {
    completed: "green",
    in_progress: "blue",
};

export default function QualityDashboard() {
    const [stats, setStats] = useState({ audits: 0, infections: 0, openAudits: 0, resolvedInfections: 0 });
    const [recentAudits, setRecentAudits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const [auditSnap, infSnap] = await Promise.all([
                    getDocs(collection(db, "qualityAudits")),
                    getDocs(collection(db, "infectionIncidents")),
                ]);
                const audits = auditSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                const infections = infSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                setStats({
                    audits: audits.length,
                    infections: infections.length,
                    openAudits: audits.filter(a => a.status !== "completed").length,
                    resolvedInfections: infections.filter(i => i.status === "resolved").length,
                });
                setRecentAudits(audits.slice(0, 6));
            } catch(e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const cards = [
        { label: "Total Audits", value: stats.audits, icon: ClipboardList, color: "bg-blue-50 text-blue-600", border: "border-blue-100", href: "/quality/audits" },
        { label: "Open Audits", value: stats.openAudits, icon: ShieldCheck, color: "bg-amber-50 text-amber-600", border: "border-amber-100", href: "/quality/audits" },
        { label: "Infection Incidents", value: stats.infections, icon: AlertTriangle, color: "bg-red-50 text-red-500", border: "border-red-100", href: "/quality/infections" },
        { label: "Resolved", value: stats.resolvedInfections, icon: ShieldCheck, color: "bg-green-50 text-green-600", border: "border-green-100", href: "/quality/infections" },
    ];

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Quality & Infection Control</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Quality audits, infection monitoring, and compliance</p>
                </div>
                <Link href="/quality/audits" className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                    <ClipboardList className="h-4 w-4" /> New Audit
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
                    <p className="text-sm font-black text-gray-900">Recent Audits</p>
                    <Link href="/quality/audits" className="text-xs font-bold text-blue-600 hover:underline">View all</Link>
                </div>
                {loading ? (
                    <div className="divide-y divide-gray-50">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
                ) : recentAudits.length === 0 ? (
                    <div className="py-14 text-center">
                        <ClipboardList className="h-10 w-10 text-gray-200 mx-auto mb-3"/>
                        <p className="text-sm font-black text-gray-900">No audits yet</p>
                        <p className="text-xs text-gray-400 mt-1">Schedule quality audits from the Audits page.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recentAudits.map(a => (
                            <div key={a.id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{a.title}</p>
                                    <p className="text-xs text-gray-400">{a.department} · {a.auditType}</p>
                                </div>
                                <Badge variant={AUDIT_STATUS_VARIANT[a.status] ?? "neutral"}>{a.status || "pending"}</Badge>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

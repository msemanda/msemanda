"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fmtDateTime } from "@/lib/ts";
import { ShieldCheck, Users, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SkeletonStatCard, SkeletonRow } from "@/components/ui/Skeleton";

export default function SecurityDashboard() {
    const [stats, setStats] = useState({ onDuty: 0, onSite: 0, openIncidents: 0 });
    const [recentVisitors, setRecentVisitors] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const today = new Date().toISOString().slice(0, 10);
                const [shiftsSnap, visitorsSnap, incidentsSnap] = await Promise.all([
                    getDocs(query(collection(db, "securityShifts"), where("date", "==", today))),
                    getDocs(collection(db, "visitorLogs")),
                    getDocs(query(collection(db, "incidents"), where("status", "==", "open"))),
                ]);

                const shifts = shiftsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                const visitors = visitorsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

                setStats({
                    onDuty: shifts.filter(s => s.status === "on_duty").length,
                    onSite: visitors.filter(v => v.status === "checked_in").length,
                    openIncidents: incidentsSnap.docs.length,
                });
                setRecentVisitors(visitors.filter(v => v.status === "checked_in").slice(0, 8));
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const cards = [
        { label: "Guards On Duty", value: stats.onDuty, icon: ShieldCheck, color: "bg-blue-50 text-blue-600", border: "border-blue-100", href: "/security/roster" },
        { label: "Visitors On Site", value: stats.onSite, icon: Users, color: "bg-green-50 text-green-600", border: "border-green-100", href: "/security/visitors" },
        { label: "Open Incidents", value: stats.openIncidents, icon: AlertTriangle, color: "bg-red-50 text-red-500", border: "border-red-100", href: "/incidents/list" },
    ];

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Security Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Guard duty, visitor access, and incident overview</p>
                </div>
                <Link href="/security/visitors" className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                    <Users className="h-4 w-4" /> Check In Visitor
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {loading
                    ? Array.from({ length: 3 }).map((_, i) => <SkeletonStatCard key={i} />)
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
                    <p className="text-sm font-black text-gray-900">Visitors Currently On Site</p>
                    <Link href="/security/visitors" className="text-xs font-bold text-blue-600 hover:underline">View all</Link>
                </div>
                {loading ? (
                    <div className="divide-y divide-gray-50">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
                ) : recentVisitors.length === 0 ? (
                    <div className="py-14 text-center">
                        <Users className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-black text-gray-900">No visitors on site</p>
                        <p className="text-xs text-gray-400 mt-1">Checked-in visitors will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recentVisitors.map(v => (
                            <div key={v.id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{v.visitorName}</p>
                                    <p className="text-xs text-gray-400">{v.purpose} · Visiting {v.hostName}</p>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">{fmtDateTime(v.timeIn)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

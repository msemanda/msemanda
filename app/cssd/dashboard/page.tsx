"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, where } from "firebase/firestore";
import { tsMs } from "@/lib/ts";
import { db } from "@/lib/firebase";
import { RefreshCw, PackageCheck, Clock, CheckCircle2, XCircle, ClipboardList } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { SkeletonStatCard, SkeletonRow } from "@/components/ui/Skeleton";

export default function CssdDashboard() {
    const [stats, setStats] = useState({ pending: 0, inCycle: 0, completed: 0, failed: 0 });
    const [recent, setRecent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const snap = await getDocs(collection(db, "cssdItems"));
                const items = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                setStats({
                    pending:   items.filter(i => i.status === "PENDING").length,
                    inCycle:   items.filter(i => i.status === "IN_CYCLE").length,
                    completed: items.filter(i => i.status === "COMPLETED").length,
                    failed:    items.filter(i => i.status === "FAILED").length,
                });
                setRecent(items.sort((a,b) => tsMs(b.createdAt) - tsMs(a.createdAt)).slice(0,8));
            } catch(e){ console.error(e); }
            finally { setLoading(false); }
        };
        fetchData();
    }, []);

    const cards = [
        { label: "Pending Processing", value: stats.pending, icon: Clock, color: "bg-amber-50 text-amber-600", border: "border-amber-100" },
        { label: "In Sterilization Cycle", value: stats.inCycle, icon: RefreshCw, color: "bg-blue-50 text-blue-600", border: "border-blue-100" },
        { label: "Completed Today", value: stats.completed, icon: CheckCircle2, color: "bg-green-50 text-green-600", border: "border-green-100" },
        { label: "Failed / Rejected", value: stats.failed, icon: XCircle, color: "bg-red-50 text-red-500", border: "border-red-100" },
    ];

    const STATUS_BADGE: Record<string, BadgeVariant> = {
        PENDING: "yellow",
        IN_CYCLE: "blue",
        COMPLETED: "green",
        FAILED: "red",
        DISPATCHED: "purple",
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">CSSD Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Central Sterile Services Department â€” sterilization tracking</p>
                </div>
                <Link href="/cssd/items" className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                    <ClipboardList className="h-4 w-4" /> New Item Request
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
                    <p className="text-sm font-black text-gray-900">Recent Items</p>
                    <Link href="/cssd/items" className="text-xs font-bold text-blue-600 hover:underline">View all</Link>
                </div>
                {loading ? (
                    <div className="divide-y divide-gray-50">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
                ) : recent.length === 0 ? (
                    <div className="py-14 text-center">
                        <PackageCheck className="h-10 w-10 text-gray-200 mx-auto mb-3"/>
                        <p className="text-sm font-black text-gray-900">No items logged yet</p>
                        <p className="text-xs text-gray-400 mt-1">Add item requests to get started.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Item", "Type", "Ward / Dept", "Submitted By", "Status"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recent.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{item.itemName}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{item.itemType || "â€”"}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{item.ward || "â€”"}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{item.submittedBy || "â€”"}</td>
                                    <td className="px-4 py-3">
                                        <Badge variant={STATUS_BADGE[item.status] ?? "neutral"}>
                                            {item.status?.replace(/_/g, " ") || "â€”"}
                                        </Badge>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                )}
            </div>
        </div>
    );
}

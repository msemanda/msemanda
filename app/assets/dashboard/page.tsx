"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Building2, TrendingDown, FileText } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { SkeletonStatCard, SkeletonRow } from "@/components/ui/Skeleton";

export default function AssetsDashboard() {
    const [stats, setStats] = useState({ total: 0, totalValue: 0, categories: 0 });
    const [recent, setRecent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const snap = await getDocs(collection(db, "fixedAssets"));
                const assets = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                const totalValue = assets.reduce((sum, a) => sum + (a.purchaseValue || 0), 0);
                const cats = new Set(assets.map(a => a.category)).size;
                setStats({ total: assets.length, totalValue, categories: cats });
                setRecent(assets.slice(0, 8));
            } catch(e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Fixed Assets</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Asset registry, depreciation tracking, and reports</p>
                </div>
                <Link href="/assets/register" className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                    <Building2 className="h-4 w-4" /> Add Asset
                </Link>
            </div>

            <div className="grid grid-cols-3 gap-4">
                {loading
                    ? Array.from({ length: 3 }).map((_, i) => <SkeletonStatCard key={i} />)
                    : [
                        { label: "Total Assets", value: stats.total.toString(), icon: Building2, color: "bg-blue-50 text-blue-600" },
                        { label: "Total Value (UGX)", value: stats.totalValue.toLocaleString(), icon: FileText, color: "bg-green-50 text-green-600" },
                        { label: "Asset Categories", value: stats.categories.toString(), icon: TrendingDown, color: "bg-purple-50 text-purple-600" },
                    ].map((c, i) => {
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
                    <p className="text-sm font-black text-gray-900">Recent Assets</p>
                    <Link href="/assets/register" className="text-xs font-bold text-blue-600 hover:underline">View all</Link>
                </div>
                {loading ? (
                    <div className="divide-y divide-gray-50">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
                ) : recent.length === 0 ? (
                    <div className="py-14 text-center">
                        <Building2 className="h-10 w-10 text-gray-200 mx-auto mb-3"/>
                        <p className="text-sm font-black text-gray-900">No assets registered</p>
                        <p className="text-xs text-gray-400 mt-1">Add fixed assets from the register.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Asset", "Category", "Location", "Purchase Value", "Purchase Date"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recent.map(a => (
                                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-bold text-gray-900">{a.name}</p>
                                        {a.assetNo && <p className="text-xs font-mono text-gray-400">{a.assetNo}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{a.category}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{a.location}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-700">UGX {(a.purchaseValue || 0).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400">{a.purchaseDate || "â€”"}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                )}
            </div>
        </div>
    );
}

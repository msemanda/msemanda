"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BarChart3, Building2, RefreshCw } from "lucide-react";

export default function AssetsReportsPage() {
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "fixedAssets"));
            setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const totalValue = assets.reduce((s, a) => s + (a.purchaseValue || 0), 0);
    const byCategory = assets.reduce((acc: Record<string, { count: number; value: number }>, a) => {
        const cat = a.category || "Uncategorized";
        if (!acc[cat]) acc[cat] = { count: 0, value: 0 };
        acc[cat].count += 1;
        acc[cat].value += a.purchaseValue || 0;
        return acc;
    }, {});
    const byCondition = assets.reduce((acc: Record<string, number>, a) => {
        const c = a.condition || "Unknown";
        acc[c] = (acc[c] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Asset Reports</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Summary and breakdown of fixed assets</p>
                </div>
                <button onClick={fetchData} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-2xl font-black text-gray-900">{loading ? "—" : assets.length}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">Total Assets</p>
                </div>
                <div className="bg-white rounded-2xl border border-blue-100 shadow-sm p-5">
                    <p className="text-2xl font-black text-blue-600">{loading ? "—" : `UGX ${totalValue.toLocaleString()}`}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">Total Value</p>
                </div>
                <div className="bg-white rounded-2xl border border-purple-100 shadow-sm p-5">
                    <p className="text-2xl font-black text-purple-600">{loading ? "—" : Object.keys(byCategory).length}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">Categories</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-black text-gray-900">By Category</p>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-14"><div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full"/></div>
                    ) : Object.keys(byCategory).length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-14">No data</p>
                    ) : (
                        <div className="p-4 space-y-3">
                            {Object.entries(byCategory).sort((a, b) => b[1].value - a[1].value).map(([cat, d]) => {
                                const pct = totalValue > 0 ? Math.round((d.value / totalValue) * 100) : 0;
                                return (
                                    <div key={cat}>
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-bold text-gray-700">{cat}</p>
                                            <p className="text-xs text-gray-500">{d.count} · UGX {d.value.toLocaleString()} ({pct}%)</p>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${pct}%` }}/>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-black text-gray-900">By Condition</p>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-14"><div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full"/></div>
                    ) : Object.keys(byCondition).length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-14">No data</p>
                    ) : (
                        <div className="p-4 space-y-3">
                            {Object.entries(byCondition).map(([cond, count]) => {
                                const pct = assets.length > 0 ? Math.round((count / assets.length) * 100) : 0;
                                const colors: Record<string, string> = { Excellent: "bg-green-500", Good: "bg-blue-500", Fair: "bg-amber-500", Poor: "bg-red-500" };
                                return (
                                    <div key={cond}>
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-bold text-gray-700">{cond}</p>
                                            <p className="text-xs text-gray-500">{count} assets ({pct}%)</p>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full transition-all ${colors[cond] || "bg-gray-400"}`} style={{ width: `${pct}%` }}/>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

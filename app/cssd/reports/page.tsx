"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BarChart3, CheckCircle2, AlertCircle, RefreshCw, Package, Truck, Activity } from "lucide-react";

export default function CssdReportsPage() {
    const [stats, setStats] = useState({ items: 0, cycles: 0, dispatches: 0, failed: 0, completed: 0 });
    const [loading, setLoading] = useState(true);
    const [cycles, setCycles] = useState<any[]>([]);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [itemsSnap, cyclesSnap, dispatchSnap] = await Promise.all([
                getDocs(collection(db, "cssdItems")),
                getDocs(collection(db, "cssdCycles")),
                getDocs(collection(db, "cssdDispatch")),
            ]);
            const cycleData = cyclesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
            const failed = cycleData.filter(c => c.status === "failed").length;
            const completed = cycleData.filter(c => c.status === "completed").length;
            setStats({ items: itemsSnap.size, cycles: cyclesSnap.size, dispatches: dispatchSnap.size, failed, completed });
            setCycles(cycleData.slice(0, 10));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const statCards = [
        { label: "Total Items Requested", value: stats.items, icon: Package, color: "bg-blue-50 text-blue-600" },
        { label: "Total Cycles Run", value: stats.cycles, icon: Activity, color: "bg-purple-50 text-purple-600" },
        { label: "Cycles Completed", value: stats.completed, icon: CheckCircle2, color: "bg-green-50 text-green-600" },
        { label: "Cycles Failed", value: stats.failed, icon: AlertCircle, color: "bg-red-50 text-red-500" },
        { label: "Total Dispatches", value: stats.dispatches, icon: Truck, color: "bg-amber-50 text-amber-600" },
    ];

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">CSSD Reports</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Sterilization activity summary and performance metrics</p>
                </div>
                <button onClick={fetchData} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {statCards.map((c, i) => {
                    const Icon = c.icon;
                    return (
                        <div key={c.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className={`h-9 w-9 rounded-xl ${c.color} flex items-center justify-center mb-3`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <p className="text-2xl font-black text-gray-900">{loading ? "â€”" : c.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5 font-medium">{c.label}</p>
                        </div>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                    <BarChart3 className="h-4 w-4 text-blue-600" />
                    <p className="text-sm font-black text-gray-900">Recent Cycle Activity</p>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-14">
                        <div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                    </div>
                ) : cycles.length === 0 ? (
                    <div className="py-14 text-center">
                        <BarChart3 className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-black text-gray-900">No cycle data</p>
                        <p className="text-xs text-gray-400 mt-1">Sterilization cycles will appear here.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-xl">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Cycle No", "Machine", "Method", "Items", "Operator", "Status"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {cycles.map(c => (
                                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{c.cycleNo}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{c.machine}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{c.method}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-700">{c.itemCount}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{c.operator}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                            c.status === "completed" ? "bg-green-50 text-green-700 border-green-100" :
                                            c.status === "failed" ? "bg-red-50 text-red-600 border-red-100" :
                                            "bg-blue-50 text-blue-600 border-blue-100"
                                        }`}>{c.status}</span>
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

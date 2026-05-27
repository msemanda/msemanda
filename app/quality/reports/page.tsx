"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BarChart3, ShieldCheck, AlertTriangle, RefreshCw } from "lucide-react";

export default function QualityReportsPage() {
    const [audits, setAudits] = useState<any[]>([]);
    const [infections, setInfections] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [aSnap, iSnap] = await Promise.all([
                getDocs(collection(db, "qualityAudits")),
                getDocs(collection(db, "infectionIncidents")),
            ]);
            setAudits(aSnap.docs.map(d => ({ id: d.id, ...d.data() })));
            setInfections(iSnap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const completedAudits = audits.filter(a => a.status === "completed").length;
    const activeInfections = infections.filter(i => i.status === "active").length;
    const resolvedInfections = infections.filter(i => i.status === "resolved").length;

    const auditsByDept = audits.reduce((acc: Record<string, number>, a) => {
        acc[a.department] = (acc[a.department] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Quality Reports</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Quality performance and infection control summary</p>
                </div>
                <button onClick={fetchData} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Audits", value: audits.length, color: "text-blue-600", border: "border-blue-100" },
                    { label: "Audits Completed", value: completedAudits, color: "text-green-600", border: "border-green-100" },
                    { label: "Active Infections", value: activeInfections, color: "text-red-500", border: "border-red-100" },
                    { label: "Infections Resolved", value: resolvedInfections, color: "text-green-600", border: "border-green-100" },
                ].map((s, i) => (
                    <div key={s.label} className={`bg-white rounded-2xl border ${s.border} shadow-sm p-5`}>
                        <p className={`text-3xl font-black ${s.color}`}>{loading ? "—" : s.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5 font-medium">{s.label}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-black text-gray-900">Audits by Department</p>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-14"><div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full"/></div>
                    ) : Object.keys(auditsByDept).length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-14">No audit data</p>
                    ) : (
                        <div className="p-4 space-y-3">
                            {Object.entries(auditsByDept).sort((a, b) => b[1] - a[1]).map(([dept, count]) => {
                                const pct = audits.length > 0 ? Math.round((count / audits.length) * 100) : 0;
                                return (
                                    <div key={dept}>
                                        <div className="flex items-center justify-between mb-1">
                                            <p className="text-xs font-bold text-gray-700">{dept}</p>
                                            <p className="text-xs text-gray-500">{count} audit{count !== 1 ? "s" : ""}</p>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }}/>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                        <p className="text-sm font-black text-gray-900">Recent Infection Incidents</p>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-14"><div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full"/></div>
                    ) : infections.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-14">No incidents reported</p>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {infections.slice(0, 6).map(inc => (
                                <div key={inc.id} className="px-5 py-3 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{inc.pathogen}</p>
                                        <p className="text-xs text-gray-400">{inc.ward} · {inc.casesCount} case{inc.casesCount !== 1 ? "s" : ""}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                        inc.status === "active" ? "bg-red-50 text-red-600 border-red-100" :
                                        inc.status === "contained" ? "bg-amber-50 text-amber-700 border-amber-100" :
                                        "bg-green-50 text-green-700 border-green-100"
                                    }`}>{inc.status}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

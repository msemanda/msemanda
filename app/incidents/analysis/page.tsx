"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { BarChart3, AlertOctagon, TrendingDown, RefreshCw } from "lucide-react";

export default function IncidentsAnalysisPage() {
    const [incidents, setIncidents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "incidents"));
            setIncidents(snap.docs.map(d => ({ id: d.id, ...d.data() })));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const byType = incidents.reduce((acc: Record<string, number>, i) => {
        acc[i.incidentType] = (acc[i.incidentType] || 0) + 1;
        return acc;
    }, {});
    const bySeverity = incidents.reduce((acc: Record<string, number>, i) => {
        acc[i.severity] = (acc[i.severity] || 0) + 1;
        return acc;
    }, {});
    const byLocation = incidents.reduce((acc: Record<string, number>, i) => {
        acc[i.location] = (acc[i.location] || 0) + 1;
        return acc;
    }, {});

    const topType = Object.entries(byType).sort((a, b) => b[1] - a[1])[0];
    const topLocation = Object.entries(byLocation).sort((a, b) => b[1] - a[1])[0];

    const SEVERITY_COLOR: Record<string, string> = {
        critical: "bg-red-500", high: "bg-amber-500", medium: "bg-blue-500", low: "bg-gray-400",
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Incident Analysis</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Root cause analysis and trend data for reported incidents</p>
                </div>
                <button onClick={fetchData} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <p className="text-3xl font-black text-gray-900">{loading ? "—" : incidents.length}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">Total Incidents</p>
                </div>
                <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                    <p className="text-lg font-black text-red-600">{loading ? "—" : topType ? topType[0] : "—"}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">Most Common Type {topType ? `(${topType[1]}x)` : ""}</p>
                </div>
                <div className="bg-white rounded-2xl border border-amber-100 shadow-sm p-5">
                    <p className="text-lg font-black text-amber-600">{loading ? "—" : topLocation ? topLocation[0] : "—"}</p>
                    <p className="text-xs text-gray-500 mt-0.5 font-medium">Highest Risk Location {topLocation ? `(${topLocation[1]}x)` : ""}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-blue-600" />
                        <p className="text-sm font-black text-gray-900">By Incident Type</p>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-14"><div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full"/></div>
                    ) : Object.keys(byType).length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-14">No data yet</p>
                    ) : (
                        <div className="p-4 space-y-3">
                            {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, count]) => {
                                const pct = incidents.length > 0 ? Math.round((count / incidents.length) * 100) : 0;
                                return (
                                    <div key={type}>
                                        <div className="flex justify-between mb-1">
                                            <p className="text-xs font-bold text-gray-700 truncate max-w-[70%]">{type}</p>
                                            <p className="text-xs text-gray-500">{count} ({pct}%)</p>
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
                        <AlertOctagon className="h-4 w-4 text-red-500" />
                        <p className="text-sm font-black text-gray-900">By Severity</p>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-14"><div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full"/></div>
                    ) : Object.keys(bySeverity).length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-14">No data yet</p>
                    ) : (
                        <div className="p-4 space-y-3">
                            {["critical", "high", "medium", "low"].filter(s => bySeverity[s]).map(sev => {
                                const count = bySeverity[sev] || 0;
                                const pct = incidents.length > 0 ? Math.round((count / incidents.length) * 100) : 0;
                                return (
                                    <div key={sev}>
                                        <div className="flex justify-between mb-1">
                                            <p className="text-xs font-bold text-gray-700 capitalize">{sev}</p>
                                            <p className="text-xs text-gray-500">{count} ({pct}%)</p>
                                        </div>
                                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${SEVERITY_COLOR[sev]}`} style={{ width: `${pct}%` }}/>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                    <TrendingDown className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-black text-gray-900">By Location (Hotspots)</p>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-10"><div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full"/></div>
                ) : Object.keys(byLocation).length === 0 ? (
                    <p className="text-xs text-gray-400 text-center py-10">No data yet</p>
                ) : (
                    <div className="p-4 grid grid-cols-2 gap-3">
                        {Object.entries(byLocation).sort((a, b) => b[1] - a[1]).map(([loc, count]) => (
                            <div key={loc} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                                <p className="text-xs font-bold text-gray-700">{loc}</p>
                                <span className="text-xs font-black text-gray-900 bg-white px-2 py-0.5 rounded-lg border border-gray-100">{count}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

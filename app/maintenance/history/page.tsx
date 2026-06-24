"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { fmtDate } from "@/lib/ts";
import { db } from "@/lib/firebase";
import { CheckCircle2, RefreshCw, Search } from "lucide-react";

interface MaintRequest {
    id: string;
    equipmentName: string;
    location: string;
    issue: string;
    priority: string;
    status: string;
    requestedBy: string;
    assignedTo?: string;
    createdAt?: any;
    updatedAt?: any;
}

export default function MaintenanceHistoryPage() {
    const [records, setRecords] = useState<MaintRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => { fetchHistory(); }, []);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "maintRequests"), where("status", "==", "completed"));
            const snap = await getDocs(q);
            setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() } as MaintRequest)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filtered = records.filter(r =>
        !search || r.equipmentName.toLowerCase().includes(search.toLowerCase()) ||
        r.location.toLowerCase().includes(search.toLowerCase())
    );

    const PRIORITY_COLOR: Record<string, string> = {
        urgent: "bg-red-50 text-red-600 border-red-100",
        high:   "bg-amber-50 text-amber-700 border-amber-100",
        normal: "bg-blue-50 text-blue-600 border-blue-100",
        low:    "bg-gray-50 text-gray-500 border-gray-100",
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Service History</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Completed maintenance records</p>
                </div>
                <button onClick={fetchHistory} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search equipment or location..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <CheckCircle2 className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No service history</p>
                    <p className="text-xs text-gray-400">Resolved maintenance requests appear here.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto rounded-xl">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Equipment", "Location", "Issue", "Priority", "Assigned To", "Resolved"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(r => (
                                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                            <p className="text-sm font-bold text-gray-900">{r.equipmentName}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{r.location}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">{r.issue}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${PRIORITY_COLOR[r.priority] || "bg-gray-50 text-gray-500 border-gray-100"}`}>{r.priority}</span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{r.assignedTo || "â€”"}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400">
                                        {fmtDate(r.updatedAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                </div>
            )}
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { CheckCircle2, RefreshCw, Search } from "lucide-react";

interface HkTask {
    id: string;
    title: string;
    location: string;
    assignedTo: string;
    priority: string;
    status: string;
    createdAt?: any;
    updatedAt?: any;
}

export default function HousekeepingCompletedPage() {
    const [tasks, setTasks] = useState<HkTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    useEffect(() => { fetchCompleted(); }, []);

    const fetchCompleted = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "hkTasks"), where("status", "==", "completed"));
            const snap = await getDocs(q);
            setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as HkTask)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const filtered = tasks.filter(t =>
        !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.location.toLowerCase().includes(search.toLowerCase())
    );

    const PRIORITY_COLOR: Record<string, string> = {
        high: "bg-red-50 text-red-600 border-red-100",
        medium: "bg-amber-50 text-amber-700 border-amber-100",
        low: "bg-gray-50 text-gray-500 border-gray-100",
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Completed Tasks</h1>
                    <p className="text-sm text-gray-500 mt-0.5">History of completed housekeeping tasks</p>
                </div>
                <button onClick={fetchCompleted} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <CheckCircle2 className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No completed tasks yet</p>
                    <p className="text-xs text-gray-400">Completed tasks appear here.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Task", "Location", "Priority", "Completed By", "Date"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                                            <p className="text-sm font-bold text-gray-900">{t.title}</p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{t.location}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${PRIORITY_COLOR[t.priority] || "bg-gray-50 text-gray-500 border-gray-100"}`}>
                                            {t.priority}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{t.assignedTo}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400">
                                        {t.updatedAt?.seconds ? new Date(t.updatedAt.seconds * 1000).toLocaleDateString() : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

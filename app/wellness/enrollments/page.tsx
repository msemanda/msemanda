"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Search, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";

interface Enrollment {
    id: string;
    patient: string;
    program: string;
    enrolledOn: string;
    attendance: string;
    progress: string;
    status: string;
}

const PROGRESS_BADGE: Record<string, string> = {
    EXCELLENT: "bg-green-50 text-green-700",
    GOOD:      "bg-blue-50 text-blue-700",
    FAIR:      "bg-amber-50 text-amber-700",
    POOR:      "bg-red-50 text-red-500",
};

export default function WellnessEnrollments() {
    const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "wellnessEnrollments"));
            setEnrollments(snap.docs.map(d => {
                const r = d.data();
                const enrolledDate = toDate(r.enrolledOn ?? r.enrolledAt ?? r.startDate);
                const sessCompleted = Number(r.sessionsCompleted ?? r.attendedSessions ?? 0);
                const sessTotal = Number(r.totalSessions ?? r.programSessions ?? 0);
                const attendance = sessTotal > 0
                    ? `${sessCompleted}/${sessTotal} sessions`
                    : ((r.attendance as string) ?? "—");
                return {
                    id: d.id,
                    patient: ((r.patientName ?? r.patient) as string) ?? "—",
                    program: ((r.program ?? r.programName) as string) ?? "—",
                    enrolledOn: enrolledDate
                        ? enrolledDate.toLocaleDateString("en-CA")
                        : ((r.enrolledOn as string) ?? "—"),
                    attendance,
                    progress: (r.progress as string) ?? "STABLE",
                    status: (r.status as string) ?? "ACTIVE",
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = enrollments.filter(e =>
        e.patient.toLowerCase().includes(search.toLowerCase()) ||
        e.program.toLowerCase().includes(search.toLowerCase())
    );
    const activeCount = enrollments.filter(e => e.status === "ACTIVE").length;

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Users className="h-6 w-6 text-violet-600" /> Enrollments
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${activeCount} active enrollments`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-violet-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20"
                    placeholder="Search patient or program..." />
            </div>
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-violet-100 border-t-violet-500 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">
                    {search ? "No enrollments match your search" : "No wellness enrollments found"}
                </p>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto rounded-xl">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>{["Patient", "Program", "Enrolled", "Attendance", "Progress", "Status"].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                                ))}</tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((e, i) => (
                                    <motion.tr key={e.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }} className="hover:bg-gray-50/50">
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900">{e.patient}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600">{e.program}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{e.enrolledOn}</td>
                                        <td className="px-4 py-3 text-xs font-semibold text-gray-700">{e.attendance}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${PROGRESS_BADGE[e.progress] ?? "bg-gray-50 text-gray-600"}`}>
                                                {e.progress}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${e.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>
                                                {e.status}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

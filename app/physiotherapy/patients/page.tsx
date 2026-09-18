"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Search, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";

interface PhysioPatient {
    id: string;
    name: string;
    age?: number;
    gender?: string;
    referredBy: string;
    condition: string;
    sessions: number;
    progress: string;
    nextSession: string | null;
}

const PROGRESS_BADGE: Record<string, string> = {
    IMPROVING: "bg-green-50 text-green-700",
    STABLE:    "bg-amber-50 text-amber-700",
    DECLINING: "bg-red-50 text-red-600",
};

export default function PhysioPatients() {
    const [patients, setPatients] = useState<PhysioPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "physiotherapyPatients"));
            setPatients(snap.docs.map(d => {
                const r = d.data();
                const nextDate = toDate(r.nextSession ?? r.nextSessionDate);
                return {
                    id:          d.id,
                    name:        (r.patientName as string) ?? "—",
                    age:         r.age as number | undefined,
                    gender:      r.gender as string | undefined,
                    referredBy:  (r.referredBy as string) ?? "—",
                    condition:   ((r.condition ?? r.treatmentPlan) as string) ?? "—",
                    sessions:    (r.totalSessions ?? r.sessions as number) ?? 0,
                    progress:    (r.progress as string) ?? "STABLE",
                    nextSession: nextDate ? nextDate.toLocaleDateString("en-CA") : null,
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.condition.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Users className="h-6 w-6 text-orange-500" /> My Patients
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${filtered.length} patients in physiotherapy`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-orange-500 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
                    placeholder="Search name or condition..."
                />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-orange-100 border-t-orange-500 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">
                    {search ? "No patients match your search" : "No physiotherapy patients found"}
                </p>
            ) : (
                <div className="space-y-3">
                    {filtered.map((p, i) => (
                        <motion.div
                            key={p.id}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-sm">
                                    {p.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900">
                                        {p.name}{" "}
                                        <span className="text-xs font-normal text-gray-400">
                                            {p.age ? `${p.age}y` : ""}{p.gender ? ` / ${p.gender}` : ""}
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-500">{p.condition}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                        Ref: {p.referredBy} · {p.sessions} sessions completed{p.nextSession ? ` · Next: ${p.nextSession}` : ""}
                                    </p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${PROGRESS_BADGE[p.progress] ?? "bg-gray-50 text-gray-600"}`}>
                                {p.progress}
                            </span>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

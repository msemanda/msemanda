"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface PhysioSession {
    id: string;
    patient: string;
    time: string;
    duration: number;
    exercises: string[];
    therapist: string;
    status: string;
}

const STATUS_STYLE: Record<string, string> = {
    COMPLETED:   "bg-green-50 text-green-700",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    SCHEDULED:   "bg-gray-50 text-gray-600",
};

export default function PhysioSessions() {
    const [sessions, setSessions] = useState<PhysioSession[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "physiotherapySessions"));
            setSessions(snap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    patient: ((r.patientName ?? r.patient) as string) ?? "—",
                    time: (r.time as string) ?? "—",
                    duration: Number(r.duration ?? 30),
                    exercises: Array.isArray(r.exercises) ? (r.exercises as string[]) : [],
                    therapist: ((r.therapist ?? r.therapistName) as string) ?? "—",
                    status: (r.status as string) ?? "SCHEDULED",
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <CalendarDays className="h-6 w-6 text-orange-500" /> Today's Sessions
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${sessions.length} sessions scheduled for today`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-orange-500 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-orange-100 border-t-orange-500 rounded-full" />
                </div>
            ) : sessions.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No sessions scheduled</p>
            ) : (
                <div className="space-y-3">
                    {sessions.map((s, i) => (
                        <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-black text-sm">{s.patient.charAt(0)}</div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">{s.patient}</p>
                                        <p className="text-xs text-gray-400 flex items-center gap-1">
                                            <Clock className="h-3 w-3" /> {s.time} · {s.duration} min · {s.therapist}
                                        </p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[s.status] ?? "bg-gray-50 text-gray-600"}`}>{s.status.replace("_", " ")}</span>
                            </div>
                            {s.exercises.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {s.exercises.map(e => (
                                        <span key={e} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-100">{e}</span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface WellnessSession {
    id: string;
    program: string;
    day: string;
    time: string;
    venue: string;
    facilitator: string;
    type: string;
    upcoming: string;
}

const TYPE_COLOR: Record<string, string> = {
    "Group Session":            "bg-blue-50 text-blue-700",
    "Exercise Session":         "bg-green-50 text-green-700",
    "Group Therapy":            "bg-purple-50 text-purple-700",
    "Education + Cooking Demo": "bg-emerald-50 text-emerald-700",
    "Individual Review":        "bg-amber-50 text-amber-700",
};

export default function WellnessSchedule() {
    const [sessions, setSessions] = useState<WellnessSession[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "wellnessSessions"));
            setSessions(snap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    program: ((r.program ?? r.programName) as string) ?? "—",
                    day: (r.day as string) ?? "—",
                    time: (r.time as string) ?? "—",
                    venue: (r.venue as string) ?? "—",
                    facilitator: (r.facilitator as string) ?? "—",
                    type: (r.type as string) ?? "—",
                    upcoming: ((r.upcoming ?? r.nextDate) as string) ?? "—",
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
                        <CalendarDays className="h-6 w-6 text-violet-600" /> Session Schedule
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Recurring wellness program sessions</p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-violet-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-violet-100 border-t-violet-500 rounded-full" />
                </div>
            ) : sessions.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No sessions scheduled</p>
            ) : (
                <div className="space-y-3">
                    {sessions.map((s, i) => (
                        <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <p className="text-sm font-black text-gray-900">{s.program}</p>
                                    <p className="text-xs text-gray-400">{s.facilitator}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${TYPE_COLOR[s.type] || "bg-gray-50 text-gray-600"}`}>{s.type}</span>
                            </div>
                            <div className="grid grid-cols-3 gap-2 mt-3">
                                <div className="text-xs text-gray-600 flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-gray-300" />{s.day}</div>
                                <div className="text-xs text-gray-600 flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gray-300" />{s.time}</div>
                                <div className="text-xs text-gray-600 flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-gray-300" />{s.venue}</div>
                            </div>
                            <p className="text-[10px] text-violet-600 font-bold mt-2">Next session: {s.upcoming}</p>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

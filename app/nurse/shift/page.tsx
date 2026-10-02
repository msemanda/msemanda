"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarClock, Sun, Moon, Sunset, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface ShiftEntry {
    id: string;
    nurse: string;
    shift: string;
    ward: string;
    days: string[];
    time: string;
}

const SHIFT_STYLE: Record<string, { bg: string; icon: React.ElementType; color: string }> = {
    MORNING: { bg: "bg-amber-50 border-amber-100 text-amber-700",   icon: Sun,    color: "text-amber-500" },
    EVENING: { bg: "bg-orange-50 border-orange-100 text-orange-700", icon: Sunset, color: "text-orange-500" },
    NIGHT:   { bg: "bg-indigo-50 border-indigo-100 text-indigo-700", icon: Moon,   color: "text-indigo-500" },
};

const DAYS_ALL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ShiftSchedulePage() {
    const [schedule, setSchedule] = useState<ShiftEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "nurseShifts"));
            setSchedule(snap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    nurse: ((r.nurseName ?? r.nurse) as string) ?? "—",
                    shift: (r.shift as string) ?? "MORNING",
                    ward: (r.ward as string) ?? "—",
                    days: Array.isArray(r.days) ? (r.days as string[]) : [],
                    time: (r.time as string) ?? "—",
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
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <CalendarClock className="h-6 w-6 text-green-600" /> Shift Schedule
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Current week nurse rotation</p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-green-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-green-100 border-t-green-500 rounded-full" />
                </div>
            ) : schedule.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No shift schedules found</p>
            ) : (
                <div className="grid grid-cols-1 gap-3">
                    {schedule.map((s, i) => {
                        const style = SHIFT_STYLE[s.shift] ?? SHIFT_STYLE.MORNING;
                        const Icon = style.icon;
                        return (
                            <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                                        {s.nurse.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">{s.nurse}</p>
                                        <p className="text-xs text-gray-400">{s.ward} · {s.time}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                        {DAYS_ALL.map(d => (
                                            <span key={d} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors ${s.days.includes(d) ? "bg-green-600 text-white" : "bg-gray-50 text-gray-300"}`}>{d}</span>
                                        ))}
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${style.bg}`}>
                                        <Icon className={`h-3 w-3 ${style.color}`} /> {s.shift}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

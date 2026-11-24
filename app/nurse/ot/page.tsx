"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Stethoscope, Clock, User, CheckCircle2, AlertCircle, XCircle, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface OTItem {
    id: string;
    time: string;
    patient: string;
    surgeon: string;
    procedure: string;
    ot: string;
    anesthesia: string;
    status: string;
    duration: number;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
    SCHEDULED:  { label: "Scheduled",   color: "badge-blue",   icon: Clock },
    IN_PROGRESS:{ label: "In Progress", color: "badge-yellow", icon: AlertCircle },
    COMPLETED:  { label: "Completed",   color: "badge-green",  icon: CheckCircle2 },
    CANCELLED:  { label: "Cancelled",   color: "badge-red",    icon: XCircle },
    POSTPONED:  { label: "Postponed",   color: "badge-purple", icon: AlertCircle },
};

export default function OTPage() {
    const [schedule, setSchedule] = useState<OTItem[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "otSchedules"));
            setSchedule(snap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    time: (r.time as string) ?? "—",
                    patient: ((r.patientName ?? r.patient) as string) ?? "—",
                    surgeon: ((r.surgeon ?? r.doctorName) as string) ?? "—",
                    procedure: (r.procedure as string) ?? "—",
                    ot: ((r.ot ?? r.theater) as string) ?? "—",
                    anesthesia: (r.anesthesia as string) ?? "—",
                    status: (r.status as string) ?? "SCHEDULED",
                    duration: Number(r.duration ?? 60),
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const otRooms = ["OT-1", "OT-2", "OT-3"];
    const sorted = [...schedule].sort((a, b) => a.time.localeCompare(b.time));

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Stethoscope className="h-6 w-6 text-blue-600" /> OT Schedule
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Operating theater bookings for {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <div className="flex items-center gap-3">
                    {otRooms.map((ot) => {
                        const busy = schedule.some(s => s.ot === ot && s.status === "IN_PROGRESS");
                        return (
                            <div key={ot} className={`px-3 py-2 rounded-xl text-xs font-bold border ${busy ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-green-50 text-green-700 border-green-100"}`}>
                                {ot}: {busy ? "In Use" : "Available"}
                            </div>
                        );
                    })}
                    <button onClick={load} className="text-gray-400 hover:text-blue-600 transition-colors">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 grid grid-cols-7 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                    <span>Time</span>
                    <span className="col-span-2">Patient</span>
                    <span>Procedure</span>
                    <span>Surgeon</span>
                    <span>OT / Duration</span>
                    <span>Status</span>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-500 rounded-full" />
                    </div>
                ) : sorted.length === 0 ? (
                    <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No OT schedules for today</p>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {sorted.map((item, i) => {
                            const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.SCHEDULED;
                            const Icon = cfg.icon;
                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`px-5 py-4 grid grid-cols-7 items-center gap-2 hover:bg-gray-50 transition-colors ${item.status === "IN_PROGRESS" ? "bg-amber-50/40" : ""}`}
                                >
                                    <span className="text-sm font-black text-blue-600">{item.time}</span>
                                    <div className="col-span-2">
                                        <p className="text-sm font-bold text-gray-900">{item.patient}</p>
                                        <p className="text-[10px] text-gray-400">{item.anesthesia} anesthesia</p>
                                    </div>
                                    <p className="text-xs font-semibold text-gray-700">{item.procedure}</p>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-600">
                                        <User className="h-3.5 w-3.5 text-gray-400" />
                                        <span className="font-semibold">{item.surgeon}</span>
                                    </div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">{item.ot}</p>
                                        <p className="text-[10px] text-gray-400">{item.duration} min</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${cfg.color}`}>
                                        <Icon className="h-3 w-3" /> {cfg.label}
                                    </span>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

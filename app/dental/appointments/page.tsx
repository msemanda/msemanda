"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Search, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface DentalAppointment {
    id: string;
    patient: string;
    time: string;
    duration: number;
    procedure: string;
    dentist: string;
    chair: string;
    status: string;
}

const STATUS_BADGE: Record<string, string> = {
    SCHEDULED:   "bg-gray-50 text-gray-600",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    COMPLETED:   "bg-green-50 text-green-700",
    CANCELLED:   "bg-red-50 text-red-500",
};

export default function DentalAppointments() {
    const [appointments, setAppointments] = useState<DentalAppointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "dentalAppointments"));
            setAppointments(snap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    patient: ((r.patientName ?? r.patient) as string) ?? "—",
                    time: (r.time as string) ?? "—",
                    duration: Number(r.duration ?? 30),
                    procedure: (r.procedure as string) ?? "—",
                    dentist: ((r.dentist ?? r.dentistName) as string) ?? "—",
                    chair: (r.chair as string) ?? "—",
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

    const filtered = appointments.filter(a => a.patient.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <CalendarDays className="h-6 w-6 text-pink-600" /> Today's Appointments
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${appointments.length} appointments today`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-pink-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20"
                    placeholder="Search patient..." />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-pink-100 border-t-pink-500 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">
                    {search ? "No appointments match your search" : "No appointments today"}
                </p>
            ) : (
                <div className="space-y-3">
                    {filtered.map((a, i) => (
                        <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="text-center">
                                    <p className="text-lg font-black text-pink-600">{a.time}</p>
                                    <p className="text-[10px] text-gray-400">{a.duration} min</p>
                                </div>
                                <div className="w-px h-10 bg-gray-100" />
                                <div>
                                    <p className="text-sm font-black text-gray-900">{a.patient}</p>
                                    <p className="text-xs text-gray-500">{a.procedure}</p>
                                    <p className="text-[10px] text-gray-400 mt-0.5">{a.chair} · {a.dentist}</p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[a.status] ?? "bg-gray-50 text-gray-600"}`}>{a.status.replace("_", " ")}</span>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

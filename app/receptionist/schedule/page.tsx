"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { CalendarClock, ChevronLeft, ChevronRight, Loader2, RefreshCw } from "lucide-react";

interface Appointment {
    id: string;
    time: string;
    patientName: string;
    doctorName: string;
    notes: string;
    status: string;
}

const STATUS_STYLE: Record<string, string> = {
    SCHEDULED:       "bg-gray-50 text-gray-600",
    CONFIRMED:       "bg-gray-50 text-gray-600",
    PENDING_PAYMENT: "bg-amber-50 text-amber-700",
    CALLED:          "bg-purple-50 text-purple-700",
    IN_CONSULTATION: "bg-blue-50 text-blue-700",
    WAITING:         "bg-amber-50 text-amber-700",
    COMPLETED:       "bg-green-50 text-green-700",
    CANCELLED:       "bg-red-50 text-red-500",
};

function offsetDate(base: string, days: number): string {
    const d = new Date(base);
    d.setDate(d.getDate() + days);
    return d.toISOString().split("T")[0];
}

function formatLabel(iso: string): string {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-UG", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
}

export default function AppointmentSchedule() {
    const todayIso = new Date().toISOString().split("T")[0];
    const [selectedDate, setSelectedDate] = useState(todayIso);
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [doctorFilter, setDoctorFilter] = useState("ALL");

    const load = async (date: string) => {
        setLoading(true);
        setDoctorFilter("ALL");
        try {
            const snap = await getDocs(
                query(collection(db, "appointments"), where("date", "==", date))
            );
            const rows = snap.docs
                .map(d => {
                    const data = d.data() as Record<string, string>;
                    return {
                        id: d.id,
                        time: data.time || "—",
                        patientName: data.patientName || "Unknown",
                        doctorName: data.doctorName || "—",
                        notes: data.notes || "",
                        status: data.status || "SCHEDULED",
                    };
                })
                .sort((a, b) => a.time.localeCompare(b.time));
            setAppointments(rows);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(selectedDate); }, [selectedDate]);

    const navigate = (days: number) => setSelectedDate(prev => offsetDate(prev, days));

    const doctors = ["ALL", ...Array.from(new Set(appointments.map(a => a.doctorName).filter(d => d !== "—")))];
    const filtered = appointments.filter(a => doctorFilter === "ALL" || a.doctorName === doctorFilter);

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <CalendarClock className="h-6 w-6 text-indigo-600" /> Appointment Schedule
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {formatLabel(selectedDate)} · {appointments.length} appointment{appointments.length !== 1 ? "s" : ""}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => load(selectedDate)} disabled={loading}
                        className="h-8 px-2.5 rounded-xl border border-gray-100 flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:bg-gray-50 transition-colors disabled:opacity-50">
                        <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <button onClick={() => navigate(-1)}
                        className="h-8 w-8 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <ChevronLeft className="h-4 w-4 text-gray-500" />
                    </button>
                    <button onClick={() => setSelectedDate(todayIso)}
                        className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-colors ${selectedDate === todayIso ? "bg-indigo-600 text-white" : "border border-gray-100 text-gray-700 hover:bg-gray-50"}`}>
                        {selectedDate === todayIso
                            ? "Today"
                            : new Date(selectedDate + "T00:00:00").toLocaleDateString("en-UG", { day: "numeric", month: "short" })}
                    </button>
                    <button onClick={() => navigate(1)}
                        className="h-8 w-8 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                    </button>
                </div>
            </div>

            {/* Doctor filter tabs — derived from loaded data */}
            {doctors.length > 1 && (
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                    {doctors.map(d => (
                        <button key={d} onClick={() => setDoctorFilter(d)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${doctorFilter === d ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                            {d === "ALL" ? "All" : d}
                        </button>
                    ))}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-20 gap-2 text-gray-400 text-sm">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading schedule…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 text-sm">
                        No appointments scheduled for this day.
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Time", "Patient", "Doctor", "Notes", "Status"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((a, i) => (
                                <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                    className="hover:bg-gray-50/50">
                                    <td className="px-4 py-3 text-sm font-black text-indigo-600">{a.time}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{a.patientName}</td>
                                    <td className="px-4 py-3 text-xs text-gray-600">{a.doctorName}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400 max-w-[200px] truncate">{a.notes || "—"}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[a.status] ?? "bg-gray-50 text-gray-500"}`}>
                                            {a.status.replace("_", " ")}
                                        </span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

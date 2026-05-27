"use client";

import { motion } from "framer-motion";
import { CalendarDays, Users, CheckCircle2, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const stats = [
    { label: "Today's Appointments", value: "9", icon: CalendarDays, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Active Patients", value: "84", icon: Users, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Completed Today", value: "5", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "Waiting", value: "3", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
];

const appointments = [
    { id: "D001", name: "Alice Nakirya", time: "09:00", procedure: "Scaling & Polishing", status: "IN_CHAIR" },
    { id: "D002", name: "Bob Katende", time: "09:45", procedure: "Root Canal Therapy", status: "WAITING" },
    { id: "D003", name: "Carol Akello", time: "10:30", procedure: "Tooth Extraction", status: "WAITING" },
    { id: "D004", name: "David Omara", time: "11:15", procedure: "Composite Filling", status: "SCHEDULED" },
    { id: "D005", name: "Eve Nassali", time: "14:00", procedure: "Dental Crown", status: "SCHEDULED" },
    { id: "D006", name: "Frank Kigozi", time: "14:45", procedure: "Orthodontic Review", status: "SCHEDULED" },
];

const toothChart = [
    [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
];
const problemTeeth = [16, 46, 36, 25];

export default function DentalDashboard() {
    const { profile } = useAuth();

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Dental Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">Dr. <span className="font-bold text-blue-600">{profile?.name}</span> &bull; Dental Clinic</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
                            <div className={`inline-flex p-2.5 rounded-xl ${s.bg} mb-3`}><Icon className={`h-5 w-5 ${s.color}`} /></div>
                            <p className="text-2xl font-black text-gray-900">{s.value}</p>
                            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Appointment list */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50">
                        <h2 className="font-bold text-gray-900">Today&apos;s Appointments</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {appointments.map((a) => (
                            <div key={a.id} className={`px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors ${a.status === "IN_CHAIR" ? "bg-blue-50/40" : ""}`}>
                                <div className="text-sm font-black text-blue-600 w-12 shrink-0">{a.time}</div>
                                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center font-black text-blue-700 text-xs shrink-0">
                                    {a.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{a.name}</p>
                                    <p className="text-xs text-gray-400">{a.procedure}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                                    a.status === "IN_CHAIR" ? "badge-blue" :
                                    a.status === "WAITING" ? "badge-yellow" : "bg-gray-50 text-gray-600 border border-gray-100"
                                }`}>
                                    {a.status.replace("_", " ")}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dental chart */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-900 text-sm mb-4">Dental Chart (FDI)</h3>
                    <div className="space-y-3">
                        {toothChart.map((row, ri) => (
                            <div key={ri} className="flex flex-wrap gap-1 justify-center">
                                {row.map((tooth) => (
                                    <div
                                        key={tooth}
                                        className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors
                                            ${problemTeeth.includes(tooth) ? "bg-red-100 text-red-700 border border-red-200" : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700 border border-gray-100"}`}
                                    >
                                        {tooth}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex items-center gap-3 text-[10px] font-semibold text-gray-500">
                        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-red-100 border border-red-200" /> Issue noted</div>
                        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-gray-50 border border-gray-100" /> Healthy</div>
                    </div>
                </div>
            </div>
        </div>
    );
}

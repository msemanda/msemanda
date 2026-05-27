"use client";

import { motion } from "framer-motion";
import { Home, Users, CalendarDays, MapPin, CheckCircle2, Clock, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const stats = [
    { label: "Active Home Patients", value: "22", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Visits Today", value: "6", icon: CalendarDays, color: "text-green-600", bg: "bg-green-50" },
    { label: "Completed", value: "3", icon: CheckCircle2, color: "text-teal-600", bg: "bg-teal-50" },
    { label: "Upcoming", value: "3", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
];

const visits = [
    { id: "HC001", patient: "Mr. Ssali Robert", address: "Ntinda, Kampala", time: "09:00", services: ["Wound dressing", "Vitals"], status: "COMPLETED", distance: "3.2 km" },
    { id: "HC002", patient: "Mrs. Nakato Juliet", address: "Bukoto, Kampala", time: "11:00", services: ["Medication administration", "Vitals", "Physiotherapy"], status: "COMPLETED", distance: "5.8 km" },
    { id: "HC003", patient: "Mr. Okello Denis", address: "Kololo, Kampala", time: "13:30", services: ["Catheter care", "Vitals"], status: "COMPLETED", distance: "7.1 km" },
    { id: "HC004", patient: "Mrs. Nabirye Sarah", address: "Muyenga, Kampala", time: "15:00", services: ["Post-op wound check", "Vitals"], status: "SCHEDULED", distance: "9.4 km" },
    { id: "HC005", patient: "Mr. Kasule James", address: "Kiwatule, Kampala", time: "16:30", services: ["Physiotherapy", "Vitals", "Medication"], status: "SCHEDULED", distance: "11.2 km" },
    { id: "HC006", patient: "Mrs. Namukasa Rose", address: "Kisaasi, Kampala", time: "17:30", services: ["Diabetic foot care", "Blood glucose"], status: "SCHEDULED", distance: "8.6 km" },
];

export default function HomeCareDashboard() {
    const { profile } = useAuth();

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Home className="h-6 w-6 text-blue-600" /> Home Care
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Welcome, <span className="font-bold text-blue-600">{profile?.name}</span> &bull; Today&apos;s Visit Schedule</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 border border-blue-100">
                    <MapPin className="h-4 w-4 text-blue-600" />
                    <span className="text-xs font-bold text-blue-700">Kampala Zone</span>
                </div>
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

            {/* Visit list */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="font-bold text-gray-900">Today&apos;s Visits</h2>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="font-semibold">Total distance: ~45.3 km</span>
                    </div>
                </div>
                <div className="divide-y divide-gray-50">
                    {visits.map((v, i) => (
                        <motion.div key={v.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                            className="px-5 py-4 hover:bg-gray-50 transition-colors">
                            <div className="flex items-start gap-4">
                                <div className="text-sm font-black text-blue-600 w-14 shrink-0 pt-0.5">{v.time}</div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between mb-1">
                                        <p className="text-sm font-bold text-gray-900">{v.patient}</p>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${v.status === "COMPLETED" ? "badge-green" : "badge-blue"}`}>
                                            {v.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mb-1.5">
                                        <MapPin className="h-3 w-3" /> {v.address} &bull; {v.distance}
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {v.services.map((s) => (
                                            <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-gray-100 text-gray-600">{s}</span>
                                        ))}
                                    </div>
                                </div>
                                {v.status === "SCHEDULED" && (
                                    <button className="shrink-0 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                        Start <ArrowRight className="h-3 w-3" />
                                    </button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

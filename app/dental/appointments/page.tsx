"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarDays, Search, Clock } from "lucide-react";

const appointments = [
    { id: "DA001", patient: "Alice Nakirya", time: "09:00", duration: 60, procedure: "Root canal — Phase 2", dentist: "Dr. Nakamya", chair: "Chair 1", status: "IN_PROGRESS" },
    { id: "DA002", patient: "James Okello", time: "10:00", duration: 30, procedure: "Orthodontic wire change", dentist: "Dr. Nakamya", chair: "Chair 2", status: "SCHEDULED" },
    { id: "DA003", patient: "Grace Nakato", time: "10:30", duration: 45, procedure: "Dental caries restoration (#16)", dentist: "Dr. Nakamya", chair: "Chair 1", status: "SCHEDULED" },
    { id: "DA004", patient: "Robert Mugisha", time: "11:30", duration: 60, procedure: "Partial denture final fitting", dentist: "Dr. Nakamya", chair: "Chair 3", status: "SCHEDULED" },
    { id: "DA005", patient: "Fatuma Nakayiza", time: "14:00", duration: 30, procedure: "Post-extraction review", dentist: "Dr. Nakamya", chair: "Chair 2", status: "SCHEDULED" },
];

const STATUS_BADGE: Record<string, string> = {
    SCHEDULED: "bg-gray-50 text-gray-600",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-500",
};

export default function DentalAppointments() {
    const [search, setSearch] = useState("");
    const filtered = appointments.filter(a => a.patient.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <CalendarDays className="h-6 w-6 text-pink-600" /> Today's Appointments
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{appointments.length} appointments today</p>
            </div>
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20"
                    placeholder="Search patient..." />
            </div>
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
                                <p className="text-[10px] text-gray-400 mt-0.5">{a.chair}</p>
                            </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[a.status]}`}>{a.status.replace("_", " ")}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

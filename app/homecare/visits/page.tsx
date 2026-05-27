"use client";

import { motion } from "framer-motion";
import { CalendarDays, MapPin, Clock, CheckCircle2 } from "lucide-react";
import { useState } from "react";

const visits = [
    { id: "V001", patient: "Agnes Kiwanuka", address: "Naguru Hill Road", time: "08:00", duration: 60, services: ["Pain assessment", "Morphine admin", "Wound check"], nurse: "HC Nurse Ssali", status: "COMPLETED", notes: "Patient comfortable. Pain VAS 3/10. Family present and informed." },
    { id: "V002", patient: "John Mwesiga", address: "Ntinda, Plot 12", time: "10:00", duration: 45, services: ["ROM exercises", "BP check", "Medication review"], nurse: "HC Nurse Nakato", status: "IN_PROGRESS", notes: "" },
    { id: "V003", patient: "Robert Sembuya", address: "Bukoto, near Shell", time: "12:30", duration: 30, services: ["Wound dressing", "Glucose check"], nurse: "HC Nurse Nakato", status: "SCHEDULED", notes: "" },
    { id: "V004", patient: "Mary Naluwooza", address: "Kireka trading center", time: "14:00", duration: 45, services: ["Physiotherapy exercises", "Vitals", "Pain assessment"], nurse: "HC Nurse Ssali", status: "SCHEDULED", notes: "" },
];

const STATUS_STYLE: Record<string, string> = {
    COMPLETED: "bg-green-50 text-green-700",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    SCHEDULED: "bg-gray-50 text-gray-600",
    CANCELLED: "bg-red-50 text-red-500",
};

export default function VisitSchedule() {
    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <CalendarDays className="h-6 w-6 text-teal-600" /> Visit Schedule
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{visits.length} visits today</p>
            </div>
            <div className="space-y-3">
                {visits.map((v, i) => (
                    <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="text-center min-w-[48px]">
                                    <p className="text-lg font-black text-teal-600">{v.time}</p>
                                    <p className="text-[10px] text-gray-400">{v.duration} min</p>
                                </div>
                                <div className="w-px h-10 bg-gray-100" />
                                <div>
                                    <p className="text-sm font-black text-gray-900">{v.patient}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" />{v.address}</p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[v.status]}`}>{v.status.replace("_", " ")}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {v.services.map(s => (
                                <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100">{s}</span>
                            ))}
                        </div>
                        {v.notes && <p className="text-xs text-gray-500 bg-gray-50 rounded-xl p-2.5">{v.notes}</p>}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

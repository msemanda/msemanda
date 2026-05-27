"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";

const appointments = [
    { id: "A001", time: "08:00", patient: "John Mwesiga", doctor: "Dr. Katongo", room: "Consulting Room 1", type: "Follow-up", status: "COMPLETED" },
    { id: "A002", time: "09:00", patient: "Grace Nakato", doctor: "Dr. Ssekibala", room: "Consulting Room 2", type: "Consultation", status: "IN_PROGRESS" },
    { id: "A003", time: "09:30", patient: "Mary Nakato", doctor: "Dr. Katongo", room: "Consulting Room 1", type: "Routine", status: "WAITING" },
    { id: "A004", time: "10:00", patient: "James Byaruhanga", doctor: "Dr. Bwire", room: "Consulting Room 3", type: "Consultation", status: "SCHEDULED" },
    { id: "A005", time: "10:30", patient: "Annet Nabukenya", doctor: "Dr. Namubiru", room: "Consulting Room 4", type: "Post-op", status: "SCHEDULED" },
    { id: "A006", time: "11:00", patient: "Peter Ssekitoleko", doctor: "Dr. Ssekibala", room: "Consulting Room 2", type: "Consultation", status: "SCHEDULED" },
    { id: "A007", time: "11:30", patient: "Rose Nakiryowa", doctor: "Dr. Katongo", room: "Consulting Room 1", type: "Follow-up", status: "SCHEDULED" },
    { id: "A008", time: "14:00", patient: "Henry Ssemakula", doctor: "Dr. Bwire", room: "Consulting Room 3", type: "Consultation", status: "SCHEDULED" },
    { id: "A009", time: "14:30", patient: "Fatuma Namutebi", doctor: "Dr. Namubiru", room: "Consulting Room 4", type: "Routine", status: "SCHEDULED" },
];

const STATUS_STYLE: Record<string, string> = {
    SCHEDULED: "bg-gray-50 text-gray-600",
    WAITING: "bg-amber-50 text-amber-700",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-green-50 text-green-700",
    CANCELLED: "bg-red-50 text-red-500",
};
const TYPE_COLOR: Record<string, string> = {
    "Follow-up": "bg-purple-50 text-purple-700",
    "Consultation": "bg-blue-50 text-blue-700",
    "Routine": "bg-gray-50 text-gray-600",
    "Post-op": "bg-teal-50 text-teal-700",
};

export default function AppointmentSchedule() {
    const [filter, setFilter] = useState("ALL");
    const filtered = appointments.filter(a => filter === "ALL" || a.doctor === filter || a.status === filter);
    const doctors = [...new Set(appointments.map(a => a.doctor))];

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <CalendarClock className="h-6 w-6 text-indigo-600" /> Appointment Schedule
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Tuesday, 27 May 2026 · {appointments.length} appointments</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="h-8 w-8 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <ChevronLeft className="h-4 w-4 text-gray-500" />
                    </button>
                    <span className="text-xs font-bold text-gray-700 px-2">Today</span>
                    <button className="h-8 w-8 rounded-xl border border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                    </button>
                </div>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-1">
                <button onClick={() => setFilter("ALL")} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${filter === "ALL" ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>All</button>
                {doctors.map(d => (
                    <button key={d} onClick={() => setFilter(d)} className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors ${filter === d ? "bg-indigo-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>{d}</button>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>{["Time", "Patient", "Doctor", "Room", "Type", "Status"].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                        ))}</tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map((a, i) => (
                            <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="hover:bg-gray-50/50">
                                <td className="px-4 py-3 text-sm font-black text-indigo-600">{a.time}</td>
                                <td className="px-4 py-3 text-sm font-bold text-gray-900">{a.patient}</td>
                                <td className="px-4 py-3 text-xs text-gray-600">{a.doctor}</td>
                                <td className="px-4 py-3 text-xs text-gray-500">{a.room}</td>
                                <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${TYPE_COLOR[a.type] || "bg-gray-50 text-gray-600"}`}>{a.type}</span></td>
                                <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[a.status]}`}>{a.status.replace("_", " ")}</span></td>
                            </motion.tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

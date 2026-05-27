"use client";

import { motion } from "framer-motion";
import { Stethoscope, Clock, User, CheckCircle2, AlertCircle, XCircle } from "lucide-react";

const otSchedule = [
    { id: "OT001", time: "08:00", patient: "Alice Nakirya", surgeon: "Dr. Katongo", procedure: "Laparoscopic Appendectomy", ot: "OT-1", anesthesia: "General", status: "IN_PROGRESS", duration: 90 },
    { id: "OT002", time: "10:30", patient: "Bob Katende", surgeon: "Dr. Ssekibala", procedure: "Total Hip Replacement", ot: "OT-2", anesthesia: "Spinal", status: "SCHEDULED", duration: 180 },
    { id: "OT003", time: "13:00", patient: "Carol Akello", surgeon: "Dr. Namubiru", procedure: "Caesarean Section", ot: "OT-1", anesthesia: "Spinal", status: "SCHEDULED", duration: 60 },
    { id: "OT004", time: "15:30", patient: "David Omara", surgeon: "Dr. Katongo", procedure: "Hernia Repair", ot: "OT-3", anesthesia: "Local+Sedation", status: "SCHEDULED", duration: 75 },
    { id: "OT005", time: "06:00", patient: "Eve Nassali", surgeon: "Dr. Bwire", procedure: "Cholecystectomy", ot: "OT-2", anesthesia: "General", status: "COMPLETED", duration: 120 },
];

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    SCHEDULED: { label: "Scheduled", color: "badge-blue", icon: Clock },
    IN_PROGRESS: { label: "In Progress", color: "badge-yellow", icon: AlertCircle },
    COMPLETED: { label: "Completed", color: "badge-green", icon: CheckCircle2 },
    CANCELLED: { label: "Cancelled", color: "badge-red", icon: XCircle },
    POSTPONED: { label: "Postponed", color: "badge-purple", icon: AlertCircle },
};

export default function OTPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Stethoscope className="h-6 w-6 text-blue-600" /> OT Schedule
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Operating theater bookings for {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</p>
                </div>
                <div className="flex gap-3">
                    {["OT-1", "OT-2", "OT-3"].map((ot) => {
                        const busy = otSchedule.some(s => s.ot === ot && s.status === "IN_PROGRESS");
                        return (
                            <div key={ot} className={`px-3 py-2 rounded-xl text-xs font-bold border ${busy ? "bg-amber-50 text-amber-700 border-amber-100" : "bg-green-50 text-green-700 border-green-100"}`}>
                                {ot}: {busy ? "In Use" : "Available"}
                            </div>
                        );
                    })}
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
                <div className="divide-y divide-gray-50">
                    {otSchedule
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((item, i) => {
                            const cfg = STATUS_CONFIG[item.status];
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
            </div>
        </div>
    );
}

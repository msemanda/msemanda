"use client";

import { motion } from "framer-motion";
import { CalendarDays, Clock } from "lucide-react";

const sessions = [
    { id: "S001", patient: "John Mwesiga", time: "08:00", duration: 60, exercises: ["Passive ROM shoulder", "Grip strengthening", "Walking aids training"], therapist: "PT Nakamya", status: "COMPLETED" },
    { id: "S002", patient: "Patrick Ssemanda", time: "09:00", duration: 45, exercises: ["Quad sets", "SLR", "Knee flexion 0-90°"], therapist: "PT Nakamya", status: "IN_PROGRESS" },
    { id: "S003", patient: "Agnes Nantale", time: "10:00", duration: 30, exercises: ["Pendulum exercises", "Codman's", "Scapular retraction"], therapist: "PT Nakamya", status: "SCHEDULED" },
    { id: "S004", patient: "Robert Mugisha", time: "11:00", duration: 45, exercises: ["McKenzie exercises", "Core stability", "TENS therapy"], therapist: "PT Nakamya", status: "SCHEDULED" },
    { id: "S005", patient: "Mary Nakato", time: "14:00", duration: 30, exercises: ["Foot massage", "Contrast bath", "Balance board"], therapist: "PT Nakamya", status: "SCHEDULED" },
];

const STATUS_STYLE: Record<string, string> = {
    COMPLETED: "bg-green-50 text-green-700",
    IN_PROGRESS: "bg-blue-50 text-blue-700",
    SCHEDULED: "bg-gray-50 text-gray-600",
};

export default function PhysioSessions() {
    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <CalendarDays className="h-6 w-6 text-orange-500" /> Today's Sessions
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{sessions.length} sessions scheduled for today</p>
            </div>
            <div className="space-y-3">
                {sessions.map((s, i) => (
                    <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600 font-black text-sm">{s.patient.charAt(0)}</div>
                                <div>
                                    <p className="text-sm font-black text-gray-900">{s.patient}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {s.time} · {s.duration} min
                                    </p>
                                </div>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[s.status]}`}>{s.status.replace("_", " ")}</span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {s.exercises.map(e => (
                                <span key={e} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-100">{e}</span>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

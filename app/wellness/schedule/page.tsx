"use client";

import { motion } from "framer-motion";
import { CalendarDays, Clock, MapPin } from "lucide-react";

const sessions = [
    { program: "Diabetes Prevention Program", day: "Monday & Wednesday", time: "09:00 – 10:30", venue: "Health Education Hall A", facilitator: "Dr. Nakato", type: "Group Session", upcoming: "2026-05-28" },
    { program: "Cardiac Rehab Program", day: "Tuesday & Thursday", time: "07:00 – 08:30", venue: "Gymnasium / PT Gym", facilitator: "PT Nakamya", type: "Exercise Session", upcoming: "2026-05-28" },
    { program: "Mental Health & Mindfulness", day: "Wednesday", time: "14:00 – 16:00", venue: "Counseling Suite 2", facilitator: "Counselor Mbabazi", type: "Group Therapy", upcoming: "2026-05-28" },
    { program: "Maternal Nutrition Program", day: "Friday", time: "10:00 – 11:30", venue: "MCH Room", facilitator: "Dietitian Ssali", type: "Education + Cooking Demo", upcoming: "2026-05-30" },
    { program: "Cardiac Rehab Program", day: "Saturday", time: "08:00 – 09:00", venue: "Gymnasium", facilitator: "PT Nakamya", type: "Individual Review", upcoming: "2026-05-31" },
];

const TYPE_COLOR: Record<string, string> = {
    "Group Session": "bg-blue-50 text-blue-700",
    "Exercise Session": "bg-green-50 text-green-700",
    "Group Therapy": "bg-purple-50 text-purple-700",
    "Education + Cooking Demo": "bg-emerald-50 text-emerald-700",
    "Individual Review": "bg-amber-50 text-amber-700",
};

export default function WellnessSchedule() {
    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <CalendarDays className="h-6 w-6 text-violet-600" /> Session Schedule
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Recurring wellness program sessions</p>
            </div>
            <div className="space-y-3">
                {sessions.map((s, i) => (
                    <motion.div key={`${s.program}-${s.day}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-2">
                            <div>
                                <p className="text-sm font-black text-gray-900">{s.program}</p>
                                <p className="text-xs text-gray-400">{s.facilitator}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${TYPE_COLOR[s.type] || "bg-gray-50 text-gray-600"}`}>{s.type}</span>
                        </div>
                        <div className="grid grid-cols-3 gap-2 mt-3">
                            <div className="text-xs text-gray-600 flex items-center gap-1"><CalendarDays className="h-3.5 w-3.5 text-gray-300" />{s.day}</div>
                            <div className="text-xs text-gray-600 flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-gray-300" />{s.time}</div>
                            <div className="text-xs text-gray-600 flex items-center gap-1"><MapPin className="h-3.5 w-3.5 text-gray-300" />{s.venue}</div>
                        </div>
                        <p className="text-[10px] text-violet-600 font-bold mt-2">Next session: {s.upcoming}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

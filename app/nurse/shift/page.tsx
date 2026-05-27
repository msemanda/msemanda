"use client";

import { motion } from "framer-motion";
import { CalendarClock, Sun, Moon, Sunset } from "lucide-react";

const schedule = [
    { nurse: "Brenda Nakabuye", shift: "MORNING", ward: "General Medicine", days: ["Mon", "Tue", "Wed", "Thu", "Fri"], time: "07:00 – 14:00" },
    { nurse: "Ivan Ssekitoleko", shift: "MORNING", ward: "Surgical", days: ["Mon", "Wed", "Fri", "Sat"], time: "07:00 – 14:00" },
    { nurse: "Flavia Atim", shift: "EVENING", ward: "General Medicine", days: ["Mon", "Tue", "Thu", "Fri"], time: "14:00 – 21:00" },
    { nurse: "Moses Byaruhanga", shift: "EVENING", ward: "Pediatrics", days: ["Tue", "Wed", "Thu", "Sat"], time: "14:00 – 21:00" },
    { nurse: "Esther Nakayiza", shift: "NIGHT", ward: "ICU", days: ["Mon", "Tue", "Wed"], time: "21:00 – 07:00" },
    { nurse: "Richard Tumusiime", shift: "NIGHT", ward: "Surgical", days: ["Thu", "Fri", "Sat"], time: "21:00 – 07:00" },
];

const SHIFT_STYLE: Record<string, { bg: string; icon: React.ElementType; color: string }> = {
    MORNING: { bg: "bg-amber-50 border-amber-100 text-amber-700", icon: Sun, color: "text-amber-500" },
    EVENING: { bg: "bg-orange-50 border-orange-100 text-orange-700", icon: Sunset, color: "text-orange-500" },
    NIGHT: { bg: "bg-indigo-50 border-indigo-100 text-indigo-700", icon: Moon, color: "text-indigo-500" },
};

const DAYS_ALL = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function ShiftSchedulePage() {
    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <CalendarClock className="h-6 w-6 text-green-600" /> Shift Schedule
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Current week nurse rotation</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
                {schedule.map((s, i) => {
                    const style = SHIFT_STYLE[s.shift];
                    const Icon = style.icon;
                    return (
                        <motion.div key={s.nurse} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                                    {s.nurse.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900">{s.nurse}</p>
                                    <p className="text-xs text-gray-400">{s.ward} · {s.time}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex gap-1">
                                    {DAYS_ALL.map(d => (
                                        <span key={d} className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-bold transition-colors ${s.days.includes(d) ? "bg-green-600 text-white" : "bg-gray-50 text-gray-300"}`}>{d}</span>
                                    ))}
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${style.bg}`}>
                                    <Icon className={`h-3 w-3 ${style.color}`} /> {s.shift}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

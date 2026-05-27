"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Users, Calendar } from "lucide-react";

const programs = [
    { id: "W001", name: "Diabetes Prevention Program", category: "CHRONIC_DISEASE", enrolled: 45, capacity: 50, startDate: "2026-04-01", endDate: "2026-06-30", facilitator: "Dr. Nakato + Dietitian Ssali", description: "12-week lifestyle intervention focusing on diet, exercise and weight management for pre-diabetics.", status: "ACTIVE" },
    { id: "W002", name: "Cardiac Rehab Program", category: "FITNESS", enrolled: 18, capacity: 20, startDate: "2026-05-01", endDate: "2026-07-31", facilitator: "PT Nakamya + Dr. Katongo", description: "Supervised exercise and education program for post-MI and heart failure patients.", status: "ACTIVE" },
    { id: "W003", name: "Mental Health & Mindfulness", category: "MENTAL_HEALTH", enrolled: 32, capacity: 40, startDate: "2026-04-15", endDate: "2026-07-15", facilitator: "Counselor Mbabazi", description: "Group therapy, CBT sessions and mindfulness practices for anxiety and depression.", status: "ACTIVE" },
    { id: "W004", name: "Maternal Nutrition Program", category: "NUTRITION", enrolled: 28, capacity: 30, startDate: "2026-05-15", endDate: "2026-08-15", facilitator: "Dietitian Ssali + Midwife Nakabuye", description: "Nutritional support and education for pregnant and breastfeeding mothers.", status: "ACTIVE" },
    { id: "W005", name: "Cancer Survivorship Program", category: "PREVENTIVE", enrolled: 12, capacity: 25, startDate: "2026-06-01", endDate: "2026-09-30", facilitator: "Dr. Ssekibala + Counselor Mbabazi", description: "Support and rehabilitation program for cancer survivors — physical and emotional recovery.", status: "UPCOMING" },
];

const CAT_COLOR: Record<string, string> = {
    CHRONIC_DISEASE: "bg-red-50 text-red-700", FITNESS: "bg-blue-50 text-blue-700",
    MENTAL_HEALTH: "bg-purple-50 text-purple-700", NUTRITION: "bg-emerald-50 text-emerald-700",
    PREVENTIVE: "bg-amber-50 text-amber-700",
};

export default function WellnessPrograms() {
    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Sparkles className="h-6 w-6 text-violet-600" /> Wellness Programs
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{programs.filter(p => p.status === "ACTIVE").length} active programs</p>
            </div>
            <div className="space-y-4">
                {programs.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-sm font-black text-gray-900">{p.name}</p>
                                <p className="text-xs text-gray-400">{p.facilitator}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-3">
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${CAT_COLOR[p.category]}`}>{p.category.replace("_", " ")}</span>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${p.status === "ACTIVE" ? "bg-green-50 text-green-700" : "bg-gray-50 text-gray-500"}`}>{p.status}</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 mb-3">{p.description}</p>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                                <Users className="h-3.5 w-3.5" />{p.enrolled}/{p.capacity} enrolled
                            </div>
                            <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full bg-violet-500 rounded-full" style={{ width: `${(p.enrolled / p.capacity) * 100}%` }} />
                            </div>
                            <div className="flex items-center gap-1 text-xs text-gray-400">
                                <Calendar className="h-3.5 w-3.5" />{p.startDate} – {p.endDate}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

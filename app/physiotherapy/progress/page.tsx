"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const progressData = [
    { patient: "John Mwesiga", condition: "Post-stroke hemiplegia", weeks: 8, totalSessions: 32, attended: 30, baseline: "Bedridden, no voluntary movement", current: "Ambulant with frame, 50m unaided", progress: 65, trend: "IMPROVING" },
    { patient: "Patrick Ssemanda", condition: "Post-op knee replacement", weeks: 3, totalSessions: 9, attended: 9, baseline: "Knee flexion 20°, unable to bear weight", current: "Knee flexion 85°, partial weight bearing", progress: 55, trend: "IMPROVING" },
    { patient: "Robert Mugisha", condition: "Lumbar spondylosis", weeks: 6, totalSessions: 18, attended: 16, baseline: "VAS pain 8/10, limited lumbar flexion", current: "VAS pain 4/10, improved mobility", progress: 50, trend: "STABLE" },
    { patient: "Agnes Nantale", condition: "Shoulder impingement", weeks: 5, totalSessions: 15, attended: 14, baseline: "ROM: abduction 60°, pain 7/10", current: "ROM: abduction 130°, pain 3/10", progress: 70, trend: "IMPROVING" },
];

const TREND_STYLE: Record<string, string> = {
    IMPROVING: "text-green-700 bg-green-50",
    STABLE: "text-amber-700 bg-amber-50",
    DECLINING: "text-red-700 bg-red-50",
};

export default function ProgressTracking() {
    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-orange-500" /> Progress Tracking
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Patient rehabilitation outcomes</p>
            </div>
            <div className="space-y-4">
                {progressData.map((p, i) => (
                    <motion.div key={p.patient} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-black text-gray-900">{p.patient}</p>
                                <p className="text-xs text-gray-500">{p.condition} · Week {p.weeks} · {p.attended}/{p.totalSessions} sessions attended</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${TREND_STYLE[p.trend]}`}>{p.trend}</span>
                        </div>
                        <div className="mb-3">
                            <div className="flex justify-between text-[10px] text-gray-400 mb-1">
                                <span>Overall Progress</span><span>{p.progress}%</span>
                            </div>
                            <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: `${p.progress}%` }} transition={{ delay: 0.3 + i * 0.05, duration: 0.7 }}
                                    className="h-full bg-orange-500 rounded-full" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-red-50/50 rounded-xl p-3">
                                <p className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-1">Baseline</p>
                                <p className="text-xs text-gray-700">{p.baseline}</p>
                            </div>
                            <div className="bg-green-50 rounded-xl p-3">
                                <p className="text-[10px] font-black text-green-500 uppercase tracking-wider mb-1">Current</p>
                                <p className="text-xs text-gray-700">{p.current}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

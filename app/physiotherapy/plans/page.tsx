"use client";

import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";

const plans = [
    { patient: "John Mwesiga", condition: "Post-stroke hemiplegia", goal: "Independent ambulation with walking frame", weeks: 12, sessionsPerWeek: 5, phase: "Active Rehabilitation", exercises: ["ROM exercises", "Strengthening", "Gait training", "ADL training"], status: "ACTIVE" },
    { patient: "Patrick Ssemanda", condition: "Post-op knee replacement", goal: "Full knee flexion 0-120° and independent walking", weeks: 8, sessionsPerWeek: 3, phase: "Post-op Phase 2", exercises: ["Quad sets", "SLR", "Flexion exercises", "Stair training"], status: "ACTIVE" },
    { patient: "Robert Mugisha", condition: "Lumbar spondylosis", goal: "Pain reduction and improved spinal mobility", weeks: 6, sessionsPerWeek: 3, phase: "Maintenance", exercises: ["McKenzie", "Core strengthening", "Posture correction", "TENS"], status: "ACTIVE" },
    { patient: "Agnes Nantale", condition: "Shoulder impingement", goal: "Full pain-free shoulder ROM", weeks: 6, sessionsPerWeek: 3, phase: "Phase 1", exercises: ["Pendulum", "Codman's", "Scapular stability", "Rotator cuff strengthening"], status: "ACTIVE" },
];

export default function TreatmentPlans() {
    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-orange-500" /> Treatment Plans
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{plans.length} active treatment plans</p>
            </div>
            <div className="space-y-4">
                {plans.map((p, i) => (
                    <motion.div key={p.patient} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-sm font-black text-gray-900">{p.patient}</p>
                                <p className="text-xs text-gray-500">{p.condition}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-orange-50 text-orange-700">{p.phase}</span>
                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700">{p.status}</span>
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 mb-3">
                            <div className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-black text-gray-900">{p.weeks}</p>
                                <p className="text-[10px] text-gray-400">Week program</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3 text-center">
                                <p className="text-lg font-black text-gray-900">{p.sessionsPerWeek}x</p>
                                <p className="text-[10px] text-gray-400">Per week</p>
                            </div>
                            <div className="bg-orange-50 rounded-xl p-3 text-center">
                                <p className="text-xs font-bold text-orange-700 leading-tight">{p.goal}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {p.exercises.map(e => (
                                <span key={e} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-orange-50 text-orange-700 border border-orange-100">{e}</span>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

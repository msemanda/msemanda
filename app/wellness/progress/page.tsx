"use client";

import { motion } from "framer-motion";
import { TrendingUp } from "lucide-react";

const data = [
    { patient: "John Mwesiga", program: "Diabetes Prevention", weeks: 8, hba1c: { before: 7.8, after: 6.9 }, weight: { before: 92, after: 87.5 }, bmi: { before: 29.4, after: 27.8 }, trend: "IMPROVING" },
    { patient: "Alice Nakirya", program: "Diabetes Prevention", weeks: 8, hba1c: { before: 8.2, after: 7.1 }, weight: { before: 85, after: 81 }, bmi: { before: 28.1, after: 26.9 }, trend: "IMPROVING" },
    { patient: "Grace Nakato", program: "Cardiac Rehab", weeks: 4, hba1c: null, weight: { before: 72, after: 70 }, bmi: { before: 26.5, after: 25.8 }, trend: "IMPROVING" },
    { patient: "Robert Mugisha", program: "Mental Health", weeks: 6, hba1c: null, weight: null, bmi: null, trend: "STABLE" },
];

const TREND_STYLE: Record<string, string> = {
    IMPROVING: "bg-green-50 text-green-700",
    STABLE: "bg-amber-50 text-amber-700",
    DECLINING: "bg-red-50 text-red-600",
};

function Delta({ before, after, unit, lowerBetter = true }: { before: number; after: number; unit: string; lowerBetter?: boolean }) {
    const delta = after - before;
    const improved = lowerBetter ? delta < 0 : delta > 0;
    return (
        <div className="bg-gray-50 rounded-xl p-3 text-center">
            <p className="text-[10px] text-gray-400">Before → After</p>
            <p className="text-xs font-bold text-gray-800">{before} → {after} {unit}</p>
            <p className={`text-[10px] font-bold ${improved ? "text-green-600" : "text-red-500"}`}>{delta > 0 ? "+" : ""}{delta.toFixed(1)}</p>
        </div>
    );
}

export default function WellnessProgress() {
    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <TrendingUp className="h-6 w-6 text-violet-600" /> Health Progress
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Patient outcomes across wellness programs</p>
            </div>
            <div className="space-y-4">
                {data.map((d, i) => (
                    <motion.div key={d.patient} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <p className="text-sm font-black text-gray-900">{d.patient}</p>
                                <p className="text-xs text-gray-400">{d.program} · Week {d.weeks}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${TREND_STYLE[d.trend]}`}>{d.trend}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                            {d.hba1c && <Delta before={d.hba1c.before} after={d.hba1c.after} unit="% HbA1c" />}
                            {d.weight && <Delta before={d.weight.before} after={d.weight.after} unit="kg" />}
                            {d.bmi && <Delta before={d.bmi.before} after={d.bmi.after} unit="BMI" />}
                            {!d.hba1c && !d.weight && !d.bmi && (
                                <div className="bg-gray-50 rounded-xl p-3 col-span-3 text-center text-xs text-gray-400">Qualitative outcomes — see session notes</div>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

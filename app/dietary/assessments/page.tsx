"use client";

import { motion } from "framer-motion";
import { ClipboardList, AlertTriangle } from "lucide-react";

const assessments = [
    { patient: "John Mwesiga", date: "2026-05-22", bmi: 29.4, waist: 96, dietHistory: "High carbohydrate intake, frequent sugary drinks, skips breakfast", malnutritionRisk: "LOW", recommendations: "Reduce refined carbs, increase vegetables, 3 regular meals, aim for 30-min daily walk", followUp: "2026-06-05" },
    { patient: "Alice Nakirya", date: "2026-05-21", bmi: 22.1, waist: 74, dietHistory: "Low appetite, reduced intake due to nausea, mostly takes fluids", malnutritionRisk: "HIGH", recommendations: "Small frequent meals, high-calorie supplements, restrict potassium and phosphorus-rich foods", followUp: "2026-05-28" },
    { patient: "Sarah Namutebi", date: "2026-05-25", bmi: 18.2, waist: 62, dietHistory: "Poor intake since admission, nausea and loss of appetite", malnutritionRisk: "HIGH", recommendations: "Nutritional support — high protein, high calorie. Consider NG tube feeding if intake doesn't improve in 48hrs", followUp: "2026-05-27" },
];

const RISK_STYLE: Record<string, string> = {
    LOW: "bg-green-50 text-green-700 border-green-100",
    MODERATE: "bg-amber-50 text-amber-700 border-amber-100",
    HIGH: "bg-red-50 text-red-700 border-red-100",
};

export default function NutritionalAssessments() {
    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-emerald-600" /> Nutritional Assessments
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{assessments.length} assessments on file</p>
            </div>
            <div className="space-y-4">
                {assessments.map((a, i) => (
                    <motion.div key={a.patient} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <p className="text-sm font-black text-gray-900">{a.patient}</p>
                                <p className="text-xs text-gray-400">Assessment date: {a.date} · Follow-up: {a.followUp}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${RISK_STYLE[a.malnutritionRisk]}`}>
                                {a.malnutritionRisk === "HIGH" && <AlertTriangle className="h-3 w-3" />}
                                {a.malnutritionRisk} RISK
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Anthropometrics</p>
                                <p className="text-xs text-gray-700">BMI: <span className="font-bold">{a.bmi}</span> kg/m²</p>
                                <p className="text-xs text-gray-700">Waist: <span className="font-bold">{a.waist}</span> cm</p>
                            </div>
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Diet History</p>
                                <p className="text-xs text-gray-700">{a.dietHistory}</p>
                            </div>
                        </div>
                        <div className="bg-emerald-50 rounded-xl p-3">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-1">Recommendations</p>
                            <p className="text-xs text-gray-700">{a.recommendations}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

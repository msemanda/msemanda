"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { ClipboardList, AlertTriangle, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";

interface NutritionalAssessment {
    id: string;
    patient: string;
    date: string;
    followUp: string;
    bmi: number;
    waist: number;
    dietHistory: string;
    malnutritionRisk: string;
    recommendations: string;
}

const RISK_STYLE: Record<string, string> = {
    LOW:      "bg-green-50 text-green-700 border-green-100",
    MODERATE: "bg-amber-50 text-amber-700 border-amber-100",
    HIGH:     "bg-red-50 text-red-700 border-red-100",
};

export default function NutritionalAssessments() {
    const [assessments, setAssessments] = useState<NutritionalAssessment[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "dietaryAssessments"));
            setAssessments(snap.docs.map(d => {
                const r = d.data();
                const dt = toDate(r.date ?? r.assessedAt);
                const fu = toDate(r.followUp ?? r.followUpDate);
                return {
                    id: d.id,
                    patient: ((r.patientName ?? r.patient) as string) ?? "—",
                    date: dt ? dt.toLocaleDateString("en-CA") : ((r.date as string) ?? "—"),
                    followUp: fu ? fu.toLocaleDateString("en-CA") : ((r.followUp as string) ?? "—"),
                    bmi: Number(r.bmi ?? 0),
                    waist: Number(r.waist ?? 0),
                    dietHistory: (r.dietHistory as string) ?? "—",
                    malnutritionRisk: (r.malnutritionRisk as string) ?? "LOW",
                    recommendations: (r.recommendations as string) ?? "—",
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-emerald-600" /> Nutritional Assessments
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${assessments.length} assessments on file`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-emerald-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-emerald-100 border-t-emerald-500 rounded-full" />
                </div>
            ) : assessments.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No nutritional assessments found</p>
            ) : (
                <div className="space-y-4">
                    {assessments.map((a, i) => (
                        <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-black text-gray-900">{a.patient}</p>
                                    <p className="text-xs text-gray-400">Assessment date: {a.date} · Follow-up: {a.followUp}</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${RISK_STYLE[a.malnutritionRisk] ?? RISK_STYLE.LOW}`}>
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
            )}
        </div>
    );
}

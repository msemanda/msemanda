"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Activity, Clock, RefreshCw } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";
import { EmergencyCase } from "@/types";

const TRIAGE_LEVELS = [
    { level: "IMMEDIATE",   label: "Immediate (Red)",        color: "bg-red-500",    light: "bg-red-50 border-red-200 text-red-900"       },
    { level: "URGENT",      label: "Urgent (Orange)",        color: "bg-orange-400", light: "bg-orange-50 border-orange-200 text-orange-900" },
    { level: "LESS_URGENT", label: "Less Urgent (Yellow)",   color: "bg-yellow-400", light: "bg-yellow-50 border-yellow-200 text-yellow-900" },
    { level: "NON_URGENT",  label: "Non-Urgent (Green)",     color: "bg-green-500",  light: "bg-green-50 border-green-200 text-green-900"   },
];

const BORDER: Record<string, string> = {
    IMMEDIATE:   "border-red-500",
    URGENT:      "border-orange-400",
    LESS_URGENT: "border-yellow-400",
    NON_URGENT:  "border-green-500",
};

const LABEL: Record<string, string> = {
    IMMEDIATE: "I", URGENT: "U", LESS_URGENT: "LU", NON_URGENT: "NU",
};

const triageMap = TRIAGE_LEVELS.reduce<Record<string, typeof TRIAGE_LEVELS[0]>>(
    (acc, t) => { acc[t.level] = t; return acc; }, {}
);

export default function TriageBoardPage() {
    const [patients, setPatients] = useState<EmergencyCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState("ALL");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(
                query(collection(db, "emergencyCases"), where("status", "!=", "DISCHARGED"))
            );
            setPatients(snap.docs.map(d => ({ id: d.id, ...d.data() } as EmergencyCase)));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = patients.filter(p => filter === "ALL" || p.triageLevel === filter);

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Activity className="h-6 w-6 text-red-600" /> Triage Board
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading
                            ? "Loading…"
                            : `${patients.filter(p => p.status === "WAITING").length} waiting · ${patients.filter(p => p.status === "IN_TREATMENT").length} in treatment`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-red-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {TRIAGE_LEVELS.map(t => {
                    const count = patients.filter(p => p.triageLevel === t.level).length;
                    return (
                        <button
                            key={t.level}
                            onClick={() => setFilter(filter === t.level ? "ALL" : t.level)}
                            className={`p-3 rounded-xl border-2 transition-all ${filter === t.level ? t.light + " border-current" : "bg-white border-gray-100 hover:border-gray-200"}`}
                        >
                            <div className={`h-2 w-full rounded-full ${t.color} mb-2`} />
                            <p className="text-xs font-black text-gray-900">{count}</p>
                            <p className="text-[10px] text-gray-500 leading-tight">{t.label}</p>
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-red-100 border-t-red-500 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No patients</p>
            ) : (
                <div className="space-y-2">
                    {filtered.map((p, i) => {
                        const t = triageMap[p.triageLevel];
                        const arrivalDate = toDate(p.arrivalTime);
                        const arrivedStr = arrivalDate
                            ? arrivalDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                            : "—";
                        return (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className={`bg-white rounded-2xl border-l-4 shadow-sm p-4 flex items-center justify-between ${BORDER[p.triageLevel] ?? "border-gray-300"}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white font-black text-xs ${t?.color ?? "bg-gray-400"}`}>
                                        {LABEL[p.triageLevel] ?? "?"}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">
                                            {p.patientName} <span className="text-xs font-normal text-gray-400">{p.age ? `${p.age}y` : ""}</span>
                                        </p>
                                        <p className="text-xs text-gray-600">{p.chiefComplaint}</p>
                                        <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5">
                                            <Clock className="h-3 w-3" /> Arrived {arrivedStr}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4 shrink-0 ml-3">
                                    {p.vitals && (
                                        <div className="text-right hidden sm:block">
                                            <p className="text-[10px] text-gray-400">BP / HR / SpO₂</p>
                                            <p className="text-xs font-bold text-gray-700">
                                                {p.vitals.bloodPressure ?? "—"} · {p.vitals.heartRate ? `${p.vitals.heartRate}bpm` : "—"} · {p.vitals.oxygenSaturation ? `${p.vitals.oxygenSaturation}%` : "—"}
                                            </p>
                                        </div>
                                    )}
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${p.status === "IN_TREATMENT" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                                        {p.status.replace("_", " ")}
                                    </span>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

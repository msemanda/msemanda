"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Clock } from "lucide-react";

const TRIAGE_LEVELS = [
    { level: "IMMEDIATE", label: "Immediate (Red)", color: "bg-red-500", light: "bg-red-50 border-red-200 text-red-900" },
    { level: "URGENT", label: "Urgent (Orange)", color: "bg-orange-400", light: "bg-orange-50 border-orange-200 text-orange-900" },
    { level: "LESS_URGENT", label: "Less Urgent (Yellow)", color: "bg-yellow-400", light: "bg-yellow-50 border-yellow-200 text-yellow-900" },
    { level: "NON_URGENT", label: "Non-Urgent (Green)", color: "bg-green-500", light: "bg-green-50 border-green-200 text-green-900" },
];

const patients = [
    { id: "E001", name: "Unknown Male", age: 45, complaint: "Chest pain + dyspnea — possible MI", arrived: "09:05", triage: "IMMEDIATE", bp: "180/110", hr: 112, spo2: 88, status: "IN_TREATMENT" },
    { id: "E002", name: "Grace Nakabuye", age: 28, complaint: "RTA — head injury, GCS 12", arrived: "09:20", triage: "IMMEDIATE", bp: "90/60", hr: 130, spo2: 94, status: "IN_TREATMENT" },
    { id: "E003", name: "Peter Ssekitoleko", age: 55, complaint: "Severe abdominal pain — surgical abdomen", arrived: "09:45", triage: "URGENT", bp: "130/85", hr: 98, spo2: 97, status: "WAITING" },
    { id: "E004", name: "Fatuma Nakiryowa", age: 22, complaint: "High fever + rigors — malaria suspected", arrived: "10:00", triage: "URGENT", bp: "115/75", hr: 105, spo2: 96, status: "WAITING" },
    { id: "E005", name: "Joshua Byaruhanga", age: 8, complaint: "Febrile convulsion — postictal", arrived: "10:15", triage: "URGENT", bp: "100/60", hr: 118, spo2: 95, status: "IN_TREATMENT" },
    { id: "E006", name: "Agnes Tumusiime", age: 65, complaint: "Difficulty breathing — COPD exacerbation", arrived: "10:30", triage: "LESS_URGENT", bp: "140/90", hr: 88, spo2: 90, status: "WAITING" },
    { id: "E007", name: "John Mwebe", age: 30, complaint: "Laceration — right hand", arrived: "10:50", triage: "NON_URGENT", bp: "120/80", hr: 78, spo2: 99, status: "WAITING" },
];

const triageMap = TRIAGE_LEVELS.reduce<Record<string, typeof TRIAGE_LEVELS[0]>>((acc, t) => { acc[t.level] = t; return acc; }, {});

export default function TriageBoardPage() {
    const [filter, setFilter] = useState("ALL");
    const filtered = patients.filter(p => filter === "ALL" || p.triage === filter);

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Activity className="h-6 w-6 text-red-600" /> Triage Board
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">{patients.filter(p => p.status === "WAITING").length} waiting · {patients.filter(p => p.status === "IN_TREATMENT").length} in treatment</p>
                </div>
            </div>

            <div className="grid grid-cols-4 gap-3">
                {TRIAGE_LEVELS.map(t => {
                    const count = patients.filter(p => p.triage === t.level).length;
                    return (
                        <button key={t.level} onClick={() => setFilter(filter === t.level ? "ALL" : t.level)}
                            className={`p-3 rounded-xl border-2 transition-all ${filter === t.level ? t.light + " border-current" : "bg-white border-gray-100 hover:border-gray-200"}`}>
                            <div className={`h-2 w-full rounded-full ${t.color} mb-2`} />
                            <p className="text-xs font-black text-gray-900">{count}</p>
                            <p className="text-[10px] text-gray-500 leading-tight">{t.label}</p>
                        </button>
                    );
                })}
            </div>

            <div className="space-y-2">
                {filtered.map((p, i) => {
                    const t = triageMap[p.triage];
                    return (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            className={`bg-white rounded-2xl border-l-4 shadow-sm p-4 flex items-center justify-between ${p.triage === "IMMEDIATE" ? "border-red-500" : p.triage === "URGENT" ? "border-orange-400" : p.triage === "LESS_URGENT" ? "border-yellow-400" : "border-green-500"}`}>
                            <div className="flex items-center gap-3">
                                <div className={`h-9 w-9 rounded-xl flex items-center justify-center text-white font-black text-xs ${t.color}`}>
                                    {p.triage === "IMMEDIATE" ? "I" : p.triage === "URGENT" ? "U" : p.triage === "LESS_URGENT" ? "LU" : "NU"}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900">{p.name} <span className="text-xs font-normal text-gray-400">{p.age}y</span></p>
                                    <p className="text-xs text-gray-600">{p.complaint}</p>
                                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" /> Arrived {p.arrived}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 shrink-0 ml-3">
                                <div className="text-right hidden sm:block">
                                    <p className="text-[10px] text-gray-400">BP / HR / SpO₂</p>
                                    <p className="text-xs font-bold text-gray-700">{p.bp} · {p.hr}bpm · {p.spo2}%</p>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${p.status === "IN_TREATMENT" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                                    {p.status.replace("_", " ")}
                                </span>
                            </div>
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

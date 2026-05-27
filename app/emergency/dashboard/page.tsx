"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Ambulance, Users, AlertCircle, Clock, Activity, ArrowRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

const TRIAGE_CONFIG: Record<string, { label: string; color: string; bg: string; border: string; dot: string }> = {
    IMMEDIATE: { label: "IMMEDIATE", color: "text-red-700", bg: "bg-red-50", border: "border-red-200", dot: "bg-red-500" },
    URGENT: { label: "URGENT", color: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", dot: "bg-amber-500" },
    LESS_URGENT: { label: "LESS URGENT", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200", dot: "bg-blue-500" },
    NON_URGENT: { label: "NON-URGENT", color: "text-green-700", bg: "bg-green-50", border: "border-green-200", dot: "bg-green-500" },
};

const edPatients = [
    { id: "ED001", name: "Sarah Namutebi", age: 45, complaint: "Severe chest pain, SOB", triage: "IMMEDIATE", arrival: "10 min ago", status: "IN_TREATMENT", doctor: "Dr. Bwire" },
    { id: "ED002", name: "John Mwesiga", age: 28, complaint: "Road traffic accident, head injury", triage: "IMMEDIATE", arrival: "25 min ago", status: "IN_TREATMENT", doctor: "Dr. Katongo" },
    { id: "ED003", name: "Grace Nakato", age: 67, complaint: "Suspected stroke, facial droop", triage: "URGENT", arrival: "40 min ago", status: "IN_TREATMENT", doctor: "Dr. Ssekibala" },
    { id: "ED004", name: "Patrick Ssemanda", age: 12, complaint: "High fever 40°C, febrile seizure", triage: "URGENT", arrival: "55 min ago", status: "WAITING", doctor: null },
    { id: "ED005", name: "Alice Nakirya", age: 34, complaint: "Abdominal pain, vomiting", triage: "LESS_URGENT", arrival: "1h 10min ago", status: "WAITING", doctor: null },
    { id: "ED006", name: "Peter Wanyama", age: 22, complaint: "Laceration on right hand", triage: "NON_URGENT", arrival: "1h 30min ago", status: "WAITING", doctor: null },
];

const stats = [
    { label: "In ED Now", value: String(edPatients.length), icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Immediate", value: String(edPatients.filter(p => p.triage === "IMMEDIATE").length), icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Waiting", value: String(edPatients.filter(p => p.status === "WAITING").length), icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Ambulances Active", value: "2", icon: Ambulance, color: "text-green-600", bg: "bg-green-50" },
];

export default function EmergencyDashboard() {
    const { profile } = useAuth();
    const [filter, setFilter] = useState<string>("ALL");
    const filtered = filter === "ALL" ? edPatients : edPatients.filter(p => p.triage === filter);

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Activity className="h-6 w-6 text-red-600" /> Emergency Department
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Real-time triage board &bull; <span className="font-bold text-red-600">{profile?.name}</span></p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 border border-red-100">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-black text-red-700">ED ACTIVE</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
                            <div className={`inline-flex p-2.5 rounded-xl ${s.bg} mb-3`}><Icon className={`h-5 w-5 ${s.color}`} /></div>
                            <p className="text-2xl font-black text-gray-900">{s.value}</p>
                            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Triage filter */}
            <div className="flex gap-2 flex-wrap">
                {["ALL", "IMMEDIATE", "URGENT", "LESS_URGENT", "NON_URGENT"].map((t) => (
                    <button
                        key={t}
                        onClick={() => setFilter(t)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                            filter === t
                                ? t === "ALL" ? "bg-gray-900 text-white" : `${TRIAGE_CONFIG[t]?.bg} ${TRIAGE_CONFIG[t]?.color} border ${TRIAGE_CONFIG[t]?.border}`
                                : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"
                        }`}
                    >
                        {t === "ALL" ? "All Patients" : TRIAGE_CONFIG[t]?.label}
                        {t !== "ALL" && (
                            <span className="ml-1.5 opacity-70">
                                ({edPatients.filter(p => p.triage === t).length})
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {/* Patient board */}
            <div className="space-y-2">
                <AnimatePresence>
                    {filtered.map((p, i) => {
                        const cfg = TRIAGE_CONFIG[p.triage];
                        return (
                            <motion.div
                                key={p.id}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ delay: i * 0.04 }}
                                className={`bg-white rounded-xl border ${cfg.border} p-4 flex items-center gap-4 hover:shadow-sm transition-all`}
                            >
                                <div className={`flex items-center gap-2 w-28 shrink-0`}>
                                    <div className={`h-2.5 w-2.5 rounded-full ${cfg.dot} animate-pulse`} />
                                    <span className={`text-[10px] font-black ${cfg.color}`}>{cfg.label}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <p className="text-sm font-bold text-gray-900">{p.name}</p>
                                        <span className="text-xs text-gray-400">{p.age}y</span>
                                    </div>
                                    <p className="text-xs text-gray-500 truncate">{p.complaint}</p>
                                </div>
                                <div className="text-xs text-gray-400 flex items-center gap-1 shrink-0">
                                    <Clock className="h-3.5 w-3.5" /> {p.arrival}
                                </div>
                                <div className="w-24 text-xs text-gray-600 shrink-0">
                                    {p.doctor ? <span className="font-semibold">{p.doctor}</span> : <span className="text-amber-500 font-semibold">Unassigned</span>}
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ${
                                    p.status === "IN_TREATMENT" ? "badge-blue" : "badge-yellow"
                                }`}>{p.status.replace("_", " ")}</span>
                                <button className="shrink-0 text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1">
                                    View <ArrowRight className="h-3 w-3" />
                                </button>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}

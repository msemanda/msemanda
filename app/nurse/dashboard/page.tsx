"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
    BedDouble, Activity, AlertCircle, CheckCircle2,
    Clock, Users, Heart, Thermometer, Droplets,
} from "lucide-react";

interface WardPatient {
    id: string;
    patientName: string;
    bedNumber: string;
    wardName: string;
    status: string;
    vitals?: { bp?: string; temp?: string; spo2?: string };
}

interface OTSlot {
    id: string;
    patientName: string;
    procedure: string;
    scheduledTime: string;
    theater: string;
}

const STATUS_CLASSES: Record<string, string> = {
    STABLE:   "badge-green",
    MONITOR:  "badge-yellow",
    CRITICAL: "badge-red",
    ACTIVE:   "badge-blue",
};

export default function NurseDashboard() {
    const { profile } = useAuth();
    const [patients, setPatients]   = useState<WardPatient[]>([]);
    const [otSlots, setOtSlots]     = useState<OTSlot[]>([]);
    const [loading, setLoading]     = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [patSnap, otSnap] = await Promise.all([
                    getDocs(query(collection(db, "ipdAdmissions"), where("dischargedAt", "==", null), orderBy("admittedAt", "desc"))),
                    getDocs(query(collection(db, "otSchedules"), orderBy("scheduledTime", "asc"), limit(5))),
                ]);
                setPatients(patSnap.docs.map(d => ({ id: d.id, ...d.data() } as WardPatient)));
                setOtSlots(otSnap.docs.map(d => ({ id: d.id, ...d.data() } as OTSlot)));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const critical   = patients.filter(p => p.status === "CRITICAL");
    const discharged = patients.filter(p => p.status === "DISCHARGED");
    const vitalsDue  = patients.filter(p => !p.vitals?.bp);

    const quickStats = [
        { label: "Ward Patients",   value: String(patients.length), icon: BedDouble,    color: "text-blue-600",  bg: "bg-blue-50"  },
        { label: "Vitals Pending",  value: String(vitalsDue.length), icon: Activity,    color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Critical Alerts", value: String(critical.length),  icon: AlertCircle, color: "text-red-600",   bg: "bg-red-50"   },
        { label: "Discharged Today",value: String(discharged.length),icon: CheckCircle2,color: "text-green-600", bg: "bg-green-50" },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">
                        Good morning, <span className="text-blue-600">{profile?.name?.split(" ")[0]}</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Ward overview &bull; {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-100">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold text-green-700">On Shift</span>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {quickStats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div key={stat.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
                            <div className={`inline-flex p-2.5 rounded-xl ${stat.bg} mb-3`}>
                                <Icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                            <p className="text-2xl font-black text-gray-900">{loading ? "—" : stat.value}</p>
                            <p className="text-xs font-semibold text-gray-500 mt-0.5">{stat.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Patient list */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" /> Ward Patients
                        </h2>
                        <span className="text-xs font-semibold text-gray-400">{patients.length} patients</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {loading && (
                            <div className="px-5 py-8 text-center text-sm text-gray-400">Loading patients…</div>
                        )}
                        {!loading && patients.length === 0 && (
                            <div className="px-5 py-8 text-center text-sm text-gray-400">No active ward patients</div>
                        )}
                        {patients.map((p) => (
                            <div key={p.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors flex items-center gap-4">
                                <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-700 text-sm shrink-0">
                                    {p.patientName?.charAt(0) ?? "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{p.patientName}</p>
                                    <p className="text-xs text-gray-400">Bed {p.bedNumber} &bull; {p.wardName}</p>
                                </div>
                                <div className="hidden md:flex items-center gap-4 text-xs text-gray-600">
                                    {p.vitals?.bp && (
                                        <div className="flex items-center gap-1">
                                            <Heart className="h-3 w-3 text-red-400" />
                                            <span className="font-semibold">{p.vitals.bp}</span>
                                        </div>
                                    )}
                                    {p.vitals?.temp && (
                                        <div className="flex items-center gap-1">
                                            <Thermometer className="h-3 w-3 text-orange-400" />
                                            <span className="font-semibold">{p.vitals.temp}°C</span>
                                        </div>
                                    )}
                                    {p.vitals?.spo2 && (
                                        <div className="flex items-center gap-1">
                                            <Droplets className="h-3 w-3 text-blue-400" />
                                            <span className="font-semibold">{p.vitals.spo2}</span>
                                        </div>
                                    )}
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_CLASSES[p.status] ?? "badge-blue"}`}>
                                    {p.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right panel */}
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" /> Today&apos;s OT Schedule
                        </h3>
                        {loading && <p className="text-xs text-gray-400">Loading…</p>}
                        {!loading && otSlots.length === 0 && (
                            <p className="text-xs text-gray-400">No OT cases scheduled today</p>
                        )}
                        <div className="space-y-2.5">
                            {otSlots.map((item) => (
                                <div key={item.id} className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50">
                                    <div className="text-xs font-black text-blue-600 w-12 shrink-0 pt-0.5">{item.scheduledTime}</div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">{item.patientName}</p>
                                        <p className="text-[10px] text-gray-400">{item.procedure} &bull; {item.theater}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {critical.length > 0 && (
                        <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
                            <h3 className="font-bold text-red-800 text-sm mb-3 flex items-center gap-2">
                                <AlertCircle className="h-4 w-4" /> Critical Alerts
                            </h3>
                            <div className="space-y-2">
                                {critical.map((p) => (
                                    <div key={p.id} className="p-2.5 bg-white rounded-xl border border-red-100">
                                        <p className="text-xs font-bold text-red-700">{p.patientName} — {p.bedNumber}</p>
                                        {p.vitals && (
                                            <p className="text-[10px] text-red-500 mt-0.5">
                                                {p.vitals.temp && `Temp ${p.vitals.temp}°C`}
                                                {p.vitals.spo2 && ` · SpO₂ ${p.vitals.spo2}`}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

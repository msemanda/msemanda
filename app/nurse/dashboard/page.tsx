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
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Tooltip } from "@/components/ui/Tooltip";
import { SkeletonStatCard, SkeletonRow } from "@/components/ui/Skeleton";

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

const STATUS_BADGE_VARIANT: Record<string, "green" | "yellow" | "red" | "blue"> = {
    STABLE: "green",
    MONITOR: "yellow",
    CRITICAL: "red",
    ACTIVE: "blue",
};

export default function NurseDashboard() {
    const { profile } = useAuth();
    const [patients, setPatients]   = useState<WardPatient[]>([]);
    const [otSlots, setOtSlots]     = useState<OTSlot[]>([]);
    const [loading, setLoading]     = useState(true);
    const [selectedPatient, setSelectedPatient] = useState<WardPatient | null>(null);

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
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
                    : quickStats.map((stat, i) => {
                        const Icon = stat.icon;
                        return (
                            <Card
                                key={stat.label}
                                variant="interactive"
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.07 }}
                                className="p-6"
                            >
                                <div className={`inline-flex p-2.5 rounded-xl ${stat.bg} mb-3`}>
                                    <Icon className={`h-5 w-5 ${stat.color}`} />
                                </div>
                                <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                                <p className="text-xs font-semibold text-gray-500 mt-0.5">{stat.label}</p>
                            </Card>
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
                        {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
                        {!loading && patients.length === 0 && (
                            <div className="px-5 py-8 text-center text-sm text-gray-400">No active ward patients</div>
                        )}
                        {patients.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setSelectedPatient(p)}
                                className="w-full text-left px-5 py-3.5 hover:bg-gray-50 transition-colors flex items-center gap-4"
                            >
                                <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-700 text-sm shrink-0">
                                    {p.patientName?.charAt(0) ?? "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{p.patientName}</p>
                                    <p className="text-xs text-gray-400">Bed {p.bedNumber} &bull; {p.wardName}</p>
                                </div>
                                <div className="hidden md:flex items-center gap-4 text-xs text-gray-600">
                                    {p.vitals?.bp && (
                                        <Tooltip content="Blood pressure">
                                            <div className="flex items-center gap-1">
                                                <Heart className="h-3 w-3 text-red-400" />
                                                <span className="font-semibold">{p.vitals.bp}</span>
                                            </div>
                                        </Tooltip>
                                    )}
                                    {p.vitals?.temp && (
                                        <Tooltip content="Temperature">
                                            <div className="flex items-center gap-1">
                                                <Thermometer className="h-3 w-3 text-orange-400" />
                                                <span className="font-semibold">{p.vitals.temp}°C</span>
                                            </div>
                                        </Tooltip>
                                    )}
                                    {p.vitals?.spo2 && (
                                        <Tooltip content="Oxygen saturation">
                                            <div className="flex items-center gap-1">
                                                <Droplets className="h-3 w-3 text-blue-400" />
                                                <span className="font-semibold">{p.vitals.spo2}</span>
                                            </div>
                                        </Tooltip>
                                    )}
                                </div>
                                <Badge variant={STATUS_BADGE_VARIANT[p.status] ?? "blue"}>{p.status}</Badge>
                            </button>
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
                                    <button
                                        key={p.id}
                                        onClick={() => setSelectedPatient(p)}
                                        className="w-full text-left p-2.5 bg-white rounded-xl border border-red-100 hover:border-red-200 transition-colors"
                                    >
                                        <p className="text-xs font-bold text-red-700">{p.patientName} — {p.bedNumber}</p>
                                        {p.vitals && (
                                            <p className="text-[10px] text-red-500 mt-0.5">
                                                {p.vitals.temp && `Temp ${p.vitals.temp}°C`}
                                                {p.vitals.spo2 && ` · SpO₂ ${p.vitals.spo2}`}
                                            </p>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <Modal
                open={selectedPatient !== null}
                onClose={() => setSelectedPatient(null)}
                title={selectedPatient?.patientName}
                description={selectedPatient ? `Bed ${selectedPatient.bedNumber} · ${selectedPatient.wardName}` : undefined}
            >
                {selectedPatient && (
                    <div className="space-y-4">
                        <Badge variant={STATUS_BADGE_VARIANT[selectedPatient.status] ?? "blue"}>{selectedPatient.status}</Badge>
                        <div className="grid grid-cols-3 gap-3">
                            <div className="rounded-xl bg-gray-50 p-3 text-center">
                                <Heart className="h-4 w-4 text-red-400 mx-auto mb-1" />
                                <p className="text-sm font-black text-gray-900">{selectedPatient.vitals?.bp ?? "—"}</p>
                                <p className="text-[10px] text-gray-400">Blood pressure</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3 text-center">
                                <Thermometer className="h-4 w-4 text-orange-400 mx-auto mb-1" />
                                <p className="text-sm font-black text-gray-900">{selectedPatient.vitals?.temp ? `${selectedPatient.vitals.temp}°C` : "—"}</p>
                                <p className="text-[10px] text-gray-400">Temperature</p>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-3 text-center">
                                <Droplets className="h-4 w-4 text-blue-400 mx-auto mb-1" />
                                <p className="text-sm font-black text-gray-900">{selectedPatient.vitals?.spo2 ?? "—"}</p>
                                <p className="text-[10px] text-gray-400">SpO₂</p>
                            </div>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}

"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import {
    BedDouble,
    Activity,
    AlertCircle,
    CheckCircle2,
    Clock,
    Users,
    Heart,
    Thermometer,
    Droplets,
} from "lucide-react";

const quickStats = [
    { label: "Ward Patients", value: "24", icon: BedDouble, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Vitals Pending", value: "8", icon: Activity, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Critical Alerts", value: "2", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
    { label: "Discharged Today", value: "5", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
];

const mockPatients = [
    { id: "P001", name: "John Mwesiga", bed: "A-01", ward: "General", bp: "120/80", temp: "37.2", spo2: "98%", status: "STABLE" },
    { id: "P002", name: "Grace Nakato", bed: "A-02", ward: "General", bp: "145/90", temp: "38.5", spo2: "95%", status: "MONITOR" },
    { id: "P003", name: "Patrick Ssemanda", bed: "B-01", ward: "Surgical", bp: "110/70", temp: "36.8", spo2: "99%", status: "STABLE" },
    { id: "P004", name: "Sarah Namutebi", bed: "B-03", ward: "Surgical", bp: "160/100", temp: "39.1", spo2: "93%", status: "CRITICAL" },
    { id: "P005", name: "James Okello", bed: "C-02", ward: "Medical", bp: "130/85", temp: "37.0", spo2: "97%", status: "STABLE" },
];

const STATUS_CLASSES: Record<string, string> = {
    STABLE: "badge-green",
    MONITOR: "badge-yellow",
    CRITICAL: "badge-red",
};

export default function NurseDashboard() {
    const { profile } = useAuth();

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">
                        Good morning, <span className="text-blue-600">{profile?.name?.split(" ")[0]}</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Ward overview — Morning Shift &bull; {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-green-50 border border-green-100">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold text-green-700">On Shift</span>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {quickStats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.label}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.07 }}
                            className="stat-card"
                        >
                            <div className={`inline-flex p-2.5 rounded-xl ${stat.bg} mb-3`}>
                                <Icon className={`h-5 w-5 ${stat.color}`} />
                            </div>
                            <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                            <p className="text-xs font-semibold text-gray-500 mt-0.5">{stat.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Patient List */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-600" /> Ward Patients
                        </h2>
                        <span className="text-xs font-semibold text-gray-400">{mockPatients.length} patients</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {mockPatients.map((p) => (
                            <div key={p.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors flex items-center gap-4">
                                <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-700 text-sm shrink-0">
                                    {p.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                                    <p className="text-xs text-gray-400">Bed {p.bed} &bull; {p.ward}</p>
                                </div>
                                <div className="hidden md:flex items-center gap-4 text-xs text-gray-600">
                                    <div className="flex items-center gap-1">
                                        <Heart className="h-3 w-3 text-red-400" />
                                        <span className="font-semibold">{p.bp}</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Thermometer className="h-3 w-3 text-orange-400" />
                                        <span className="font-semibold">{p.temp}°C</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        <Droplets className="h-3 w-3 text-blue-400" />
                                        <span className="font-semibold">{p.spo2}</span>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_CLASSES[p.status]}`}>
                                    {p.status}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right panel */}
                <div className="space-y-4">
                    {/* Upcoming OT */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-blue-600" /> Today&apos;s OT Schedule
                        </h3>
                        <div className="space-y-2.5">
                            {[
                                { time: "08:00", patient: "Alice Nakirya", proc: "Appendectomy", ot: "OT-1" },
                                { time: "10:30", patient: "Bob Katende", proc: "Hip Replacement", ot: "OT-2" },
                                { time: "14:00", patient: "Carol Akello", proc: "C-Section", ot: "OT-1" },
                            ].map((item) => (
                                <div key={item.time} className="flex items-start gap-3 p-2.5 rounded-xl bg-gray-50">
                                    <div className="text-xs font-black text-blue-600 w-12 shrink-0 pt-0.5">{item.time}</div>
                                    <div>
                                        <p className="text-xs font-bold text-gray-900">{item.patient}</p>
                                        <p className="text-[10px] text-gray-400">{item.proc} &bull; {item.ot}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="bg-red-50 rounded-2xl border border-red-100 p-5">
                        <h3 className="font-bold text-red-800 text-sm mb-3 flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" /> Critical Alerts
                        </h3>
                        <div className="space-y-2">
                            <div className="p-2.5 bg-white rounded-xl border border-red-100">
                                <p className="text-xs font-bold text-red-700">Sarah Namutebi — B-03</p>
                                <p className="text-[10px] text-red-500 mt-0.5">High temp 39.1°C &bull; Low SpO₂ 93%</p>
                            </div>
                            <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                                <p className="text-xs font-bold text-amber-700">Grace Nakato — A-02</p>
                                <p className="text-[10px] text-amber-500 mt-0.5">Elevated BP 145/90 — Monitor closely</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

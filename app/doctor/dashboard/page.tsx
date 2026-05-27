"use client";

import React, { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
    Users,
    Calendar,
    Clock,
    ChevronRight,
    ClipboardList,
    FileText,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DoctorDashboard() {
    const { profile } = useAuth();
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (profile) {
            fetchPatients();
        }
    }, [profile]);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "users"),
                where("assignedDoctorId", "==", profile?.uid)
            );
            const querySnapshot = await getDocs(q);
            setPatients(querySnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id })));
        } catch (error) {
            console.error("Error fetching patients:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-gray-900">
                        Welcome, <span className="text-cyan-600">{profile?.name?.split(" ")[0]}</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">You have <span className="text-cyan-600 font-black">{patients.length}</span> patients scheduled today.</p>
                </div>
                <div className="flex bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden shrink-0">
                    <div className="px-5 py-3 border-r border-gray-100 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Today</p>
                        <p className="text-lg font-black text-cyan-600">08</p>
                    </div>
                    <div className="px-5 py-3 text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Pending</p>
                        <p className="text-lg font-black text-orange-500">{patients.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
                            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                <Users className="h-4 w-4 text-cyan-600" /> Consultation Queue
                            </h2>
                            <Button variant="ghost" size="sm" className="text-cyan-600 font-bold hover:bg-cyan-50 rounded-xl text-xs px-4">Live Schedule</Button>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {loading ? (
                                <div className="py-16 text-center">
                                    <div className="animate-spin h-8 w-8 border-[3px] border-cyan-100 border-t-cyan-600 rounded-full mx-auto mb-4" />
                                    <p className="text-gray-400 font-bold text-xs uppercase tracking-widest">Loading</p>
                                </div>
                            ) : patients.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="py-16 text-center"
                                >
                                    <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Calendar className="h-8 w-8 text-gray-200" />
                                    </div>
                                    <p className="text-sm text-gray-400">Queue is empty.</p>
                                </motion.div>
                            ) : (
                                patients.map((patient, idx) => (
                                    <motion.div
                                        key={patient.uid}
                                        initial={{ opacity: 0, x: -10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.07 }}
                                        className="p-4 hover:bg-cyan-50/30 transition-all group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-100 to-teal-50 flex items-center justify-center text-cyan-700 font-black text-sm group-hover:scale-105 transition-transform shadow-sm shrink-0">
                                                {patient.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <h3 className="text-sm font-black text-gray-900 truncate">{patient.name}</h3>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center text-xs font-bold text-gray-600 uppercase tracking-tighter">
                                                        <Clock className="h-3.5 w-3.5 mr-1.5 text-cyan-500" /> {patient.visitDate || "TBA"}
                                                    </div>
                                                    <div className="h-1 w-1 bg-gray-300 rounded-full" />
                                                    <div className="flex items-center text-xs font-bold text-gray-600 uppercase tracking-tighter">
                                                        <Activity className="h-3.5 w-3.5 mr-1.5 text-teal-500" /> Routine Checkup
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <Link href={`/doctor/diagnose/${patient.uid}`} className="shrink-0">
                                            <Button className="h-9 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5">
                                                Start <ChevronRight className="h-3.5 w-3.5" />
                                            </Button>
                                        </Link>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-cyan-600" /> Quick Access
                        </h3>
                        <div className="space-y-2">
                            <Link href="/doctor/diagnostics">
                                <Button variant="outline" className="w-full justify-start h-10 rounded-xl border-gray-100 bg-gray-50 hover:bg-white hover:border-cyan-200 text-gray-700 font-bold text-xs mb-2">
                                    <FileText className="mr-2 h-3.5 w-3.5 text-gray-400" /> Diagnostic History
                                </Button>
                            </Link>
                            <Button variant="outline" className="w-full justify-start h-10 rounded-xl border-gray-100 bg-gray-50 hover:bg-white hover:border-cyan-200 text-gray-700 font-bold text-xs">
                                <Users className="mr-2 h-3.5 w-3.5 text-gray-400" /> Patient Registry
                            </Button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-sm font-black mb-1">Clinic Performance</h3>
                            <p className="text-gray-400 text-xs mb-4">Completed <span className="text-cyan-400 font-black">94%</span> of visits this quarter.</p>
                            <div className="space-y-1.5">
                                <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: "94%" }} className="h-full bg-cyan-400" />
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-gray-500">
                                    <span>Efficiency</span>
                                    <span className="text-cyan-400">94%</span>
                                </div>
                            </div>
                        </div>
                        <Activity className="absolute bottom-[-20px] right-[-20px] h-32 w-32 text-white/[0.03]" />
                    </div>
                </div>
            </div>
        </div>
    );
}

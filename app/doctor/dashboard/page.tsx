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
        <div className="max-w-7xl mx-auto py-12 px-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-16 gap-8">
                <div className="space-y-1">
                    <h1 className="text-5xl font-black text-gray-900 tracking-tight">
                        Greetings, <span className="text-gradient-cyan">{profile?.name}</span>
                    </h1>
                    <p className="text-lg text-gray-500 font-medium">You have <span className="text-cyan-600 font-black">{patients.length}</span> patients scheduled for consultation today.</p>
                </div>
                <div className="flex bg-glass p-2.5 rounded-[32px] shadow-premium border border-white/60">
                    <div className="px-8 py-3 border-r border-gray-100 text-center group cursor-default">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-cyan-500 transition-colors">Today</p>
                        <p className="text-2xl font-black text-cyan-600">08</p>
                    </div>
                    <div className="px-8 py-3 text-center group cursor-default">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 group-hover:text-orange-500 transition-colors">Pending</p>
                        <p className="text-2xl font-black text-orange-500">{patients.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8">
                    <div className="bg-glass rounded-[40px] shadow-premium border border-white/60 overflow-hidden">
                        <div className="px-10 py-8 border-b border-gray-50 flex justify-between items-center bg-white/50">
                            <h2 className="text-2xl font-black text-gray-900 flex items-center gap-4">
                                <Users className="h-6 w-6 text-cyan-600" /> Consultation Queue
                            </h2>
                            <Button variant="ghost" size="sm" className="text-cyan-600 font-black hover:bg-cyan-50 rounded-2xl px-6">Live Schedule</Button>
                        </div>

                        <div className="divide-y divide-gray-50">
                            {loading ? (
                                <div className="p-32 text-center">
                                    <div className="animate-spin h-10 w-10 border-4 border-cyan-100 border-t-cyan-600 rounded-full mx-auto mb-6" />
                                    <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Accessing Records</p>
                                </div>
                            ) : patients.length === 0 ? (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="p-32 text-center"
                                >
                                    <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <Calendar className="h-10 w-10 text-gray-200" />
                                    </div>
                                    <p className="text-gray-400 font-medium">Your consultation queue is currently empty.</p>
                                </motion.div>
                            ) : (
                                patients.map((patient, idx) => (
                                    <motion.div
                                        key={patient.uid}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        className="p-10 hover:bg-cyan-50/30 transition-all group flex flex-col md:flex-row md:items-center justify-between gap-6"
                                    >
                                        <div className="flex items-center gap-8">
                                            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-cyan-100 to-teal-50 flex items-center justify-center text-cyan-700 font-black text-2xl group-hover:scale-110 group-hover:rotate-3 transition-transform shadow-sm">
                                                {patient.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900 mb-1">{patient.name}</h3>
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
                                        <div className="flex items-center gap-6">
                                            <div className="hidden xl:block text-right">
                                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Chief Complaint</p>
                                                <p className="text-sm text-gray-700 font-bold italic line-clamp-1 max-w-[200px]">"{patient.problem}"</p>
                                            </div>
                                            <Link href={`/doctor/diagnose/${patient.uid}`}>
                                                <Button className="h-14 px-8 rounded-2xl shadow-premium group-hover:bg-cyan-700 transition-all flex items-center gap-2">
                                                    Start Session <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                                                </Button>
                                            </Link>
                                        </div>
                                    </motion.div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-10">
                    <section className="bg-glass rounded-[40px] p-10 shadow-premium border border-white/60">
                        <h3 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-3">
                            <ClipboardList className="h-6 w-6 text-cyan-600" /> Quick Access
                        </h3>
                        <div className="space-y-4">
                            <Button variant="outline" className="w-full justify-start h-16 rounded-2xl border-gray-100 bg-gray-50/50 hover:bg-white hover:border-cyan-200 text-gray-700 font-bold group">
                                <FileText className="mr-3 h-5 w-5 text-gray-400 group-hover:text-cyan-500 transition-colors" /> Medical History
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-16 rounded-2xl border-gray-100 bg-gray-50/50 hover:bg-white hover:border-cyan-200 text-gray-700 font-bold group">
                                <Users className="mr-3 h-5 w-5 text-gray-400 group-hover:text-cyan-500 transition-colors" /> Patient Registry
                            </Button>
                        </div>
                    </section>

                    <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[40px] p-10 text-white shadow-2xl relative overflow-hidden">
                        <div className="relative z-10 flex flex-col h-full">
                            <h3 className="text-2xl font-black mb-4">Clinic Performance</h3>
                            <p className="text-gray-400 font-medium mb-10">You've completed <span className="text-cyan-400 font-black">94%</span> of scheduled visits this quarter. Exemplary rating.</p>

                            <div className="mt-auto space-y-3">
                                <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: "94%" }} className="h-full bg-cyan-400 shadow-[0_0_20px_rgba(34,211,238,0.5)]" />
                                </div>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">
                                    <span>Efficiency</span>
                                    <span className="text-cyan-400">Target Reached</span>
                                </div>
                            </div>
                        </div>
                        <Activity className="absolute bottom-[-30px] right-[-30px] h-48 w-48 text-white/[0.03]" />
                    </section>
                </div>
            </div>
        </div>
    );
}

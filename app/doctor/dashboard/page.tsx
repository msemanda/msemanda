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
        <div className="max-w-7xl mx-auto py-12 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-bold font-premium text-gray-900 tracking-tight">
                        Greetings, {profile?.name}
                    </h1>
                    <p className="mt-2 text-gray-600">You have {patients.length} patients scheduled for consultation.</p>
                </div>
                <div className="flex bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <div className="px-6 py-2 border-r text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase">Today</p>
                        <p className="text-xl font-bold text-blue-600">08</p>
                    </div>
                    <div className="px-6 py-2 text-center">
                        <p className="text-xs font-bold text-gray-400 uppercase">Pending</p>
                        <p className="text-xl font-bold text-orange-500">{patients.length}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-3xl shadow-xl border border-gray-50 overflow-hidden">
                        <div className="px-8 py-6 bg-gray-50/50 border-b flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center">
                                <Users className="mr-3 h-5 w-5 text-blue-600" /> Patient Consultation Queue
                            </h2>
                            <Button variant="ghost" size="sm" className="text-blue-600">View Schedule</Button>
                        </div>

                        <div className="divide-y">
                            {loading ? (
                                <div className="p-20 text-center text-gray-400 italic">Accessing patient records...</div>
                            ) : patients.length === 0 ? (
                                <div className="p-20 text-center text-gray-400 border-dashed border-2 m-8 rounded-2xl">
                                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-20" />
                                    <p>Your consultation queue is currently empty.</p>
                                </div>
                            ) : (
                                patients.map((patient) => (
                                    <div key={patient.uid} className="p-8 hover:bg-blue-50/30 transition-colors group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-6">
                                                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-blue-600 font-bold text-xl group-hover:scale-110 transition-transform">
                                                    {patient.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h3 className="text-lg font-bold text-gray-900">{patient.name}</h3>
                                                    <div className="flex items-center text-sm text-gray-500 mt-1">
                                                        <Clock className="h-3 w-3 mr-1" /> {patient.visitDate || "TBA"}
                                                    </div>
                                                </div>
                                            </div>
                                            <Link href={`/doctor/diagnose/${patient.uid}`}>
                                                <Button className="rounded-xl px-6 group-hover:translate-x-1 transition-transform">
                                                    Consult <ChevronRight className="ml-2 h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </div>
                                        <div className="mt-4 ml-20">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Stated Symptoms</p>
                                            <p className="text-sm text-gray-600 italic line-clamp-1">{patient.problem}</p>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-white rounded-3xl p-8 shadow-lg border border-gray-50">
                        <h3 className="text-lg font-bold mb-6 flex items-center font-premium">
                            <ClipboardList className="h-5 w-5 mr-3 text-indigo-600" /> Quick Actions
                        </h3>
                        <div className="space-y-4">
                            <Button variant="outline" className="w-full justify-start h-14 rounded-2xl border-gray-100 bg-gray-50/50 hover:bg-white text-gray-700">
                                <FileText className="mr-3 h-5 w-5 text-gray-400" /> View Medical History
                            </Button>
                            <Button variant="outline" className="w-full justify-start h-14 rounded-2xl border-gray-100 bg-gray-50/50 hover:bg-white text-gray-700">
                                <Users className="mr-3 h-5 w-5 text-gray-400" /> Manage Staff Access
                            </Button>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-blue-700 to-indigo-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-xl font-bold mb-4">Clinic Performance</h3>
                            <p className="text-blue-100 text-sm mb-6">You've completed 94% of your scheduled visits this month. Keep up the great work!</p>
                            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-300 h-full w-[94%]" />
                            </div>
                        </div>
                        <Activity className="absolute bottom-[-20px] right-[-20px] h-40 w-40 text-white/5" />
                    </div>
                </div>
            </div>
        </div>
    );
}

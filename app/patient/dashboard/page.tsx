"use client";

import { useAuth } from "@/context/AuthContext";
import {
    Calendar,
    Clock,
    User,
    FileText,
    HeartPulse,
    Activity
} from "lucide-react";
import { PatientProfile } from "@/types";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "framer-motion";

export default function PatientDashboard() {
    const { profile: userProfile } = useAuth();
    const profile = userProfile as PatientProfile;

    // In a real app, we'd fetch these from Firestore
    // Mocking the data based on legacy plog.jsp logic
    const appointment = profile?.visitDate ? {
        doctor: "Dr. Smith", // We'd fetch the actual doctor name using assignedDoctorId
        date: profile.visitDate,
        time: "12:00 AM"
    } : null;

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-gray-900">Welcome, <span className="text-cyan-600">{profile?.name?.split(" ")[0]}</span></h1>
                    <p className="text-sm text-gray-500 mt-0.5">Your health dashboard — appointments and records.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/patient/records">
                        <Button variant="outline" className="h-9 px-4 rounded-xl border-gray-200 bg-white font-bold text-xs flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-gray-400" /> Records
                        </Button>
                    </Link>
                    <Button className="h-9 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5">
                        <Activity className="h-3.5 w-3.5" /> Request Care
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {appointment ? (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
                        >
                            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 p-4 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
                                        <Calendar className="h-5 w-5 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-sm font-black">Active Consultation</h2>
                                        <p className="text-cyan-50/80 text-[10px] font-bold uppercase tracking-widest">Confirmed</p>
                                    </div>
                                </div>
                                <span className="bg-white/10 px-3 py-1 rounded-xl text-[10px] font-bold uppercase border border-white/20 w-fit">
                                    Live
                                </span>
                            </div>
                            <div className="p-4 sm:p-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-cyan-50 p-2.5 rounded-xl shrink-0">
                                            <User className="h-4 w-4 text-cyan-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Assigned Specialist</p>
                                            <p className="text-sm font-black text-gray-900">Dr. Sarah Jenkins</p>
                                            <p className="text-xs text-cyan-600 font-bold mt-1">Senior Cardiology</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-teal-50 p-2.5 rounded-xl shrink-0">
                                            <Clock className="h-4 w-4 text-teal-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Appointment</p>
                                            <p className="text-sm font-black text-gray-900">{appointment.date}</p>
                                            <p className="text-xs text-gray-500 font-bold mt-1">{appointment.time}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between gap-3 flex-wrap">
                                    <p className="text-xs text-gray-400 italic">Please arrive 15 minutes early.</p>
                                    <div className="flex gap-2">
                                        <Button variant="ghost" className="h-9 px-4 text-gray-400 font-bold rounded-xl hover:bg-gray-50 text-xs">Reschedule</Button>
                                        <Button className="h-9 px-4 rounded-xl font-bold text-xs">Check-in</Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-14 text-center">
                            <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm font-black text-gray-900 mb-1">No Active Consultations</p>
                            <p className="text-xs text-gray-400 max-w-xs mx-auto">Contact administration if you need a check-up.</p>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                <HeartPulse className="h-4 w-4 text-cyan-600" /> Diagnostic History
                            </h3>
                            <button className="text-xs font-bold text-cyan-600 hover:underline">View all</button>
                        </div>
                        <Link href="/patient/diagnostics" className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-cyan-100 hover:bg-cyan-50/30 transition-all group">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 bg-white rounded-xl border border-gray-100 flex items-center justify-center shadow-sm shrink-0">
                                    <FileText className="h-4 w-4 text-cyan-600" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900">General Health Screening</p>
                                    <p className="text-xs text-gray-400 font-bold mt-0.5">Oct 24, 2025 · Dr. Sarah Jenkins</p>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" className="h-8 px-3 rounded-xl text-cyan-600 font-bold text-xs shrink-0">View</Button>
                        </Link>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
                        <div className="relative z-10">
                            <h3 className="text-sm font-black mb-1">Patient Profile</h3>
                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider">Verified Identity</span>
                            <div className="mt-4 space-y-4">
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Medical ID</p>
                                    <p className="text-xs font-mono font-bold text-cyan-50">RMC-{profile?.uid?.substring(0, 12).toUpperCase()}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Primary Condition</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 bg-teal-400 rounded-full animate-pulse" />
                                        <p className="text-sm font-black">Persistent Cough</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Blood Type</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-1.5 w-1.5 bg-red-500 rounded-full" />
                                        <p className="text-sm font-black">A+</p>
                                    </div>
                                </div>
                            </div>
                            <Button className="w-full h-9 mt-5 bg-white text-gray-900 font-bold rounded-xl text-xs hover:bg-cyan-50">
                                Edit Profile
                            </Button>
                        </div>
                        <Activity className="absolute bottom-[-20px] right-[-20px] h-36 w-36 text-white/[0.03]" />
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Settings</h4>
                        <div className="space-y-2">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-600">Pharmacy Sync</span>
                                <div className="h-5 w-9 bg-cyan-600 rounded-full flex items-center px-0.5">
                                    <div className="h-4 w-4 bg-white rounded-full translate-x-4" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-600">Cloud Backups</span>
                                <span className="text-[10px] font-bold text-teal-600">Active</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
        <div className="max-w-7xl mx-auto py-16 px-6 sm:px-10">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-16 gap-10">
                <div className="space-y-2">
                    <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
                        Healthy Life, <br /><span className="text-gradient-cyan">{profile?.name}</span>
                    </h1>
                    <p className="text-xl text-gray-500 font-medium">Monitoring your wellness journey and vital care points.</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                    <Link href="/patient/records">
                        <Button variant="outline" className="h-16 px-8 rounded-2xl border-gray-200 bg-white font-black group">
                            <FileText className="mr-3 h-5 w-5 text-gray-400 group-hover:text-cyan-600 transition-colors" /> Medical Archives
                        </Button>
                    </Link>
                    <Button className="h-16 px-8 rounded-2xl shadow-premium font-black flex items-center gap-3">
                        <Activity className="h-5 w-5" /> Request Care Node
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-12">
                    {appointment ? (
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-glass rounded-[48px] shadow-premium border border-white overflow-hidden transition-all group"
                        >
                            <div className="bg-gradient-to-r from-cyan-600 to-teal-600 p-10 text-white flex flex-col md:flex-row md:items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="h-16 w-16 bg-white/20 rounded-3xl flex items-center justify-center backdrop-blur-md">
                                        <Calendar className="h-8 w-8 text-white" />
                                    </div>
                                    <div>
                                        <h2 className="text-3xl font-black tracking-tight">Active Consultation</h2>
                                        <p className="text-cyan-50/80 font-bold uppercase tracking-widest text-xs mt-1">Confirmed Priority Node</p>
                                    </div>
                                </div>
                                <div className="bg-white/10 px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/20 backdrop-blur-sm">
                                    Queue Status: Live
                                </div>
                            </div>
                            <div className="p-10 lg:p-12">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                    <div className="flex items-start gap-6">
                                        <div className="bg-cyan-50 p-4 rounded-3xl group-hover:scale-110 transition-transform">
                                            <User className="h-8 w-8 text-cyan-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Specialist Assigned</p>
                                            <p className="text-2xl font-black text-gray-900 leading-tight">Dr. Sarah Jenkins</p>
                                            <p className="text-sm text-cyan-600 font-black mt-2 bg-cyan-50 w-fit px-3 py-1 rounded-full">Senior Cardiology Unit</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-6">
                                        <div className="bg-teal-50 p-4 rounded-3xl group-hover:scale-110 transition-transform">
                                            <Clock className="h-8 w-8 text-teal-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Temporal Window</p>
                                            <p className="text-2xl font-black text-gray-900 leading-tight">{appointment.date}</p>
                                            <p className="text-sm text-gray-500 font-bold mt-2 uppercase tracking-tighter">Est. Time: {appointment.time}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-12 pt-10 border-t border-gray-50 flex items-center justify-between">
                                    <p className="text-xs text-gray-400 font-bold italic">Please arrive 15 minutes early for biometrics.</p>
                                    <div className="flex gap-4">
                                        <Button variant="ghost" className="h-12 px-6 text-gray-400 font-black rounded-2xl hover:bg-gray-50 transition-all">Reschedule</Button>
                                        <Button className="h-12 px-8 rounded-2xl shadow-xl font-black">Secure Check-in</Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="bg-white/50 rounded-[48px] border-2 border-dashed border-gray-100 p-24 text-center">
                            <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                <Calendar className="h-10 w-10 text-gray-200" />
                            </div>
                            <h3 className="text-2xl font-black text-gray-900 mb-2">No Active Consultations</h3>
                            <p className="text-gray-400 font-medium max-w-sm mx-auto leading-relaxed">Your recovery path looks clear. Contact administration if you require a specialized check-up.</p>
                        </div>
                    )}

                    <div className="bg-glass rounded-[48px] shadow-premium border border-white p-10 lg:p-12">
                        <div className="flex items-center justify-between mb-10">
                            <h3 className="text-2xl font-black text-gray-900 flex items-center gap-4">
                                <HeartPulse className="h-7 w-7 text-cyan-600" /> Diagnostic History
                            </h3>
                            <button className="text-xs font-black text-cyan-600 uppercase tracking-widest hover:underline transition-all">Full Vault</button>
                        </div>
                        <div className="space-y-6">
                            {[1].map((_, i) => (
                                <Link key={i} href="/patient/diagnostics" className="group block p-6 rounded-[32px] border border-gray-50 hover:border-cyan-100 hover:bg-cyan-50/30 transition-all flex items-center justify-between shadow-sm hover:shadow-md">
                                    <div className="flex items-center gap-6">
                                        <div className="h-14 w-14 bg-white rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
                                            <FileText className="h-6 w-6 text-cyan-600" />
                                        </div>
                                        <div>
                                            <p className="text-lg font-black text-gray-900 group-hover:text-cyan-700 transition-colors">General Health Screening</p>
                                            <p className="text-xs text-gray-400 font-bold uppercase tracking-tight mt-1">Oct 24, 2025 • Lead: Dr. Sarah Jenkins</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm" className="h-10 px-5 rounded-xl text-cyan-600 font-black">View Insight</Button>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-12">
                    <section className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[48px] p-10 text-white shadow-2xl relative overflow-hidden h-[500px] group">
                        <div className="relative z-10 flex flex-col h-full">
                            <h3 className="text-3xl font-black mb-4">Patient Profile</h3>
                            <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-12">Verified Core Identity</span>

                            <div className="space-y-8 flex-1">
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Medical ID</p>
                                    <p className="text-lg font-mono font-bold tracking-tighter text-cyan-50">E-HEALTH-{profile?.uid.substring(0, 12).toUpperCase()}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Primary Condition</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 bg-teal-400 rounded-full animate-pulse" />
                                        <p className="text-xl font-black">Persistent Cough</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Critical Marker</p>
                                    <div className="flex items-center gap-2">
                                        <div className="h-2 w-2 bg-red-500 rounded-full" />
                                        <p className="text-xl font-black">Blood Type A+</p>
                                    </div>
                                </div>
                            </div>

                            <Button className="w-full h-16 bg-white text-gray-900 font-black rounded-2xl shadow-xl hover:bg-cyan-50 transition-all">
                                Edit Health Spec
                            </Button>
                        </div>
                        <Activity className="absolute bottom-[-40px] right-[-40px] h-64 w-64 text-white/[0.03] group-hover:scale-110 transition-transform duration-1000" />
                    </section>

                    <section className="bg-white rounded-[40px] p-10 shadow-premium border border-gray-100/50">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Quick Connectivity</h4>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-600">Sync with Pharmacy</span>
                                <div className="h-6 w-10 bg-cyan-600 rounded-full flex items-center px-1">
                                    <div className="h-4 w-4 bg-white rounded-full translate-x-4" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100">
                                <span className="text-xs font-bold text-gray-600">Cloud Backups</span>
                                <span className="text-[10px] font-black text-teal-600">Active</span>
                            </div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}

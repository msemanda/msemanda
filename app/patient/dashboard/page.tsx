"use client";

import { useEffect, useState } from "react";
import { collection, query, where, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { fmtDate } from "@/lib/ts";
import {
    Calendar,
    Clock,
    User,
    FileText,
    HeartPulse,
    Activity,
    MessageCircle,
    Droplet,
    ShieldCheck,
} from "lucide-react";
import { PatientProfile } from "@/types";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "framer-motion";

interface UpcomingAppointment {
    id: string;
    doctorName: string;
    specialization: string;
    date: string;
    time: string;
    status: string;
}

interface RecentDiagnostic {
    id: string;
    orderedBy?: string;
    predictions?: string;
    createdAt?: any;
}

const STATUS_LABEL: Record<string, string> = {
    CONFIRMED:       "Confirmed",
    SCHEDULED:       "Confirmed",
    PENDING_PAYMENT: "Awaiting Payment",
};

export default function PatientDashboard() {
    const { profile: userProfile } = useAuth();
    const profile = userProfile as PatientProfile;

    const [appointment, setAppointment] = useState<UpcomingAppointment | null>(null);
    const [diagnostic, setDiagnostic] = useState<RecentDiagnostic | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!profile?.uid) return;
        const load = async () => {
            setLoading(true);
            try {
                const today = new Date().toISOString().split("T")[0];
                const [apptSnap, diagSnap] = await Promise.all([
                    getDocs(query(collection(db, "appointments"), where("patientEmail", "==", profile.email))),
                    getDocs(query(collection(db, "diagnostics"), where("patientId", "==", profile.uid), orderBy("createdAt", "desc"), limit(1))),
                ]);

                const upcoming = apptSnap.docs
                    .map(d => ({ id: d.id, ...d.data() } as UpcomingAppointment & { [k: string]: any }))
                    .filter(a => (a.status === "CONFIRMED" || a.status === "SCHEDULED" || a.status === "PENDING_PAYMENT") && a.date >= today)
                    .sort((a, b) => a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date));
                setAppointment(upcoming[0] || null);

                const diagDoc = diagSnap.docs[0];
                setDiagnostic(diagDoc ? { id: diagDoc.id, ...diagDoc.data() } : null);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [profile?.uid, profile?.email]);

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-gray-900">Welcome, <span className="text-cyan-600">{profile?.name?.split(" ")[0]}</span></h1>
                    <p className="text-sm text-gray-500 mt-0.5">Your health dashboard — appointments and records.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/patient/messages">
                        <Button variant="outline" className="h-9 px-4 rounded-xl border-gray-200 bg-white font-bold text-xs flex items-center gap-1.5">
                            <MessageCircle className="h-3.5 w-3.5 text-gray-400" /> Messages
                        </Button>
                    </Link>
                    <Link href="/patient/records">
                        <Button variant="outline" className="h-9 px-4 rounded-xl border-gray-200 bg-white font-bold text-xs flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-gray-400" /> Records
                        </Button>
                    </Link>
                    <Link href="/patient/messages">
                        <Button className="h-9 px-4 rounded-xl font-bold text-xs flex items-center gap-1.5">
                            <Activity className="h-3.5 w-3.5" /> Request Care
                        </Button>
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {loading ? (
                        <div className="bg-white rounded-2xl border border-gray-100 py-14 flex items-center justify-center">
                            <div className="animate-spin h-7 w-7 border-[3px] border-cyan-100 border-t-cyan-600 rounded-full" />
                        </div>
                    ) : appointment ? (
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
                                        <h2 className="text-sm font-black">Upcoming Appointment</h2>
                                        <p className="text-cyan-50/80 text-[10px] font-bold uppercase tracking-widest">{STATUS_LABEL[appointment.status] || appointment.status}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="p-4 sm:p-5">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div className="flex items-start gap-3">
                                        <div className="bg-cyan-50 p-2.5 rounded-xl shrink-0">
                                            <User className="h-4 w-4 text-cyan-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Doctor</p>
                                            <p className="text-sm font-black text-gray-900">{appointment.doctorName}</p>
                                            <p className="text-xs text-cyan-600 font-bold mt-1">{appointment.specialization || "General"}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-3">
                                        <div className="bg-teal-50 p-2.5 rounded-xl shrink-0">
                                            <Clock className="h-4 w-4 text-teal-600" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">When</p>
                                            <p className="text-sm font-black text-gray-900">{appointment.date}</p>
                                            <p className="text-xs text-gray-500 font-bold mt-1">{appointment.time}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between gap-3 flex-wrap">
                                    <p className="text-xs text-gray-400 italic">
                                        {appointment.status === "PENDING_PAYMENT"
                                            ? "Complete your consultation fee payment to confirm this slot."
                                            : "Please arrive 15 minutes early."}
                                    </p>
                                    <Link href="/patient/records">
                                        <Button variant="ghost" className="h-9 px-4 text-cyan-600 font-bold rounded-xl hover:bg-cyan-50 text-xs">View in Records</Button>
                                    </Link>
                                </div>
                            </div>
                        </motion.div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-14 text-center">
                            <Calendar className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                            <p className="text-sm font-black text-gray-900 mb-1">No Upcoming Appointments</p>
                            <p className="text-xs text-gray-400 max-w-xs mx-auto">Contact reception if you need to book a visit.</p>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                <HeartPulse className="h-4 w-4 text-cyan-600" /> Diagnostic History
                            </h3>
                            <Link href="/patient/diagnostics" className="text-xs font-bold text-cyan-600 hover:underline">View all</Link>
                        </div>
                        {diagnostic ? (
                            <Link href="/patient/diagnostics" className="flex items-center justify-between p-3.5 rounded-xl border border-gray-100 hover:border-cyan-100 hover:bg-cyan-50/30 transition-all group">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-9 w-9 bg-white rounded-xl border border-gray-100 flex items-center justify-center shadow-sm shrink-0">
                                        <FileText className="h-4 w-4 text-cyan-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-gray-900 truncate">{diagnostic.predictions || "Diagnostic record"}</p>
                                        <p className="text-xs text-gray-400 font-bold mt-0.5">{fmtDate(diagnostic.createdAt, "—")}{diagnostic.orderedBy ? ` · Dr. ${diagnostic.orderedBy}` : ""}</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm" className="h-8 px-3 rounded-xl text-cyan-600 font-bold text-xs shrink-0">View</Button>
                            </Link>
                        ) : (
                            <p className="text-xs text-gray-400 text-center py-6">No diagnostic records yet.</p>
                        )}
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
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Blood Type</p>
                                    <div className="flex items-center gap-2">
                                        <Droplet className="h-3.5 w-3.5 text-red-400" />
                                        <p className="text-sm font-black">{profile?.bloodGroup || "Not recorded"}</p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-1">Allergies</p>
                                    <div className="flex items-center gap-2">
                                        <ShieldCheck className="h-3.5 w-3.5 text-teal-400" />
                                        <p className="text-sm font-black">{profile?.allergies || "None recorded"}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <Activity className="absolute bottom-[-20px] right-[-20px] h-36 w-36 text-white/[0.03]" />
                    </div>
                </div>
            </div>
        </div>
    );
}

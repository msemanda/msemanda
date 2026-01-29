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
import Link from "next/link";
import {
    Search,
    Pill,
    User,
    FileText,
    ArrowRight,
    ClipboardCheck
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PharmacyProfile } from "@/types";
import { motion } from "framer-motion";

export default function PharmacyDashboard() {
    const { profile: userProfile } = useAuth();
    const profile = userProfile as PharmacyProfile;
    const [diagnostics, setDiagnostics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (profile) {
            fetchPrescriptions();
        }
    }, [profile]);

    const fetchPrescriptions = async () => {
        setLoading(true);
        try {
            // In legacy pharmhome.jsp, it filters diagnostics by phname (pharmacy_id)
            const q = query(
                collection(db, "diagnostics"),
                where("pharmacyId", "==", profile?.uid)
            );
            const querySnapshot = await getDocs(q);
            setDiagnostics(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        } catch (error) {
            console.error("Error fetching prescriptions:", error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = diagnostics.filter(d =>
        d.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto py-16 px-6 sm:px-10 pb-24">
            <div className="flex flex-col xl:flex-row xl:items-end justify-between mb-20 gap-10">
                <div className="space-y-2">
                    <h1 className="text-5xl md:text-6xl font-black text-gray-900 tracking-tight leading-tight">
                        Prescription <br /><span className="text-gradient-cyan">Command Center</span>
                    </h1>
                    <p className="text-xl text-gray-500 font-medium">Monitoring <span className="text-cyan-600 font-black">{profile?.name}</span> • Managed by Chief {profile?.pharmacistName}</p>
                </div>
                <div className="relative w-full max-w-xl group">
                    <div className="absolute inset-0 bg-cyan-500/5 blur-2xl rounded-[32px] group-hover:bg-cyan-500/10 transition-colors" />
                    <div className="relative">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-300 group-hover:text-cyan-500 transition-colors" />
                        <Input
                            placeholder="Identify Patient by Name or Ref ID..."
                            className="h-20 pl-16 pr-8 rounded-[32px] text-lg font-bold shadow-premium border-gray-100 bg-white/80 backdrop-blur-md focus:bg-white transition-all placeholder:text-gray-300"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-12">
                {loading ? (
                    <div className="text-center py-40">
                        <div className="animate-spin h-12 w-12 border-[5px] border-cyan-100 border-t-cyan-600 rounded-full mx-auto mb-8" />
                        <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px]">Synchronizing Network</p>
                    </div>
                ) : filtered.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="p-32 text-center bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[48px]"
                    >
                        <div className="h-24 w-24 bg-white rounded-[32px] flex items-center justify-center mx-auto mb-8 shadow-sm">
                            <Pill className="h-10 w-10 text-gray-200" />
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 mb-2">Prescription Queue Clear</h3>
                        <p className="text-gray-400 font-medium">New medical directives from the physician network will appear here automatically.</p>
                    </motion.div>
                ) : (
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                        {filtered.map((diag, idx) => (
                            <motion.div
                                key={diag.id}
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-glass rounded-[48px] shadow-premium border border-white overflow-hidden group hover:shadow-2xl hover:border-cyan-100 transition-all cursor-default"
                            >
                                <div className="p-10 lg:p-12">
                                    <div className="flex items-center justify-between mb-10">
                                        <div className="flex items-center gap-6">
                                            <div className="h-16 w-16 rounded-[24px] bg-gradient-to-br from-cyan-500 to-teal-500 p-[2px] group-hover:rotate-6 transition-transform">
                                                <div className="h-full w-full bg-white rounded-[22px] flex items-center justify-center text-cyan-700 font-black text-2xl">
                                                    {diag.patientName.charAt(0)}
                                                </div>
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black text-gray-900">{diag.patientName}</h3>
                                                <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mt-1.5 flex items-center gap-2">
                                                    Ref ID: {diag.patientId.substring(0, 12)} <span className="h-1.5 w-1.5 bg-cyan-200 rounded-full" /> Priority Patient
                                                </p>
                                            </div>
                                        </div>
                                        <div className="h-14 w-14 bg-teal-50 rounded-2xl flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                                            <ClipboardCheck className="h-7 w-7 text-teal-600" />
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="bg-gray-50/50 p-8 rounded-[36px] border border-gray-100/80 group-hover:bg-cyan-50/30 transition-all">
                                            <div className="flex items-center justify-between mb-8">
                                                <h4 className="flex items-center text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                                    <Pill className="h-4 w-4 mr-2.5 text-cyan-500" /> Professional Directive
                                                </h4>
                                                <span className="text-[9px] font-black bg-cyan-600 text-white px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg shadow-cyan-600/20">Active</span>
                                            </div>
                                            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                                                <div>
                                                    <p className="text-4xl font-black text-gray-900 leading-none mb-3 tracking-tighter">{diag.medicines}</p>
                                                    <p className="text-lg text-cyan-600 font-black mt-2 bg-white/60 w-fit px-4 py-1 rounded-2xl shadow-sm border border-cyan-50">{diag.dosage} Frequency</p>
                                                </div>
                                                <div className="md:text-right">
                                                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-1.5">Treatment Cycle</p>
                                                    <p className="text-sm font-black text-gray-900 flex items-center gap-2">
                                                        {diag.fromDate} <ArrowRight className="h-3 w-3 text-cyan-500" /> {diag.toDate}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="flex items-start bg-white/40 p-5 rounded-2xl border border-white group-hover:border-cyan-50 transition-all">
                                                <FileText className="h-5 w-5 mr-4 text-gray-400 mt-0.5" />
                                                <p className="text-sm text-gray-700 font-bold italic leading-relaxed">"{diag.usageDirections}"</p>
                                            </div>
                                            <div className="flex gap-3">
                                                <Link href={`/pharmacy/diagnostics/${diag.id}`} className="flex-1">
                                                    <Button variant="outline" className="w-full h-18 text-sm font-black rounded-3xl border-gray-100 hover:bg-white/50 hover:border-cyan-200 transition-all uppercase tracking-widest">
                                                        Inspect Details
                                                    </Button>
                                                </Link>
                                                <Button className="flex-1 h-18 text-sm font-black rounded-3xl shadow-premium group-hover:bg-cyan-700 transition-all flex items-center justify-center gap-3 group/btn">
                                                    Finalize <ArrowRight className="h-4 w-4 group-hover/btn:translate-x-1 transition-transform" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

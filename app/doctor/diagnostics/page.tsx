"use client";

import React, { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    getDocs
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fmtDate } from "@/lib/ts";
import { useAuth } from "@/context/AuthContext";
import {
    FileText,
    ArrowLeft,
    Pill,
    Activity,
    Search,
    Calendar,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function DoctorDiagnosticsPage() {
    const { profile } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        if (profile) {
            fetchDiagnostics();
        }
    }, [profile]);

    const fetchDiagnostics = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "diagnostics"),
                where("doctorId", "==", profile?.uid)
            );
            const querySnapshot = await getDocs(q);
            setReports(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        } catch (error) {
            console.error("Error fetching doctor diagnostics:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredReports = reports.filter(report =>
        report.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        report.id.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto py-12 px-6">
            <div className="flex items-center gap-4 mb-10">
                <Link href="/doctor/dashboard">
                    <Button variant="ghost" size="sm" className="h-10 w-10 text-gray-400 p-0 rounded-xl hover:bg-white hover:border-gray-100 hover:text-cyan-600 transition-all">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Diagnostic History</h1>
                    <p className="text-gray-500 font-medium">Your historical clinical assessments and reports.</p>
                </div>
            </div>

            <div className="bg-glass rounded-[40px] shadow-premium p-10 border border-white/60 mb-10">
                <div className="flex flex-col md:flex-row gap-6 md:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search by Patient Name or Reference ID..."
                            className="w-full pl-12 pr-6 h-14 rounded-2xl bg-white border border-gray-100 outline-none focus:border-cyan-200 focus:ring-4 focus:ring-cyan-50 transition-all font-medium text-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="px-6 py-3 bg-cyan-50 rounded-2xl border border-cyan-100 text-cyan-700 text-xs font-black uppercase tracking-widest">
                            {reports.length} Total Records
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                {loading ? (
                    <div className="p-32 text-center bg-glass rounded-[40px] border border-white/60 shadow-premium">
                        <div className="animate-spin h-10 w-10 border-4 border-cyan-100 border-t-cyan-600 rounded-full mx-auto mb-6" />
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Loading records…</p>
                    </div>
                ) : filteredReports.length === 0 ? (
                    <div className="p-32 text-center bg-glass rounded-[40px] border border-white/60 shadow-premium">
                        <div className="h-24 w-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <FileText className="h-10 w-10 text-gray-200" />
                        </div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2">No Records Found</h2>
                        <p className="text-gray-500 font-medium">Your historical diagnostic records will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {filteredReports.map((report, idx) => (
                            <motion.div
                                key={report.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: idx * 0.05 }}
                                className="bg-white rounded-[32px] shadow-premium border border-gray-100 overflow-hidden group hover:border-cyan-200 transition-all"
                            >
                                <div className="p-10">
                                    <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                                        <div className="flex items-center gap-6">
                                            <div className="h-14 w-14 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-600/20 group-hover:rotate-6 transition-transform">
                                                <Activity className="h-7 w-7 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-xl font-black text-gray-900 mb-1">{report.patientName}</h3>
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Patient ID: {report.patientId.substring(0, 10)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-10">
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Date</p>
                                                <div className="flex items-center text-sm font-black text-gray-900">
                                                    <Calendar className="h-4 w-4 mr-2 text-cyan-600" />
                                                    {fmtDate(report.createdAt, 'N/A')}
                                                </div>
                                            </div>
                                            <div className="h-10 w-px bg-gray-100" />
                                            <div className="text-right">
                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ref ID</p>
                                                <p className="text-sm font-black text-cyan-600 font-mono">#{report.id.substring(0, 8).toUpperCase()}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-8">
                                        <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 group-hover:bg-white transition-all">
                                            <p className="text-[10px] font-black text-cyan-600 uppercase tracking-widest mb-3">Diagnosis</p>
                                            <p className="text-sm text-gray-700 font-medium leading-relaxed italic line-clamp-3">"{report.predictions}"</p>
                                        </div>
                                        <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 group-hover:bg-white transition-all">
                                            <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-3">Medication</p>
                                            <div className="flex items-start gap-4">
                                                <Pill className="h-5 w-5 text-gray-400 shrink-0" />
                                                <div>
                                                    <p className="text-sm font-black text-gray-900">{report.medicines}</p>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-gray-50/50 p-6 rounded-3xl border border-gray-100 group-hover:bg-white transition-all">
                                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-3">Pharmacy</p>
                                            <p className="text-sm font-black text-gray-900 truncate">{report.pharmacyName || "Internal System"}</p>
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

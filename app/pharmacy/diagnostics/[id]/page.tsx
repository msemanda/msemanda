"use client";

import React, { useEffect, useState } from "react";
import {
    doc, getDoc, getDocs, collection, query,
    where, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
    Pill,
    User,
    FileText,
    ArrowLeft,
    CheckCircle2,
    Activity,
    Calendar,
    Stethoscope
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { motion } from "framer-motion";
import { useParams, useRouter } from "next/navigation";

export default function PharmacyDiagnosticDetail() {
    const { id } = useParams();
    const router = useRouter();
    const { profile } = useAuth();
    const [diagnostic, setDiagnostic] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [fulfilling, setFulfilling] = useState(false);
    const [fulfilled, setFulfilled] = useState(false);

    useEffect(() => {
        if (id) {
            fetchDiagnostic();
        }
    }, [id]);

    const fetchDiagnostic = async () => {
        setLoading(true);
        try {
            const docRef = doc(db, "diagnostics", id as string);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setDiagnostic({ ...docSnap.data(), id: docSnap.id });
            } else {
                console.error("No such diagnostic!");
                router.push("/pharmacy/dashboard");
            }
        } catch (error) {
            console.error("Error fetching diagnostic detail:", error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <div className="text-center">
                    <div className="animate-spin h-12 w-12 border-[5px] border-cyan-100 border-t-cyan-600 rounded-full mx-auto mb-8" />
                    <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px]">Loading prescription…</p>
                </div>
            </div>
        );
    }

    const handleFulfill = async () => {
        if (!diagnostic || fulfilling || fulfilled) return;
        setFulfilling(true);
        try {
            // Find the associated cpoeOrder by diagnosticRef
            const snap = await getDocs(query(
                collection(db, "cpoeOrders"),
                where("diagnosticRef", "==", diagnostic.id),
            ));
            const orderDoc = snap.docs && snap.docs.length > 0 ? snap.docs[0] : null;
            if (orderDoc) {
                await updateDoc(doc(db, "cpoeOrders", orderDoc.id), {
                    status: "DISPENSED",
                    dispensedBy: profile?.name,
                    dispensedAt: serverTimestamp(),
                });
            }
            setFulfilled(true);
            setTimeout(() => router.push("/pharmacy/dashboard"), 1500);
        } catch (e) { console.error(e); }
        finally { setFulfilling(false); }
    };

    if (!diagnostic) return null;

    return (
        <div className="max-w-5xl mx-auto py-12 px-6">
            <Link href="/pharmacy/dashboard" className="inline-flex items-center text-gray-400 hover:text-cyan-600 mb-10 group transition-colors">
                <Button variant="ghost" size="sm" className="h-10 w-10 p-0 rounded-xl mr-4 hover:bg-white border hover:border-cyan-100 transition-all">
                    <ArrowLeft className="h-5 w-5" />
                </Button>
                <span className="text-sm font-black uppercase tracking-widest">Back to Dashboard</span>
            </Link>

            <div className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                    <div className="flex items-center gap-8">
                        <div className="h-20 w-20 rounded-[32px] bg-gradient-to-br from-cyan-600 to-teal-600 p-[2px] shadow-lg shadow-cyan-600/20">
                            <div className="h-full w-full bg-white rounded-[30px] flex items-center justify-center">
                                <Stethoscope className="h-10 w-10 text-cyan-600" />
                            </div>
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-gray-900 tracking-tight">Prescription Details</h1>
                            <p className="text-gray-500 font-medium">Reference: <span className="text-cyan-600 font-black">#{diagnostic.id.substring(0, 12).toUpperCase()}</span></p>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <section className="md:col-span-2 space-y-8">
                        <div className="bg-glass rounded-[40px] p-10 shadow-premium border border-white">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10 flex items-center">
                                <User className="h-4 w-4 mr-3 text-cyan-500" /> Patient
                            </h3>
                            <div className="flex flex-col sm:flex-row gap-10">
                                <div className="h-24 w-24 rounded-[32px] bg-gray-50 flex items-center justify-center text-4xl font-black text-cyan-700 border border-gray-100">
                                    {diagnostic.patientName.charAt(0)}
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <p className="text-3xl font-black text-gray-900 leading-none mb-2">{diagnostic.patientName}</p>
                                        <p className="text-sm font-bold text-gray-400">Patient ID: {diagnostic.patientId}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-glass rounded-[40px] p-10 shadow-premium border border-white">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10 flex items-center">
                                <Activity className="h-4 w-4 mr-3 text-cyan-500" /> Diagnosis
                            </h3>
                            <div className="space-y-8">
                                <div className="p-8 bg-gray-50/50 rounded-3xl border border-gray-100 flex items-start gap-6 leading-relaxed italic text-gray-700 font-bold">
                                    <FileText className="h-6 w-6 text-gray-300 shrink-0" />
                                    "{diagnostic.predictions}"
                                </div>
                            </div>
                        </div>
                    </section>

                    <section className="space-y-8">
                        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[40px] p-10 shadow-2xl text-white">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10 flex items-center">
                                <Calendar className="h-4 w-4 mr-3 text-cyan-500" /> Schedule
                            </h3>
                            <div className="space-y-10">
                                <div>
                                    <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4">Start Date</p>
                                    <p className="text-2xl font-black text-cyan-400">{diagnostic.fromDate}</p>
                                </div>
                                <div className="h-px bg-white/5 w-full" />
                                <div>
                                    <p className="text-[11px] font-black text-gray-500 uppercase tracking-widest mb-4">End Date</p>
                                    <p className="text-2xl font-black text-orange-400">{diagnostic.toDate}</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-glass rounded-[40px] p-10 shadow-premium border border-white">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mb-10 flex items-center">
                                <Pill className="h-4 w-4 mr-3 text-cyan-500" /> Medication
                            </h3>
                            <div className="space-y-6">
                                <div>
                                    <p className="text-3xl font-black text-gray-900 mb-2 truncate">{diagnostic.medicines}</p>
                                </div>
                                <div className="p-4 bg-cyan-50 rounded-2xl border border-cyan-100">
                                    <p className="text-[9px] font-black text-cyan-600 uppercase tracking-[0.2em] mb-1">Dosage</p>
                                    <p className="text-sm font-black text-cyan-900 italic">"{diagnostic.dosage}"</p>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <div className="flex gap-6">
                    <Button
                        onClick={handleFulfill}
                        disabled={fulfilling || fulfilled}
                        className="flex-1 h-20 text-xl font-black rounded-[32px] shadow-premium bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 transition-all flex items-center justify-center gap-4">
                        {fulfilled
                            ? <><CheckCircle2 className="h-6 w-6" /> Fulfilled — Redirecting…</>
                            : fulfilling
                                ? <><span className="animate-spin h-6 w-6 border-[3px] border-white/30 border-t-white rounded-full inline-block" /> Processing…</>
                                : <><CheckCircle2 className="h-6 w-6" /> Confirm Fulfillment</>
                        }
                    </Button>
                </div>
            </div>
        </div>
    );
}

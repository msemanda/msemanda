"use client";

import React, { useEffect, useState } from "react";
import {
    doc,
    getDoc,
    collection,
    getDocs,
    setDoc,
    addDoc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    ArrowLeft,
    Stethoscope,
    Pill,
    Calendar,
    FileText,
    User,
    ArrowRight
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function DiagnosisEntryPage() {
    const { id } = useParams();
    const router = useRouter();
    const { profile } = useAuth();
    const [patient, setPatient] = useState<any>(null);
    const [pharmacies, setPharmacies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        predictions: "",
        medicines: "",
        dosage: "",
        fromDate: "",
        toDate: "",
        usageDirections: "",
        pharmacyId: "",
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, [id]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const patientDoc = await getDoc(doc(db, "users", id as string));
            if (patientDoc.exists()) {
                setPatient(patientDoc.data());
            }

            const pharmaciesSnapshot = await getDocs(collection(db, "users"));
            setPharmacies(pharmaciesSnapshot.docs
                .map(doc => ({ ...doc.data(), uid: doc.id }))
                .filter((u: any) => u.role === "PHARMACY"));
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        try {
            const diagId = `DIAG-${Date.now()}`;

            // Save clinical notes to diagnostics collection (EMR record)
            await setDoc(doc(db, "diagnostics", diagId), {
                ...formData,
                patientId: id,
                patientName: patient?.name,
                patientEmail: patient?.email || "",
                orderedBy: profile?.name,
                orderedByUid: profile?.uid,
                createdAt: serverTimestamp(),
            });

            // Send medication order directly to pharmacy queue. No bill is
            // created here — the pharmacist bills the patient at dispense
            // time using the real stock price, once the actual quantity
            // dispensed is known.
            if (formData.medicines) {
                await addDoc(collection(db, "cpoeOrders"), {
                    orderType: "MEDICATION",
                    detail: `${formData.medicines}${formData.dosage ? ` — ${formData.dosage}` : ""}`,
                    patientId: id,
                    patientName: patient?.name,
                    patientEmail: patient?.email || "",
                    notes: formData.usageDirections,
                    fromDate: formData.fromDate,
                    toDate: formData.toDate,
                    diagnosticRef: diagId,
                    orderedBy: profile?.name,
                    orderedByUid: profile?.uid,
                    priority: "ROUTINE",
                    status: "PENDING",
                    amount: 0,
                    ward: "OPD",
                    createdAt: serverTimestamp(),
                });
            }

            router.push("/doctor/dashboard");
        } catch (error) {
            console.error("Error saving diagnosis:", error);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center p-20">
                <div className="animate-spin h-10 w-10 border-4 border-cyan-100 border-t-cyan-600 rounded-full" />
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto py-12 px-6 pb-32">
            <Link href="/doctor/dashboard" className="group inline-flex items-center text-gray-400 hover:text-cyan-600 mb-12 transition-colors font-black uppercase tracking-widest text-[10px]">
                <ArrowLeft className="mr-3 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Dashboard
            </Link>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-glass rounded-[48px] shadow-premium border border-white overflow-hidden"
            >
                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-12 text-white relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-175 transition-transform duration-1000">
                        <Stethoscope className="h-48 w-48" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                        <div className="h-24 w-24 rounded-[32px] bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center text-white text-4xl font-black shadow-xl shrink-0 group-hover:rotate-6 transition-transform">
                            {patient?.name.charAt(0)}
                        </div>
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl font-black tracking-tight mb-2">Patient <span className="text-cyan-400">Diagnosis</span></h1>
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <p className="text-gray-400 font-bold flex items-center bg-white/5 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/10 uppercase tracking-tighter text-xs">
                                    <User className="h-4 w-4 mr-2 text-cyan-400" /> Patient: {patient?.name}
                                </p>
                                <p className="text-gray-400 font-bold flex items-center bg-white/5 px-4 py-2 rounded-2xl backdrop-blur-sm border border-white/10 uppercase tracking-tighter text-xs">
                                    <FileText className="h-4 w-4 mr-2 text-teal-400" /> Patient ID: {(id as string).substring(0, 12).toUpperCase()}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-12 space-y-12 bg-white/40">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
                        <div className="space-y-10">
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-4">
                                    <FileText className="h-6 w-6 text-cyan-500" /> Diagnosis
                                </h3>
                                <p className="text-sm text-gray-400 font-medium">Document your findings and predictive outcomes.</p>
                            </div>

                            <div className="space-y-8">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Medical Predictions</label>
                                    <textarea
                                        className="w-full h-48 rounded-[32px] border border-gray-100 bg-white px-8 py-6 text-sm font-medium transition-all placeholder:text-gray-300 focus:bg-white focus:border-cyan-200 focus:ring-8 focus:ring-cyan-500/5 shadow-sm outline-none resize-none"
                                        required
                                        placeholder="Analyze patient symptoms and primary condition..."
                                        value={formData.predictions}
                                        onChange={(e) => setFormData({ ...formData, predictions: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Usage Directions</label>
                                    <textarea
                                        className="w-full h-32 rounded-[32px] border border-gray-100 bg-white px-8 py-6 text-sm font-medium transition-all placeholder:text-gray-300 focus:bg-white focus:border-cyan-200 focus:ring-8 focus:ring-cyan-500/5 shadow-sm outline-none resize-none"
                                        required
                                        placeholder="Usage directions and patient care instructions..."
                                        value={formData.usageDirections}
                                        onChange={(e) => setFormData({ ...formData, usageDirections: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-10">
                            <div className="space-y-2">
                                <h3 className="text-xl font-black text-gray-900 flex items-center gap-4">
                                    <Pill className="h-6 w-6 text-teal-600" /> Prescription
                                </h3>
                                <p className="text-sm text-gray-400 font-medium">Prescribe medication and specify dosage.</p>
                            </div>

                            <div className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Medicines</label>
                                        <Input
                                            className="h-16 rounded-2xl border-gray-100 bg-white px-6 font-bold"
                                            required
                                            placeholder="e.g. Amoxicillin"
                                            value={formData.medicines}
                                            onChange={(e) => setFormData({ ...formData, medicines: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Dosage</label>
                                        <Input
                                            className="h-16 rounded-2xl border-gray-100 bg-white px-6 font-bold"
                                            required
                                            placeholder="e.g. 500mg BID"
                                            value={formData.dosage}
                                            onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Start Date</label>
                                        <Input
                                            className="h-16 rounded-2xl border-gray-100 bg-white px-6 font-bold appearance-none"
                                            type="date"
                                            required
                                            value={formData.fromDate}
                                            onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">End Date</label>
                                        <Input
                                            className="h-16 rounded-2xl border-gray-100 bg-white px-6 font-bold"
                                            type="date"
                                            required
                                            value={formData.toDate}
                                            onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Pharmacy</label>
                                    <select
                                        className="w-full h-16 rounded-2xl border border-gray-100 bg-white px-6 text-sm font-bold transition-all focus:border-cyan-200 focus:ring-8 focus:ring-cyan-500/5 outline-none shadow-sm"
                                        value={formData.pharmacyId}
                                        onChange={(e) => setFormData({ ...formData, pharmacyId: e.target.value })}
                                    >
                                        <option value="">Any pharmacy (central queue)</option>
                                        {pharmacies.map(ph => (
                                            <option key={ph.uid} value={ph.uid}>{ph.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-12 border-t border-gray-100 flex flex-col md:flex-row justify-between items-center gap-8">
                        <div className="flex items-center gap-4 bg-gray-50/50 px-6 py-3 rounded-2xl border border-gray-100">
                            <Calendar className="h-5 w-5 text-gray-400" />
                            <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Date: <span className="text-cyan-600 ml-1">{new Date().toLocaleDateString()}</span></p>
                        </div>
                        <Button type="submit" className="h-20 px-16 text-xl font-black rounded-[28px] shadow-heavy group/btn w-full md:w-auto" disabled={processing}>
                            {processing ? "Saving…" : "Save Diagnosis"}
                            <ArrowRight className="ml-4 h-6 w-6 group-hover/btn:translate-x-2 transition-transform" />
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

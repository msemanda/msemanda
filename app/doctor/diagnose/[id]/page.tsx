"use client";

import React, { useEffect, useState } from "react";
import {
    doc,
    getDoc,
    collection,
    getDocs,
    setDoc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
    ArrowLeft,
    Stethoscope,
    Pill,
    Calendar,
    FileText,
    User
} from "lucide-react";
import Link from "next/link";

export default function DiagnosisEntryPage() {
    const { id } = useParams();
    const router = useRouter();
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

            const pharmaciesSnapshot = await getDocs(collection(db, "users")); // Simple mock, in reality we'd filter by role
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
            await setDoc(doc(db, "diagnostics", diagId), {
                ...formData,
                patientId: id,
                patientName: patient?.name,
                createdAt: serverTimestamp(),
            });
            alert("Diagnostic Consultation Recorded Successfully");
            router.push("/doctor/dashboard");
        } catch (error) {
            console.error("Error saving diagnosis:", error);
        } finally {
            setProcessing(false);
        }
    };

    if (loading) return <div className="p-20 text-center italic text-gray-400">Loading consultation record...</div>;

    return (
        <div className="max-w-5xl mx-auto py-12 px-4">
            <Link href="/doctor/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 font-medium">
                <ArrowLeft className="mr-2 h-4 w-4" /> Return to Queue
            </Link>

            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-10 text-white relative">
                    <Stethoscope className="absolute right-10 top-1/2 -translate-y-1/2 h-24 w-24 opacity-10" />
                    <div className="flex items-center space-x-6">
                        <div className="h-20 w-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/30 text-3xl font-bold">
                            {patient?.name.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold font-premium">Medical Consultation</h1>
                            <p className="text-blue-100 flex items-center mt-1">
                                <User className="h-4 w-4 mr-2" /> Patient: {patient?.name} • ID: {(id as string).substring(0, 8)}
                            </p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-10">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        <div className="space-y-6">
                            <h3 className="text-lg font-bold flex items-center border-b pb-2 text-gray-800">
                                <FileText className="mr-2 h-5 w-5 text-blue-600" /> Clinical Findings
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Medical Predictions</label>
                                    <textarea
                                        className="w-full rounded-2xl border-gray-100 bg-gray-50 p-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                        rows={4}
                                        required
                                        placeholder="Enter observations and likely conditions..."
                                        value={formData.predictions}
                                        onChange={(e) => setFormData({ ...formData, predictions: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Usage Directions</label>
                                    <textarea
                                        className="w-full rounded-2xl border-gray-100 bg-gray-50 p-4 text-sm focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                                        rows={3}
                                        required
                                        placeholder="Specific instructions for the patient..."
                                        value={formData.usageDirections}
                                        onChange={(e) => setFormData({ ...formData, usageDirections: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-lg font-bold flex items-center border-b pb-2 text-gray-800">
                                <Pill className="mr-2 h-5 w-5 text-indigo-600" /> Medication Control
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Prescribed Medicines</label>
                                    <Input
                                        required
                                        placeholder="e.g. Amoxicillin, Paracetamol"
                                        value={formData.medicines}
                                        onChange={(e) => setFormData({ ...formData, medicines: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Dosage Amount</label>
                                    <Input
                                        required
                                        placeholder="e.g. 500mg, 2 tablets"
                                        value={formData.dosage}
                                        onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest text-[10px]">Start Date</label>
                                        <Input
                                            type="date"
                                            required
                                            value={formData.fromDate}
                                            onChange={(e) => setFormData({ ...formData, fromDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest text-[10px]">End Date</label>
                                        <Input
                                            type="date"
                                            required
                                            value={formData.toDate}
                                            onChange={(e) => setFormData({ ...formData, toDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Assign Pharmacy</label>
                                    <select
                                        className="w-full rounded-2xl border-gray-100 bg-gray-50 p-3 text-sm focus:ring-2 focus:ring-blue-500"
                                        required
                                        value={formData.pharmacyId}
                                        onChange={(e) => setFormData({ ...formData, pharmacyId: e.target.value })}
                                    >
                                        <option value="">Select Pharmacy Location</option>
                                        {pharmacies.map(ph => (
                                            <option key={ph.uid} value={ph.uid}>{ph.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="pt-10 border-t flex justify-between items-center">
                        <div className="flex items-center text-sm text-gray-500">
                            <Calendar className="mr-2 h-4 w-4" /> Consultation Date: {new Date().toLocaleDateString()}
                        </div>
                        <Button type="submit" className="px-12 py-6 text-lg rounded-2xl shadow-lg" disabled={processing}>
                            {processing ? "Saving Consultation..." : "Finalize Diagnostic Report"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}

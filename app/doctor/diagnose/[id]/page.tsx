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
import { notify, resolvePatientUid } from "@/lib/notify";
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
    ArrowRight,
    Search,
    X,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

interface DrugStock {
    id: string;
    drugName: string;
    genericName?: string;
    category: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    reorderLevel: number;
}

export default function DiagnosisEntryPage() {
    const { id } = useParams();
    const router = useRouter();
    const { profile } = useAuth();
    const [patient, setPatient] = useState<any>(null);
    const [pharmacies, setPharmacies] = useState<any[]>([]);
    const [drugs, setDrugs] = useState<DrugStock[]>([]);
    const [selectedDrug, setSelectedDrug] = useState<DrugStock | null>(null);
    const [drugSearch, setDrugSearch] = useState("");
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({
        predictions: "",
        dosage: "",
        quantity: "1",
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

            const [usersSnapshot, stockSnapshot] = await Promise.all([
                getDocs(collection(db, "users")),
                getDocs(collection(db, "pharmacyStock")),
            ]);
            setPharmacies(usersSnapshot.docs
                .map(doc => ({ ...doc.data(), uid: doc.id }))
                .filter((u: any) => u.role === "PHARMACY"));
            setDrugs(stockSnapshot.docs.map(d => ({ id: d.id, ...d.data() } as DrugStock)));
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const filteredDrugs = drugs.filter(d =>
        d.drugName.toLowerCase().includes(drugSearch.toLowerCase()) ||
        (d.genericName || "").toLowerCase().includes(drugSearch.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDrug) return;
        setProcessing(true);
        try {
            const diagId = `DIAG-${Date.now()}`;
            const quantity = parseInt(formData.quantity) || 1;
            const unitPrice = selectedDrug.unitPrice ?? 0;
            const amount = unitPrice * quantity;
            const detail = `${selectedDrug.drugName}${formData.dosage ? ` — ${formData.dosage}` : ""}`;

            // Save clinical notes to diagnostics collection (EMR record)
            await setDoc(doc(db, "diagnostics", diagId), {
                predictions: formData.predictions,
                medicines: selectedDrug.drugName,
                dosage: formData.dosage,
                quantity,
                fromDate: formData.fromDate,
                toDate: formData.toDate,
                usageDirections: formData.usageDirections,
                pharmacyId: formData.pharmacyId,
                patientId: id,
                patientName: patient?.name,
                patientEmail: patient?.email || "",
                orderedBy: profile?.name,
                orderedByUid: profile?.uid,
                createdAt: serverTimestamp(),
            });

            // The drug (and its real stock price) is picked here at
            // prescribing time, so the order carries a real amount and goes
            // through the same payment gate as every other department —
            // the pharmacist can no longer dispense before Finance clears it.
            const orderRef = await addDoc(collection(db, "cpoeOrders"), {
                orderType: "MEDICATION",
                detail,
                drugId: selectedDrug.id,
                quantity,
                unit: selectedDrug.unit,
                unitPrice,
                amount,
                paymentStatus: amount > 0 ? "UNPAID" : "PAID",
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
                ward: "OPD",
                createdAt: serverTimestamp(),
            });

            if (amount > 0) {
                await addDoc(collection(db, "patientBills"), {
                    patientName: patient?.name,
                    patientEmail: patient?.email || "",
                    description: detail,
                    billType: "MEDICATION",
                    amount,
                    orderId: orderRef.id,
                    orderedBy: profile?.name,
                    status: "PENDING_PAYMENT",
                    ward: "OPD",
                    createdAt: serverTimestamp(),
                });

                const patientUid = await resolvePatientUid(id as string, patient?.email);
                if (patientUid) {
                    await notify({
                        targetUid: patientUid,
                        type: "billing",
                        title: "New pharmacy bill",
                        body: `${detail} — UGX ${amount.toLocaleString()} awaiting payment confirmation.`,
                        link: "/patient/records",
                    });
                }
                await notify({
                    targetRole: "CASHIER",
                    type: "billing",
                    title: `New bill — ${patient?.name}`,
                    body: `${detail} — UGX ${amount.toLocaleString()}`,
                    link: "/cashier/bills",
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
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Medicine</label>
                                    {selectedDrug ? (
                                        <div className="flex items-center justify-between h-16 px-6 rounded-2xl border border-cyan-100 bg-cyan-50">
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-gray-900 truncate">{selectedDrug.drugName}</p>
                                                <p className="text-[11px] text-cyan-600 font-semibold">
                                                    {selectedDrug.quantity} {selectedDrug.unit} in stock · UGX {selectedDrug.unitPrice?.toLocaleString()} each
                                                </p>
                                            </div>
                                            <button type="button" onClick={() => { setSelectedDrug(null); setDrugSearch(""); }}
                                                className="h-8 w-8 rounded-xl bg-white border border-cyan-200 flex items-center justify-center text-cyan-700 hover:bg-cyan-100 transition-colors shrink-0">
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                value={drugSearch}
                                                onChange={(e) => setDrugSearch(e.target.value)}
                                                placeholder="Search pharmacy stock by drug name..."
                                                className="w-full h-16 pl-12 pr-6 rounded-2xl border border-gray-100 bg-white text-sm font-bold transition-all focus:border-cyan-200 focus:ring-8 focus:ring-cyan-500/5 outline-none shadow-sm"
                                            />
                                            {drugSearch && (
                                                <div className="absolute z-20 top-full mt-1 left-0 right-0 max-h-56 overflow-y-auto bg-white border border-gray-100 rounded-2xl shadow-lg p-1">
                                                    {filteredDrugs.length === 0 ? (
                                                        <p className="text-xs text-gray-400 text-center py-4">No matching drugs in stock</p>
                                                    ) : filteredDrugs.map(d => (
                                                        <button key={d.id} type="button" onClick={() => { setSelectedDrug(d); setDrugSearch(""); }}
                                                            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl hover:bg-cyan-50 text-left transition-colors">
                                                            <div className="min-w-0">
                                                                <p className="text-xs font-bold text-gray-900 truncate">{d.drugName}</p>
                                                                <p className="text-[10px] text-gray-400 truncate">{d.genericName || d.category}</p>
                                                            </div>
                                                            <span className={`text-[10px] font-bold shrink-0 ml-3 ${d.quantity === 0 ? "text-red-500" : d.quantity <= d.reorderLevel ? "text-amber-500" : "text-green-600"}`}>
                                                                {d.quantity} {d.unit} · UGX {d.unitPrice?.toLocaleString()}
                                                            </span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {!loading && drugs.length === 0 && (
                                        <p className="text-[11px] text-amber-600 font-semibold ml-2">No drugs found in pharmacy stock — ask Pharmacy to add inventory first.</p>
                                    )}
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">
                                            Quantity {selectedDrug && <span className="text-cyan-500 normal-case font-semibold">(UGX {(( parseInt(formData.quantity) || 0) * (selectedDrug.unitPrice ?? 0)).toLocaleString()} total)</span>}
                                        </label>
                                        <Input
                                            className="h-16 rounded-2xl border-gray-100 bg-white px-6 font-bold"
                                            type="number"
                                            min="1"
                                            max={selectedDrug?.quantity}
                                            required
                                            value={formData.quantity}
                                            onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
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
                        <Button type="submit" className="h-20 px-16 text-xl font-black rounded-[28px] shadow-heavy group/btn w-full md:w-auto" disabled={processing || !selectedDrug}>
                            {processing ? "Saving…" : "Save Diagnosis"}
                            <ArrowRight className="ml-4 h-6 w-6 group-hover/btn:translate-x-2 transition-transform" />
                        </Button>
                    </div>
                </form>
            </motion.div>
        </div>
    );
}

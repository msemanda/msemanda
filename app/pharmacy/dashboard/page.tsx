"use client";

import React, { useEffect, useState } from "react";
import {
    collection, query, where, getDocs,
    doc, updateDoc, serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
    Search, Pill, FileText, ArrowRight,
    ClipboardCheck, Loader2, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { PharmacyProfile } from "@/types";
import { motion } from "framer-motion";
import { SkeletonRow } from "@/components/ui/Skeleton";

export default function PharmacyDashboard() {
    const { profile: userProfile } = useAuth();
    const profile = userProfile as PharmacyProfile;
    const [diagnostics, setDiagnostics] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [finalizing, setFinalizing] = useState<string | null>(null);
    const [finalized, setFinalized] = useState<Set<string>>(new Set());

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

    const handleFinalize = async (diag: any) => {
        if (finalizing === diag.id || finalized.has(diag.id)) return;
        setFinalizing(diag.id);
        try {
            // Mark the diagnostic itself as dispensed
            await updateDoc(doc(db, "diagnostics", diag.id), {
                status: "DISPENSED",
                dispensedBy: profile?.name,
                dispensedAt: serverTimestamp(),
            });

            // Also mark the linked cpoeOrder if one exists
            const snap = await getDocs(query(
                collection(db, "cpoeOrders"),
                where("diagnosticRef", "==", diag.id),
            ));
            const orderDoc = snap.docs && snap.docs.length > 0 ? snap.docs[0] : null;
            if (orderDoc) {
                await updateDoc(doc(db, "cpoeOrders", orderDoc.id), {
                    status: "DISPENSED",
                    dispensedBy: profile?.name,
                    dispensedAt: serverTimestamp(),
                });
            }

            setFinalized(prev => new Set([...prev, diag.id]));
        } catch (e) {
            console.error("Finalize error:", e);
            alert("Failed to finalize prescription. Please try again.");
        }
        finally { setFinalizing(null); }
    };

    const filtered = diagnostics.filter(d =>
        d.patientName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        d.patientId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-gray-900">Pharmacy Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Prescriptions assigned to {profile?.name}</p>
                </div>
                <div className="relative max-w-sm w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                        placeholder="Search patient or ref ID..."
                        className="h-10 pl-9 pr-4 rounded-xl border-gray-200 text-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {loading ? (
                <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
                    {Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <Pill className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No prescriptions</p>
                    <p className="text-xs text-gray-400">Physician orders will appear here automatically.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {filtered.map((diag, idx) => (
                        <motion.div
                            key={diag.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.07 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 group hover:border-cyan-100 transition-all"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-teal-500 p-[2px] shrink-0">
                                        <div className="h-full w-full bg-white rounded-[10px] flex items-center justify-center text-cyan-700 font-black text-sm">
                                            {diag.patientName.charAt(0)}
                                        </div>
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="text-sm font-black text-gray-900 truncate">{diag.patientName}</h3>
                                        <p className="text-[10px] font-bold text-cyan-600 truncate">Ref: {diag.patientId?.substring(0, 12)}</p>
                                    </div>
                                </div>
                                <div className="h-9 w-9 bg-teal-50 rounded-xl flex items-center justify-center shrink-0">
                                    <ClipboardCheck className="h-4 w-4 text-teal-600" />
                                </div>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 mb-4">
                                <div className="flex items-center justify-between mb-3">
                                    <p className="flex items-center text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                        <Pill className="h-3.5 w-3.5 mr-1.5 text-cyan-500" /> Prescription
                                    </p>
                                    <span className="text-[10px] font-bold bg-cyan-600 text-white px-2 py-0.5 rounded-full">Active</span>
                                </div>
                                <p className="text-lg font-black text-gray-900 mb-1">{diag.medicines}</p>
                                <p className="text-xs text-cyan-600 font-bold">{diag.dosage} — {diag.fromDate} → {diag.toDate}</p>
                            </div>

                            {diag.usageDirections && (
                                <div className="flex items-start gap-2 bg-white p-3 rounded-xl border border-gray-100 mb-4">
                                    <FileText className="h-3.5 w-3.5 text-gray-400 mt-0.5 shrink-0" />
                                    <p className="text-xs text-gray-600 italic line-clamp-2">"{diag.usageDirections}"</p>
                                </div>
                            )}

                            <div className="flex gap-2">
                                <Link href={`/pharmacy/diagnostics/${diag.id}`} className="flex-1">
                                    <Button variant="outline" className="w-full h-9 text-xs font-bold rounded-xl border-gray-200">
                                        Details
                                    </Button>
                                </Link>
                                {finalized.has(diag.id) ? (
                                    <Button disabled className="flex-1 h-9 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 bg-green-600 hover:bg-green-600">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Dispensed
                                    </Button>
                                ) : (
                                    <Button
                                        onClick={() => handleFinalize(diag)}
                                        disabled={finalizing === diag.id}
                                        className="flex-1 h-9 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5">
                                        {finalizing === diag.id
                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                            : <>Finalize <ArrowRight className="h-3 w-3" /></>
                                        }
                                    </Button>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

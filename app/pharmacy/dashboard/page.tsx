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

export default function PharmacyDashboard() {
    const { profile } = useAuth();
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
        <div className="max-w-7xl mx-auto py-12 px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
                <div>
                    <h1 className="text-4xl font-bold font-premium text-gray-900 tracking-tight">Prescription Hub</h1>
                    <p className="mt-2 text-gray-600">Connected as <strong>{profile?.name}</strong> • Lead: {profile?.pharmacistName}</p>
                </div>
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        placeholder="Search by Patient ID or Name..."
                        className="pl-12 h-14 rounded-2xl shadow-sm border-gray-200"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8">
                {loading ? (
                    <div className="text-center py-20 italic text-gray-400">Syncing with physician server...</div>
                ) : filtered.length === 0 ? (
                    <div className="p-20 text-center text-gray-400 border-2 border-dashed rounded-3xl bg-gray-50/50">
                        <Pill className="h-16 w-16 mx-auto mb-4 opacity-10" />
                        <h3 className="text-xl font-bold text-gray-900 mb-2">No Pending Prescriptions</h3>
                        <p>New prescriptions sent to your pharmacy by doctors will appear here.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {filtered.map((diag) => (
                            <div key={diag.id} className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden hover:shadow-2xl transition-all">
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center space-x-4">
                                            <div className="h-12 w-12 rounded-full bg-blue-50 flex items-center justify-center">
                                                <User className="h-6 w-6 text-blue-600" />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg">{diag.patientName}</h3>
                                                <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Patient Ref: {diag.patientId.substring(0, 8)}</p>
                                            </div>
                                        </div>
                                        <div className="p-2 bg-green-50 rounded-lg">
                                            <ClipboardCheck className="h-5 w-5 text-green-600" />
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <div className="bg-gray-50/50 p-6 rounded-2xl border border-gray-100">
                                            <h4 className="flex items-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                                                <Pill className="h-3 w-3 mr-2" /> Medical Directive
                                            </h4>
                                            <div className="flex justify-between items-end">
                                                <div>
                                                    <p className="text-xl font-black text-blue-900 leading-none">{diag.medicines}</p>
                                                    <p className="text-sm text-blue-600 mt-2 font-medium">{diag.dosage} Dosage Plan</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xs text-gray-400 mb-1">Duration</p>
                                                    <p className="text-sm font-bold text-gray-700">{diag.fromDate} → {diag.toDate}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center text-sm text-gray-600 italic px-2">
                                                <FileText className="h-4 w-4 mr-2 text-gray-300" />
                                                "{diag.usageDirections}"
                                            </div>
                                            <Button className="w-full h-14 text-lg rounded-2xl shadow-lg shadow-blue-100">
                                                Process Fulfillment <ArrowRight className="ml-2 h-5 w-5" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

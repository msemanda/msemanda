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
    Download,
    ArrowLeft,
    Pill,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function PatientDiagnosticsPage() {
    const { profile } = useAuth();
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

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
                where("patientId", "==", profile?.uid)
            );
            const querySnapshot = await getDocs(q);
            setReports(querySnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })));
        } catch (error) {
            console.error("Error fetching diagnostics:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto py-12 px-4">
            <Link href="/patient/dashboard" className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-8 font-medium">
                <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
            </Link>

            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-3xl font-bold font-premium text-gray-900 tracking-tight">Diagnostic Reports</h1>
                    <p className="text-gray-500 mt-2">Historical medical records and physician findings.</p>
                </div>
                <Button variant="outline" className="flex items-center border-gray-200">
                    <Download className="mr-2 h-4 w-4" /> Export All (JSON)
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-20 italic text-gray-400">Retrieving diagnostic data...</div>
            ) : reports.length === 0 ? (
                <div className="bg-white rounded-2xl border-2 border-dashed p-16 text-center shadow-sm">
                    <FileText className="h-16 w-16 text-gray-200 mx-auto mb-4" />
                    <h2 className="text-xl font-bold text-gray-900">No Reports Found</h2>
                    <p className="text-gray-500 max-w-md mx-auto mt-2">Diagnostic reports will appear here once your physician completes their evaluation.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {reports.map((report) => (
                        <div key={report.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-8">
                                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                                    <div className="flex items-center">
                                        <div className="bg-blue-600 p-3 rounded-xl mr-4 shadow-lg shadow-blue-200">
                                            <Activity className="h-6 w-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-900">Medical Conclusion</h3>
                                            <p className="text-sm text-gray-400">Ref ID: {report.id.substring(0, 10)}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-gray-900">
                                            {fmtDate(report.createdAt, 'Pending')}
                                        </div>
                                        <div className="text-xs text-blue-600 font-bold uppercase tracking-widest">Digital Healthcare Signature</div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Findings & Predictions</p>
                                        <p className="text-gray-700 bg-gray-50 p-4 rounded-xl border leading-relaxed">{report.predictions}</p>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Prescription Details</p>
                                        <div className="bg-gray-50 p-4 rounded-xl border flex items-start">
                                            <Pill className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                                            <div>
                                                <p className="font-bold text-gray-900">{report.medicines}</p>
                                                <p className="text-sm text-gray-600">{report.dosage} units per application</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <p className="text-xs font-bold text-gray-400 uppercase">Administration Timeline</p>
                                        <div className="bg-gray-50 p-4 rounded-xl border text-sm">
                                            <div className="flex justify-between mb-2">
                                                <span className="text-gray-500">Commencement</span>
                                                <span className="font-medium">{report.fromDate}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-500">Completion</span>
                                                <span className="font-medium">{report.toDate}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t flex flex-col md:flex-row md:items-center justify-between text-sm text-gray-500 gap-4">
                                    <p><strong>Pharmacy Source:</strong> {report.pharmacyId}</p>
                                    <p><strong>Directions:</strong> {report.usageDirections}</p>
                                    <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-700 hover:bg-blue-50">
                                        Detailed View
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

"use client";

import React, { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    doc,
    getDoc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Receipt, CreditCard, User } from "lucide-react";

export default function GenerateBillPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [billData, setBillData] = useState({
        hospitalAmount: "",
        pharmacyAmount: "",
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchValidatedPatients();
    }, []);

    const fetchValidatedPatients = async () => {
        setLoading(true);
        try {
            const q = collection(db, "categories");
            const snapshot = await getDocs(q);
            setPatients(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id })));
        } catch (error) {
            console.error("Error fetching validated patients:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateBill = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) return;

        setProcessing(true);
        try {
            const hospital = parseInt(billData.hospitalAmount || "0");
            const pharmacy = parseInt(billData.pharmacyAmount || "0");
            const total = hospital + pharmacy;
            const concessionAmount = Math.round((selectedPatient.concession * hospital) / 100);
            const net = total - concessionAmount;

            const billId = `BILL-${Date.now()}`;
            await setDoc(doc(db, "bills", billId), {
                billId,
                patientId: selectedPatient.patientId,
                name: selectedPatient.name,
                category: selectedPatient.category,
                hospitalAmount: hospital,
                pharmacyAmount: pharmacy,
                total,
                concession: selectedPatient.concession,
                concessionAmount,
                netAmount: net,
                createdAt: serverTimestamp(),
            });

            alert(`Bill Generated Successfully!\nNet Amount: $${net}`);
            setSelectedPatient(null);
            setBillData({ hospitalAmount: "", pharmacyAmount: "" });
        } catch (error) {
            console.error("Error generating bill:", error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold font-premium">Generate Medical Bill</h1>
                <p className="text-gray-500">Calculate final costs including hospital services and pharmacy charges.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 bg-gray-50 border-b font-semibold">Select Validated Patient</div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {loading ? (
                                <div className="p-10 text-center text-gray-400">Loading...</div>
                            ) : (
                                patients.map((p) => (
                                    <button
                                        key={p.uid}
                                        onClick={() => setSelectedPatient(p)}
                                        className={`w-full text-left p-4 hover:bg-gray-50 transition-colors border-b ${selectedPatient?.uid === p.uid ? "bg-blue-50" : ""
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <div className="font-bold">{p.name}</div>
                                                <div className="text-xs text-gray-500">Cat: {p.category}</div>
                                            </div>
                                            <div className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                                                {p.concession}% Disc
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-8">
                    {selectedPatient ? (
                        <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden divide-y">
                            <div className="p-8 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h2 className="text-3xl font-bold">Medical Invoice</h2>
                                        <p className="text-blue-100 mt-1 italic">Billing Statement for {selectedPatient.name}</p>
                                    </div>
                                    <Receipt className="h-12 w-12 text-blue-200 opacity-50" />
                                </div>
                            </div>

                            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold flex items-center">
                                        <User className="mr-2 h-5 w-5 text-gray-400" /> Patient Details
                                    </h3>
                                    <div className="space-y-4 text-sm">
                                        <div className="flex justify-between pb-2 border-b">
                                            <span className="text-gray-500">Patient ID</span>
                                            <span className="font-medium">{selectedPatient.patientId.substring(0, 12)}</span>
                                        </div>
                                        <div className="flex justify-between pb-2 border-b">
                                            <span className="text-gray-500">Category</span>
                                            <span className="font-medium text-blue-600">{selectedPatient.category}</span>
                                        </div>
                                        <div className="flex justify-between pb-2 border-b">
                                            <span className="text-gray-500">Medical Problem</span>
                                            <span className="font-medium italic">{selectedPatient.problem}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <h3 className="text-lg font-bold flex items-center font-premium">
                                        <CreditCard className="mr-2 h-5 w-5 text-gray-400" /> Charge Details
                                    </h3>
                                    <form onSubmit={handleGenerateBill} className="space-y-4">
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Hospital Charges</label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                required
                                                value={billData.hospitalAmount}
                                                onChange={(e) => setBillData({ ...billData, hospitalAmount: e.target.value })}
                                                className="text-lg font-bold"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-xs font-semibold text-gray-500 uppercase">Pharmacy Charges</label>
                                            <Input
                                                type="number"
                                                placeholder="0.00"
                                                required
                                                value={billData.pharmacyAmount}
                                                onChange={(e) => setBillData({ ...billData, pharmacyAmount: e.target.value })}
                                                className="text-lg font-bold"
                                            />
                                        </div>

                                        <div className="pt-6">
                                            <div className="bg-blue-50 p-4 rounded-lg mb-4 text-sm">
                                                <div className="flex justify-between text-gray-600 mb-1">
                                                    <span>Applied Concession:</span>
                                                    <span className="font-bold">{selectedPatient.concession}%</span>
                                                </div>
                                                <p className="text-[10px] text-blue-400">*Concession applies only to hospital charges.</p>
                                            </div>
                                            <Button type="submit" className="w-full text-lg h-14" disabled={processing}>
                                                {processing ? "Finalizing Bill..." : "Generate Final Bill"}
                                            </Button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <Receipt className="h-16 w-16 text-gray-300 mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">Patient Billing</h3>
                            <p className="text-gray-500 max-w-sm mt-2">Select a validated patient to generate their medical bill and calculate the final net amount.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

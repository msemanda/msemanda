"use client";

import React, { useEffect, useState } from "react";
import {
    collection,
    getDocs,
    query,
    where,
    doc,
    setDoc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Search, ShieldCheck } from "lucide-react";

export default function ValidatePatientPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [validationData, setValidationData] = useState({
        category: "General",
        concession: "0",
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchPatients();
    }, []);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "users"), where("role", "==", "PATIENT"));
            const snapshot = await getDocs(q);
            setPatients(snapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id })));
        } catch (error) {
            console.error("Error fetching patients:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) return;

        setProcessing(true);
        try {
            // Store validation in a 'categories' collection as in legacy logic
            await setDoc(doc(db, "categories", selectedPatient.uid), {
                patientId: selectedPatient.uid,
                name: selectedPatient.name,
                age: selectedPatient.age,
                problem: selectedPatient.problem,
                category: validationData.category,
                concession: parseInt(validationData.concession),
                validatedAt: serverTimestamp(),
            });

            alert("Patient Validated Successfully!");
            setSelectedPatient(null);
        } catch (error) {
            console.error("Error validating patient:", error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold font-premium">Patient Validation</h1>
                <p className="text-gray-500">Categorize patients and apply medical concessions.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 h-[600px] flex flex-col">
                        <div className="p-4 border-b">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input placeholder="Search patients..." className="pl-10" />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-2">
                            {loading ? (
                                <div className="text-center py-10 text-gray-400">Loading...</div>
                            ) : (
                                patients.map((p) => (
                                    <button
                                        key={p.uid}
                                        onClick={() => setSelectedPatient(p)}
                                        className={`w-full text-left p-4 rounded-lg transition-colors ${selectedPatient?.uid === p.uid ? "bg-blue-50 border-blue-100 border" : "hover:bg-gray-50 border border-transparent"
                                            }`}
                                    >
                                        <div className="font-bold">{p.name}</div>
                                        <div className="text-xs text-gray-500">ID: {p.uid.substring(0, 8)}</div>
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-2">
                    {selectedPatient ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                            <div className="bg-blue-600 p-8 text-white relative">
                                <ShieldCheck className="absolute right-8 top-1/2 -translate-y-1/2 h-20 w-20 opacity-10" />
                                <h2 className="text-2xl font-bold mb-2">Patient Verification</h2>
                                <div className="flex space-x-4 text-blue-100 text-sm">
                                    <span>Name: {selectedPatient.name}</span>
                                    <span>Age: {selectedPatient.age}</span>
                                </div>
                            </div>

                            <form onSubmit={handleValidate} className="p-8 space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Patient Records</h3>
                                        <div className="bg-gray-50 p-4 rounded-lg border">
                                            <p className="text-xs text-gray-500 mb-1">Diagnosed Problem</p>
                                            <p className="font-medium">{selectedPatient.problem}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">Validation Criteria</h3>
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Category</label>
                                                <select
                                                    className="w-full h-11 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-2 text-sm transition-all focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                                                    value={validationData.category}
                                                    onChange={(e) => setValidationData({ ...validationData, category: e.target.value })}
                                                >
                                                    <option>General</option>
                                                    <option>HalfYear</option>
                                                    <option>Senior</option>
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-sm font-medium">Concession (%)</label>
                                                <Input
                                                    type="number"
                                                    value={validationData.concession}
                                                    onChange={(e) => setValidationData({ ...validationData, concession: e.target.value })}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-6 border-t font-premium">
                                    <Button type="submit" className="px-12" disabled={processing}>
                                        {processing ? "Validating..." : "Complete Validation"}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                            <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                                <Search className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900">No Patient Selected</h3>
                            <p className="text-gray-500 max-w-sm mt-2">Select a patient from the list on the left to begin the validation and categorization process.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

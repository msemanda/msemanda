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
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

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
        <div className="space-y-12 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Clinical <span className="text-gradient-cyan">Validation</span></h1>
                    <p className="text-gray-500 font-medium">Categorize patient profiles and optimize concession parameters.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                <div className="lg:col-span-4">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-glass rounded-[40px] shadow-premium border border-white h-[700px] flex flex-col overflow-hidden"
                    >
                        <div className="p-8 border-b border-gray-100 bg-gray-900/5">
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
                                <Input
                                    placeholder="Search patient node..."
                                    className="pl-12 h-14 rounded-2xl bg-white border-gray-100 focus:border-cyan-200 transition-all font-bold text-sm"
                                />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {loading ? (
                                <div className="flex flex-col items-center justify-center py-20">
                                    <div className="animate-spin h-6 w-6 border-2 border-cyan-100 border-t-cyan-600 rounded-full mb-4" />
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest text-center">Syncing Registry</p>
                                </div>
                            ) : (
                                patients.map((p, idx) => (
                                    <motion.button
                                        key={p.uid}
                                        initial={{ opacity: 0, scale: 0.95 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        transition={{ delay: idx * 0.03 }}
                                        onClick={() => setSelectedPatient(p)}
                                        className={cn(
                                            "w-full text-left p-6 rounded-3xl transition-all group relative overflow-hidden",
                                            selectedPatient?.uid === p.uid
                                                ? "bg-gradient-to-br from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-600/20"
                                                : "bg-white border border-gray-50 hover:border-cyan-100 hover:shadow-sm"
                                        )}
                                    >
                                        <div className="relative z-10 flex items-center justify-between">
                                            <div>
                                                <div className="font-black text-lg leading-tight mb-1">{p.name}</div>
                                                <div className={cn("text-[9px] font-black uppercase tracking-widest", selectedPatient?.uid === p.uid ? "text-cyan-100/70" : "text-gray-300")}>Node: {p.uid.substring(0, 12).toUpperCase()}</div>
                                            </div>
                                            {selectedPatient?.uid === p.uid && (
                                                <div className="h-8 w-8 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-md">
                                                    <ShieldCheck className="h-4 w-4" />
                                                </div>
                                            )}
                                        </div>
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </motion.div>
                </div>

                <div className="lg:col-span-8">
                    <AnimatePresence mode="wait">
                        {selectedPatient ? (
                            <motion.div
                                key={selectedPatient.uid}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="bg-glass rounded-[48px] shadow-premium border border-white overflow-hidden"
                            >
                                <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-12 text-white relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 group-hover:scale-175 transition-transform duration-1000">
                                        <ShieldCheck className="h-48 w-48" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex items-center gap-6 mb-6">
                                            <div className="h-16 w-16 bg-gradient-to-br from-cyan-400 to-teal-400 rounded-2xl flex items-center justify-center text-2xl font-black shadow-lg">
                                                {selectedPatient.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black tracking-tight">{selectedPatient.name}</h2>
                                                <p className="text-cyan-400/80 font-black uppercase tracking-widest text-xs mt-1">Identity Verified Security Class A</p>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-4">
                                            <span className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-300">Age: {selectedPatient.age} Solar Years</span>
                                            <span className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-300">Origin: {(selectedPatient.address || "Unknown").split(',')[0]}</span>
                                        </div>
                                    </div>
                                </div>

                                <form onSubmit={handleValidate} className="p-12 space-y-12">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-16">
                                        <div className="space-y-6">
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                <div className="h-1.5 w-1.5 bg-cyan-500 rounded-full" /> Legacy Intelligence
                                            </h3>
                                            <div className="bg-cyan-50/30 p-8 rounded-[32px] border border-cyan-100/50 group/item">
                                                <p className="text-[9px] font-black text-cyan-700 uppercase tracking-widest mb-3 opacity-60">Reported Condition</p>
                                                <p className="text-lg font-black text-cyan-900 leading-relaxed italic">"{selectedPatient.problem}"</p>
                                            </div>
                                        </div>

                                        <div className="space-y-10">
                                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                <div className="h-1.5 w-1.5 bg-teal-500 rounded-full" /> Optimization Parameters
                                            </h3>
                                            <div className="space-y-8">
                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Classification Category</label>
                                                    <select
                                                        className="w-full h-16 rounded-2xl border border-gray-100 bg-white px-6 text-sm font-black transition-all focus:border-cyan-200 focus:ring-8 focus:ring-cyan-500/5 outline-none shadow-sm"
                                                        value={validationData.category}
                                                        onChange={(e) => setValidationData({ ...validationData, category: e.target.value })}
                                                    >
                                                        <option>General</option>
                                                        <option>HalfYear</option>
                                                        <option>Senior</option>
                                                        <option>Emergency Elite</option>
                                                    </select>
                                                </div>
                                                <div className="space-y-3">
                                                    <label className="text-[11px] font-black text-gray-500 uppercase tracking-widest ml-1">Economic Concession (%)</label>
                                                    <div className="relative group">
                                                        <Input
                                                            type="number"
                                                            className="h-16 rounded-2xl border-gray-100 bg-white px-6 font-black text-xl pr-20"
                                                            value={validationData.concession}
                                                            onChange={(e) => setValidationData({ ...validationData, concession: e.target.value })}
                                                        />
                                                        <div className="absolute right-6 top-1/2 -translate-y-1/2 font-black text-gray-300 group-focus-within:text-cyan-500 transition-colors">%</div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-10 border-t border-gray-50">
                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.15em] max-w-[240px]">Confirming this validation will update universal node access permissions.</p>
                                        <Button type="submit" className="h-20 px-16 text-xl font-black rounded-[28px] shadow-heavy group/btn" disabled={processing}>
                                            {processing ? "Syncing..." : "Finalize Validation"}
                                            <ShieldCheck className="ml-4 h-6 w-6 group-hover/btn:scale-110 transition-transform" />
                                        </Button>
                                    </div>
                                </form>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="h-[700px] flex flex-col items-center justify-center text-center p-20 bg-white/40 rounded-[48px] border-2 border-dashed border-gray-100 shadow-inner"
                            >
                                <div className="h-32 w-32 bg-white rounded-[40px] shadow-premium flex items-center justify-center mb-10 group-hover:rotate-3 transition-transform">
                                    <Search className="h-12 w-12 text-cyan-200 animate-pulse" />
                                </div>
                                <h3 className="text-3xl font-black text-gray-900 mb-4 tracking-tighter">Null Selection Detected</h3>
                                <p className="text-gray-400 font-medium max-w-sm mx-auto leading-relaxed">Initialize the validation sequence by selecting a patient node from the primary registry on the left.</p>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

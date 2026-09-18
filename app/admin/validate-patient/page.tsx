"use client";

import React, { useEffect, useState } from "react";
import {
    collection, getDocs, query, where,
    doc, setDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Input } from "@/components/ui/Input";
import {
    Search, ShieldCheck, User, Mail,
    FileText, CheckCircle2, ChevronDown, Percent
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CATEGORIES = [
    { value: "General",         label: "General Patient" },
    { value: "Student",         label: "Student" },
    { value: "Senior",          label: "Senior Citizen (60+)" },
    { value: "Insurance",       label: "Insurance / Covered" },
    { value: "Emergency",       label: "Emergency Case" },
    { value: "Staff",           label: "Staff / Employee" },
];

export default function ValidatePatientPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
    const [form, setForm] = useState({ category: "General", concession: "0" });
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);

    useEffect(() => { fetchPatients(); }, []);

    const fetchPatients = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, "users"), where("role", "==", "PATIENT")));
            setPatients(snap.docs.map(d => ({ ...d.data(), uid: d.id })));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleValidate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient) return;
        setProcessing(true);
        try {
            await setDoc(doc(db, "categories", selectedPatient.uid), {
                patientId: selectedPatient.uid,
                name: selectedPatient.name || selectedPatient.email,
                age: selectedPatient.age || null,
                problem: selectedPatient.problem || "",
                category: form.category,
                concession: parseInt(form.concession) || 0,
                validatedAt: serverTimestamp(),
            });
            setSuccess(true);
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(false);
        }
    };

    const handleSelect = (p: any) => {
        setSelectedPatient(p);
        setSuccess(false);
        setForm({ category: "General", concession: "0" });
    };

    const filtered = patients.filter(p => {
        if (!search) return true;
        const q = search.toLowerCase();
        return (
            (p.name || "").toLowerCase().includes(q) ||
            (p.email || "").toLowerCase().includes(q)
        );
    });

    const displayName = (p: any) => p.name && p.name !== p.email ? p.name : p.email;

    return (
        <div className="space-y-6 pb-10">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Patient Validation</h1>
                <p className="text-sm text-gray-500 mt-0.5">Assign a care category and fee concession to each patient</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">

                {/* Patient list */}
                <div className="lg:col-span-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col h-[680px]">
                        <div className="p-4 border-b border-gray-50">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input placeholder="Search by name or email..."
                                    className="pl-9"
                                    value={search}
                                    onChange={e => setSearch(e.target.value)} />
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 space-y-1">
                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                                </div>
                            ) : filtered.length === 0 ? (
                                <p className="text-center text-sm text-gray-400 py-12">No patients found.</p>
                            ) : (
                                filtered.map((p, i) => (
                                    <motion.button
                                        key={p.uid}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                        onClick={() => handleSelect(p)}
                                        className={`w-full text-left px-3.5 py-3 rounded-xl transition-all flex items-center gap-3 ${
                                            selectedPatient?.uid === p.uid
                                                ? "bg-blue-600 text-white"
                                                : "hover:bg-gray-50 text-gray-900"
                                        }`}
                                    >
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                            selectedPatient?.uid === p.uid ? "bg-white/20 text-white" : "bg-blue-50 text-blue-600"
                                        }`}>
                                            {(p.name || p.email || "?").charAt(0).toUpperCase()}
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-sm font-bold truncate ${selectedPatient?.uid === p.uid ? "text-white" : "text-gray-900"}`}>
                                                {displayName(p)}
                                            </p>
                                            <p className={`text-[10px] truncate ${selectedPatient?.uid === p.uid ? "text-blue-100" : "text-gray-400"}`}>
                                                {p.age ? `Age ${p.age}` : "Age not set"} · {p.status === "true" ? "Scheduled" : "Unscheduled"}
                                            </p>
                                        </div>
                                        {selectedPatient?.uid === p.uid && (
                                            <CheckCircle2 className="h-4 w-4 text-white/80 shrink-0 ml-auto" />
                                        )}
                                    </motion.button>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Detail + form */}
                <div className="lg:col-span-8">
                    <AnimatePresence mode="wait">
                        {!selectedPatient ? (
                            <motion.div key="empty"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="h-[680px] flex flex-col items-center justify-center bg-white rounded-2xl border border-dashed border-gray-200 text-center p-10">
                                <div className="h-16 w-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                    <User className="h-8 w-8 text-gray-300" />
                                </div>
                                <p className="text-base font-black text-gray-900 mb-1">No patient selected</p>
                                <p className="text-sm text-gray-400 max-w-xs">Select a patient from the list on the left to validate their profile.</p>
                            </motion.div>
                        ) : (
                            <motion.div key={selectedPatient.uid}
                                initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                                {/* Patient header */}
                                <div className="p-6 border-b border-gray-50 flex items-center gap-4">
                                    <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-600 text-lg shrink-0">
                                        {(selectedPatient.name || selectedPatient.email || "?").charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0">
                                        <h2 className="text-lg font-black text-gray-900 truncate">{displayName(selectedPatient)}</h2>
                                        <p className="text-xs text-gray-400">{selectedPatient.email}</p>
                                    </div>
                                    <div className="ml-auto flex gap-2 shrink-0">
                                        {selectedPatient.age && (
                                            <span className="px-2.5 py-1 rounded-lg bg-gray-50 border border-gray-100 text-xs font-bold text-gray-600">
                                                Age: {selectedPatient.age}
                                            </span>
                                        )}
                                        <span className={`px-2.5 py-1 rounded-lg border text-xs font-bold ${
                                            selectedPatient.status === "true"
                                                ? "bg-green-50 border-green-100 text-green-700"
                                                : "bg-amber-50 border-amber-100 text-amber-700"
                                        }`}>
                                            {selectedPatient.status === "true" ? "Scheduled" : "Not Scheduled"}
                                        </span>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Patient info */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                                <FileText className="h-3 w-3" /> Reported Condition
                                            </p>
                                            <p className="text-sm font-semibold text-gray-700">
                                                {selectedPatient.problem || <span className="text-gray-400 italic">Not provided</span>}
                                            </p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                                                <Mail className="h-3 w-3" /> Contact
                                            </p>
                                            <p className="text-sm font-semibold text-gray-700 truncate">{selectedPatient.email}</p>
                                            {selectedPatient.phone && (
                                                <p className="text-xs text-gray-400 mt-0.5">{selectedPatient.phone}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Validation form */}
                                    <form onSubmit={handleValidate} className="space-y-5">
                                        <div className="border-t border-gray-50 pt-5">
                                            <p className="text-xs font-black text-gray-500 uppercase tracking-wider mb-4">Validation Details</p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient Category</label>
                                                    <div className="relative">
                                                        <ShieldCheck className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                        <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                                        <select
                                                            value={form.category}
                                                            onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                                            className="w-full h-11 pl-10 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all appearance-none cursor-pointer"
                                                        >
                                                            {CATEGORIES.map(c => (
                                                                <option key={c.value} value={c.value}>{c.label}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="space-y-1.5">
                                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Discount / Concession (%)</label>
                                                    <div className="relative">
                                                        <Percent className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <Input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            className="pl-10"
                                                            value={form.concession}
                                                            onChange={e => setForm(p => ({ ...p, concession: e.target.value }))}
                                                        />
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 ml-1">0 = full price · 100 = free</p>
                                                </div>
                                            </div>
                                        </div>

                                        <AnimatePresence>
                                            {success && (
                                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                                    className="p-3.5 bg-green-50 border border-green-100 rounded-xl flex items-center gap-2.5 text-green-700 text-sm font-semibold">
                                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                                    Patient validated successfully. You can update again or select another patient.
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        <div className="flex items-center justify-between pt-2">
                                            <p className="text-xs text-gray-400">
                                                This sets the billing category used when generating invoices.
                                            </p>
                                            <button type="submit" disabled={processing}
                                                className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm shadow-blue-600/20 shrink-0 ml-4">
                                                {processing
                                                    ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                                    : <><ShieldCheck className="h-4 w-4" /> Validate Patient</>}
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

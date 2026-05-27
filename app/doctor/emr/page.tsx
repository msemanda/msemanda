"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FileText, Search, Filter, ChevronRight, Activity, Pill, FlaskConical, Scan } from "lucide-react";

const emrPatients = [
    {
        id: "P001", name: "John Mwesiga", age: 45, gender: "M", dob: "15/03/1981",
        diagnosis: "Type 2 Diabetes Mellitus", icd: "E11", lastVisit: "2026-05-20",
        allergies: ["Penicillin"], bloodGroup: "O+", vitals: { bp: "138/88", hr: 82, temp: 37.1, spo2: 97 },
        medications: ["Metformin 500mg BD", "Atorvastatin 20mg OD"],
        labs: [{ name: "HbA1c", value: "8.2%", date: "2026-05-15", flag: "HIGH" }],
    },
    {
        id: "P002", name: "Grace Nakato", age: 67, gender: "F", dob: "22/07/1959",
        diagnosis: "Hypertension Stage 2", icd: "I10", lastVisit: "2026-05-22",
        allergies: [], bloodGroup: "A+", vitals: { bp: "158/98", hr: 76, temp: 36.8, spo2: 98 },
        medications: ["Amlodipine 5mg OD", "Losartan 50mg OD", "Hydrochlorothiazide 12.5mg OD"],
        labs: [{ name: "RFTs", value: "Creatinine 1.1 mg/dL", date: "2026-05-10", flag: "NORMAL" }],
    },
    {
        id: "P003", name: "Patrick Ssemanda", age: 32, gender: "M", dob: "08/11/1993",
        diagnosis: "Community-acquired Pneumonia", icd: "J18", lastVisit: "2026-05-24",
        allergies: ["Sulfa drugs"], bloodGroup: "B+", vitals: { bp: "118/75", hr: 95, temp: 38.6, spo2: 94 },
        medications: ["Amoxicillin-Clavulanate 875mg BD", "Azithromycin 500mg OD", "Paracetamol 1g TDS"],
        labs: [{ name: "CBC", value: "WBC 14.2 x10³/µL", date: "2026-05-24", flag: "HIGH" }],
    },
];

const FLAG_CLASS: Record<string, string> = { HIGH: "badge-red", LOW: "badge-yellow", NORMAL: "badge-green", CRITICAL: "badge-red" };

export default function EMRPage() {
    const [selected, setSelected] = useState<typeof emrPatients[0] | null>(null);
    const [search, setSearch] = useState("");

    const filtered = emrPatients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) || p.id.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-7xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <FileText className="h-6 w-6 text-blue-600" /> Electronic Medical Records
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Comprehensive patient medical history and records</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-[70vh]">
                {/* Patient list */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-4 py-3 border-b border-gray-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-lg border-0 outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Search patient or ID..."
                            />
                        </div>
                    </div>
                    <div className="flex-1 divide-y divide-gray-50 overflow-y-auto">
                        {filtered.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setSelected(p)}
                                className={`w-full text-left px-4 py-3.5 hover:bg-blue-50/50 transition-colors flex items-center gap-3 ${selected?.id === p.id ? "bg-blue-50 border-r-2 border-blue-600" : ""}`}
                            >
                                <div className="h-9 w-9 rounded-xl bg-blue-100 flex items-center justify-center font-black text-blue-700 text-sm shrink-0">
                                    {p.name.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{p.name}</p>
                                    <p className="text-xs text-gray-400">{p.age}y &bull; {p.gender} &bull; {p.bloodGroup}</p>
                                    <p className="text-xs text-blue-600 font-semibold truncate">{p.diagnosis}</p>
                                </div>
                                <ChevronRight className="h-4 w-4 text-gray-300 shrink-0" />
                            </button>
                        ))}
                    </div>
                </div>

                {/* EMR detail */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto">
                    {!selected ? (
                        <div className="h-full flex flex-col items-center justify-center text-center p-12 text-gray-400">
                            <FileText className="h-12 w-12 mb-3 opacity-20" />
                            <p className="font-semibold">Select a patient to view their EMR</p>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-5 space-y-5">
                            {/* Patient header */}
                            <div className="flex items-start justify-between pb-4 border-b border-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className="h-12 w-12 rounded-xl bg-blue-100 flex items-center justify-center font-black text-blue-700 text-lg">
                                        {selected.name.charAt(0)}
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-black text-gray-900">{selected.name}</h2>
                                        <p className="text-xs text-gray-400">
                                            DOB: {selected.dob} &bull; {selected.age}y {selected.gender} &bull; {selected.bloodGroup}
                                            {selected.allergies.length > 0 && <span className="ml-1 text-red-500 font-bold">&bull; Allergic: {selected.allergies.join(", ")}</span>}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-400">Last visit: {selected.lastVisit}</p>
                                    <p className="text-xs font-bold text-blue-600">{selected.icd} — {selected.diagnosis}</p>
                                </div>
                            </div>

                            {/* Vitals */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Activity className="h-3.5 w-3.5" /> Latest Vitals
                                </h3>
                                <div className="grid grid-cols-4 gap-2">
                                    {[
                                        { label: "BP", value: selected.vitals.bp, unit: "mmHg" },
                                        { label: "HR", value: selected.vitals.hr, unit: "bpm" },
                                        { label: "Temp", value: selected.vitals.temp, unit: "°C" },
                                        { label: "SpO₂", value: selected.vitals.spo2, unit: "%" },
                                    ].map((v) => (
                                        <div key={v.label} className="bg-gray-50 rounded-xl p-3 text-center">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{v.label}</p>
                                            <p className="text-lg font-black text-gray-900">{v.value}</p>
                                            <p className="text-[10px] text-gray-400">{v.unit}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Medications */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <Pill className="h-3.5 w-3.5" /> Current Medications
                                </h3>
                                <div className="space-y-1.5">
                                    {selected.medications.map((m) => (
                                        <div key={m} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-50 border border-blue-100">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                                            <span className="text-sm font-semibold text-blue-700">{m}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Lab results */}
                            <div>
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                                    <FlaskConical className="h-3.5 w-3.5" /> Recent Lab Results
                                </h3>
                                <div className="space-y-2">
                                    {selected.labs.map((l) => (
                                        <div key={l.name} className="flex items-center justify-between px-3 py-2.5 rounded-xl bg-gray-50 border border-gray-100">
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{l.name}</p>
                                                <p className="text-xs text-gray-400">{l.date}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-gray-700">{l.value}</p>
                                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${FLAG_CLASS[l.flag]}`}>{l.flag}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex gap-2 pt-2">
                                <button className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors">
                                    Add Consultation Note
                                </button>
                                <button className="flex-1 py-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-sm font-bold border border-gray-100 transition-colors">
                                    Order Labs / Imaging
                                </button>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

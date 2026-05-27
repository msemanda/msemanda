"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Activity, Plus, Save, Search } from "lucide-react";

const mockQueue = [
    { id: "P001", name: "John Mwesiga", bed: "A-01", dueIn: "Now" },
    { id: "P002", name: "Grace Nakato", bed: "A-02", dueIn: "15 min" },
    { id: "P003", name: "Patrick Ssemanda", bed: "B-01", dueIn: "30 min" },
];

export default function VitalsPage() {
    const [selected, setSelected] = useState<string | null>(null);
    const [form, setForm] = useState({ bp: "", hr: "", temp: "", spo2: "", weight: "", notes: "" });
    const [saved, setSaved] = useState(false);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => { setSaved(false); setSelected(null); setForm({ bp: "", hr: "", temp: "", spo2: "", weight: "", notes: "" }); }, 2000);
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Activity className="h-6 w-6 text-blue-600" /> Vitals Recording
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Record patient vitals for the current shift</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Patient queue */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-lg border-0 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all" placeholder="Search patient..." />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {mockQueue.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => setSelected(p.id)}
                                className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors ${selected === p.id ? "bg-blue-50 border-r-2 border-blue-600" : ""}`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{p.name}</p>
                                        <p className="text-xs text-gray-400">Bed {p.bed}</p>
                                    </div>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${p.dueIn === "Now" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-600"}`}>
                                        {p.dueIn}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Vitals form */}
                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    {!selected ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-16 text-gray-400">
                            <Activity className="h-10 w-10 mb-3 opacity-30" />
                            <p className="font-semibold">Select a patient to record vitals</p>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <h3 className="font-bold text-gray-900">
                                Recording vitals for: <span className="text-blue-600">{mockQueue.find(p => p.id === selected)?.name}</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Blood Pressure (mmHg)", key: "bp", placeholder: "e.g. 120/80" },
                                    { label: "Heart Rate (bpm)", key: "hr", placeholder: "e.g. 72" },
                                    { label: "Temperature (°C)", key: "temp", placeholder: "e.g. 37.2" },
                                    { label: "SpO₂ (%)", key: "spo2", placeholder: "e.g. 98" },
                                    { label: "Weight (kg)", key: "weight", placeholder: "e.g. 70" },
                                ].map((f) => (
                                    <div key={f.key} className="space-y-1">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{f.label}</label>
                                        <input
                                            value={(form as any)[f.key]}
                                            onChange={(e) => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                                            placeholder={f.placeholder}
                                            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        />
                                    </div>
                                ))}
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Clinical Notes</label>
                                    <textarea
                                        rows={3}
                                        value={form.notes}
                                        onChange={(e) => setForm(prev => ({ ...prev, notes: e.target.value }))}
                                        placeholder="Add any observations..."
                                        className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-900 resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleSave}
                                className={`w-full h-10 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-colors ${saved ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
                            >
                                {saved ? <><CheckCircle className="h-4 w-4" /> Saved!</> : <><Save className="h-4 w-4" /> Save Vitals</>}
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CheckCircle({ className }: { className?: string }) {
    return <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>;
}

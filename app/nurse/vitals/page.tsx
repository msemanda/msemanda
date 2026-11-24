"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Activity, Save, Search, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface QueuePatient {
    id: string;
    name: string;
    bed: string;
}

export default function VitalsPage() {
    const [queue, setQueue] = useState<QueuePatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({ bp: "", hr: "", temp: "", spo2: "", weight: "", notes: "" });
    const [saved, setSaved] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "ipdAdmissions"));
            setQueue(snap.docs
                .filter(d => {
                    const s = (d.data().status as string) ?? "";
                    return !s || s === "ADMITTED" || s === "ACTIVE";
                })
                .map(d => {
                    const r = d.data();
                    return {
                        id: d.id,
                        name: ((r.patientName ?? r.name) as string) ?? "—",
                        bed: ((r.bedNumber ?? r.bed) as string) ?? "—",
                    };
                })
            );
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => {
            setSaved(false);
            setSelected(null);
            setForm({ bp: "", hr: "", temp: "", spo2: "", weight: "", notes: "" });
        }, 2000);
    };

    const filtered = queue.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
    const selectedPatient = queue.find(p => p.id === selected);

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Activity className="h-6 w-6 text-blue-600" /> Vitals Recording
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Record patient vitals for the current shift</p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-blue-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-50">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-lg border-0 outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20 transition-all"
                                placeholder="Search patient..."
                            />
                        </div>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin h-5 w-5 border-[3px] border-blue-100 border-t-blue-500 rounded-full" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-gray-400 py-8 text-xs">No admitted patients</p>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {filtered.map((p) => (
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
                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">Due</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    {!selected ? (
                        <div className="h-full flex flex-col items-center justify-center text-center py-16 text-gray-400">
                            <Activity className="h-10 w-10 mb-3 opacity-30" />
                            <p className="font-semibold">Select a patient to record vitals</p>
                        </div>
                    ) : (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                            <h3 className="font-bold text-gray-900">
                                Recording vitals for: <span className="text-blue-600">{selectedPatient?.name}</span>
                            </h3>
                            <div className="grid grid-cols-2 gap-3">
                                {[
                                    { label: "Blood Pressure (mmHg)", key: "bp",     placeholder: "e.g. 120/80" },
                                    { label: "Heart Rate (bpm)",       key: "hr",     placeholder: "e.g. 72" },
                                    { label: "Temperature (°C)",       key: "temp",   placeholder: "e.g. 37.2" },
                                    { label: "SpO₂ (%)",               key: "spo2",   placeholder: "e.g. 98" },
                                    { label: "Weight (kg)",            key: "weight", placeholder: "e.g. 70" },
                                ].map((f) => (
                                    <div key={f.key} className="space-y-1">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">{f.label}</label>
                                        <input
                                            value={(form as Record<string, string>)[f.key]}
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
                                {saved
                                    ? <><CheckIcon className="h-4 w-4" /> Saved!</>
                                    : <><Save className="h-4 w-4" /> Save Vitals</>
                                }
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
    );
}

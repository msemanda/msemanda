"use client";

import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, setDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Search, User, X } from "lucide-react";

// Standard FDI tooth numbering — 32 adult teeth
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [41, 42, 43, 44, 45, 46, 47, 48];

const CONDITION_OPTIONS: { label: string; color: string }[] = [
    { label: "Healthy", color: "" },
    { label: "Caries", color: "bg-red-400" },
    { label: "Filling", color: "bg-blue-400" },
    { label: "Crown", color: "bg-yellow-400" },
    { label: "Extracted", color: "bg-gray-400" },
];

type ToothMap = Record<number, { label: string; color: string }>;

interface KnownPatient {
    uid: string;
    name: string;
    email: string;
}

function ToothRow({ teeth, label, chart, selected, onSelect }: {
    teeth: number[]; label: string; chart: ToothMap; selected: number | null; onSelect: (t: number) => void;
}) {
    return (
        <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 text-center">{label}</p>
            <div className="flex justify-center gap-1.5">
                {teeth.map(t => {
                    const cond = chart[t];
                    return (
                        <button key={t} onClick={() => onSelect(t)}
                            className="relative flex flex-col items-center group">
                            <div className={`w-9 h-10 rounded-lg border-2 flex items-center justify-center text-[9px] font-black transition-all ${cond ? `${cond.color} text-white border-transparent` : "bg-green-50 text-green-700 border-green-100 hover:border-green-300"} ${selected === t ? "ring-2 ring-blue-500 scale-110" : ""}`}>
                                {t}
                            </div>
                            {cond && <span className="text-[8px] text-gray-400 mt-0.5">{cond.label}</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function DentalChart() {
    const { profile } = useAuth();
    const [patients, setPatients] = useState<KnownPatient[]>([]);
    const [nameQuery, setNameQuery] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<KnownPatient | null>(null);

    const [chart, setChart] = useState<ToothMap>({});
    const [loadingChart, setLoadingChart] = useState(false);
    const [selectedTooth, setSelectedTooth] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        getDocs(query(collection(db, "users"), where("role", "==", "PATIENT")))
            .then(snap => setPatients(
                snap.docs.map(d => {
                    const data = d.data() as any;
                    return { uid: d.id, name: data.name || "", email: data.email || "" };
                }).filter(p => p.name)
            ))
            .catch(console.error);
    }, []);

    const loadChart = async (patient: KnownPatient) => {
        setSelectedPatient(patient);
        setSelectedTooth(null);
        setLoadingChart(true);
        try {
            const snap = await getDoc(doc(db, "dentalCharts", patient.uid));
            setChart(snap.exists() ? ((snap.data().teeth as ToothMap) || {}) : {});
        } catch (e) {
            console.error(e);
            setChart({});
        } finally {
            setLoadingChart(false);
        }
    };

    const setCondition = async (option: { label: string; color: string }) => {
        if (!selectedPatient || selectedTooth === null) return;
        setSaving(true);
        setError("");
        try {
            const next = { ...chart };
            if (option.label === "Healthy") {
                delete next[selectedTooth];
            } else {
                next[selectedTooth] = option;
            }
            await setDoc(doc(db, "dentalCharts", selectedPatient.uid), {
                teeth: next,
                patientName: selectedPatient.name,
                updatedBy: profile?.name,
                updatedAt: new Date().toISOString(),
            }, { merge: true });
            setChart(next);
            setSelectedTooth(null);
        } catch (e: any) {
            console.error(e);
            setError(e?.message || "Failed to save. Please try again.");
        }
        finally { setSaving(false); }
    };

    const suggestions = patients.filter(p =>
        nameQuery.length >= 1 && p.name.toLowerCase().includes(nameQuery.toLowerCase())
    ).slice(0, 8);

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-pink-600" /> Dental Chart
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">FDI tooth numbering system</p>
            </div>

            {/* Patient selector */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Patient
                </label>
                {selectedPatient ? (
                    <div className="flex items-center gap-2 h-11 px-3 rounded-xl border border-pink-200 bg-pink-50 w-fit">
                        <span className="text-sm font-bold text-pink-900">{selectedPatient.name}</span>
                        <button onClick={() => { setSelectedPatient(null); setChart({}); }}
                            className="h-5 w-5 rounded-full bg-pink-200 hover:bg-pink-300 flex items-center justify-center transition-colors">
                            <X className="h-3 w-3 text-pink-700" />
                        </button>
                    </div>
                ) : (
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={nameQuery}
                            onChange={e => { setNameQuery(e.target.value); setDropdownOpen(true); }}
                            onFocus={() => nameQuery.length >= 1 && setDropdownOpen(true)}
                            placeholder="Search patient by name…"
                            className="h-11 w-full pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:bg-white focus:border-pink-500 focus:ring-2 focus:ring-pink-500/20 outline-none transition-all" />
                        <AnimatePresence>
                            {dropdownOpen && suggestions.length > 0 && (
                                <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                    className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden">
                                    {suggestions.map(p => (
                                        <button key={p.uid} type="button"
                                            onMouseDown={() => { loadChart(p); setNameQuery(""); setDropdownOpen(false); }}
                                            className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-pink-50 transition-colors text-left">
                                            <span className="text-xs font-bold text-gray-900">{p.name}</span>
                                            <span className="text-[10px] text-gray-400 ml-auto">{p.email}</span>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </div>

            {!selectedPatient ? (
                <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-16 text-center">
                    <ClipboardList className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">Select a patient to view their chart</p>
                    <p className="text-xs text-gray-400">Each patient's tooth conditions are recorded and saved separately.</p>
                </div>
            ) : loadingChart ? (
                <div className="bg-white rounded-2xl border border-gray-100 py-16 flex items-center justify-center">
                    <div className="animate-spin h-7 w-7 border-[3px] border-pink-100 border-t-pink-600 rounded-full" />
                </div>
            ) : (
                <>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                        <div className="flex justify-center gap-4 flex-wrap">
                            {CONDITION_OPTIONS.map(l => (
                                <div key={l.label} className="flex items-center gap-1.5">
                                    <div className={`w-3 h-3 rounded ${l.color || "bg-green-200"}`} />
                                    <span className="text-[10px] text-gray-500">{l.label}</span>
                                </div>
                            ))}
                        </div>
                        <div className="border-b border-dashed border-gray-100 pb-6 space-y-4">
                            <ToothRow teeth={UPPER_RIGHT} label="Upper Right (18→11)" chart={chart} selected={selectedTooth} onSelect={t => setSelectedTooth(selectedTooth === t ? null : t)} />
                            <ToothRow teeth={UPPER_LEFT} label="Upper Left (21→28)" chart={chart} selected={selectedTooth} onSelect={t => setSelectedTooth(selectedTooth === t ? null : t)} />
                        </div>
                        <div className="space-y-4 pt-2">
                            <ToothRow teeth={LOWER_LEFT} label="Lower Left (31→38)" chart={chart} selected={selectedTooth} onSelect={t => setSelectedTooth(selectedTooth === t ? null : t)} />
                            <ToothRow teeth={LOWER_RIGHT} label="Lower Right (41→48)" chart={chart} selected={selectedTooth} onSelect={t => setSelectedTooth(selectedTooth === t ? null : t)} />
                        </div>

                        {selectedTooth !== null && (
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 flex items-center gap-3 flex-wrap">
                                <span className="text-xs font-black text-blue-700">Tooth {selectedTooth} — set condition:</span>
                                {CONDITION_OPTIONS.map(opt => (
                                    <button key={opt.label} disabled={saving} onClick={() => setCondition(opt)}
                                        className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 hover:bg-blue-100 text-[11px] font-bold text-blue-700 transition-colors disabled:opacity-50">
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        {error && (
                            <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mt-3">{error}</p>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-sm font-black text-gray-900 mb-3">Charted Findings</h2>
                        {Object.keys(chart).length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-4">No findings recorded yet — click a tooth to chart it.</p>
                        ) : (
                            <div className="space-y-2">
                                {Object.entries(chart).map(([tooth, cond]) => (
                                    <div key={tooth} className="flex items-center gap-3 text-xs">
                                        <span className={`h-6 w-8 rounded-md ${cond.color} text-white flex items-center justify-center font-black text-[10px]`}>{tooth}</span>
                                        <span className="font-semibold text-gray-700">{cond.label}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

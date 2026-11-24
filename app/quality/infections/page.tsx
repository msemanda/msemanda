"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Plus, Search, RefreshCw, X, CheckCircle2, Clock } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface InfectionIncident {
    id: string;
    pathogen: string;
    ward: string;
    casesCount: number;
    reportedBy: string;
    status: "active" | "contained" | "resolved";
    measures: string;
    reportedAt?: any;
}

const WARDS = ["General Ward", "ICU", "Maternity", "Pediatrics", "Surgery", "OPD", "Theatre", "Kitchen"];
const PATHOGENS = ["MRSA", "C. difficile", "E. coli", "Norovirus", "Influenza", "COVID-19", "Hepatitis", "Other"];

const STATUS_CONFIG: Record<InfectionIncident["status"], { label: string; color: string }> = {
    active:    { label: "Active",    color: "bg-red-50 text-red-600 border-red-100" },
    contained: { label: "Contained", color: "bg-amber-50 text-amber-700 border-amber-100" },
    resolved:  { label: "Resolved",  color: "bg-green-50 text-green-700 border-green-100" },
};

export default function QualityInfectionsPage() {
    const { profile } = useAuth();
    const [incidents, setIncidents] = useState<InfectionIncident[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({ pathogen: PATHOGENS[0], ward: WARDS[0], casesCount: "1", measures: "" });

    useEffect(() => { fetchIncidents(); }, []);

    const fetchIncidents = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "infectionIncidents"));
            setIncidents(snap.docs.map(d => ({ id: d.id, ...d.data() } as InfectionIncident)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleReport = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "infectionIncidents"), {
                pathogen: form.pathogen,
                ward: form.ward,
                casesCount: parseInt(form.casesCount),
                measures: form.measures.trim(),
                reportedBy: profile?.name,
                status: "active",
                reportedAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ pathogen: PATHOGENS[0], ward: WARDS[0], casesCount: "1", measures: "" });
            fetchIncidents();
        } catch(e) { console.error(e); }
        finally { setCreating(false); }
    };

    const updateStatus = async (id: string, status: InfectionIncident["status"]) => {
        setUpdating(id);
        try {
            await updateDoc(doc(db, "infectionIncidents", id), { status, updatedAt: serverTimestamp() });
            setIncidents(prev => prev.map(i => i.id === id ? { ...i, status } : i));
        } catch(e) { console.error(e); }
        finally { setUpdating(null); }
    };

    const filtered = incidents.filter(i =>
        !search || i.pathogen.toLowerCase().includes(search.toLowerCase()) ||
        i.ward.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Infection Incidents</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Track and manage hospital-acquired infection events</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchIncidents} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> Report Incident
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Report Infection Incident</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleReport} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Pathogen</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.pathogen} onChange={e => setForm(p => ({ ...p, pathogen: e.target.value }))}>
                                        {PATHOGENS.map(p => <option key={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Ward / Area</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.ward} onChange={e => setForm(p => ({ ...p, ward: e.target.value }))}>
                                        {WARDS.map(w => <option key={w}>{w}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Cases</label>
                                    <Input type="number" min="1" required value={form.casesCount} onChange={e => setForm(p => ({ ...p, casesCount: e.target.value }))} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Control Measures Taken</label>
                                <textarea rows={3} required placeholder="Describe isolation, disinfection, contact tracing steps..." value={form.measures} onChange={e => setForm(p => ({ ...p, measures: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:bg-white focus:border-blue-500 outline-none resize-none" />
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : "Report Incident"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search by pathogen or ward..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <AlertTriangle className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No incidents reported</p>
                    <p className="text-xs text-gray-400">Report an infection incident above.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((inc, i) => {
                            const s = STATUS_CONFIG[inc.status];
                            return (
                                <motion.div key={inc.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                                    className={`rounded-2xl border shadow-sm p-5 ${inc.status === "active" ? "bg-red-50/50 border-red-100" : "bg-white border-gray-100"}`}>
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <AlertTriangle className={`h-4 w-4 ${inc.status === "active" ? "text-red-500" : "text-gray-400"}`} />
                                                <p className="text-sm font-black text-gray-900">{inc.pathogen}</p>
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${s.color}`}>{s.label}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">{inc.ward} · {inc.casesCount} case{inc.casesCount !== 1 ? "s" : ""} · By {inc.reportedBy}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{inc.measures}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {inc.status === "active" && (
                                                <button onClick={() => updateStatus(inc.id, "contained")} disabled={!!updating}
                                                    className="h-8 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors">
                                                    Mark Contained
                                                </button>
                                            )}
                                            {inc.status === "contained" && (
                                                <button onClick={() => updateStatus(inc.id, "resolved")} disabled={!!updating}
                                                    className="h-8 px-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold transition-colors flex items-center gap-1">
                                                    {updating === inc.id ? <div className="animate-spin h-3 w-3 border border-green-400 border-t-transparent rounded-full"/> : <><CheckCircle2 className="h-3.5 w-3.5"/> Resolved</>}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

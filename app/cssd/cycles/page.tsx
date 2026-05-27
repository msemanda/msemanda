"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { RefreshCw, Plus, Search, X, CheckCircle2, Clock, PlayCircle, AlertCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface SterilizationCycle {
    id: string;
    cycleNo: string;
    machine: string;
    method: string;
    startedAt?: any;
    completedAt?: any;
    status: "running" | "completed" | "failed";
    operator: string;
    itemCount: number;
    notes?: string;
}

const METHODS = ["Steam (Autoclave)", "Dry Heat", "EO Gas", "Chemical/Cold", "Plasma"];
const MACHINES = ["Autoclave 1", "Autoclave 2", "Dry Heat Oven", "EO Chamber", "Plasma Unit"];

const STATUS_CONFIG: Record<SterilizationCycle["status"], { label: string; color: string; icon: any }> = {
    running:   { label: "Running",   color: "bg-blue-50 text-blue-600 border-blue-100",    icon: PlayCircle },
    completed: { label: "Completed", color: "bg-green-50 text-green-700 border-green-100", icon: CheckCircle2 },
    failed:    { label: "Failed",    color: "bg-red-50 text-red-600 border-red-100",       icon: AlertCircle },
};

export default function CssdCyclesPage() {
    const { profile } = useAuth();
    const [cycles, setCycles] = useState<SterilizationCycle[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({ machine: MACHINES[0], method: METHODS[0], itemCount: "1", notes: "" });

    useEffect(() => { fetchCycles(); }, []);

    const fetchCycles = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "cssdCycles"));
            setCycles(snap.docs.map(d => ({ id: d.id, ...d.data() } as SterilizationCycle)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleStart = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const cycleNo = `CYC-${Date.now().toString().slice(-6)}`;
            await addDoc(collection(db, "cssdCycles"), {
                cycleNo,
                machine: form.machine,
                method: form.method,
                itemCount: parseInt(form.itemCount),
                operator: profile?.name,
                status: "running",
                startedAt: serverTimestamp(),
                notes: form.notes.trim(),
            });
            setShowForm(false);
            setForm({ machine: MACHINES[0], method: METHODS[0], itemCount: "1", notes: "" });
            fetchCycles();
        } catch(e) { console.error(e); }
        finally { setCreating(false); }
    };

    const handleComplete = async (cycle: SterilizationCycle, status: "completed" | "failed") => {
        setUpdating(cycle.id);
        try {
            await updateDoc(doc(db, "cssdCycles", cycle.id), { status, completedAt: serverTimestamp() });
            setCycles(prev => prev.map(c => c.id === cycle.id ? { ...c, status } : c));
        } catch(e) { console.error(e); }
        finally { setUpdating(null); }
    };

    const filtered = cycles.filter(c =>
        !search || c.cycleNo.toLowerCase().includes(search.toLowerCase()) ||
        c.machine.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Sterilization Cycles</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Monitor and manage active sterilization cycles</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchCycles} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> Start Cycle
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Start Sterilization Cycle</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleStart} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Machine</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.machine} onChange={e => setForm(p => ({ ...p, machine: e.target.value }))}>
                                        {MACHINES.map(m => <option key={m}>{m}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Method</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.method} onChange={e => setForm(p => ({ ...p, method: e.target.value }))}>
                                        {METHODS.map(m => <option key={m}>{m}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Item Count in Load</label>
                                <Input type="number" min="1" required value={form.itemCount} onChange={e => setForm(p => ({ ...p, itemCount: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Notes (optional)</label>
                                <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:bg-white focus:border-blue-500 outline-none resize-none" />
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : "Start Cycle"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search cycles..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <RefreshCw className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No cycles recorded</p>
                    <p className="text-xs text-gray-400">Start a new sterilization cycle above.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((cycle, i) => {
                            const s = STATUS_CONFIG[cycle.status];
                            const StatusIcon = s.icon;
                            return (
                                <motion.div key={cycle.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-black text-gray-900">{cycle.cycleNo}</p>
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${s.color}`}>
                                                    <StatusIcon className="h-3 w-3" /> {s.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">{cycle.machine} · {cycle.method}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{cycle.itemCount} items · Operator: {cycle.operator}</p>
                                        </div>
                                        {cycle.status === "running" && (
                                            <div className="flex gap-2">
                                                <button onClick={() => handleComplete(cycle, "failed")} disabled={!!updating}
                                                    className="h-9 px-4 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50">
                                                    Mark Failed
                                                </button>
                                                <button onClick={() => handleComplete(cycle, "completed")} disabled={!!updating}
                                                    className="h-9 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm">
                                                    {updating === cycle.id ? <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full"/> : <><CheckCircle2 className="h-3.5 w-3.5"/> Complete</>}
                                                </button>
                                            </div>
                                        )}
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

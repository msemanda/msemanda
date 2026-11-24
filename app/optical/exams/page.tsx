"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { fmtDate } from "@/lib/ts";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Plus, RefreshCw, X, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Exam {
    id: string;
    patientName: string;
    visualAcuityOD: string;
    visualAcuityOS: string;
    iopOD: string;
    iopOS: string;
    diagnosis: string;
    notes: string;
    examinedBy?: string;
    createdAt?: any;
}

export default function EyeExamsPage() {
    const { profile } = useAuth();
    const canWrite = profile?.permissions?.includes("optical_exams") || profile?.role === "ADMIN";
    const [exams, setExams] = useState<Exam[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({ patientName: "", visualAcuityOD: "", visualAcuityOS: "", iopOD: "", iopOS: "", diagnosis: "", notes: "" });

    useEffect(() => { fetchExams(); }, []);

    const fetchExams = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "opticalExams"));
            setExams(snap.docs.map(d => ({ id: d.id, ...d.data() } as Exam)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "opticalExams"), {
                patientName: form.patientName.trim(),
                visualAcuityOD: form.visualAcuityOD.trim(),
                visualAcuityOS: form.visualAcuityOS.trim(),
                iopOD: form.iopOD.trim(),
                iopOS: form.iopOS.trim(),
                diagnosis: form.diagnosis.trim(),
                notes: form.notes.trim(),
                examinedBy: profile?.name,
                createdAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ patientName: "", visualAcuityOD: "", visualAcuityOS: "", iopOD: "", iopOS: "", diagnosis: "", notes: "" });
            fetchExams();
        } catch (e) { console.error(e); }
        finally { setCreating(false); }
    };

    const filtered = exams.filter(e => !search || e.patientName.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Eye Exams</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Vision tests, IOP, and diagnoses</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchExams} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    {canWrite && (
                        <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                            <Plus className="h-4 w-4" /> New Exam
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showForm && canWrite && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Record Eye Exam</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient Name</label>
                                <Input required placeholder="Patient's full name" value={form.patientName} onChange={e => setForm(p => ({ ...p, patientName: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Visual Acuity (OD / Right)</label>
                                    <Input placeholder="e.g. 6/6" value={form.visualAcuityOD} onChange={e => setForm(p => ({ ...p, visualAcuityOD: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Visual Acuity (OS / Left)</label>
                                    <Input placeholder="e.g. 6/9" value={form.visualAcuityOS} onChange={e => setForm(p => ({ ...p, visualAcuityOS: e.target.value }))} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">IOP (OD / Right, mmHg)</label>
                                    <Input placeholder="e.g. 16" value={form.iopOD} onChange={e => setForm(p => ({ ...p, iopOD: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">IOP (OS / Left, mmHg)</label>
                                    <Input placeholder="e.g. 17" value={form.iopOS} onChange={e => setForm(p => ({ ...p, iopOS: e.target.value }))} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Diagnosis</label>
                                <Input placeholder="e.g. Myopia, Astigmatism" value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))} />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Notes (optional)</label>
                                <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:bg-white focus:border-blue-500 outline-none resize-none" />
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : "Save Exam"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search by patient..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <Eye className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No exams recorded</p>
                    <p className="text-xs text-gray-400">{canWrite ? "Record an eye exam above." : "Exams recorded by the optician will appear here."}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((e, i) => (
                            <motion.div key={e.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <div>
                                        <p className="text-sm font-black text-gray-900">{e.patientName}</p>
                                        <p className="text-xs text-gray-500">VA — OD {e.visualAcuityOD || "—"} / OS {e.visualAcuityOS || "—"} · IOP — OD {e.iopOD || "—"} / OS {e.iopOS || "—"}</p>
                                        {e.diagnosis && <p className="text-xs text-gray-700 font-semibold mt-0.5">{e.diagnosis}</p>}
                                        {e.notes && <p className="text-xs text-gray-400 mt-0.5">{e.notes}</p>}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-gray-400">{fmtDate(e.createdAt)}</p>
                                        {e.examinedBy && <p className="text-[10px] text-gray-400">by {e.examinedBy}</p>}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

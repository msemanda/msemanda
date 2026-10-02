"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Plus, Search, RefreshCw, X, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface QualityAudit {
    id: string;
    title: string;
    auditType: string;
    department: string;
    auditor: string;
    scheduledDate: string;
    status: "scheduled" | "in_progress" | "completed";
    score?: number;
    findings?: string;
    createdAt?: any;
}

const AUDIT_TYPES = ["Internal Audit", "Clinical Audit", "Drug Safety Audit", "Infection Control Audit", "Patient Safety Audit", "Environmental Audit"];
const DEPARTMENTS = ["General Ward", "ICU", "Theatre", "OPD", "Pharmacy", "Laboratory", "Radiology", "Maternity", "Kitchen", "Administration"];

const STATUS_CONFIG: Record<QualityAudit["status"], { label: string; color: string; icon: any }> = {
    scheduled:   { label: "Scheduled",   color: "bg-gray-50 text-gray-500 border-gray-100",    icon: Clock },
    in_progress: { label: "In Progress", color: "bg-blue-50 text-blue-600 border-blue-100",    icon: PlayCircle },
    completed:   { label: "Completed",   color: "bg-green-50 text-green-700 border-green-100", icon: CheckCircle2 },
};

export default function QualityAuditsPage() {
    const { profile } = useAuth();
    const [audits, setAudits] = useState<QualityAudit[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({ title: "", auditType: AUDIT_TYPES[0], department: DEPARTMENTS[0], scheduledDate: "", findings: "", score: "" });

    useEffect(() => { fetchAudits(); }, []);

    const fetchAudits = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "qualityAudits"));
            setAudits(snap.docs.map(d => ({ id: d.id, ...d.data() } as QualityAudit)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "qualityAudits"), {
                title: form.title.trim(),
                auditType: form.auditType,
                department: form.department,
                scheduledDate: form.scheduledDate,
                auditor: profile?.name,
                status: "scheduled",
                createdAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ title: "", auditType: AUDIT_TYPES[0], department: DEPARTMENTS[0], scheduledDate: "", findings: "", score: "" });
            fetchAudits();
        } catch(e) { console.error(e); }
        finally { setCreating(false); }
    };

    const updateStatus = async (audit: QualityAudit, status: QualityAudit["status"]) => {
        setUpdating(audit.id);
        try {
            await updateDoc(doc(db, "qualityAudits", audit.id), { status, updatedAt: serverTimestamp() });
            setAudits(prev => prev.map(a => a.id === audit.id ? { ...a, status } : a));
        } catch(e) { console.error(e); }
        finally { setUpdating(null); }
    };

    const filtered = audits.filter(a =>
        !search || a.title.toLowerCase().includes(search.toLowerCase()) ||
        a.department.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Quality Audits</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Schedule and track departmental quality audits</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchAudits} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> Schedule Audit
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Schedule Audit</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Audit Title</label>
                                <Input required placeholder="e.g. Q2 Ward Hygiene Audit" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Audit Type</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.auditType} onChange={e => setForm(p => ({ ...p, auditType: e.target.value }))}>
                                        {AUDIT_TYPES.map(t => <option key={t}>{t}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Department</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.department} onChange={e => setForm(p => ({ ...p, department: e.target.value }))}>
                                        {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Scheduled Date</label>
                                <Input type="date" required value={form.scheduledDate} onChange={e => setForm(p => ({ ...p, scheduledDate: e.target.value }))} />
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : "Schedule Audit"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search audits..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <ClipboardList className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No audits scheduled</p>
                    <p className="text-xs text-gray-400">Schedule a quality audit above.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((audit, i) => {
                            const s = STATUS_CONFIG[audit.status];
                            const StatusIcon = s.icon;
                            return (
                                <motion.div key={audit.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-black text-gray-900">{audit.title}</p>
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${s.color}`}>
                                                    <StatusIcon className="h-3 w-3" /> {s.label}
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-500">{audit.auditType} · {audit.department}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">Auditor: {audit.auditor} · {audit.scheduledDate}</p>
                                        </div>
                                        <div className="flex gap-2">
                                            {audit.status === "scheduled" && (
                                                <button onClick={() => updateStatus(audit, "in_progress")} disabled={!!updating}
                                                    className="h-8 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-colors flex items-center gap-1">
                                                    <PlayCircle className="h-3.5 w-3.5"/> Start
                                                </button>
                                            )}
                                            {audit.status === "in_progress" && (
                                                <button onClick={() => updateStatus(audit, "completed")} disabled={!!updating}
                                                    className="h-8 px-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold transition-colors flex items-center gap-1">
                                                    {updating === audit.id ? <div className="animate-spin h-3 w-3 border border-green-400 border-t-transparent rounded-full"/> : <><CheckCircle2 className="h-3.5 w-3.5"/> Complete</>}
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

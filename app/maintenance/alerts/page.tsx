"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Plus, RefreshCw, X, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface MaintAlert {
    id: string;
    title: string;
    equipmentName: string;
    severity: "info" | "warning" | "critical";
    description: string;
    createdBy: string;
    createdAt?: any;
}

const SEVERITY_CONFIG: Record<MaintAlert["severity"], { label: string; color: string; bg: string }> = {
    info:     { label: "Info",     color: "text-blue-600",  bg: "bg-blue-50 border-blue-100" },
    warning:  { label: "Warning",  color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
    critical: { label: "Critical", color: "text-red-600",   bg: "bg-red-50 border-red-100" },
};

export default function MaintenanceAlertsPage() {
    const { profile } = useAuth();
    const [alerts, setAlerts] = useState<MaintAlert[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ title: "", equipmentName: "", severity: "warning" as MaintAlert["severity"], description: "" });

    useEffect(() => { fetchAlerts(); }, []);

    const fetchAlerts = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "maintAlerts"));
            setAlerts(snap.docs.map(d => ({ id: d.id, ...d.data() } as MaintAlert)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "maintAlerts"), {
                title: form.title.trim(),
                equipmentName: form.equipmentName.trim(),
                severity: form.severity,
                description: form.description.trim(),
                createdBy: profile?.name,
                createdAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ title: "", equipmentName: "", severity: "warning", description: "" });
            fetchAlerts();
        } catch(e) { console.error(e); }
        finally { setCreating(false); }
    };

    const handleDismiss = async (id: string) => {
        try {
            await deleteDoc(doc(db, "maintAlerts", id));
            setAlerts(prev => prev.filter(a => a.id !== id));
        } catch(e) { console.error(e); }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Maintenance Alerts</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Critical equipment warnings and service alerts</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchAlerts} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> New Alert
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Create Alert</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Alert Title</label>
                                    <Input required placeholder="e.g. Service Due" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Equipment</label>
                                    <Input required placeholder="Equipment name" value={form.equipmentName} onChange={e => setForm(p => ({ ...p, equipmentName: e.target.value }))} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Severity</label>
                                <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                    value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value as MaintAlert["severity"] }))}>
                                    <option value="info">Info</option>
                                    <option value="warning">Warning</option>
                                    <option value="critical">Critical</option>
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Description</label>
                                <textarea rows={3} required placeholder="Describe the alert..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:bg-white focus:border-blue-500 outline-none resize-none" />
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : "Create Alert"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : alerts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <AlertCircle className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No active alerts</p>
                    <p className="text-xs text-gray-400">All equipment is operating normally.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {alerts.map((alert, i) => {
                            const s = SEVERITY_CONFIG[alert.severity];
                            return (
                                <motion.div key={alert.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                                    className={`rounded-2xl border p-5 ${s.bg}`}>
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className={`h-5 w-5 shrink-0 mt-0.5 ${s.color}`} />
                                            <div>
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <p className="text-sm font-black text-gray-900">{alert.title}</p>
                                                    <span className={`text-[10px] font-black uppercase ${s.color}`}>{s.label}</span>
                                                </div>
                                                <p className="text-xs font-semibold text-gray-700">{alert.equipmentName}</p>
                                                <p className="text-xs text-gray-500 mt-1">{alert.description}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">By {alert.createdBy} · {alert.createdAt?.seconds ? new Date(alert.createdAt.seconds * 1000).toLocaleDateString() : "—"}</p>
                                            </div>
                                        </div>
                                        <button onClick={() => handleDismiss(alert.id)} className="h-7 w-7 rounded-lg border border-current/20 flex items-center justify-center text-gray-400 hover:bg-white/50 transition-colors shrink-0">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </button>
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

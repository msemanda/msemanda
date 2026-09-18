"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { fmt } from "@/helpers/constants";
import { fmtDate } from "@/lib/ts";
import { AnimatePresence, motion } from "framer-motion";
import { Package, Plus, RefreshCw, X, Search, CheckCircle2, Clock, PackageCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Order {
    id: string;
    patientName: string;
    frame: string;
    lensType: string;
    cost: number;
    status: "ordered" | "ready" | "dispensed";
    notes?: string;
    createdAt?: any;
}

const STATUS_CONFIG: Record<Order["status"], { label: string; color: string; icon: any }> = {
    ordered:   { label: "Ordered",   color: "bg-gray-50 text-gray-500 border-gray-100",    icon: Clock },
    ready:     { label: "Ready for Pickup", color: "bg-amber-50 text-amber-700 border-amber-100", icon: PackageCheck },
    dispensed: { label: "Dispensed", color: "bg-green-50 text-green-700 border-green-100", icon: CheckCircle2 },
};

export default function OpticalDispensingPage() {
    const { profile } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({ patientName: "", frame: "", lensType: "", cost: "" });

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "opticalOrders"));
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as Order)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "opticalOrders"), {
                patientName: form.patientName.trim(),
                frame: form.frame.trim(),
                lensType: form.lensType.trim(),
                cost: Number(form.cost) || 0,
                status: "ordered",
                loggedBy: profile?.name,
                createdAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ patientName: "", frame: "", lensType: "", cost: "" });
            fetchOrders();
        } catch (e) { console.error(e); }
        finally { setCreating(false); }
    };

    const handleStatusChange = async (o: Order, status: Order["status"]) => {
        setUpdating(o.id);
        try {
            await updateDoc(doc(db, "opticalOrders", o.id), { status, updatedAt: serverTimestamp() });
            setOrders(prev => prev.map(x => x.id === o.id ? { ...x, status } : x));
        } catch (e) { console.error(e); }
        finally { setUpdating(null); }
    };

    const filtered = orders.filter(o => !search || o.patientName.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Dispensing</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Frame & lens order tracking and pickups</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchOrders} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> New Order
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Log Frame / Lens Order</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient Name</label>
                                <Input required placeholder="Patient's full name" value={form.patientName} onChange={e => setForm(p => ({ ...p, patientName: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Frame</label>
                                    <Input required placeholder="Frame model" value={form.frame} onChange={e => setForm(p => ({ ...p, frame: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Lens Type</label>
                                    <Input required placeholder="e.g. Progressive" value={form.lensType} onChange={e => setForm(p => ({ ...p, lensType: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Cost (UGX)</label>
                                    <Input type="number" placeholder="0" value={form.cost} onChange={e => setForm(p => ({ ...p, cost: e.target.value }))} />
                                </div>
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : "Save Order"}
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
                    <Package className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No orders yet</p>
                    <p className="text-xs text-gray-400">Log a frame/lens order above.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((o, i) => {
                            const s = STATUS_CONFIG[o.status] || STATUS_CONFIG.ordered;
                            const StatusIcon = s.icon;
                            return (
                                <motion.div key={o.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div>
                                            <p className="text-sm font-black text-gray-900">{o.patientName}</p>
                                            <p className="text-xs text-gray-500">{o.frame} · {o.lensType} · {fmt(o.cost)}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{fmtDate(o.createdAt)}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${s.color}`}>
                                                <StatusIcon className="h-3 w-3" /> {s.label}
                                            </span>
                                            {o.status === "ordered" && (
                                                <button onClick={() => handleStatusChange(o, "ready")} disabled={!!updating}
                                                    className="h-8 px-3 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 text-xs font-bold transition-colors disabled:opacity-50">
                                                    Mark Ready
                                                </button>
                                            )}
                                            {o.status === "ready" && (
                                                <button onClick={() => handleStatusChange(o, "dispensed")} disabled={!!updating}
                                                    className="h-8 px-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                                                    {updating === o.id ? <div className="animate-spin h-3 w-3 border border-green-400 border-t-transparent rounded-full" /> : <><CheckCircle2 className="h-3.5 w-3.5" /> Dispense</>}
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

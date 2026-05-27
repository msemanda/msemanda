"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, Plus, Search, RefreshCw, X, CheckCircle2, Clock } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface IpdOrder {
    id: string;
    patientName: string;
    ward: string;
    orderType: string;
    description: string;
    orderedBy: string;
    status: "pending" | "completed";
    createdAt?: any;
}

const ORDER_TYPES = ["Medication", "Lab Test", "Radiology", "Nursing Care", "Dietary", "Physiotherapy", "Consultation", "Procedure"];
const WARDS = ["General", "ICU", "Pediatrics", "Maternity", "Surgery", "Orthopedics", "Neurology"];

export default function IpdOrdersPage() {
    const { profile } = useAuth();
    const [orders, setOrders] = useState<IpdOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({ patientName: "", ward: WARDS[0], orderType: ORDER_TYPES[0], description: "" });

    useEffect(() => { fetchOrders(); }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "ipdOrders"));
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as IpdOrder)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "ipdOrders"), {
                patientName: form.patientName.trim(),
                ward: form.ward,
                orderType: form.orderType,
                description: form.description.trim(),
                orderedBy: profile?.name,
                status: "pending",
                createdAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ patientName: "", ward: WARDS[0], orderType: ORDER_TYPES[0], description: "" });
            fetchOrders();
        } catch(e) { console.error(e); }
        finally { setCreating(false); }
    };

    const filtered = orders.filter(o =>
        !search || o.patientName.toLowerCase().includes(search.toLowerCase()) ||
        o.orderType.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Inpatient Orders</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Clinical orders for admitted patients</p>
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
                            <h2 className="text-base font-black text-gray-900">New Clinical Order</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient Name</label>
                                    <Input required placeholder="Full name" value={form.patientName} onChange={e => setForm(p => ({ ...p, patientName: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Ward</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.ward} onChange={e => setForm(p => ({ ...p, ward: e.target.value }))}>
                                        {WARDS.map(w => <option key={w}>{w}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Order Type</label>
                                <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                    value={form.orderType} onChange={e => setForm(p => ({ ...p, orderType: e.target.value }))}>
                                    {ORDER_TYPES.map(t => <option key={t}>{t}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Order Details</label>
                                <textarea rows={3} required placeholder="Describe the order..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:bg-white focus:border-blue-500 outline-none resize-none" />
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : "Submit Order"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search patient or order type..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <ClipboardList className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No orders</p>
                    <p className="text-xs text-gray-400">Create clinical orders for admitted patients.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-50">
                        {filtered.map(o => (
                            <div key={o.id} className="px-5 py-4 flex items-start justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-start gap-3 min-w-0">
                                    <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-600 text-xs shrink-0 mt-0.5">
                                        {o.patientName?.charAt(0) || "?"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-gray-900">{o.patientName}</p>
                                        <p className="text-xs text-gray-500">{o.ward} · {o.orderType}</p>
                                        <p className="text-xs text-gray-400 mt-0.5 truncate">{o.description}</p>
                                        <p className="text-[10px] text-gray-300 mt-0.5">By {o.orderedBy} · {o.createdAt?.seconds ? new Date(o.createdAt.seconds * 1000).toLocaleDateString() : "—"}</p>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 shrink-0 ${
                                    o.status === "completed" ? "bg-green-50 text-green-700 border-green-100" : "bg-gray-50 text-gray-500 border-gray-100"
                                }`}>
                                    {o.status === "completed" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                                    {o.status === "completed" ? "Completed" : "Pending"}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

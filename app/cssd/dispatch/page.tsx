"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Truck, Plus, Search, RefreshCw, X, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface DispatchRecord {
    id: string;
    itemName: string;
    quantity: number;
    destination: string;
    receivedBy: string;
    dispatchedBy: string;
    dispatchedAt?: any;
    notes?: string;
}

const DEPARTMENTS = ["Theatre", "Ward A", "Ward B", "ICU", "Maternity", "Outpatient", "Emergency", "Dental", "Physiotherapy"];

export default function CssdDispatchPage() {
    const { profile } = useAuth();
    const [records, setRecords] = useState<DispatchRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({ itemName: "", quantity: "1", destination: DEPARTMENTS[0], receivedBy: "", notes: "" });

    useEffect(() => { fetchRecords(); }, []);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "cssdDispatch"));
            setRecords(snap.docs.map(d => ({ id: d.id, ...d.data() } as DispatchRecord)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDispatch = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "cssdDispatch"), {
                itemName: form.itemName.trim(),
                quantity: parseInt(form.quantity),
                destination: form.destination,
                receivedBy: form.receivedBy.trim(),
                dispatchedBy: profile?.name,
                notes: form.notes.trim(),
                dispatchedAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ itemName: "", quantity: "1", destination: DEPARTMENTS[0], receivedBy: "", notes: "" });
            fetchRecords();
        } catch(e) { console.error(e); }
        finally { setCreating(false); }
    };

    const filtered = records.filter(r =>
        !search || r.itemName.toLowerCase().includes(search.toLowerCase()) ||
        r.destination.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Dispatch Log</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Record sterile item dispatch to departments</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchRecords} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> Record Dispatch
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Record Dispatch</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleDispatch} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Item Name</label>
                                    <Input required placeholder="Sterile item name" value={form.itemName} onChange={e => setForm(p => ({ ...p, itemName: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Quantity</label>
                                    <Input type="number" min="1" required value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Destination</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.destination} onChange={e => setForm(p => ({ ...p, destination: e.target.value }))}>
                                        {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Received By</label>
                                    <Input required placeholder="Staff name" value={form.receivedBy} onChange={e => setForm(p => ({ ...p, receivedBy: e.target.value }))} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Notes (optional)</label>
                                <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:bg-white focus:border-blue-500 outline-none resize-none" />
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : "Record Dispatch"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <Truck className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No dispatch records</p>
                    <p className="text-xs text-gray-400">Record a sterile item dispatch above.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Item", "Qty", "Destination", "Received By", "Dispatched By", "Date"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(r => (
                                <tr key={r.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-bold text-gray-900">{r.itemName}</p>
                                        {r.notes && <p className="text-xs text-gray-400 truncate max-w-[140px]">{r.notes}</p>}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-700">{r.quantity}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{r.destination}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{r.receivedBy}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{r.dispatchedBy}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400">
                                        {r.dispatchedAt?.seconds ? new Date(r.dispatchedAt.seconds * 1000).toLocaleDateString() : "—"}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

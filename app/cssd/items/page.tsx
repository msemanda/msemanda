"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Plus, Search, RefreshCw, X, CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface CssdItem {
    id: string;
    name: string;
    itemType: string;
    quantity: number;
    requestedBy: string;
    department: string;
    status: "pending" | "in_cycle" | "completed" | "failed";
    createdAt?: any;
    notes?: string;
}

const ITEM_TYPES = ["Surgical Instruments", "Dressing Sets", "Trays", "Linen", "Gloves", "Syringes", "Other"];
const DEPARTMENTS = ["Theatre", "Ward A", "Ward B", "ICU", "Maternity", "Outpatient", "Emergency", "Dental", "Physiotherapy"];

const STATUS_CONFIG: Record<CssdItem["status"], { label: string; color: string; icon: any }> = {
    pending:    { label: "Pending",    color: "bg-gray-50 text-gray-500 border-gray-100",    icon: Clock },
    in_cycle:   { label: "In Cycle",  color: "bg-blue-50 text-blue-600 border-blue-100",    icon: RefreshCw },
    completed:  { label: "Sterilized",color: "bg-green-50 text-green-700 border-green-100", icon: CheckCircle2 },
    failed:     { label: "Failed",    color: "bg-red-50 text-red-600 border-red-100",       icon: XCircle },
};

export default function CssdItemsPage() {
    const { profile } = useAuth();
    const [items, setItems] = useState<CssdItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({
        name: "", itemType: ITEM_TYPES[0], quantity: "1",
        department: DEPARTMENTS[0], notes: "",
    });

    useEffect(() => { fetchItems(); }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "cssdItems"));
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as CssdItem)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "cssdItems"), {
                name: form.name.trim(),
                itemType: form.itemType,
                quantity: parseInt(form.quantity),
                department: form.department,
                requestedBy: profile?.name,
                status: "pending",
                notes: form.notes.trim(),
                createdAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ name: "", itemType: ITEM_TYPES[0], quantity: "1", department: DEPARTMENTS[0], notes: "" });
            fetchItems();
        } catch(e) { console.error(e); }
        finally { setCreating(false); }
    };

    const filtered = items.filter(i =>
        !search || i.name.toLowerCase().includes(search.toLowerCase()) ||
        i.department.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Sterilization Items</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Track items submitted for CSSD sterilization</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchItems} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> New Request
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Request Sterilization</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Item Name</label>
                                    <Input required placeholder="e.g. Forceps set" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Quantity</label>
                                    <Input type="number" min="1" required value={form.quantity} onChange={e => setForm(p => ({ ...p, quantity: e.target.value }))} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Item Type</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.itemType} onChange={e => setForm(p => ({ ...p, itemType: e.target.value }))}>
                                        {ITEM_TYPES.map(t => <option key={t}>{t}</option>)}
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
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Notes (optional)</label>
                                <textarea rows={2} placeholder="Any special instructions..." value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:bg-white focus:border-blue-500 outline-none resize-none" />
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : "Submit for Sterilization"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search items..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <Package className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No items found</p>
                    <p className="text-xs text-gray-400">Submit a new sterilization request above.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Item", "Type", "Qty", "Department", "Requested By", "Status"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(item => {
                                const s = STATUS_CONFIG[item.status];
                                const StatusIcon = s.icon;
                                return (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-bold text-gray-900">{item.name}</p>
                                            {item.notes && <p className="text-xs text-gray-400 truncate max-w-[160px]">{item.notes}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{item.itemType}</td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-700">{item.quantity}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{item.department}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{item.requestedBy || "—"}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 w-fit ${s.color}`}>
                                                <StatusIcon className="h-3 w-3" /> {s.label}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

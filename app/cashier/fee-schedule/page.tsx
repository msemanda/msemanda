"use client";

import { useEffect, useState } from "react";
import {
    collection, getDocs, addDoc, updateDoc, deleteDoc,
    doc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    ListChecks, Plus, Pencil, Trash2, CheckCircle2,
    XCircle, Loader2, RefreshCw, Save, X,
} from "lucide-react";

interface FeeItem {
    id: string;
    name: string;
    category: string;
    amount: number;
    description?: string;
    active: boolean;
}

const CATEGORIES = [
    "CONSULTATION", "LAB", "RADIOLOGY", "MEDICATION",
    "NURSING", "PROCEDURE", "DIET", "OTHER",
];

const CAT_COLOR: Record<string, string> = {
    CONSULTATION: "bg-blue-50 text-blue-700",
    LAB:          "bg-amber-50 text-amber-700",
    RADIOLOGY:    "bg-purple-50 text-purple-700",
    MEDICATION:   "bg-teal-50 text-teal-700",
    NURSING:      "bg-rose-50 text-rose-700",
    PROCEDURE:    "bg-indigo-50 text-indigo-700",
    DIET:         "bg-green-50 text-green-700",
    OTHER:        "bg-gray-50 text-gray-600",
};

const DEFAULT_FEES: Omit<FeeItem, "id">[] = [
    { name: "General Consultation",    category: "CONSULTATION", amount: 30000,  active: true },
    { name: "Specialist Consultation", category: "CONSULTATION", amount: 80000,  active: true },
    { name: "Emergency Consultation",  category: "CONSULTATION", amount: 50000,  active: true },
    { name: "Follow-up Visit",         category: "CONSULTATION", amount: 15000,  active: true },
    { name: "Dental Consultation",     category: "CONSULTATION", amount: 40000,  active: true },
    { name: "CBC (Blood Count)",        category: "LAB",          amount: 25000,  active: true },
    { name: "Malaria RDT",             category: "LAB",          amount: 10000,  active: true },
    { name: "Urinalysis",              category: "LAB",          amount: 15000,  active: true },
    { name: "Chest X-Ray",             category: "RADIOLOGY",    amount: 60000,  active: true },
    { name: "Ultrasound (Abdomen)",    category: "RADIOLOGY",    amount: 80000,  active: true },
    { name: "Physiotherapy Session",   category: "PROCEDURE",    amount: 35000,  active: true },
    { name: "Dressing & Wound Care",   category: "NURSING",      amount: 20000,  active: true },
    { name: "IV Fluid Administration", category: "NURSING",      amount: 15000,  active: true },
    { name: "Hospital Meal (per day)", category: "DIET",         amount: 25000,  active: true },
];

function emptyForm() {
    return { name: "", category: CATEGORIES[0], amount: "", description: "" };
}

export default function FeeSchedulePage() {
    const { profile } = useAuth();
    const [fees, setFees] = useState<FeeItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [seeding, setSeeding] = useState(false);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<FeeItem | null>(null);
    const [form, setForm] = useState(emptyForm());
    const [catFilter, setCatFilter] = useState("ALL");

    const load = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, "feeSchedule"), orderBy("category")));
            setFees(snap.docs.map(d => ({ id: d.id, ...d.data() } as FeeItem)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, []);

    const openAdd = () => {
        setEditItem(null);
        setForm(emptyForm());
        setShowForm(true);
    };

    const openEdit = (item: FeeItem) => {
        setEditItem(item);
        setForm({ name: item.name, category: item.category, amount: item.amount.toString(), description: item.description || "" });
        setShowForm(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const payload = {
                name: form.name.trim(),
                category: form.category,
                amount: parseFloat(form.amount) || 0,
                description: form.description.trim(),
                active: true,
                updatedAt: serverTimestamp(),
            };
            if (editItem) {
                await updateDoc(doc(db, "feeSchedule", editItem.id), payload);
            } else {
                await addDoc(collection(db, "feeSchedule"), { ...payload, createdBy: profile?.name, createdAt: serverTimestamp() });
            }
            setShowForm(false);
            setEditItem(null);
            load();
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const toggleActive = async (item: FeeItem) => {
        await updateDoc(doc(db, "feeSchedule", item.id), { active: !item.active });
        setFees(prev => prev.map(f => f.id === item.id ? { ...f, active: !f.active } : f));
    };

    const handleDelete = async (id: string) => {
        setDeletingId(id);
        try {
            await deleteDoc(doc(db, "feeSchedule", id));
            setFees(prev => prev.filter(f => f.id !== id));
        } catch (e) { console.error(e); }
        finally { setDeletingId(null); }
    };

    const seedDefaults = async () => {
        if (fees.length > 0) return;
        setSeeding(true);
        try {
            await Promise.all(DEFAULT_FEES.map(f =>
                addDoc(collection(db, "feeSchedule"), { ...f, createdBy: profile?.name, createdAt: serverTimestamp() })
            ));
            load();
        } catch (e) { console.error(e); }
        finally { setSeeding(false); }
    };

    const categories = ["ALL", ...CATEGORIES.filter(c => fees.some(f => f.category === c))];
    const filtered = fees.filter(f => catFilter === "ALL" || f.category === catFilter);
    const grouped = CATEGORIES.reduce<Record<string, FeeItem[]>>((acc, cat) => {
        const items = filtered.filter(f => f.category === cat);
        if (items.length) acc[cat] = items;
        return acc;
    }, {});

    return (
        <div className="max-w-5xl mx-auto space-y-5 pb-10">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <ListChecks className="h-6 w-6 text-blue-600" /> Fee Schedule
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Configure prices for all hospital services — amounts auto-fill across the system
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={load} disabled={loading}
                        className="h-9 w-9 rounded-xl border border-gray-100 bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    {fees.length === 0 && !loading && (
                        <button onClick={seedDefaults} disabled={seeding}
                            className="h-9 px-4 rounded-xl border border-indigo-200 bg-indigo-50 text-indigo-700 text-xs font-bold flex items-center gap-1.5 hover:bg-indigo-100 transition-colors disabled:opacity-50">
                            {seeding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                            Load Defaults
                        </button>
                    )}
                    <button onClick={openAdd}
                        className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> Add Service
                    </button>
                </div>
            </div>

            {/* Add / Edit form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden">
                        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4 max-w-xl">
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-black text-gray-900">{editItem ? "Edit Service" : "Add New Service"}</h2>
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="h-6 w-6 rounded-lg border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Service Name</label>
                                    <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                                        placeholder="e.g. General Consultation"
                                        className="h-10 w-full px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Category</label>
                                    <select required value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                        className="h-10 w-full px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold focus:bg-white focus:border-blue-500 outline-none">
                                        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Amount (UGX)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 pointer-events-none">UGX</span>
                                        <input required type="number" min="0" value={form.amount}
                                            onChange={e => setForm(p => ({ ...p, amount: e.target.value }))}
                                            className="h-10 w-full pl-12 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-bold focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                    </div>
                                </div>
                                <div className="col-span-2 space-y-1">
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">Description <span className="text-gray-300 font-normal normal-case">(optional)</span></label>
                                    <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                                        placeholder="Short note visible to staff"
                                        className="h-10 w-full px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium focus:bg-white focus:border-blue-500 outline-none" />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowForm(false)}
                                    className="h-9 px-4 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={saving}
                                    className="flex-1 h-9 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors">
                                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><Save className="h-3.5 w-3.5" /> {editItem ? "Save Changes" : "Add Service"}</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Category filter */}
            {categories.length > 1 && (
                <div className="flex gap-1.5 flex-wrap">
                    {categories.map(c => (
                        <button key={c} onClick={() => setCatFilter(c)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${catFilter === c ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                            {c === "ALL" ? "All Services" : c}
                        </button>
                    ))}
                </div>
            )}

            {/* Fee list */}
            {loading ? (
                <div className="flex items-center justify-center py-20 gap-2 text-gray-400 text-sm">
                    <Loader2 className="h-5 w-5 animate-spin" /> Loading fee schedule…
                </div>
            ) : Object.keys(grouped).length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
                    <ListChecks className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                    <p className="text-sm font-black text-gray-700 mb-1">No services configured yet</p>
                    <p className="text-xs text-gray-400">Click "Load Defaults" to seed standard hospital fees or "Add Service" to start from scratch.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {Object.entries(grouped).map(([cat, items]) => (
                        <div key={cat} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                                <span className={`text-[10px] font-black px-2 py-0.5 rounded-md ${CAT_COLOR[cat]}`}>{cat}</span>
                                <span className="text-xs text-gray-400">{items.length} service{items.length !== 1 ? "s" : ""}</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {items.map((item, i) => (
                                    <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                        className={`px-5 py-3.5 flex items-center justify-between gap-4 ${!item.active ? "opacity-50" : ""}`}>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-bold text-gray-900">{item.name}</p>
                                                {!item.active && <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">Inactive</span>}
                                            </div>
                                            {item.description && <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>}
                                        </div>
                                        <div className="flex items-center gap-3 shrink-0">
                                            <p className="text-sm font-black text-gray-900 whitespace-nowrap">
                                                UGX {item.amount.toLocaleString()}
                                            </p>
                                            <button onClick={() => toggleActive(item)}
                                                className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors ${item.active ? "text-green-600 hover:bg-green-50" : "text-gray-400 hover:bg-gray-50"}`}
                                                title={item.active ? "Deactivate" : "Activate"}>
                                                {item.active ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
                                            </button>
                                            <button onClick={() => openEdit(item)}
                                                className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                                <Pencil className="h-3.5 w-3.5" />
                                            </button>
                                            <button onClick={() => handleDelete(item.id)} disabled={deletingId === item.id}
                                                className="h-7 w-7 rounded-lg flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors disabled:opacity-50">
                                                {deletingId === item.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                                            </button>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

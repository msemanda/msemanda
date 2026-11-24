"use client";

import { useEffect, useState } from "react";
import {
    collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, query, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Package, Plus, Search, RefreshCw, AlertTriangle, CheckCircle2,
    X, Edit2, ChevronDown,
} from "lucide-react";
import { DRUG_CATEGORIES } from "@/helpers/constants";

interface DrugStock {
    id: string;
    drugName: string;
    genericName?: string;
    category: string;
    quantity: number;
    unit: string;
    reorderLevel: number;
    unitPrice: number;
    supplier?: string;
    batchNo?: string;
    expiryDate?: string;
    lastRestocked?: any;
    lastRestockedBy?: string;
}

const UNITS = ["tablets", "capsules", "ml", "mg", "vials", "ampoules", "sachets", "bottles", "units"];

const STOCK_STATUS = (qty: number, reorder: number) => {
    if (qty === 0) return { label: "Out of Stock", cls: "bg-red-50 text-red-700 border-red-100" };
    if (qty <= reorder) return { label: "Low Stock", cls: "bg-amber-50 text-amber-700 border-amber-100" };
    return { label: "In Stock", cls: "bg-green-50 text-green-700 border-green-100" };
};

const EMPTY: Omit<DrugStock, "id"> = {
    drugName: "", genericName: "", category: DRUG_CATEGORIES[0],
    quantity: 0, unit: "tablets", reorderLevel: 10, unitPrice: 0,
    supplier: "", batchNo: "", expiryDate: "",
};

export default function PharmacyInventoryPage() {
    const { profile } = useAuth();
    const [stock, setStock] = useState<DrugStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filterCat, setFilterCat] = useState("All");
    const [showForm, setShowForm] = useState(false);
    const [editItem, setEditItem] = useState<DrugStock | null>(null);
    const [form, setForm] = useState({ ...EMPTY });
    const [saving, setSaving] = useState(false);
    const [restockId, setRestockId] = useState<string | null>(null);
    const [restockQty, setRestockQty] = useState("");

    useEffect(() => { fetchStock(); }, []);

    const fetchStock = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, "pharmacyStock"), orderBy("drugName")));
            setStock(snap.docs.map(d => ({ id: d.id, ...d.data() } as DrugStock)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleSave = async () => {
        if (!form.drugName.trim()) return;
        setSaving(true);
        try {
            if (editItem) {
                await updateDoc(doc(db, "pharmacyStock", editItem.id), {
                    ...form,
                    updatedAt: serverTimestamp(),
                    updatedBy: profile?.name,
                });
                setStock(prev => prev.map(s => s.id === editItem.id ? { ...s, ...form } : s));
            } else {
                const ref = await addDoc(collection(db, "pharmacyStock"), {
                    ...form,
                    createdAt: serverTimestamp(),
                    createdBy: profile?.name,
                    lastRestocked: serverTimestamp(),
                    lastRestockedBy: profile?.name,
                });
                setStock(prev => [...prev, { id: ref.id, ...form }].sort((a, b) => a.drugName.localeCompare(b.drugName)));
            }
            setShowForm(false);
            setEditItem(null);
            setForm({ ...EMPTY });
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const handleRestock = async (item: DrugStock) => {
        const qty = parseInt(restockQty);
        if (!qty || qty <= 0) return;
        try {
            const newQty = item.quantity + qty;
            await updateDoc(doc(db, "pharmacyStock", item.id), {
                quantity: newQty,
                lastRestocked: serverTimestamp(),
                lastRestockedBy: profile?.name,
            });
            setStock(prev => prev.map(s => s.id === item.id ? { ...s, quantity: newQty, lastRestockedBy: profile?.name } : s));
            setRestockId(null);
            setRestockQty("");
        } catch (e) { console.error(e); }
    };

    const openEdit = (item: DrugStock) => {
        setEditItem(item);
        setForm({
            drugName: item.drugName, genericName: item.genericName || "",
            category: item.category, quantity: item.quantity, unit: item.unit,
            reorderLevel: item.reorderLevel, unitPrice: item.unitPrice,
            supplier: item.supplier || "", batchNo: item.batchNo || "",
            expiryDate: item.expiryDate || "",
        });
        setShowForm(true);
    };

    const filtered = stock.filter(s => {
        const matchSearch = !search || s.drugName.toLowerCase().includes(search.toLowerCase()) ||
            (s.genericName || "").toLowerCase().includes(search.toLowerCase());
        const matchCat = filterCat === "All" || s.category === filterCat;
        return matchSearch && matchCat;
    });

    const lowCount = stock.filter(s => s.quantity > 0 && s.quantity <= s.reorderLevel).length;
    const outCount = stock.filter(s => s.quantity === 0).length;

    // Suggested categories plus any already in use (e.g. typed in freehand
    // via the datalist below) so the filter and form always reflect reality.
    const categoryOptions = Array.from(new Set([...DRUG_CATEGORIES, ...stock.map(s => s.category)])).filter(Boolean).sort();

    return (
        <div className="space-y-5 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                    <h1 className="text-xl font-black text-gray-900">Drug Inventory</h1>
                    <p className="text-sm text-gray-500 mt-0.5">{stock.length} drugs tracked · {outCount} out of stock · {lowCount} low stock</p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchStock} className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => { setEditItem(null); setForm({ ...EMPTY }); setShowForm(true); }}
                        className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm">
                        <Plus className="h-3.5 w-3.5" /> Add Drug
                    </button>
                </div>
            </div>

            {/* Alert banners */}
            {(outCount > 0 || lowCount > 0) && (
                <div className="flex flex-col sm:flex-row gap-3">
                    {outCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl">
                            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                            <p className="text-xs font-bold text-red-700">{outCount} drug{outCount !== 1 ? "s" : ""} completely out of stock</p>
                        </div>
                    )}
                    {lowCount > 0 && (
                        <div className="flex items-center gap-2 px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl">
                            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                            <p className="text-xs font-bold text-amber-700">{lowCount} drug{lowCount !== 1 ? "s" : ""} below reorder level</p>
                        </div>
                    )}
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative max-w-xs w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input placeholder="Search drug or generic name..." value={search} onChange={e => setSearch(e.target.value)}
                        className="h-9 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                </div>
                <div className="relative">
                    <select value={filterCat} onChange={e => setFilterCat(e.target.value)}
                        className="h-9 pl-3 pr-8 rounded-xl border border-gray-200 bg-white text-xs font-medium appearance-none focus:border-blue-500 outline-none">
                        <option value="All">All Categories</option>
                        {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                </div>
            </div>

            {/* Table */}
            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-7 w-7 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <Package className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No drugs found</p>
                    <p className="text-xs text-gray-400">Add the first drug to start tracking inventory.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-xs">
                            <thead>
                                <tr className="border-b border-gray-100 bg-gray-50">
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Drug</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Category</th>
                                    <th className="text-right px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Qty</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="text-right px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Unit Price</th>
                                    <th className="text-left px-4 py-3 font-bold text-gray-500 uppercase tracking-wider">Expiry</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((item, i) => {
                                    const status = STOCK_STATUS(item.quantity, item.reorderLevel);
                                    return (
                                        <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                            className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3">
                                                <p className="font-bold text-gray-900">{item.drugName}</p>
                                                {item.genericName && <p className="text-gray-400 text-[10px]">{item.genericName}</p>}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500">{item.category}</td>
                                            <td className="px-4 py-3 text-right">
                                                {restockId === item.id ? (
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <input type="number" min="1" placeholder="Qty" value={restockQty}
                                                            onChange={e => setRestockQty(e.target.value)}
                                                            className="w-16 h-7 px-2 rounded-lg border border-blue-300 text-xs font-bold text-center focus:outline-none" />
                                                        <button onClick={() => handleRestock(item)}
                                                            className="h-7 px-2 rounded-lg bg-green-600 text-white text-[10px] font-bold">Add</button>
                                                        <button onClick={() => { setRestockId(null); setRestockQty(""); }}
                                                            className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400">
                                                            <X className="h-3 w-3" /></button>
                                                    </div>
                                                ) : (
                                                    <span className={`font-black ${item.quantity === 0 ? "text-red-600" : item.quantity <= item.reorderLevel ? "text-amber-600" : "text-gray-900"}`}>
                                                        {item.quantity} <span className="font-normal text-gray-400">{item.unit}</span>
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold ${status.cls}`}>{status.label}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-bold text-gray-700">UGX {item.unitPrice.toLocaleString()}</td>
                                            <td className="px-4 py-3 text-gray-500">{item.expiryDate || "—"}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <button onClick={() => setRestockId(item.id)}
                                                        className="h-7 px-2.5 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 text-[10px] font-bold transition-colors">
                                                        + Stock
                                                    </button>
                                                    <button onClick={() => openEdit(item)}
                                                        className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors">
                                                        <Edit2 className="h-3 w-3" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Add / Edit Modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between p-5 border-b border-gray-100">
                                <h2 className="text-base font-black text-gray-900">{editItem ? "Edit Drug" : "Add New Drug"}</h2>
                                <button onClick={() => { setShowForm(false); setEditItem(null); }}
                                    className="h-8 w-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:text-gray-700">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Drug Name *</label>
                                        <input value={form.drugName} onChange={e => setForm(f => ({ ...f, drugName: e.target.value }))}
                                            placeholder="e.g. Amoxicillin 500mg"
                                            className="h-9 w-full px-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Generic Name</label>
                                        <input value={form.genericName} onChange={e => setForm(f => ({ ...f, genericName: e.target.value }))}
                                            placeholder="e.g. Amoxicillin"
                                            className="h-9 w-full px-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Category</label>
                                        <input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                                            list="drug-category-options" placeholder="e.g. Antibiotics (PO)"
                                            className="h-9 w-full px-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-white" />
                                        <datalist id="drug-category-options">
                                            {categoryOptions.map(c => <option key={c} value={c} />)}
                                        </datalist>
                                        <p className="text-[10px] text-gray-400 mt-1">Pick a suggestion or type a new category.</p>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Unit</label>
                                        <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))}
                                            className="h-9 w-full px-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 outline-none bg-white">
                                            {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Quantity</label>
                                        <input type="number" min="0" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 0 }))}
                                            className="h-9 w-full px-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Reorder Level</label>
                                        <input type="number" min="0" value={form.reorderLevel} onChange={e => setForm(f => ({ ...f, reorderLevel: parseInt(e.target.value) || 0 }))}
                                            className="h-9 w-full px-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Unit Price (UGX)</label>
                                        <input type="number" min="0" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: parseFloat(e.target.value) || 0 }))}
                                            className="h-9 w-full px-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Expiry Date</label>
                                        <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))}
                                            className="h-9 w-full px-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Batch No.</label>
                                        <input value={form.batchNo} onChange={e => setForm(f => ({ ...f, batchNo: e.target.value }))}
                                            placeholder="e.g. BT-2024-001"
                                            className="h-9 w-full px-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                    </div>
                                    <div className="col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Supplier</label>
                                        <input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))}
                                            placeholder="Supplier name"
                                            className="h-9 w-full px-3 rounded-xl border border-gray-200 text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2 p-5 border-t border-gray-100">
                                <button onClick={() => { setShowForm(false); setEditItem(null); }}
                                    className="flex-1 h-10 rounded-xl border border-gray-200 text-sm font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleSave} disabled={saving || !form.drugName.trim()}
                                    className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50">
                                    {saving ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <><CheckCircle2 className="h-4 w-4" /> {editItem ? "Save Changes" : "Add Drug"}</>}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

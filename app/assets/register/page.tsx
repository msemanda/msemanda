"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { Building2, Plus, Search, RefreshCw, X } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Asset {
    id: string;
    assetNo: string;
    name: string;
    category: string;
    location: string;
    purchaseValue: number;
    purchaseDate: string;
    usefulLifeYears: number;
    condition: string;
    supplier?: string;
}

const CATEGORIES = ["Medical Equipment", "Furniture", "IT & Electronics", "Vehicles", "Buildings & Land", "Office Equipment", "Laboratory Equipment"];
const LOCATIONS = ["Administration", "Theatre", "ICU", "Ward A", "Ward B", "OPD", "Radiology", "Lab", "Pharmacy", "Physiotherapy", "Kitchen"];
const CONDITIONS = ["Excellent", "Good", "Fair", "Poor"];

export default function AssetsRegisterPage() {
    const { profile } = useAuth();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({
        name: "", category: CATEGORIES[0], location: LOCATIONS[0],
        purchaseValue: "", purchaseDate: "", usefulLifeYears: "5",
        condition: CONDITIONS[0], supplier: "",
    });

    useEffect(() => { fetchAssets(); }, []);

    const fetchAssets = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "fixedAssets"));
            setAssets(snap.docs.map(d => ({ id: d.id, ...d.data() } as Asset)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            const assetNo = `AST-${Date.now().toString().slice(-6)}`;
            await addDoc(collection(db, "fixedAssets"), {
                assetNo,
                name: form.name.trim(),
                category: form.category,
                location: form.location,
                purchaseValue: parseFloat(form.purchaseValue),
                purchaseDate: form.purchaseDate,
                usefulLifeYears: parseInt(form.usefulLifeYears),
                condition: form.condition,
                supplier: form.supplier.trim(),
                registeredBy: profile?.name,
                createdAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ name: "", category: CATEGORIES[0], location: LOCATIONS[0], purchaseValue: "", purchaseDate: "", usefulLifeYears: "5", condition: CONDITIONS[0], supplier: "" });
            fetchAssets();
        } catch(e) { console.error(e); }
        finally { setCreating(false); }
    };

    const filtered = assets.filter(a =>
        !search || a.name.toLowerCase().includes(search.toLowerCase()) ||
        a.category.toLowerCase().includes(search.toLowerCase()) ||
        a.assetNo?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Asset Register</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Register and manage hospital fixed assets</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchAssets} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> Add Asset
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Register Asset</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Asset Name</label>
                                    <Input required placeholder="e.g. Operating Table" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Category</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Location</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}>
                                        {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Condition</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value }))}>
                                        {CONDITIONS.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Purchase Value (UGX)</label>
                                    <Input type="number" required min="0" placeholder="0" value={form.purchaseValue} onChange={e => setForm(p => ({ ...p, purchaseValue: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Purchase Date</label>
                                    <Input type="date" required value={form.purchaseDate} onChange={e => setForm(p => ({ ...p, purchaseDate: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Useful Life (years)</label>
                                    <Input type="number" required min="1" value={form.usefulLifeYears} onChange={e => setForm(p => ({ ...p, usefulLifeYears: e.target.value }))} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Supplier (optional)</label>
                                <Input placeholder="Supplier name" value={form.supplier} onChange={e => setForm(p => ({ ...p, supplier: e.target.value }))} />
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : "Register Asset"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search assets..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <Building2 className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No assets registered</p>
                    <p className="text-xs text-gray-400">Add a fixed asset above.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Asset", "Category", "Location", "Purchase Value", "Useful Life", "Condition"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(a => (
                                <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3">
                                        <p className="text-sm font-bold text-gray-900">{a.name}</p>
                                        <p className="text-xs font-mono text-gray-400">{a.assetNo}</p>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{a.category}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{a.location}</td>
                                    <td className="px-4 py-3 text-sm font-bold text-gray-700">UGX {(a.purchaseValue || 0).toLocaleString()}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{a.usefulLifeYears}y</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                            a.condition === "Excellent" ? "bg-green-50 text-green-700 border-green-100" :
                                            a.condition === "Good" ? "bg-blue-50 text-blue-600 border-blue-100" :
                                            a.condition === "Fair" ? "bg-amber-50 text-amber-700 border-amber-100" :
                                            "bg-red-50 text-red-600 border-red-100"
                                        }`}>{a.condition}</span>
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

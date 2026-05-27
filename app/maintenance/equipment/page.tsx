"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { Wrench, Plus, Search, RefreshCw, X, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Equipment {
    id: string;
    name: string;
    model: string;
    serialNo: string;
    location: string;
    category: string;
    condition: "good" | "fair" | "poor" | "out_of_service";
    lastServiceDate: string;
    nextServiceDate: string;
    purchaseDate?: string;
}

const CATEGORIES = ["Diagnostic", "Surgical", "Life Support", "Imaging", "Laboratory", "Rehabilitation", "Administrative"];
const LOCATIONS = ["Theatre", "ICU", "Ward A", "Ward B", "OPD", "Radiology", "Lab", "Pharmacy", "Physiotherapy", "Admin"];
const CONDITION_CONFIG: Record<Equipment["condition"], { label: string; color: string }> = {
    good:           { label: "Good",           color: "bg-green-50 text-green-700 border-green-100" },
    fair:           { label: "Fair",           color: "bg-amber-50 text-amber-700 border-amber-100" },
    poor:           { label: "Poor",           color: "bg-red-50 text-red-600 border-red-100" },
    out_of_service: { label: "Out of Service", color: "bg-gray-100 text-gray-500 border-gray-200" },
};

export default function MaintenanceEquipmentPage() {
    const { profile } = useAuth();
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({
        name: "", model: "", serialNo: "", location: LOCATIONS[0],
        category: CATEGORIES[0], condition: "good" as Equipment["condition"],
        lastServiceDate: "", nextServiceDate: "", purchaseDate: "",
    });

    useEffect(() => { fetchEquipment(); }, []);

    const fetchEquipment = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "maintEquipment"));
            setEquipment(snap.docs.map(d => ({ id: d.id, ...d.data() } as Equipment)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "maintEquipment"), {
                ...form,
                registeredBy: profile?.name,
                createdAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ name: "", model: "", serialNo: "", location: LOCATIONS[0], category: CATEGORIES[0], condition: "good", lastServiceDate: "", nextServiceDate: "", purchaseDate: "" });
            fetchEquipment();
        } catch(e) { console.error(e); }
        finally { setCreating(false); }
    };

    const filtered = equipment.filter(e =>
        !search || e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.location.toLowerCase().includes(search.toLowerCase()) ||
        e.serialNo.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Equipment Register</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Hospital equipment inventory and condition tracking</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchEquipment} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> Register Equipment
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Register Equipment</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleRegister} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Equipment Name</label>
                                    <Input required placeholder="e.g. Ventilator" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Model</label>
                                    <Input placeholder="Model number" value={form.model} onChange={e => setForm(p => ({ ...p, model: e.target.value }))} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Serial No</label>
                                    <Input placeholder="Serial number" value={form.serialNo} onChange={e => setForm(p => ({ ...p, serialNo: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Location</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}>
                                        {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Category</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}>
                                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Condition</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.condition} onChange={e => setForm(p => ({ ...p, condition: e.target.value as Equipment["condition"] }))}>
                                        <option value="good">Good</option>
                                        <option value="fair">Fair</option>
                                        <option value="poor">Poor</option>
                                        <option value="out_of_service">Out of Service</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Last Service</label>
                                    <Input type="date" value={form.lastServiceDate} onChange={e => setForm(p => ({ ...p, lastServiceDate: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Next Service</label>
                                    <Input type="date" value={form.nextServiceDate} onChange={e => setForm(p => ({ ...p, nextServiceDate: e.target.value }))} />
                                </div>
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : "Register Equipment"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search by name, location, serial no..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <Wrench className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No equipment registered</p>
                    <p className="text-xs text-gray-400">Register hospital equipment above.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Equipment", "Category", "Location", "Serial No", "Condition", "Next Service"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(eq => {
                                const c = CONDITION_CONFIG[eq.condition];
                                const isOverdue = eq.nextServiceDate && new Date(eq.nextServiceDate) < new Date();
                                return (
                                    <tr key={eq.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-bold text-gray-900">{eq.name}</p>
                                            {eq.model && <p className="text-xs text-gray-400">{eq.model}</p>}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{eq.category}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{eq.location}</td>
                                        <td className="px-4 py-3 text-xs font-mono text-gray-400">{eq.serialNo || "—"}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${c.color}`}>{c.label}</span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-bold ${isOverdue ? "text-red-500" : "text-gray-700"}`}>
                                                {eq.nextServiceDate || "—"}
                                            </span>
                                            {isOverdue && <span className="ml-1 text-[10px] text-red-500">Overdue</span>}
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

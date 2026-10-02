"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Package, Search, AlertTriangle, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface InventoryItem {
    id: string;
    name: string;
    category: string;
    stock: number;
    reorderPoint: number;
    unit: string;
    expiryDate: string | null;
    supplier: string;
    status: string;
}

const STATUS_STYLE: Record<string, string> = {
    IN_STOCK:     "bg-green-50 text-green-700",
    LOW_STOCK:    "bg-amber-50 text-amber-700",
    OUT_OF_STOCK: "bg-red-50 text-red-600",
};

function computeStatus(qty: number, reorder: number): string {
    if (qty === 0) return "OUT_OF_STOCK";
    if (qty <= reorder) return "LOW_STOCK";
    return "IN_STOCK";
}

const CATS = ["All", "Medication", "Consumable", "IV Fluid", "Equipment", "Antibiotics", "Other"];

export default function InventoryPage() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [cat, setCat] = useState("All");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "pharmacyStock"));
            setItems(snap.docs.map(d => {
                const r = d.data();
                const qty     = Number(r.quantity ?? r.stock ?? 0);
                const reorder = Number(r.reorderLevel ?? r.reorderPoint ?? 0);
                return {
                    id:           d.id,
                    name:         ((r.drugName ?? r.name) as string) ?? "—",
                    category:     (r.category as string) ?? "Other",
                    stock:        qty,
                    reorderPoint: reorder,
                    unit:         (r.unit as string) ?? "units",
                    expiryDate:   (r.expiryDate as string) ?? null,
                    supplier:     (r.supplier as string) ?? "—",
                    status:       (r.status as string) ?? computeStatus(qty, reorder),
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = items.filter(i => {
        const matchS = i.name.toLowerCase().includes(search.toLowerCase());
        const matchC = cat === "All" || i.category === cat;
        return matchS && matchC;
    });
    const lowOrOut = items.filter(i => i.status !== "IN_STOCK").length;

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Inventory</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${items.length} items · ${lowOrOut} items need attention`}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    {!loading && lowOrOut > 0 && (
                        <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                            <AlertTriangle className="h-4 w-4" /> {lowOrOut} low / out of stock
                        </div>
                    )}
                    <button onClick={load} className="text-gray-400 hover:text-blue-600 transition-colors">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                </div>
            </div>

            <div className="flex gap-3 flex-wrap items-center">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Search items..."
                    />
                </div>
                <div className="flex gap-1.5 flex-wrap">
                    {CATS.map(c => (
                        <button
                            key={c}
                            onClick={() => setCat(c)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${cat === c ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}
                        >
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-500 rounded-full" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">
                            {search || cat !== "All" ? "No items match your filter" : "No inventory items found"}
                        </p>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {["Item", "Category", "Stock", "Reorder At", "Unit", "Expiry", "Supplier", "Status"].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((item, i) => (
                                    <motion.tr
                                        key={item.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }}
                                        className={`hover:bg-gray-50/50 transition-colors ${item.status === "OUT_OF_STOCK" ? "bg-red-50/30" : item.status === "LOW_STOCK" ? "bg-amber-50/20" : ""}`}
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <Package className="h-4 w-4 text-gray-300 shrink-0" />
                                                <span className="text-sm font-bold text-gray-900">{item.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{item.category}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-sm font-black ${item.stock === 0 ? "text-red-600" : item.stock <= item.reorderPoint ? "text-amber-600" : "text-gray-900"}`}>
                                                {item.stock.toLocaleString()}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-400">{item.reorderPoint}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{item.unit}</td>
                                        <td className="px-4 py-3 text-xs text-gray-400">{item.expiryDate ?? "N/A"}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{item.supplier}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[item.status] ?? "bg-gray-50 text-gray-600"}`}>
                                                {item.status.replace("_", " ")}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

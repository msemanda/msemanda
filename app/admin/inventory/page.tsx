"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Package, Search, AlertTriangle } from "lucide-react";

const items = [
    { id: "INV001", name: "Paracetamol 500mg Tabs", category: "Medication", stock: 2400, reorderPoint: 500, unit: "tabs", expiryDate: "2027-06-30", supplier: "Cipla Uganda", status: "IN_STOCK" },
    { id: "INV002", name: "Amoxicillin 250mg Caps", category: "Medication", stock: 180, reorderPoint: 200, unit: "caps", expiryDate: "2026-12-31", supplier: "Cipla Uganda", status: "LOW_STOCK" },
    { id: "INV003", name: "IV Normal Saline 1L", category: "IV Fluid", stock: 320, reorderPoint: 100, unit: "bags", expiryDate: "2027-03-31", supplier: "Fresenius Uganda", status: "IN_STOCK" },
    { id: "INV004", name: "Surgical Gloves (Medium)", category: "Consumable", stock: 45, reorderPoint: 100, unit: "boxes", expiryDate: "2028-01-01", supplier: "Medisel Uganda", status: "LOW_STOCK" },
    { id: "INV005", name: "Metformin 500mg Tabs", category: "Medication", stock: 0, reorderPoint: 300, unit: "tabs", expiryDate: "2027-09-30", supplier: "Cipla Uganda", status: "OUT_OF_STOCK" },
    { id: "INV006", name: "Insulin (Actrapid) 10mL", category: "Medication", stock: 85, reorderPoint: 50, unit: "vials", expiryDate: "2026-08-31", supplier: "Novo Nordisk", status: "IN_STOCK" },
    { id: "INV007", name: "Oxygen Cylinder (Large)", category: "Equipment", stock: 12, reorderPoint: 5, unit: "cylinders", expiryDate: null, supplier: "BOC Uganda", status: "IN_STOCK" },
    { id: "INV008", name: "Disposable Syringes 5mL", category: "Consumable", stock: 820, reorderPoint: 500, unit: "pcs", expiryDate: "2028-06-01", supplier: "Medisel Uganda", status: "IN_STOCK" },
];

const STATUS_STYLE: Record<string, string> = {
    IN_STOCK: "bg-green-50 text-green-700",
    LOW_STOCK: "bg-amber-50 text-amber-700",
    OUT_OF_STOCK: "bg-red-50 text-red-600",
};

const CATS = ["All", "Medication", "Consumable", "IV Fluid", "Equipment"];

export default function InventoryPage() {
    const [search, setSearch] = useState("");
    const [cat, setCat] = useState("All");
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
                    <p className="text-sm text-gray-500 mt-0.5">{items.length} items · {lowOrOut} items need attention</p>
                </div>
                {lowOrOut > 0 && (
                    <div className="flex items-center gap-2 text-xs font-bold text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
                        <AlertTriangle className="h-4 w-4" /> {lowOrOut} low / out of stock
                    </div>
                )}
            </div>

            <div className="flex gap-3 flex-wrap items-center">
                <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2.5 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Search items..." />
                </div>
                <div className="flex gap-1.5">
                    {CATS.map(c => (
                        <button key={c} onClick={() => setCat(c)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${cat === c ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Item", "Category", "Stock", "Reorder At", "Unit", "Expiry", "Supplier", "Status"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map((item, i) => (
                                <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                    className={`hover:bg-gray-50/50 transition-colors ${item.status === "OUT_OF_STOCK" ? "bg-red-50/30" : item.status === "LOW_STOCK" ? "bg-amber-50/20" : ""}`}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Package className="h-4 w-4 text-gray-300 shrink-0" />
                                            <span className="text-sm font-bold text-gray-900">{item.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{item.category}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-sm font-black ${item.stock === 0 ? "text-red-600" : item.stock <= item.reorderPoint ? "text-amber-600" : "text-gray-900"}`}>{item.stock.toLocaleString()}</span>
                                    </td>
                                    <td className="px-4 py-3 text-xs text-gray-400">{item.reorderPoint}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{item.unit}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400">{item.expiryDate || "N/A"}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{item.supplier}</td>
                                    <td className="px-4 py-3">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[item.status]}`}>{item.status.replace("_", " ")}</span>
                                    </td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

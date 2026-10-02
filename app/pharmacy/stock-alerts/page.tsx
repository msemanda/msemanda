"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import {
    AlertTriangle, XCircle, RefreshCw, Package,
    ArrowRight, TrendingDown, ShieldAlert,
} from "lucide-react";
import Link from "next/link";
import { fmt } from "@/helpers/constants";

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
    expiryDate?: string;
}

type AlertLevel = "all" | "out" | "low" | "expiring";

function daysUntilExpiry(dateStr?: string): number | null {
    if (!dateStr) return null;
    const diff = new Date(dateStr).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function StockAlertsPage() {
    const [items, setItems] = useState<DrugStock[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<AlertLevel>("all");

    const fetchItems = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, "pharmacyStock"), orderBy("drugName")));
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as DrugStock)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchItems(); }, []);

    const outOfStock  = items.filter(i => i.quantity === 0);
    const lowStock    = items.filter(i => i.quantity > 0 && i.quantity <= i.reorderLevel);
    const expiringIn30 = items.filter(i => {
        const d = daysUntilExpiry(i.expiryDate);
        return d !== null && d >= 0 && d <= 30;
    });

    const displayed = (() => {
        switch (filter) {
            case "out":      return outOfStock;
            case "low":      return lowStock;
            case "expiring": return expiringIn30;
            default:         return [...outOfStock, ...lowStock, ...expiringIn30.filter(i => i.quantity > i.reorderLevel)];
        }
    })();

    const summaryCards = [
        {
            key: "out",
            label: "Out of Stock",
            count: outOfStock.length,
            icon: XCircle,
            bg: "bg-red-50",
            border: "border-red-100",
            text: "text-red-700",
            iconCls: "text-red-500",
            activeCls: "bg-red-600 text-white border-red-600",
        },
        {
            key: "low",
            label: "Low Stock",
            count: lowStock.length,
            icon: TrendingDown,
            bg: "bg-amber-50",
            border: "border-amber-100",
            text: "text-amber-700",
            iconCls: "text-amber-500",
            activeCls: "bg-amber-500 text-white border-amber-500",
        },
        {
            key: "expiring",
            label: "Expiring ≤ 30 days",
            count: expiringIn30.length,
            icon: ShieldAlert,
            bg: "bg-orange-50",
            border: "border-orange-100",
            text: "text-orange-700",
            iconCls: "text-orange-500",
            activeCls: "bg-orange-500 text-white border-orange-500",
        },
    ] as const;

    const getRowAlert = (item: DrugStock) => {
        if (item.quantity === 0) return { label: "Out of Stock", cls: "bg-red-50 text-red-700 border-red-100" };
        if (item.quantity <= item.reorderLevel) return { label: "Low Stock", cls: "bg-amber-50 text-amber-700 border-amber-100" };
        const d = daysUntilExpiry(item.expiryDate);
        if (d !== null && d <= 30) return { label: `Expires in ${d}d`, cls: "bg-orange-50 text-orange-700 border-orange-100" };
        return { label: "OK", cls: "bg-green-50 text-green-700 border-green-100" };
    };

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Stock Alerts</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Items that need immediate attention — restock or remove expired stock
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/pharmacy/inventory"
                        className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm">
                        <Package className="h-3.5 w-3.5" /> Go to Inventory
                    </Link>
                    <button onClick={fetchItems}
                        className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                </div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {summaryCards.map(card => {
                    const Icon = card.icon;
                    const active = filter === card.key;
                    return (
                        <button key={card.key} onClick={() => setFilter(active ? "all" : card.key)}
                            className={`flex items-center gap-4 p-5 rounded-2xl border text-left transition-all ${
                                active ? card.activeCls : `${card.bg} ${card.border}`
                            }`}>
                            <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${
                                active ? "bg-white/20" : "bg-white"
                            }`}>
                                <Icon className={`h-6 w-6 ${active ? "text-white" : card.iconCls}`} />
                            </div>
                            <div>
                                <p className={`text-2xl font-black ${active ? "text-white" : card.text}`}>
                                    {loading ? "—" : card.count}
                                </p>
                                <p className={`text-xs font-semibold mt-0.5 ${active ? "text-white/80" : card.text}`}>
                                    {card.label}
                                </p>
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* No alerts state */}
            {!loading && displayed.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <AlertTriangle className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">
                        {filter === "all" ? "No alerts — stock levels look good" : "No items in this category"}
                    </p>
                    <p className="text-xs text-gray-400">Items flagged for low stock or expiry appear here.</p>
                </div>
            )}

            {/* Alert table */}
            {!loading && displayed.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <p className="text-sm font-black text-gray-900">
                            {displayed.length} item{displayed.length !== 1 ? "s" : ""} need attention
                        </p>
                        {filter !== "all" && (
                            <button onClick={() => setFilter("all")}
                                className="text-xs font-semibold text-blue-600 hover:underline">
                                Show all alerts
                            </button>
                        )}
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-50">
                                    {["Item", "Category", "Stock", "Reorder At", "Expiry", "Supplier", "Alert"].map(h => (
                                        <th key={h} className="px-5 py-3 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {displayed.map((item, i) => {
                                    const alert = getRowAlert(item);
                                    const days = daysUntilExpiry(item.expiryDate);
                                    return (
                                        <motion.tr key={item.id}
                                            initial={{ opacity: 0, x: -6 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: i * 0.03 }}
                                            className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-5 py-4">
                                                <p className="font-bold text-gray-900">{item.drugName}</p>
                                                {item.genericName && (
                                                    <p className="text-xs text-gray-400 mt-0.5">{item.genericName}</p>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-gray-500 text-xs">{item.category}</td>
                                            <td className="px-5 py-4">
                                                <span className={`font-black text-base ${
                                                    item.quantity === 0 ? "text-red-600" :
                                                    item.quantity <= item.reorderLevel ? "text-amber-600" : "text-gray-900"
                                                }`}>
                                                    {item.quantity.toLocaleString()}
                                                </span>
                                                <span className="text-xs text-gray-400 ml-1">{item.unit}</span>
                                            </td>
                                            <td className="px-5 py-4 text-gray-500 text-xs">
                                                {item.reorderLevel.toLocaleString()}
                                            </td>
                                            <td className="px-5 py-4 text-xs">
                                                {item.expiryDate ? (
                                                    <span className={days !== null && days <= 30 ? "text-orange-600 font-semibold" : "text-gray-500"}>
                                                        {item.expiryDate}
                                                        {days !== null && days <= 30 && ` (${days}d)`}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-300">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-4 text-xs text-gray-500">{item.supplier || "—"}</td>
                                            <td className="px-5 py-4">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${alert.cls}`}>
                                                    {alert.label}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between">
                        <p className="text-xs text-gray-400">
                            Estimated restock cost: <span className="font-black text-gray-700">
                                {fmt(displayed.reduce((s, i) => s + Math.max(0, i.reorderLevel - i.quantity) * i.unitPrice, 0))}
                            </span>
                        </p>
                        <Link href="/pharmacy/inventory"
                            className="text-xs font-bold text-blue-600 flex items-center gap-1 hover:underline">
                            Manage inventory <ArrowRight className="h-3 w-3" />
                        </Link>
                    </div>
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            )}
        </div>
    );
}

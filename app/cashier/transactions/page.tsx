"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { fmtDate } from "@/lib/ts";
import { db } from "@/lib/firebase";
import { Transaction } from "@/types";
import { motion } from "framer-motion";
import { ArrowLeftRight, Search, RefreshCw, ArrowUpRight, ArrowDownRight, Filter } from "lucide-react";

function fmt(n: number) { return "UGX " + n.toLocaleString("en-UG"); }

type FilterType = "ALL" | "INCOME" | "EXPENSE";

export default function TransactionsPage() {
    const [all, setAll] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState<FilterType>("ALL");

    const fetchAll = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, "transactions"), orderBy("date", "desc")));
            setAll(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    const filtered = useMemo(() => all.filter(t => {
        const typeMatch = typeFilter === "ALL" || t.type === typeFilter;
        const q = search.toLowerCase();
        const searchMatch = !q || t.description.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) || (t.patientName || "").toLowerCase().includes(q) ||
            (t.reference || "").toLowerCase().includes(q);
        return typeMatch && searchMatch;
    }), [all, typeFilter, search]);

    const totals = useMemo(() => ({
        income: all.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0),
        expenses: all.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0),
    }), [all]);

    return (
        <div className="max-w-5xl mx-auto space-y-5 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <ArrowLeftRight className="h-6 w-6 text-violet-600" /> All Transactions
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">{all.length} total entries</p>
                </div>
                <button onClick={fetchAll} className="h-9 w-9 rounded-xl border border-gray-100 bg-white shadow-sm text-gray-400 hover:text-violet-600 flex items-center justify-center transition-colors">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            {/* Summary bar */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { label: "Total Income", value: fmt(totals.income), color: "text-green-600", bg: "bg-green-50" },
                    { label: "Total Expenses", value: fmt(totals.expenses), color: "text-red-500", bg: "bg-red-50" },
                    { label: "Net Balance", value: fmt(totals.income - totals.expenses), color: totals.income >= totals.expenses ? "text-blue-600" : "text-red-600", bg: "bg-blue-50" },
                ].map(s => (
                    <div key={s.label} className={`rounded-2xl ${s.bg} border border-white p-4`}>
                        <p className={`text-base font-black ${s.color}`}>{s.value}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="flex bg-white border border-gray-100 rounded-xl p-1 gap-1 shadow-sm">
                    {(["ALL", "INCOME", "EXPENSE"] as FilterType[]).map(f => (
                        <button key={f} onClick={() => setTypeFilter(f)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${typeFilter === f ? (f === "INCOME" ? "bg-green-600 text-white" : f === "EXPENSE" ? "bg-red-500 text-white" : "bg-violet-600 text-white") : "text-gray-500 hover:bg-gray-50"}`}>
                            {f}
                        </button>
                    ))}
                </div>
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20"
                        placeholder="Search description, category, patient..." />
                </div>
                {(search || typeFilter !== "ALL") && (
                    <button onClick={() => { setSearch(""); setTypeFilter("ALL"); }}
                        className="text-xs font-bold text-gray-400 hover:text-gray-600 flex items-center gap-1">
                        <Filter className="h-3.5 w-3.5" /> Clear
                    </button>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-violet-100 border-t-violet-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <ArrowLeftRight className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900">No transactions found</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-4 px-5 py-3 bg-gray-50 border-b border-gray-100 text-[10px] font-black text-gray-400 uppercase tracking-wider">
                        <span>Type</span><span>Description</span><span>Method</span><span>Amount</span>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {filtered.map((t, i) => (
                            <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: Math.min(i * 0.015, 0.3) }}
                                className="grid grid-cols-[auto_1fr_auto_auto] gap-4 items-center px-5 py-3.5">
                                <div className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${t.type === "INCOME" ? "bg-green-50" : "bg-red-50"}`}>
                                    {t.type === "INCOME"
                                        ? <ArrowUpRight className="h-3.5 w-3.5 text-green-600" />
                                        : <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{t.description}</p>
                                    <p className="text-xs text-gray-400 truncate">
                                        {t.category}
                                        {t.patientName && ` · ${t.patientName}`}
                                        {" · "}{fmtDate(t.date)}
                                        {" · "}{t.recordedBy}
                                    </p>
                                </div>
                                <span className="text-xs font-semibold text-gray-500 whitespace-nowrap">{t.paymentMethod.replace(/_/g, " ")}</span>
                                <span className={`text-sm font-black whitespace-nowrap ${t.type === "INCOME" ? "text-green-600" : "text-red-500"}`}>
                                    {t.type === "INCOME" ? "+" : "-"}{fmt(t.amount)}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

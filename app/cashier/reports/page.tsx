"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, getDocs, orderBy } from "firebase/firestore";
import { toDate } from "@/lib/ts";
import { db } from "@/lib/firebase";
import { Transaction } from "@/types";
import { motion } from "framer-motion";
import { BarChart3, RefreshCw, TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { format } from "date-fns";

function fmt(n: number) { return "UGX " + n.toLocaleString("en-UG"); }

export default function FinanceReports() {
    const [all, setAll] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchAll = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, "transactions"), orderBy("date", "desc")));
            setAll(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchAll(); }, []);

    // Group by month
    const byMonth = useMemo(() => {
        const map: Record<string, { income: number; expenses: number }> = {};
        all.forEach(t => {
            const d = toDate(t.date);
            const key = d ? format(d, "MMM yyyy") : "Unknown";
            if (!map[key]) map[key] = { income: 0, expenses: 0 };
            if (t.type === "INCOME") map[key].income += t.amount;
            else map[key].expenses += t.amount;
        });
        return Object.entries(map).map(([month, v]) => ({ month, ...v, net: v.income - v.expenses }));
    }, [all]);

    // Group by category
    const byCategory = useMemo(() => {
        const map: Record<string, { type: string; total: number; count: number }> = {};
        all.forEach(t => {
            if (!map[t.category]) map[t.category] = { type: t.type, total: 0, count: 0 };
            map[t.category].total += t.amount;
            map[t.category].count += 1;
        });
        return Object.entries(map)
            .map(([cat, v]) => ({ category: cat, ...v }))
            .sort((a, b) => b.total - a.total);
    }, [all]);

    const totals = useMemo(() => ({
        income: all.filter(t => t.type === "INCOME").reduce((s, t) => s + t.amount, 0),
        expenses: all.filter(t => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0),
    }), [all]);

    const maxMonthVal = Math.max(...byMonth.map(m => Math.max(m.income, m.expenses)), 1);

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-blue-600" /> Financial Reports
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Income vs expenses summary</p>
                </div>
                <button onClick={fetchAll} className="h-9 w-9 rounded-xl border border-gray-100 bg-white shadow-sm text-gray-400 hover:text-blue-600 flex items-center justify-center transition-colors">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            {/* Totals */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                    { label: "Total Income", value: fmt(totals.income), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50" },
                    { label: "Total Expenses", value: fmt(totals.expenses), icon: TrendingDown, color: "text-red-500", bg: "bg-red-50" },
                    { label: "Net Balance", value: fmt(totals.income - totals.expenses), icon: Wallet, color: totals.income >= totals.expenses ? "text-blue-600" : "text-red-600", bg: "bg-blue-50" },
                ].map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center mb-3`}>
                                <Icon className={`h-4.5 w-4.5 ${s.color}`} />
                            </div>
                            <p className={`text-lg font-black ${s.color}`}>{loading ? "—" : s.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : (
                <>
                    {/* Monthly summary */}
                    {byMonth.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h2 className="text-sm font-black text-gray-900 mb-4">Monthly Summary</h2>
                            <div className="space-y-3">
                                {byMonth.map((m, i) => (
                                    <motion.div key={m.month} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-xs font-bold text-gray-700">{m.month}</span>
                                            <span className={`text-xs font-black ${m.net >= 0 ? "text-green-600" : "text-red-500"}`}>{m.net >= 0 ? "+" : ""}{fmt(m.net)}</span>
                                        </div>
                                        <div className="flex gap-1.5 h-5">
                                            <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden">
                                                <div className="h-full bg-green-400 rounded-lg transition-all"
                                                    style={{ width: `${(m.income / maxMonthVal) * 100}%` }} />
                                            </div>
                                            <div className="flex-1 bg-gray-50 rounded-lg overflow-hidden">
                                                <div className="h-full bg-red-400 rounded-lg transition-all"
                                                    style={{ width: `${(m.expenses / maxMonthVal) * 100}%` }} />
                                            </div>
                                        </div>
                                        <div className="flex justify-between mt-1">
                                            <span className="text-[10px] text-green-600 font-semibold">{fmt(m.income)}</span>
                                            <span className="text-[10px] text-red-500 font-semibold">{fmt(m.expenses)}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                            <div className="flex gap-4 mt-4 pt-3 border-t border-gray-50">
                                <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded bg-green-400" /><span className="text-[10px] text-gray-500 font-semibold">Income</span></div>
                                <div className="flex items-center gap-1.5"><div className="h-2.5 w-2.5 rounded bg-red-400" /><span className="text-[10px] text-gray-500 font-semibold">Expenses</span></div>
                            </div>
                        </div>
                    )}

                    {/* Category breakdown */}
                    {byCategory.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <h2 className="text-sm font-black text-gray-900 mb-4">By Category</h2>
                            <div className="space-y-2">
                                {byCategory.map((c, i) => (
                                    <motion.div key={c.category} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                        className="flex items-center justify-between py-2.5 border-b border-gray-50 last:border-0">
                                        <div className="flex items-center gap-3">
                                            <div className={`h-2 w-2 rounded-full ${c.type === "INCOME" ? "bg-green-500" : "bg-red-500"}`} />
                                            <div>
                                                <p className="text-sm font-bold text-gray-800">{c.category}</p>
                                                <p className="text-xs text-gray-400">{c.count} {c.count === 1 ? "entry" : "entries"}</p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-black ${c.type === "INCOME" ? "text-green-600" : "text-red-500"}`}>
                                            {fmt(c.total)}
                                        </span>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}

                    {byMonth.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                            <BarChart3 className="h-10 w-10 text-gray-200 mb-3" />
                            <p className="text-sm font-black text-gray-900">No data yet</p>
                            <p className="text-xs text-gray-400 mt-1">Record income and expenses to see reports here.</p>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

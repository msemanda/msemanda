"use client";

import { useEffect, useState } from "react";
import { collection, query, getDocs, orderBy, limit, where, Timestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Transaction } from "@/types";
import { motion } from "framer-motion";
import {
    TrendingUp, TrendingDown, Wallet, ArrowLeftRight,
    RefreshCw, ArrowUpRight, ArrowDownRight,
} from "lucide-react";
import Link from "next/link";

function fmt(n: number) {
    return "UGX " + n.toLocaleString("en-UG");
}

function startOfMonth() {
    const d = new Date();
    d.setDate(1); d.setHours(0, 0, 0, 0);
    return Timestamp.fromDate(d);
}

export default function CashierDashboard() {
    const [totals, setTotals] = useState({ income: 0, expenses: 0, monthIncome: 0, monthExpenses: 0 });
    const [recent, setRecent] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "transactions"));
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction));

            const som = startOfMonth();
            let income = 0, expenses = 0, monthIncome = 0, monthExpenses = 0;
            all.forEach(t => {
                if (t.type === "INCOME") { income += t.amount; if (t.date?.seconds >= som.seconds) monthIncome += t.amount; }
                else { expenses += t.amount; if (t.date?.seconds >= som.seconds) monthExpenses += t.amount; }
            });
            setTotals({ income, expenses, monthIncome, monthExpenses });

            const recentSnap = await getDocs(query(collection(db, "transactions"), orderBy("date", "desc"), limit(8)));
            setRecent(recentSnap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchData(); }, []);

    const net = totals.income - totals.expenses;
    const monthNet = totals.monthIncome - totals.monthExpenses;

    const stats = [
        { label: "Total Income", value: fmt(totals.income), sub: `${fmt(totals.monthIncome)} this month`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-50", border: "border-green-100" },
        { label: "Total Expenses", value: fmt(totals.expenses), sub: `${fmt(totals.monthExpenses)} this month`, icon: TrendingDown, color: "text-red-500", bg: "bg-red-50", border: "border-red-100" },
        { label: "Net Balance", value: fmt(net), sub: `${fmt(monthNet)} this month`, icon: Wallet, color: net >= 0 ? "text-blue-600" : "text-red-600", bg: net >= 0 ? "bg-blue-50" : "bg-red-50", border: net >= 0 ? "border-blue-100" : "border-red-100" },
        { label: "Transactions", value: (totals.income > 0 || totals.expenses > 0) ? "View All" : "None yet", sub: "All recorded entries", icon: ArrowLeftRight, color: "text-violet-600", bg: "bg-violet-50", border: "border-violet-100", href: "/cashier/transactions" },
    ];

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Finance Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Hospital income, expenses and net balance</p>
                </div>
                <button onClick={fetchData} className="h-9 w-9 rounded-xl border border-gray-100 bg-white shadow-sm text-gray-400 hover:text-green-600 flex items-center justify-center transition-colors">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    const card = (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className={`bg-white rounded-2xl border ${s.border} shadow-sm p-5 ${s.href ? "cursor-pointer hover:shadow-md transition-shadow" : ""}`}>
                            <div className="flex items-start justify-between mb-3">
                                <div className={`h-9 w-9 rounded-xl ${s.bg} flex items-center justify-center`}>
                                    <Icon className={`h-4.5 w-4.5 ${s.color}`} />
                                </div>
                            </div>
                            <p className={`text-xl font-black ${s.color}`}>{loading ? "—" : s.value}</p>
                            <p className="text-xs font-bold text-gray-500 mt-0.5">{s.label}</p>
                            <p className="text-[11px] text-gray-400 mt-1">{s.sub}</p>
                        </motion.div>
                    );
                    return s.href ? <Link key={s.label} href={s.href}>{card}</Link> : card;
                })}
            </div>

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Link href="/cashier/income">
                    <div className="bg-green-600 hover:bg-green-700 transition-colors rounded-2xl p-5 text-white cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingUp className="h-5 w-5" />
                            <span className="font-black text-sm">Record Income</span>
                        </div>
                        <p className="text-xs text-green-100">Consultation fees, lab, pharmacy, procedures…</p>
                    </div>
                </Link>
                <Link href="/cashier/expenses">
                    <div className="bg-red-500 hover:bg-red-600 transition-colors rounded-2xl p-5 text-white cursor-pointer">
                        <div className="flex items-center gap-3 mb-2">
                            <TrendingDown className="h-5 w-5" />
                            <span className="font-black text-sm">Record Expense</span>
                        </div>
                        <p className="text-xs text-red-100">Salaries, supplies, utilities, maintenance…</p>
                    </div>
                </Link>
            </div>

            {/* Recent transactions */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                    <p className="text-sm font-black text-gray-900">Recent Transactions</p>
                    <Link href="/cashier/transactions" className="text-xs font-bold text-blue-600 hover:underline">View all</Link>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <div className="animate-spin h-7 w-7 border-[3px] border-gray-100 border-t-green-600 rounded-full" />
                    </div>
                ) : recent.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <ArrowLeftRight className="h-8 w-8 text-gray-200 mb-2" />
                        <p className="text-sm font-bold text-gray-400">No transactions yet</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recent.map((t, i) => (
                            <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                className="flex items-center justify-between px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center ${t.type === "INCOME" ? "bg-green-50" : "bg-red-50"}`}>
                                        {t.type === "INCOME"
                                            ? <ArrowUpRight className="h-4 w-4 text-green-600" />
                                            : <ArrowDownRight className="h-4 w-4 text-red-500" />}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{t.description}</p>
                                        <p className="text-xs text-gray-400">{t.category} · {t.date?.seconds ? new Date(t.date.seconds * 1000).toLocaleDateString() : "—"}</p>
                                    </div>
                                </div>
                                <span className={`text-sm font-black ${t.type === "INCOME" ? "text-green-600" : "text-red-500"}`}>
                                    {t.type === "INCOME" ? "+" : "-"}{fmt(t.amount)}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

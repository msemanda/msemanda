"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Transaction, EXPENSE_CATEGORIES, PaymentMethod } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import { TrendingDown, Plus, X, CheckCircle2, RefreshCw, ArrowDownRight, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
    { value: "CASH", label: "Cash" },
    { value: "MOBILE_MONEY", label: "Mobile Money" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "INSURANCE", label: "Insurance" },
];

function fmt(n: number) { return "UGX " + n.toLocaleString("en-UG"); }

export default function ExpensesPage() {
    const { profile } = useAuth();
    const [entries, setEntries] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({
        description: "",
        category: EXPENSE_CATEGORIES[0],
        amount: "",
        paymentMethod: "CASH" as PaymentMethod,
        reference: "",
        notes: "",
    });

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "transactions"), where("type", "==", "EXPENSE"), orderBy("date", "desc"));
            const snap = await getDocs(q);
            setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchExpenses(); }, []);

    const total = entries.reduce((s, t) => s + t.amount, 0);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.amount || isNaN(Number(form.amount))) return;
        setSaving(true);
        try {
            const docRef = await addDoc(collection(db, "transactions"), {
                type: "EXPENSE",
                description: form.description,
                category: form.category,
                amount: Number(form.amount),
                paymentMethod: form.paymentMethod,
                reference: form.reference,
                notes: form.notes,
                recordedBy: profile?.name || "Cashier",
                date: serverTimestamp(),
                recordedAt: serverTimestamp(),
            });
            setEntries(prev => [{
                id: docRef.id, type: "EXPENSE", description: form.description,
                category: form.category, amount: Number(form.amount),
                paymentMethod: form.paymentMethod, reference: form.reference,
                notes: form.notes, recordedBy: profile?.name || "Cashier",
                date: { seconds: Date.now() / 1000 }, recordedAt: { seconds: Date.now() / 1000 },
            }, ...prev]);
            setForm({ description: "", category: EXPENSE_CATEGORIES[0], amount: "", paymentMethod: "CASH", reference: "", notes: "" });
            setSaved(true); setShowForm(false);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const filtered = entries.filter(e => {
        const q = search.toLowerCase();
        return !q || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q);
    });

    return (
        <div className="max-w-4xl mx-auto space-y-5 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <TrendingDown className="h-6 w-6 text-red-500" /> Expenses
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Total: <span className="font-black text-red-500">{fmt(total)}</span></p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchExpenses} className="h-9 w-9 rounded-xl border border-gray-100 bg-white shadow-sm text-gray-400 hover:text-red-500 flex items-center justify-center transition-colors">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(true)}
                        className="h-9 px-4 rounded-xl bg-red-500 hover:bg-red-600 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> Record Expense
                    </button>
                </div>
            </div>

            {saved && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-red-700 text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> Expense recorded successfully.
                </motion.div>
            )}

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
                        onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-5">
                                <h2 className="text-base font-black text-gray-900">Record Expense</h2>
                                <button onClick={() => setShowForm(false)} className="h-8 w-8 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50"><X className="h-4 w-4" /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Description *</label>
                                        <Input required placeholder="e.g. Electricity bill — May 2026" value={form.description}
                                            onChange={e => setForm(p => ({ ...p, description: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Category *</label>
                                        <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                                            className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-400/20 outline-none transition-all cursor-pointer">
                                            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Amount (UGX) *</label>
                                        <Input required type="number" min="0" placeholder="0" value={form.amount}
                                            onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Payment Method</label>
                                        <select value={form.paymentMethod} onChange={e => setForm(p => ({ ...p, paymentMethod: e.target.value as PaymentMethod }))}
                                            className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-red-400 focus:ring-2 focus:ring-red-400/20 outline-none transition-all cursor-pointer">
                                            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Reference No.</label>
                                        <Input placeholder="e.g. INV-0089" value={form.reference}
                                            onChange={e => setForm(p => ({ ...p, reference: e.target.value }))} />
                                    </div>
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Notes</label>
                                        <Input placeholder="Optional notes" value={form.notes}
                                            onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button type="button" onClick={() => setShowForm(false)}
                                        className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors">Cancel</button>
                                    <button type="submit" disabled={saving}
                                        className="flex-1 h-10 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                                        {saving ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <><Plus className="h-4 w-4" /> Save</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-400/20"
                    placeholder="Search description or category..." />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-red-100 border-t-red-500 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <TrendingDown className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900">No expense entries yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Record Expense" to add the first entry.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-50">
                        {filtered.map((t, i) => (
                            <motion.div key={t.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                className="flex items-center justify-between px-5 py-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-9 w-9 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                                        <ArrowDownRight className="h-4 w-4 text-red-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{t.description}</p>
                                        <p className="text-xs text-gray-400">
                                            {t.category} · {t.paymentMethod.replace(/_/g, " ")}
                                            {" · "}{t.date?.seconds ? new Date(t.date.seconds * 1000).toLocaleDateString() : "—"}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-3">
                                    <p className="text-sm font-black text-red-500">-{fmt(t.amount)}</p>
                                    {t.reference && <p className="text-[10px] text-gray-400">{t.reference}</p>}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

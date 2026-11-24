"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp, orderBy } from "firebase/firestore";
import { fmtDate } from "@/lib/ts";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Transaction, INCOME_CATEGORIES, PaymentMethod } from "@/types";
import { generateReceiptNo } from "@/helpers/constants";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp, Plus, X, CheckCircle2, RefreshCw,
    ArrowUpRight, Search, Lock, Trash2, ListPlus,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { buildReceiptDocument } from "@/lib/receipt";

const PAYMENT_METHODS: { value: PaymentMethod; label: string }[] = [
    { value: "CASH", label: "Cash" },
    { value: "MOBILE_MONEY", label: "Mobile Money" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "VISA", label: "Visa Card" },
    { value: "INSURANCE", label: "Insurance" },
];

interface FeeItem {
    id: string;
    name: string;
    category: string;
    amount: number;
    active: boolean;
}

interface CartItem {
    key: string;
    description: string;
    category: typeof INCOME_CATEGORIES[number];
    amount: number;
}

// Fee Schedule uses its own broad service categories (CONSULTATION, LAB, ...) —
// map each to the closest income-report category so revenue reporting stays
// consistent regardless of whether an amount was picked from the schedule or
// entered manually under "Other Income".
const FEE_CATEGORY_TO_INCOME_CATEGORY: Record<string, typeof INCOME_CATEGORIES[number]> = {
    CONSULTATION: "Consultation Fee",
    LAB: "Laboratory Fee",
    RADIOLOGY: "Radiology Fee",
    MEDICATION: "Pharmacy Sales",
    NURSING: "Procedure Fee",
    PROCEDURE: "Procedure Fee",
    DIET: "Other Income",
    OTHER: "Other Income",
};

const MANUAL_SERVICE = "__manual__";

function fmt(n: number) { return "UGX " + n.toLocaleString("en-UG"); }

export default function IncomePage() {
    const { profile } = useAuth();
    const [entries, setEntries] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [search, setSearch] = useState("");
    const [feeItems, setFeeItems] = useState<FeeItem[]>([]);

    // Bill-wide fields — entered once, applied to every item in the cart.
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
    const [patientName, setPatientName] = useState("");
    const [reference, setReference] = useState("");
    const [notes, setNotes] = useState("");

    // "Add item" mini-form — one test/service/line at a time, appended to the cart below.
    const [cart, setCart] = useState<CartItem[]>([]);
    const [serviceId, setServiceId] = useState<string>(MANUAL_SERVICE);
    const [itemDescription, setItemDescription] = useState("");
    const [itemCategory, setItemCategory] = useState<typeof INCOME_CATEGORIES[number]>(INCOME_CATEGORIES[0]);
    const [itemAmount, setItemAmount] = useState("");

    const fetchIncome = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "transactions"), where("type", "==", "INCOME"), orderBy("date", "desc"));
            const snap = await getDocs(q);
            setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transaction)));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchFeeSchedule = async () => {
        try {
            const snap = await getDocs(query(collection(db, "feeSchedule"), where("active", "==", true)));
            setFeeItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as FeeItem)));
        } catch (err) { console.error(err); }
    };

    useEffect(() => { fetchIncome(); fetchFeeSchedule(); }, []);

    const total = entries.reduce((s, t) => s + t.amount, 0);
    const isManual = serviceId === MANUAL_SERVICE;
    const cartTotal = cart.reduce((s, c) => s + c.amount, 0);

    const feeByCategory = feeItems.reduce<Record<string, FeeItem[]>>((acc, item) => {
        (acc[item.category] ??= []).push(item);
        return acc;
    }, {});

    const resetItemForm = () => {
        setServiceId(MANUAL_SERVICE);
        setItemDescription("");
        setItemCategory(INCOME_CATEGORIES[0]);
        setItemAmount("");
    };

    const handleServiceChange = (id: string) => {
        setServiceId(id);
        if (id === MANUAL_SERVICE) return;
        const item = feeItems.find(f => f.id === id);
        if (!item) return;
        setItemDescription(item.name);
        setItemCategory(FEE_CATEGORY_TO_INCOME_CATEGORY[item.category] ?? "Other Income");
        setItemAmount(String(item.amount));
    };

    const addToCart = () => {
        if (!itemDescription.trim() || !itemAmount || isNaN(Number(itemAmount)) || Number(itemAmount) <= 0) return;
        setCart(prev => [...prev, {
            key: `${Date.now()}-${prev.length}`,
            description: itemDescription.trim(),
            category: itemCategory,
            amount: Number(itemAmount),
        }]);
        resetItemForm();
    };

    const removeFromCart = (key: string) => setCart(prev => prev.filter(c => c.key !== key));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (cart.length === 0) return;
        setSaving(true);
        try {
            // Multiple items recorded together share one receipt number, so they
            // print as a single itemized bill rather than N separate receipts.
            const sharedReference = reference.trim() || (cart.length > 1 ? generateReceiptNo() : "");
            const newEntries: Transaction[] = [];
            for (const item of cart) {
                const docRef = await addDoc(collection(db, "transactions"), {
                    type: "INCOME",
                    description: item.description,
                    category: item.category,
                    amount: item.amount,
                    paymentMethod,
                    patientName,
                    reference: sharedReference,
                    notes,
                    recordedBy: profile?.name || "Cashier",
                    date: serverTimestamp(),
                    recordedAt: serverTimestamp(),
                });
                newEntries.push({
                    id: docRef.id,
                    type: "INCOME",
                    description: item.description,
                    category: item.category,
                    amount: item.amount,
                    paymentMethod,
                    patientName,
                    reference: sharedReference,
                    notes,
                    recordedBy: profile?.name || "Cashier",
                    date: { seconds: Date.now() / 1000 },
                    recordedAt: { seconds: Date.now() / 1000 },
                });
            }
            setEntries(prev => [...newEntries, ...prev]);
            setCart([]);
            resetItemForm();
            setPaymentMethod("CASH");
            setPatientName("");
            setReference("");
            setNotes("");
            setSaved(true);
            setShowForm(false);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const filtered = entries.filter(e => {
        const q = search.toLowerCase();
        return !q || e.description.toLowerCase().includes(q) || e.category.toLowerCase().includes(q) || (e.patientName || "").toLowerCase().includes(q);
    });

    // Entries recorded together (multiple tests billed in one go) share a
    // reference number — group them back into one card so the list reads as
    // "one bill" rather than N disconnected rows, and so one Receipt covers
    // all of them.
    const groups: Transaction[][] = [];
    const groupIndex = new Map<string, number>();
    for (const t of filtered) {
        const key = t.reference || t.id;
        if (t.reference && groupIndex.has(key)) {
            groups[groupIndex.get(key)!].push(t);
        } else {
            groupIndex.set(key, groups.length);
            groups.push([t]);
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-5 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <TrendingUp className="h-6 w-6 text-green-600" /> Income
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Total: <span className="font-black text-green-600">{fmt(total)}</span></p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchIncome} className="h-9 w-9 rounded-xl border border-gray-100 bg-white shadow-sm text-gray-400 hover:text-green-600 flex items-center justify-center transition-colors">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(true)}
                        className="h-9 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> Record Income
                    </button>
                </div>
            </div>

            {saved && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-2 bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-green-700 text-sm font-semibold">
                    <CheckCircle2 className="h-4 w-4" /> Income recorded successfully.
                </motion.div>
            )}

            {/* Form modal */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
                        onClick={e => e.target === e.currentTarget && setShowForm(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className="text-base font-black text-gray-900">Record Income</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">Add every test or service billed to this patient, then save once.</p>
                                </div>
                                <button onClick={() => setShowForm(false)} className="h-8 w-8 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Add item */}
                                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 space-y-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Service</label>
                                        <select value={serviceId} onChange={e => handleServiceChange(e.target.value)}
                                            className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all cursor-pointer">
                                            <option value={MANUAL_SERVICE}>— Manual entry / Other —</option>
                                            {Object.entries(feeByCategory).map(([cat, items]) => (
                                                <optgroup key={cat} label={cat}>
                                                    {items.map(item => (
                                                        <option key={item.id} value={item.id}>{item.name} — UGX {item.amount.toLocaleString()}</option>
                                                    ))}
                                                </optgroup>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div className="col-span-2 space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Description</label>
                                            <Input placeholder="e.g. Malaria RDT" value={itemDescription}
                                                onChange={e => setItemDescription(e.target.value)} />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Category</label>
                                            <select
                                                value={itemCategory}
                                                disabled={!isManual}
                                                onChange={e => setItemCategory(e.target.value as typeof INCOME_CATEGORIES[number])}
                                                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
                                                {INCOME_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                                                Amount (UGX) {!isManual && <Lock className="h-2.5 w-2.5 text-gray-400" />}
                                            </label>
                                            {isManual ? (
                                                <Input type="number" min="0" placeholder="0" value={itemAmount}
                                                    onChange={e => setItemAmount(e.target.value)} />
                                            ) : (
                                                <div className="h-11 w-full px-3 rounded-xl border border-gray-200 bg-white text-sm font-bold text-gray-700 flex items-center">
                                                    {fmt(Number(itemAmount) || 0)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <button type="button" onClick={addToCart}
                                        className="w-full h-9 rounded-xl bg-white border border-green-200 text-green-700 text-xs font-bold flex items-center justify-center gap-1.5 hover:bg-green-50 transition-colors">
                                        <ListPlus className="h-3.5 w-3.5" /> Add to Bill
                                    </button>
                                </div>

                                {/* Cart */}
                                {cart.length > 0 && (
                                    <div className="rounded-xl border border-gray-100 overflow-hidden">
                                        <div className="divide-y divide-gray-50">
                                            {cart.map(item => (
                                                <div key={item.key} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-gray-900 truncate">{item.description}</p>
                                                        <p className="text-[10px] text-gray-400">{item.category}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-xs font-black text-green-600">{fmt(item.amount)}</span>
                                                        <button type="button" onClick={() => removeFromCart(item.key)}
                                                            className="h-6 w-6 rounded-lg flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors">
                                                            <Trash2 className="h-3 w-3" />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center justify-between px-3.5 py-2.5 bg-green-50 border-t border-green-100">
                                            <span className="text-xs font-black text-green-800">Bill Total ({cart.length} item{cart.length !== 1 ? "s" : ""})</span>
                                            <span className="text-sm font-black text-green-700">{fmt(cartTotal)}</span>
                                        </div>
                                    </div>
                                )}

                                {/* Bill-wide fields */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Payment Method</label>
                                        <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}
                                            className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none transition-all cursor-pointer">
                                            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient Name</label>
                                        <Input placeholder="Optional" value={patientName}
                                            onChange={e => setPatientName(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Reference / Receipt No.</label>
                                        <Input placeholder="Auto-generated if left blank" value={reference}
                                            onChange={e => setReference(e.target.value)} />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Notes</label>
                                        <Input placeholder="Optional notes" value={notes}
                                            onChange={e => setNotes(e.target.value)} />
                                    </div>
                                </div>
                                <div className="flex gap-2 pt-1">
                                    <button type="button" onClick={() => setShowForm(false)}
                                        className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={saving || cart.length === 0}
                                        className="flex-1 h-10 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                                        {saving
                                            ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                            : <><Plus className="h-4 w-4" /> Save {cart.length > 0 ? `(${cart.length} item${cart.length !== 1 ? "s" : ""})` : ""}</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-green-500/20"
                    placeholder="Search description, category or patient..." />
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-green-100 border-t-green-600 rounded-full" />
                </div>
            ) : groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <TrendingUp className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900">No income entries yet</p>
                    <p className="text-xs text-gray-400 mt-1">Click "Record Income" to add the first entry.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-50">
                        {groups.map((group, i) => {
                            const first = group[0];
                            const groupTotal = group.reduce((s, t) => s + t.amount, 0);
                            const receipt = buildReceiptDocument({
                                title: "Income Receipt",
                                receiptNo: first.reference,
                                patientName: first.patientName,
                                items: group.map(t => ({ description: t.description, category: t.category, amount: t.amount })),
                                paymentMethod: first.paymentMethod,
                                recordedBy: first.recordedBy,
                                date: first.date,
                                notes: first.notes,
                            });
                            return (
                                <motion.div key={first.reference || first.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                                    className="flex items-center justify-between px-5 py-4 gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-9 w-9 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
                                            <ArrowUpRight className="h-4 w-4 text-green-600" />
                                        </div>
                                        <div className="min-w-0">
                                            {group.length > 1 ? (
                                                <>
                                                    <p className="text-sm font-bold text-gray-900 truncate">
                                                        {group.length} items{first.patientName ? ` · ${first.patientName}` : ""}
                                                    </p>
                                                    <p className="text-xs text-gray-400 truncate">
                                                        {group.map(t => t.description).join(", ")}
                                                    </p>
                                                    <p className="text-[10px] text-gray-400 mt-0.5">
                                                        {first.paymentMethod.replace(/_/g, " ")} · {fmtDate(first.date)}
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p className="text-sm font-bold text-gray-900 truncate">{first.description}</p>
                                                    <p className="text-xs text-gray-400">
                                                        {first.category}
                                                        {first.patientName && ` · ${first.patientName}`}
                                                        {" · "}{first.paymentMethod.replace(/_/g, " ")}
                                                        {" · "}{fmtDate(first.date)}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                        <div className="text-right">
                                            <p className="text-sm font-black text-green-600">+{fmt(groupTotal)}</p>
                                            {first.reference && <p className="text-[10px] text-gray-400">{first.reference}</p>}
                                        </div>
                                        <ExportMenu variant="icon" label="Receipt" data={receipt} />
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

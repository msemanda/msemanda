"use client";

import { useEffect, useState } from "react";
import {
    collection, query, where, getDocs,
    doc, setDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    CreditCard, CheckCircle2, Clock, Search,
    DollarSign, RefreshCw, ShieldCheck, ArrowRight,
    AlertCircle, X, Smartphone, Building2, Banknote, Shield
} from "lucide-react";
import { Input } from "@/components/ui/Input";

interface FeeRecord {
    id: string;
    patientName: string;
    patientEmail: string;
    amount: number;
    consultationType: string;
    status: "PENDING" | "PATIENT_PAID" | "PAID";
    paymentMethod?: string;
    paymentReference?: string;
    createdAt?: any;
    paidAt?: any;
    receiptNo?: string;
}

const CONSULTATION_TYPES = [
    { label: "General Consultation",    amount: 30000 },
    { label: "Specialist Consultation", amount: 80000 },
    { label: "Emergency Consultation",  amount: 50000 },
    { label: "Follow-up Visit",         amount: 15000 },
    { label: "Dental Consultation",     amount: 40000 },
    { label: "Physiotherapy Session",   amount: 35000 },
];

const METHOD_LABEL: Record<string, string> = {
    MOBILE_MONEY: "Mobile Money", CASH: "Cash",
    BANK_TRANSFER: "Bank Transfer", INSURANCE: "Insurance",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    PENDING:      { label: "Awaiting Patient",    color: "bg-gray-50 text-gray-500 border-gray-100",   icon: Clock },
    PATIENT_PAID: { label: "Submitted — Pending Finance Approval", color: "bg-amber-50 text-amber-700 border-amber-100", icon: Clock },
    PAID:         { label: "Confirmed by Finance", color: "bg-green-50 text-green-700 border-green-100", icon: CheckCircle2 },
};

type Tab = "all" | "PENDING" | "PATIENT_PAID" | "PAID";

export default function ReceptionistPaymentsPage() {
    const { profile } = useAuth();
    const [fees, setFees] = useState<FeeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>("all");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        patientName: "", patientEmail: "",
        consultationType: CONSULTATION_TYPES[0].label,
        amount: CONSULTATION_TYPES[0].amount.toString(),
    });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    useEffect(() => { fetchFees(); }, []);

    const fetchFees = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "consultationFees"));
            setFees(snap.docs.map(d => ({ id: d.id, ...d.data() } as FeeRecord)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreateFee = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true); setCreateError("");
        try {
            const id = `fee_${Date.now()}`;
            await setDoc(doc(db, "consultationFees", id), {
                patientName: form.patientName.trim(),
                patientEmail: form.patientEmail.toLowerCase().trim(),
                consultationType: form.consultationType,
                amount: parseFloat(form.amount),
                status: "PENDING",
                createdAt: serverTimestamp(),
                createdBy: profile?.uid,
                createdByName: profile?.name,
            });
            setShowForm(false);
            setForm({ patientName: "", patientEmail: "", consultationType: CONSULTATION_TYPES[0].label, amount: CONSULTATION_TYPES[0].amount.toString() });
            fetchFees();
        } catch(err: any) {
            setCreateError(err.message || "Failed to create fee.");
        } finally { setCreating(false); }
    };

    const filtered = fees.filter(f => {
        const matchTab = tab === "all" || f.status === tab;
        const matchSearch = !search ||
            f.patientName.toLowerCase().includes(search.toLowerCase()) ||
            f.patientEmail.toLowerCase().includes(search.toLowerCase());
        return matchTab && matchSearch;
    });

    const tabCounts = {
        all: fees.length,
        PENDING: fees.filter(f => f.status === "PENDING").length,
        PATIENT_PAID: fees.filter(f => f.status === "PATIENT_PAID").length,
        PAID: fees.filter(f => f.status === "PAID").length,
    };

    const TAB_LABELS: Record<Tab, string> = {
        all: "All", PENDING: "Awaiting Patient",
        PATIENT_PAID: "Pending Finance", PAID: "Confirmed",
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Consultation Fees</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Create fee records — Finance / Cashier approves payments</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchFees}
                        className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)}
                        className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <CreditCard className="h-4 w-4" /> New Fee
                    </button>
                </div>
            </div>

            {/* Finance approval notice */}
            {tabCounts.PATIENT_PAID > 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="text-sm font-semibold text-amber-700">
                        {tabCounts.PATIENT_PAID} payment{tabCounts.PATIENT_PAID !== 1 ? "s" : ""} submitted by patients — awaiting Finance / Cashier approval.
                    </p>
                </div>
            )}

            {/* Create fee form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Create Consultation Fee</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreateFee} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient Name</label>
                                    <Input required placeholder="Full name" value={form.patientName} onChange={e => setForm(p => ({ ...p, patientName: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient Email</label>
                                    <Input type="email" required placeholder="patient@email.com" value={form.patientEmail} onChange={e => setForm(p => ({ ...p, patientEmail: e.target.value }))} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Consultation Type</label>
                                <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    value={form.consultationType}
                                    onChange={e => {
                                        const t = CONSULTATION_TYPES.find(x => x.label === e.target.value);
                                        setForm(p => ({ ...p, consultationType: e.target.value, amount: t ? t.amount.toString() : p.amount }));
                                    }}>
                                    {CONSULTATION_TYPES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Amount (UGX)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input type="number" required min="0" className="pl-10" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                                </div>
                            </div>
                            {createError && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex gap-2">
                                    <ShieldCheck className="h-4 w-4 shrink-0" />{createError}
                                </div>
                            )}
                            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100 text-xs font-semibold text-blue-700 flex gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                The patient will see this on their Records page and can submit payment. Finance will then confirm it.
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : <><ArrowRight className="h-4 w-4"/> Create Fee Record</>}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Tabs + search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-1.5 flex gap-1 flex-wrap">
                    {(["all", "PENDING", "PATIENT_PAID", "PAID"] as Tab[]).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                                tab === t ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"
                            }`}>
                            {TAB_LABELS[t]}
                            {tabCounts[t] > 0 && (
                                <span className={`text-[10px] font-black px-1.5 rounded-full ${tab === t ? "bg-white/25" : "bg-gray-100 text-gray-500"}`}>
                                    {tabCounts[t]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)}
                        className="h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                </div>
            </div>

            {/* List — read only */}
            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <CreditCard className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No fee records</p>
                    <p className="text-xs text-gray-400">Create a new fee record above.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-50">
                        {filtered.map(fee => {
                            const s = STATUS_CONFIG[fee.status];
                            const StatusIcon = s.icon;
                            return (
                                <div key={fee.id} className="px-5 py-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-600 text-sm shrink-0">
                                            {fee.patientName?.charAt(0) || "?"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-gray-900 truncate">{fee.patientName}</p>
                                            <p className="text-xs text-gray-400 truncate">{fee.consultationType}</p>
                                            {fee.paymentMethod && (
                                                <p className="text-[10px] text-gray-400 mt-0.5">
                                                    {METHOD_LABEL[fee.paymentMethod] || fee.paymentMethod}
                                                    {fee.paymentReference ? ` · ${fee.paymentReference}` : ""}
                                                </p>
                                            )}
                                            {fee.receiptNo && <p className="text-[10px] font-mono text-gray-300">{fee.receiptNo}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <p className="text-sm font-black text-gray-900">UGX {fee.amount.toLocaleString()}</p>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 whitespace-nowrap ${s.color}`}>
                                            <StatusIcon className="h-3 w-3 shrink-0" /> {s.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}

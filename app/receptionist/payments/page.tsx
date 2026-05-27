"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    CreditCard, CheckCircle2, Clock, Search,
    DollarSign, RefreshCw, ShieldCheck, ArrowRight
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface PaymentRecord {
    id: string;
    patientName: string;
    patientEmail: string;
    amount: number;
    consultationType: string;
    status: "PENDING" | "PAID" | "WAIVED";
    createdAt: any;
    paidAt?: any;
    collectedBy?: string;
    receiptNo?: string;
}

const CONSULTATION_TYPES = [
    { label: "General Consultation", amount: 30000 },
    { label: "Specialist Consultation", amount: 80000 },
    { label: "Emergency Consultation", amount: 50000 },
    { label: "Follow-up Visit", amount: 15000 },
    { label: "Dental Consultation", amount: 40000 },
    { label: "Physiotherapy Session", amount: 35000 },
];

export default function ConsultationPaymentsPage() {
    const { profile } = useAuth();
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [tab, setTab] = useState<"pending" | "paid">("pending");
    const [search, setSearch] = useState("");

    // New payment form
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        patientName: "",
        patientEmail: "",
        consultationType: CONSULTATION_TYPES[0].label,
        amount: CONSULTATION_TYPES[0].amount.toString(),
    });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    useEffect(() => {
        fetchPayments();
    }, [tab]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "consultationFees"),
                where("status", "==", tab === "pending" ? "PENDING" : "PAID")
            );
            const snap = await getDocs(q);
            setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentRecord)));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleConfirmPayment = async (payment: PaymentRecord) => {
        setProcessing(payment.id);
        try {
            const receiptNo = `RMC-${Date.now().toString().slice(-8)}`;
            await updateDoc(doc(db, "consultationFees", payment.id), {
                status: "PAID",
                paidAt: serverTimestamp(),
                collectedBy: profile?.name,
                receiptNo,
            });

            // Also record in bills collection for admin revenue tracking
            await setDoc(doc(db, "bills", payment.id), {
                patientName: payment.patientName,
                patientEmail: payment.patientEmail,
                description: payment.consultationType,
                netAmount: payment.amount,
                status: "PAID",
                paidAt: serverTimestamp(),
                collectedBy: profile?.uid,
                receiptNo,
            });

            setPayments(prev => prev.filter(p => p.id !== payment.id));
        } catch (err) {
            console.error(err);
        } finally {
            setProcessing(null);
        }
    };

    const handleCreateFee = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setCreateError("");
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
            if (tab === "pending") fetchPayments();
        } catch (err: any) {
            setCreateError(err.message || "Failed to create fee record.");
        } finally {
            setCreating(false);
        }
    };

    const filtered = payments.filter(p =>
        !search || p.patientName.toLowerCase().includes(search.toLowerCase()) ||
        p.patientEmail.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Consultation Fees</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Track and confirm patient consultation fee payments</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={fetchPayments}
                        className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)}
                        className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm shadow-blue-600/20">
                        <CreditCard className="h-4 w-4" /> New Fee
                    </button>
                </div>
            </div>

            {/* Create fee form */}
            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl">
                        <h2 className="text-base font-black text-gray-900 mb-4">Create Consultation Fee</h2>
                        <form onSubmit={handleCreateFee} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient Name</label>
                                    <Input required placeholder="Full name" value={form.patientName}
                                        onChange={e => setForm(p => ({ ...p, patientName: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient Email</label>
                                    <Input type="email" required placeholder="patient@email.com" value={form.patientEmail}
                                        onChange={e => setForm(p => ({ ...p, patientEmail: e.target.value }))} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Consultation Type</label>
                                <select
                                    className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                    value={form.consultationType}
                                    onChange={e => {
                                        const type = CONSULTATION_TYPES.find(t => t.label === e.target.value);
                                        setForm(p => ({ ...p, consultationType: e.target.value, amount: type ? type.amount.toString() : p.amount }));
                                    }}>
                                    {CONSULTATION_TYPES.map(t => <option key={t.label} value={t.label}>{t.label}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Amount (UGX)</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input type="number" required min="0" className="pl-10" value={form.amount}
                                        onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} />
                                </div>
                            </div>
                            {createError && (
                                <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex gap-2">
                                    <ShieldCheck className="h-4 w-4 shrink-0" /><span>{createError}</span>
                                </div>
                            )}
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                                {creating
                                    ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                    : <><ArrowRight className="h-4 w-4" /> Create Fee Record</>}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Filter/search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-1.5 flex gap-1">
                    {(["pending", "paid"] as const).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${tab === t ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                            {t}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        placeholder="Search patient..."
                        className="h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <CreditCard className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No {tab} payments</p>
                    <p className="text-xs text-gray-400">{tab === "pending" ? "Create a new fee record above." : "Confirmed payments appear here."}</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-50">
                        {filtered.map((payment) => (
                            <div key={payment.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-600 text-xs shrink-0">
                                        {payment.patientName?.charAt(0) || "?"}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-gray-900 truncate">{payment.patientName}</p>
                                        <p className="text-xs text-gray-400 truncate">{payment.consultationType}</p>
                                        {payment.receiptNo && (
                                            <p className="text-[10px] font-mono text-gray-300">{payment.receiptNo}</p>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0 ml-4">
                                    <p className="text-base font-black text-gray-900">
                                        UGX {payment.amount.toLocaleString()}
                                    </p>
                                    {payment.status === "PAID" ? (
                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 flex items-center gap-1">
                                            <CheckCircle2 className="h-3 w-3" /> Paid
                                        </span>
                                    ) : (
                                        <button
                                            onClick={() => handleConfirmPayment(payment)}
                                            disabled={processing === payment.id}
                                            className="h-9 px-4 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                                        >
                                            {processing === payment.id
                                                ? <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />
                                                : <><CheckCircle2 className="h-3.5 w-3.5" /> Confirm Paid</>}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

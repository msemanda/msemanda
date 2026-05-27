"use client";

import { useEffect, useState } from "react";
import {
    collection, query, where, getDocs,
    doc, setDoc, serverTimestamp, updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    CreditCard, CheckCircle2, Clock, Search,
    DollarSign, RefreshCw, ShieldCheck, ArrowRight,
    Smartphone, Building2, Banknote, Shield, X, AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/Input";

interface PaymentRecord {
    id: string;
    patientName: string;
    patientEmail: string;
    amount: number;
    consultationType: string;
    status: "PENDING" | "PATIENT_PAID" | "PAID";
    paymentMethod?: string;
    paymentReference?: string;
    createdAt?: any;
    patientPaidAt?: any;
    paidAt?: any;
    collectedBy?: string;
    receiptNo?: string;
}

const CONSULTATION_TYPES = [
    { label: "General Consultation",   amount: 30000 },
    { label: "Specialist Consultation", amount: 80000 },
    { label: "Emergency Consultation",  amount: 50000 },
    { label: "Follow-up Visit",         amount: 15000 },
    { label: "Dental Consultation",     amount: 40000 },
    { label: "Physiotherapy Session",   amount: 35000 },
];

const METHOD_LABEL: Record<string, string> = {
    MOBILE_MONEY:  "Mobile Money",
    CASH:          "Cash",
    BANK_TRANSFER: "Bank Transfer",
    INSURANCE:     "Insurance",
};

type Tab = "pending" | "submitted" | "paid";

export default function ConsultationPaymentsPage() {
    const { profile } = useAuth();
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [tab, setTab] = useState<Tab>("pending");
    const [search, setSearch] = useState("");

    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        patientName: "",
        patientEmail: "",
        consultationType: CONSULTATION_TYPES[0].label,
        amount: CONSULTATION_TYPES[0].amount.toString(),
    });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    useEffect(() => { fetchPayments(); }, [tab]);

    const fetchPayments = async () => {
        setLoading(true);
        try {
            const statusMap: Record<Tab, string> = {
                pending:   "PENDING",
                submitted: "PATIENT_PAID",
                paid:      "PAID",
            };
            const q = query(
                collection(db, "consultationFees"),
                where("status", "==", statusMap[tab])
            );
            const snap = await getDocs(q);
            setPayments(snap.docs.map(d => ({ id: d.id, ...d.data() } as PaymentRecord)));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (payment: PaymentRecord) => {
        setProcessing(payment.id);
        try {
            const receiptNo = `RMC-${Date.now().toString().slice(-8)}`;
            await updateDoc(doc(db, "consultationFees", payment.id), {
                status: "PAID",
                paidAt: serverTimestamp(),
                collectedBy: profile?.name,
                receiptNo,
            });
            await setDoc(doc(db, "bills", payment.id), {
                patientName: payment.patientName,
                patientEmail: payment.patientEmail,
                description: payment.consultationType,
                netAmount: payment.amount,
                paymentMethod: payment.paymentMethod || "CASH",
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
        !search ||
        p.patientName.toLowerCase().includes(search.toLowerCase()) ||
        p.patientEmail.toLowerCase().includes(search.toLowerCase())
    );

    const TAB_LABELS: Record<Tab, string> = {
        pending:   "Awaiting Patient",
        submitted: "Patient Submitted",
        paid:      "Confirmed",
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Consultation Fees</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Create and approve patient consultation fee payments</p>
                </div>
                <div className="flex gap-2">
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
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Create Consultation Fee</h2>
                            <button onClick={() => setShowForm(false)}
                                className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
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
                            <div className="p-3.5 bg-blue-50 rounded-xl border border-blue-100 text-xs font-semibold text-blue-700 flex gap-2">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>The patient will see this fee on their Records page and can submit payment details from there.</span>
                            </div>
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

            {/* Tabs + search */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-1.5 flex gap-1">
                    {(["pending", "submitted", "paid"] as Tab[]).map(t => (
                        <button key={t} onClick={() => setTab(t)}
                            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                                tab === t
                                    ? t === "submitted" ? "bg-amber-500 text-white" : "bg-blue-600 text-white"
                                    : "text-gray-500 hover:bg-gray-50"
                            }`}>
                            {TAB_LABELS[t]}
                        </button>
                    ))}
                </div>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input placeholder="Search patient..."
                        className="h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        value={search} onChange={e => setSearch(e.target.value)} />
                </div>
            </div>

            {/* Patient Submitted banner */}
            {tab === "submitted" && !loading && filtered.length > 0 && (
                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-center gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="text-sm font-semibold text-amber-700">
                        {filtered.length} patient{filtered.length !== 1 ? "s have" : " has"} submitted payment — review the details and approve to confirm.
                    </p>
                </div>
            )}

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <CreditCard className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">
                        {tab === "pending" ? "No pending fees" : tab === "submitted" ? "No patient submissions" : "No confirmed payments"}
                    </p>
                    <p className="text-xs text-gray-400">
                        {tab === "pending" ? "Create a new fee record above." :
                         tab === "submitted" ? "Patients haven't submitted payment yet." :
                         "Approved payments appear here."}
                    </p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="divide-y divide-gray-50">
                        {filtered.map((payment) => (
                            <motion.div key={payment.id}
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className={`px-6 py-4 hover:bg-gray-50/50 transition-colors ${tab === "submitted" ? "border-l-4 border-amber-400" : ""}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-600 text-sm shrink-0">
                                            {payment.patientName?.charAt(0) || "?"}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black text-gray-900 truncate">{payment.patientName}</p>
                                            <p className="text-xs text-gray-400 truncate">{payment.consultationType}</p>
                                            {payment.paymentMethod && (
                                                <div className="flex items-center gap-1.5 mt-1">
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                                                        {METHOD_LABEL[payment.paymentMethod] || payment.paymentMethod}
                                                    </span>
                                                    {payment.paymentReference && (
                                                        <span className="text-[10px] text-gray-400 font-mono">Ref: {payment.paymentReference}</span>
                                                    )}
                                                </div>
                                            )}
                                            {payment.receiptNo && (
                                                <p className="text-[10px] font-mono text-gray-300 mt-0.5">{payment.receiptNo}</p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        <p className="text-base font-black text-gray-900">
                                            UGX {payment.amount.toLocaleString()}
                                        </p>
                                        {payment.status === "PAID" ? (
                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Confirmed
                                            </span>
                                        ) : payment.status === "PATIENT_PAID" ? (
                                            <button
                                                onClick={() => handleApprove(payment)}
                                                disabled={processing === payment.id}
                                                className="h-9 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 transition-colors">
                                                {processing === payment.id
                                                    ? <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />
                                                    : <><CheckCircle2 className="h-3.5 w-3.5" /> Approve Payment</>}
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> Awaiting Patient
                                                </span>
                                                <button
                                                    onClick={() => handleApprove(payment)}
                                                    disabled={processing === payment.id}
                                                    className="h-9 px-3 rounded-xl bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-xs font-bold flex items-center gap-1.5 transition-colors">
                                                    {processing === payment.id
                                                        ? <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />
                                                        : <><CheckCircle2 className="h-3.5 w-3.5" /> Confirm Cash</>}
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

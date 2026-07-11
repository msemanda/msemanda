"use client";

import { useEffect, useState, useRef } from "react";
import {
    collection, query, where, getDocs,
    doc, setDoc, updateDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { notify } from "@/lib/notify";
import { motion, AnimatePresence } from "framer-motion";
import {
    CreditCard, CheckCircle2, Clock, Search,
    RefreshCw, ShieldCheck, ArrowRight,
    AlertCircle, X, UserCheck,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { buildReceiptDocument } from "@/lib/receipt";
import { PhoneDuplicateGuard } from "@/components/patients/PhoneDuplicateGuard";

interface KnownPatient { uid: string; name: string; email: string; phone?: string; }

interface FeeRecord {
    id: string;
    patientName: string;
    patientEmail: string;
    amount: number;
    consultationType: string;
    status: "PENDING" | "PATIENT_PAID" | "PAID" | "CANCELLED";
    paymentMethod?: string;
    paymentReference?: string;
    createdAt?: any;
    paidAt?: any;
    receiptNo?: string;
    cancelledBy?: string;
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
    BANK_TRANSFER: "Bank Transfer", VISA: "Visa Card", INSURANCE: "Insurance",
};

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    PENDING:      { label: "Awaiting Patient",    color: "bg-gray-50 text-gray-500 border-gray-100",   icon: Clock },
    PATIENT_PAID: { label: "Submitted — Pending Finance Approval", color: "bg-amber-50 text-amber-700 border-amber-100", icon: Clock },
    PAID:         { label: "Confirmed by Finance", color: "bg-green-50 text-green-700 border-green-100", icon: CheckCircle2 },
    CANCELLED:    { label: "Cancelled",           color: "bg-gray-50 text-gray-400 border-gray-100",   icon: X },
};

type Tab = "all" | "PENDING" | "PATIENT_PAID" | "PAID" | "CANCELLED";

export default function ReceptionistPaymentsPage() {
    const { profile } = useAuth();
    const [fees, setFees] = useState<FeeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<Tab>("all");
    const [search, setSearch] = useState("");
    const [showForm, setShowForm] = useState(false);
    const [form, setForm] = useState({
        patientName: "", patientEmail: "", patientPhone: "",
        consultationType: CONSULTATION_TYPES[0].label,
        amount: CONSULTATION_TYPES[0].amount.toString(),
    });
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    // Patient combobox
    const [patients, setPatients] = useState<KnownPatient[]>([]);
    const [nameQuery, setNameQuery] = useState("");
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [pickedPatient, setPickedPatient] = useState<KnownPatient | null>(null);
    const nameRef = useRef<HTMLDivElement>(null);

    useEffect(() => { fetchFees(); }, []);

    const fetchFees = async () => {
        setLoading(true);
        try {
            const [feesSnap, patientsSnap] = await Promise.all([
                getDocs(collection(db, "consultationFees")),
                getDocs(query(collection(db, "users"), where("role", "==", "PATIENT"))),
            ]);
            setFees(feesSnap.docs.map(d => ({ id: d.id, ...d.data() } as FeeRecord)));
            setPatients(
                patientsSnap.docs
                    .map(d => { const data = d.data() as any; return { uid: d.id, name: data.name || "", email: data.email || "", phone: data.phone || "" }; })
                    .filter(p => p.name)
            );
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (nameRef.current && !nameRef.current.contains(e.target as Node)) setDropdownOpen(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const patientSuggestions = patients.filter(p =>
        nameQuery.length >= 1 &&
        (p.name.toLowerCase().includes(nameQuery.toLowerCase()) ||
         p.email.toLowerCase().includes(nameQuery.toLowerCase()))
    ).slice(0, 8);

    const handleNameChange = (val: string) => {
        setNameQuery(val);
        setForm(prev => ({ ...prev, patientName: val, patientEmail: "" }));
        setPickedPatient(null);
        setDropdownOpen(true);
    };

    const pickPatient = (p: KnownPatient) => {
        setPickedPatient(p);
        setNameQuery(p.name);
        setForm(prev => ({ ...prev, patientName: p.name, patientEmail: p.email, patientPhone: p.phone || "" }));
        setDropdownOpen(false);
    };

    const clearPick = () => {
        setPickedPatient(null);
        setNameQuery("");
        setForm(prev => ({ ...prev, patientName: "", patientEmail: "", patientPhone: "" }));
    };

    const handleCreateFee = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true); setCreateError("");
        try {
            const email = form.patientEmail.toLowerCase().trim();
            const id = `fee_${Date.now()}`;
            await setDoc(doc(db, "consultationFees", id), {
                patientName: form.patientName.trim(),
                patientEmail: email,
                patientId: pickedPatient?.uid || null,
                consultationType: form.consultationType,
                amount: parseFloat(form.amount),
                status: "PENDING",
                createdAt: serverTimestamp(),
                createdBy: profile?.uid,
                createdByName: profile?.name,
            });

            // Link to any appointment already reserved for this patient that's
            // stuck waiting on a fee that never existed (e.g. booked before this
            // fee was created) — without this, PENDING_PAYMENT appointments with
            // no feeId can never be confirmed since nothing links them to a fee
            // for the cashier's approval flow to find.
            const orphanedAppts = await getDocs(query(
                collection(db, "appointments"),
                where("patientEmail", "==", email),
                where("status", "==", "PENDING_PAYMENT")
            ));
            await Promise.all(
                orphanedAppts.docs
                    .filter(d => !d.data().feeId)
                    .map(d => updateDoc(doc(db, "appointments", d.id), { feeId: id }))
            );

            if (pickedPatient?.uid) {
                await notify({
                    targetUid: pickedPatient.uid,
                    type:      "payment",
                    title:     "Consultation fee due",
                    body:      `UGX ${parseFloat(form.amount).toLocaleString()} for ${form.consultationType}. Pay to confirm your appointment.`,
                    link:      "/patient/records",
                });
            }
            setShowForm(false);
            setPickedPatient(null); setNameQuery("");
            setForm({ patientName: "", patientEmail: "", patientPhone: "", consultationType: CONSULTATION_TYPES[0].label, amount: CONSULTATION_TYPES[0].amount.toString() });
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
        CANCELLED: fees.filter(f => f.status === "CANCELLED").length,
    };

    const TAB_LABELS: Record<Tab, string> = {
        all: "All", PENDING: "Awaiting Patient",
        PATIENT_PAID: "Pending Finance", PAID: "Confirmed",
        CANCELLED: "Cancelled",
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
                            {/* Patient combobox */}
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient</label>
                                <div ref={nameRef} className="relative">
                                    {pickedPatient ? (
                                        <div className="flex items-center gap-2 h-11 px-3 rounded-xl border border-blue-300 bg-blue-50">
                                            <UserCheck className="h-4 w-4 text-blue-600 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-bold text-blue-900 truncate">{pickedPatient.name}</p>
                                                <p className="text-[10px] text-blue-500 truncate">{pickedPatient.email}</p>
                                            </div>
                                            <button type="button" onClick={clearPick}
                                                className="h-5 w-5 rounded-full bg-blue-200 hover:bg-blue-300 flex items-center justify-center shrink-0 transition-colors">
                                                <X className="h-3 w-3 text-blue-700" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="relative">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                            <input required value={nameQuery}
                                                onChange={e => handleNameChange(e.target.value)}
                                                onFocus={() => nameQuery.length >= 1 && setDropdownOpen(true)}
                                                placeholder="Search patient by name or email…"
                                                className="h-11 w-full pl-9 pr-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
                                        </div>
                                    )}
                                    <AnimatePresence>
                                        {dropdownOpen && patientSuggestions.length > 0 && !pickedPatient && (
                                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                                className="absolute z-50 top-full left-0 right-0 mt-1 bg-white rounded-xl border border-gray-100 shadow-xl overflow-hidden">
                                                <p className="px-3 pt-2 pb-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">Existing patients</p>
                                                {patientSuggestions.map(p => (
                                                    <button key={p.uid} type="button" onMouseDown={() => pickPatient(p)}
                                                        className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-blue-50 transition-colors text-left">
                                                        <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center shrink-0">
                                                            <span className="text-[10px] font-black text-blue-700">{p.name.charAt(0).toUpperCase()}</span>
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-gray-900 truncate">{p.name}</p>
                                                            <p className="text-[10px] text-gray-400 truncate">{p.email}</p>
                                                        </div>
                                                        <UserCheck className="h-3.5 w-3.5 text-blue-400 shrink-0 ml-auto" />
                                                    </button>
                                                ))}
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            </div>

                            {!pickedPatient && nameQuery.length > 0 && (
                                <div className="space-y-2">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient Phone (optional — checks for existing records)</label>
                                        <Input type="tel" placeholder="+256 700 000 000" value={form.patientPhone}
                                            onChange={e => setForm(p => ({ ...p, patientPhone: e.target.value }))} />
                                    </div>
                                    <PhoneDuplicateGuard
                                        phone={form.patientPhone}
                                        patients={patients}
                                        onUseExisting={pickPatient}
                                    />
                                </div>
                            )}

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
                                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-gray-400 pointer-events-none">UGX</span>
                                    <Input type="number" required min="0" readOnly className="pl-12 bg-gray-100 text-gray-500 cursor-not-allowed" value={form.amount} />
                                </div>
                                <p className="text-[10px] text-gray-400 ml-1">Fixed by the selected consultation type — not editable</p>
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
                    {(["all", "PENDING", "PATIENT_PAID", "PAID", "CANCELLED"] as Tab[]).map(t => (
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
                                        {fee.status === "PAID" && (
                                            <ExportMenu
                                                variant="icon"
                                                label="Receipt"
                                                data={buildReceiptDocument({
                                                    title: "Consultation Fee Receipt",
                                                    receiptNo: fee.receiptNo,
                                                    patientName: fee.patientName,
                                                    items: [{ description: fee.consultationType, amount: fee.amount }],
                                                    paymentMethod: fee.paymentMethod,
                                                    date: fee.paidAt,
                                                })}
                                            />
                                        )}
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

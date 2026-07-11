"use client";

import { useEffect, useState } from "react";
import {
    collection, query, where, getDocs,
    doc, setDoc, serverTimestamp, updateDoc, addDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { notify } from "@/lib/notify";
import { motion, AnimatePresence } from "framer-motion";
import {
    CreditCard, CheckCircle2, Clock, Search,
    RefreshCw, AlertCircle, XCircle, Smartphone,
    Banknote, Building2, Shield
} from "lucide-react";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { buildReceiptDocument } from "@/lib/receipt";

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
    patientPaidAt?: any;
    paidAt?: any;
    collectedBy?: string;
    receiptNo?: string;
}

const METHOD_ICON: Record<string, any> = {
    MOBILE_MONEY: Smartphone,
    CASH: Banknote,
    BANK_TRANSFER: Building2,
    VISA: CreditCard,
    INSURANCE: Shield,
};
const METHOD_LABEL: Record<string, string> = {
    MOBILE_MONEY: "Mobile Money",
    CASH: "Cash",
    BANK_TRANSFER: "Bank Transfer",
    VISA: "Visa Card",
    INSURANCE: "Insurance",
};

type Tab = "submitted" | "pending" | "paid";

const TAB_CONFIG: Record<Tab, { label: string; status: string; color: string }> = {
    submitted: { label: "Awaiting Approval", status: "PATIENT_PAID", color: "bg-amber-500" },
    pending:   { label: "Not Yet Paid",       status: "PENDING",      color: "bg-blue-600" },
    paid:      { label: "Confirmed",          status: "PAID",         color: "bg-blue-600" },
};

export default function CashierFeesPage() {
    const { profile } = useAuth();
    const [tab, setTab] = useState<Tab>("submitted");
    const [fees, setFees] = useState<FeeRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [counts, setCounts] = useState({ submitted: 0, pending: 0, paid: 0 });

    useEffect(() => { fetchFees(); }, [tab]);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [s, p, d] = await Promise.all([
                    getDocs(query(collection(db, "consultationFees"), where("status", "==", "PATIENT_PAID"))),
                    getDocs(query(collection(db, "consultationFees"), where("status", "==", "PENDING"))),
                    getDocs(query(collection(db, "consultationFees"), where("status", "==", "PAID"))),
                ]);
                setCounts({ submitted: s.size, pending: p.size, paid: d.size });
            } catch(e) { console.error(e); }
        };
        fetchCounts();
    }, []);

    const fetchFees = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "consultationFees"), where("status", "==", TAB_CONFIG[tab].status));
            const snap = await getDocs(q);
            setFees(snap.docs.map(d => ({ id: d.id, ...d.data() } as FeeRecord)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleApprove = async (fee: FeeRecord) => {
        setProcessing(fee.id);
        try {
            const receiptNo = `RMC-${Date.now().toString().slice(-8)}`;
            await updateDoc(doc(db, "consultationFees", fee.id), {
                status: "PAID",
                paidAt: serverTimestamp(),
                collectedBy: profile?.name,
                receiptNo,
            });
            await setDoc(doc(db, "bills", fee.id), {
                patientName: fee.patientName,
                patientEmail: fee.patientEmail,
                description: fee.consultationType,
                netAmount: fee.amount,
                paymentMethod: fee.paymentMethod || "CASH",
                status: "PAID",
                paidAt: serverTimestamp(),
                collectedBy: profile?.uid,
                receiptNo,
            });
            // Record as income so cashier dashboard totals are accurate
            await addDoc(collection(db, "transactions"), {
                type: "INCOME",
                category: "Consultation Fees",
                description: `Consultation fee — ${fee.patientName} (${fee.consultationType})`,
                amount: fee.amount,
                paymentMethod: fee.paymentMethod || "CASH",
                date: serverTimestamp(),
                recordedBy: profile?.name,
                recordedAt: serverTimestamp(),
                patientId: fee.patientEmail,
                receiptNo,
            });

            // Activate any appointment(s) reception reserved against this fee —
            // they were created as PENDING_PAYMENT so the slot wasn't lost, and
            // only now become visible to the doctor.
            const apptSnap = await getDocs(query(
                collection(db, "appointments"),
                where("feeId", "==", fee.id),
                where("status", "==", "PENDING_PAYMENT")
            ));
            for (const apptDoc of apptSnap.docs) {
                await updateDoc(doc(db, "appointments", apptDoc.id), { status: "CONFIRMED" });
                const appt = apptDoc.data() as { doctorId?: string; patientName?: string; date?: string; time?: string };
                if (appt.doctorId) {
                    await notify({
                        targetUid: appt.doctorId,
                        type:      "appointment",
                        title:     `Appointment confirmed: ${appt.patientName || fee.patientName}`,
                        body:      `${appt.date} at ${appt.time} — consultation fee paid`,
                        link:      "/doctor/appointments",
                    });
                }
            }

            setFees(prev => prev.filter(f => f.id !== fee.id));
            setCounts(prev => ({ ...prev, submitted: prev.submitted - 1, paid: prev.paid + 1 }));
        } catch(e) { console.error(e); }
        finally { setProcessing(null); }
    };

    const handleReject = async (fee: FeeRecord) => {
        setProcessing(`reject-${fee.id}`);
        try {
            await updateDoc(doc(db, "consultationFees", fee.id), {
                status: "PENDING",
                paymentMethod: null,
                paymentReference: null,
                patientPaidAt: null,
                rejectedBy: profile?.name,
                rejectedAt: serverTimestamp(),
            });
            setFees(prev => prev.filter(f => f.id !== fee.id));
            setCounts(prev => ({ ...prev, submitted: prev.submitted - 1, pending: prev.pending + 1 }));
        } catch(e) { console.error(e); }
        finally { setProcessing(null); }
    };

    const filtered = fees.filter(f =>
        !search ||
        f.patientName.toLowerCase().includes(search.toLowerCase()) ||
        f.patientEmail.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Consultation Fees</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Review and approve patient payment submissions</p>
                </div>
                <button onClick={fetchFees}
                    className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all shrink-0">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {(Object.entries(TAB_CONFIG) as [Tab, typeof TAB_CONFIG[Tab]][]).map(([key, cfg]) => {
                    const count = counts[key];
                    return (
                        <button key={key} onClick={() => setTab(key)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                                tab === key ? `${cfg.color} text-white shadow-sm` : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                            }`}>
                            {cfg.label}
                            {count > 0 && (
                                <span className={`h-4.5 min-w-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
                                    tab === key ? "bg-white/25 text-white" : key === "submitted" ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-600"
                                }`}>
                                    {count}
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Submitted alert */}
            {tab === "submitted" && !loading && filtered.length > 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="text-sm font-semibold text-amber-700">
                        {filtered.length} payment{filtered.length !== 1 ? "s" : ""} submitted by patients — verify details and approve or reject.
                    </p>
                </div>
            )}

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search patient..."
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <CreditCard className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">
                        {tab === "submitted" ? "No submissions awaiting approval" : tab === "pending" ? "No outstanding fees" : "No confirmed payments yet"}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((fee, i) => {
                            const MethodIcon = fee.paymentMethod ? METHOD_ICON[fee.paymentMethod] : CreditCard;
                            return (
                                <motion.div key={fee.id}
                                    initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }}
                                    transition={{ delay: i * 0.04 }}
                                    className={`bg-white rounded-2xl border shadow-sm p-5 ${tab === "submitted" ? "border-amber-100" : "border-gray-100"}`}>
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`h-11 w-11 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                                tab === "submitted" ? "bg-amber-50 text-amber-700" : tab === "paid" ? "bg-green-50 text-green-700" : "bg-blue-50 text-blue-600"
                                            }`}>
                                                {fee.patientName?.charAt(0) || "?"}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-gray-900 truncate">{fee.patientName}</p>
                                                <p className="text-xs text-gray-400 truncate">{fee.patientEmail}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{fee.consultationType}</p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <p className="text-lg font-black text-gray-900">UGX {fee.amount.toLocaleString()}</p>
                                            {fee.status === "PAID" && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> Confirmed · {fee.receiptNo}
                                                    </span>
                                                    <ExportMenu
                                                        variant="icon"
                                                        label="Receipt"
                                                        data={buildReceiptDocument({
                                                            title: "Consultation Fee Receipt",
                                                            receiptNo: fee.receiptNo,
                                                            patientName: fee.patientName,
                                                            items: [{ description: fee.consultationType, amount: fee.amount }],
                                                            paymentMethod: fee.paymentMethod,
                                                            recordedBy: fee.collectedBy,
                                                            date: fee.paidAt,
                                                        })}
                                                    />
                                                </div>
                                            )}
                                            {fee.status === "PENDING" && (
                                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100 flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> Awaiting patient payment
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {/* Payment details row (submitted or paid) */}
                                    {fee.paymentMethod && (
                                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between flex-wrap gap-3">
                                            <div className="flex items-center gap-2.5">
                                                <div className="h-8 w-8 rounded-lg bg-gray-50 border border-gray-100 flex items-center justify-center">
                                                    <MethodIcon className="h-4 w-4 text-gray-500" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-gray-700">{METHOD_LABEL[fee.paymentMethod] || fee.paymentMethod}</p>
                                                    {fee.paymentReference && (
                                                        <p className="text-[10px] text-gray-400 font-mono">Ref: {fee.paymentReference}</p>
                                                    )}
                                                </div>
                                            </div>

                                            {tab === "submitted" && (
                                                <div className="flex items-center gap-2">
                                                    <button
                                                        onClick={() => handleReject(fee)}
                                                        disabled={!!processing}
                                                        className="h-9 px-4 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50">
                                                        {processing === `reject-${fee.id}`
                                                            ? <div className="animate-spin h-3.5 w-3.5 border-2 border-red-200 border-t-red-500 rounded-full"/>
                                                            : <><XCircle className="h-3.5 w-3.5"/> Reject</>}
                                                    </button>
                                                    <button
                                                        onClick={() => handleApprove(fee)}
                                                        disabled={!!processing}
                                                        className="h-9 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm">
                                                        {processing === fee.id
                                                            ? <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full"/>
                                                            : <><CheckCircle2 className="h-3.5 w-3.5"/> Approve & Confirm</>}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

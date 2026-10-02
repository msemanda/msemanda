"use client";

import { useEffect, useState } from "react";
import {
    collection, query, where, getDocs,
    doc, updateDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { notify } from "@/lib/notify";
import { tsMs } from "@/lib/ts";
import { CPOEOrder } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
    FileText, CalendarDays, CreditCard, Clock,
    CheckCircle2, AlertCircle, ChevronDown, X,
    Smartphone, Building2, Banknote, Shield,
    FlaskConical, Scan
} from "lucide-react";

interface AppointmentRecord {
    id: string;
    doctorName: string;
    specialization: string;
    date: string;
    time: string;
    status: string;
    notes?: string;
    bookedAt?: any;
}

interface FeeRecord {
    id: string;
    consultationType: string;
    amount: number;
    status: "PENDING" | "PATIENT_PAID" | "PAID";
    paymentMethod?: string;
    paymentReference?: string;
    createdAt?: any;
    receiptNo?: string;
}

interface ServiceBill {
    id: string;
    description: string;
    billType: string;
    amount: number;
    status: "PENDING_PAYMENT" | "PAID" | "CANCELLED";
    visitRef?: string;
    createdAt?: any;
    paidAt?: any;
    receiptNo?: string;
}

const PAYMENT_METHODS = [
    { value: "MOBILE_MONEY", label: "Mobile Money (MTN/Airtel)", icon: Smartphone },
    { value: "CASH", label: "Cash (at reception)", icon: Banknote },
    { value: "BANK_TRANSFER", label: "Bank Transfer", icon: Building2 },
    { value: "VISA", label: "Visa Card", icon: CreditCard },
    { value: "INSURANCE", label: "Insurance", icon: Shield },
];

const STATUS_BADGE: Record<string, { color: string; label: string }> = {
    SCHEDULED:       { color: "bg-blue-50 text-blue-700 border-blue-100",   label: "Scheduled" },
    CONFIRMED:       { color: "bg-blue-50 text-blue-700 border-blue-100",   label: "Confirmed" },
    PENDING_PAYMENT: { color: "bg-amber-50 text-amber-700 border-amber-100", label: "Awaiting Payment" },
    COMPLETED:       { color: "bg-green-50 text-green-700 border-green-100", label: "Completed" },
    CANCELLED:       { color: "bg-red-50 text-red-500 border-red-100",       label: "Cancelled" },
    IN_PROGRESS:     { color: "bg-purple-50 text-purple-700 border-purple-100", label: "In Progress" },
};

const FEE_STATUS: Record<string, { color: string; label: string; icon: any }> = {
    PENDING:      { color: "bg-amber-50 text-amber-700 border-amber-100", label: "Payment Due",      icon: Clock },
    PATIENT_PAID: { color: "bg-blue-50 text-blue-700 border-blue-100",    label: "Awaiting Approval", icon: Clock },
    PAID:         { color: "bg-green-50 text-green-700 border-green-100", label: "Confirmed",        icon: CheckCircle2 },
};

const BILL_STATUS: Record<string, { color: string; label: string; icon: any }> = {
    PENDING_PAYMENT: { color: "bg-amber-50 text-amber-700 border-amber-100", label: "Payment Due", icon: Clock },
    PAID:            { color: "bg-green-50 text-green-700 border-green-100", label: "Paid",        icon: CheckCircle2 },
    CANCELLED:       { color: "bg-gray-50 text-gray-500 border-gray-100",    label: "Cancelled",   icon: X },
};

interface BillGroup {
    key: string;
    visitRef?: string;
    bills: ServiceBill[];
    totalAmount: number;
    status: string;
}

function groupServiceBills(list: ServiceBill[]): BillGroup[] {
    const map = new Map<string, BillGroup>();
    for (const b of list) {
        const key = b.visitRef || b.id;
        if (!map.has(key)) map.set(key, { key, visitRef: b.visitRef, bills: [], totalAmount: 0, status: b.status });
        const g = map.get(key)!;
        g.bills.push(b);
        g.totalAmount += b.amount;
    }
    return Array.from(map.values());
}

type Tab = "appointments" | "payments" | "results";

export default function PatientRecordsPage() {
    const { profile } = useAuth();
    const [tab, setTab] = useState<Tab>("appointments");
    const [appointments, setAppointments] = useState<AppointmentRecord[]>([]);
    const [fees, setFees] = useState<FeeRecord[]>([]);
    const [serviceBills, setServiceBills] = useState<ServiceBill[]>([]);
    const [results, setResults] = useState<CPOEOrder[]>([]);
    const [loading, setLoading] = useState(true);

    const [payingFee, setPayingFee] = useState<FeeRecord | null>(null);
    const [payMethod, setPayMethod] = useState("MOBILE_MONEY");
    const [payRef, setPayRef] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [payError, setPayError] = useState("");

    useEffect(() => {
        if (!profile?.email) return;
        fetchData();
    }, [profile]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [apptSnap, feeSnap, orderSnap, billSnap] = await Promise.all([
                getDocs(query(
                    collection(db, "appointments"),
                    where("patientEmail", "==", profile!.email)
                )),
                getDocs(query(
                    collection(db, "consultationFees"),
                    where("patientEmail", "==", profile!.email)
                )),
                getDocs(query(
                    collection(db, "cpoeOrders"),
                    where("patientEmail", "==", profile!.email)
                )),
                getDocs(query(
                    collection(db, "patientBills"),
                    where("patientEmail", "==", profile!.email)
                )),
            ]);
            setAppointments(apptSnap.docs.map(d => ({ id: d.id, ...d.data() } as AppointmentRecord)));
            setFees(feeSnap.docs.map(d => ({ id: d.id, ...d.data() } as FeeRecord)));
            const bills = billSnap.docs.map(d => ({ id: d.id, ...d.data() } as ServiceBill));
            bills.sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
            setServiceBills(bills);
            const testResults = orderSnap.docs
                .map(d => ({ id: d.id, ...d.data() } as CPOEOrder))
                .filter(o => (o.orderType === "LAB" || o.orderType === "RADIOLOGY") && o.status === "COMPLETED");
            testResults.sort((a, b) => tsMs(b.resultsEnteredAt || b.reportedAt) - tsMs(a.resultsEnteredAt || a.reportedAt));
            setResults(testResults);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handlePaySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!payingFee) return;
        if (payMethod !== "CASH" && !payRef.trim()) {
            setPayError("Please enter a payment reference.");
            return;
        }
        setSubmitting(true);
        setPayError("");
        try {
            await updateDoc(doc(db, "consultationFees", payingFee.id), {
                status: "PATIENT_PAID",
                paymentMethod: payMethod,
                paymentReference: payRef.trim(),
                patientPaidAt: serverTimestamp(),
            });
            setFees(prev => prev.map(f =>
                f.id === payingFee.id
                    ? { ...f, status: "PATIENT_PAID", paymentMethod: payMethod, paymentReference: payRef.trim() }
                    : f
            ));
            await Promise.all([
                notify({
                    targetRole: "CASHIER",
                    type:       "payment",
                    title:      `Payment submitted: ${profile?.name || "Patient"}`,
                    body:       `UGX ${payingFee.amount.toLocaleString()} for ${payingFee.consultationType} — awaiting approval.`,
                    link:       "/cashier/fees",
                }),
                notify({
                    targetRole: "RECEPTIONIST",
                    type:       "payment",
                    title:      `Payment submitted: ${profile?.name || "Patient"}`,
                    body:       `UGX ${payingFee.amount.toLocaleString()} for ${payingFee.consultationType} — awaiting Finance approval.`,
                    link:       "/receptionist/payments",
                }),
            ]);
            setPayingFee(null);
            setPayRef("");
            setPayMethod("MOBILE_MONEY");
        } catch (err: any) {
            setPayError(err.message || "Failed to submit payment.");
        } finally {
            setSubmitting(false);
        }
    };

    const billGroups = groupServiceBills(serviceBills);
    const pendingBillGroups = billGroups.filter(g => g.status === "PENDING_PAYMENT");
    const pendingCount = fees.filter(f => f.status === "PENDING").length + pendingBillGroups.length;

    return (
        <div className="max-w-4xl mx-auto px-6 py-8 pb-16 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <FileText className="h-6 w-6 text-blue-600" /> Medical Records
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Your appointments and payment history</p>
                </div>
                {pendingCount > 0 && (
                    <button onClick={() => setTab("payments")}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-xs font-bold hover:bg-amber-100 transition-colors">
                        <AlertCircle className="h-4 w-4" />
                        {pendingCount} payment{pendingCount > 1 ? "s" : ""} due
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-1 w-fit">
                {(["appointments", "payments", "results"] as Tab[]).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-5 py-2 rounded-xl text-xs font-bold capitalize transition-all flex items-center gap-1.5 ${
                            tab === t ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
                        }`}>
                        {t === "appointments" ? <CalendarDays className="h-3.5 w-3.5" /> : t === "payments" ? <CreditCard className="h-3.5 w-3.5" /> : <FlaskConical className="h-3.5 w-3.5" />}
                        {t === "appointments" ? "Appointments" : t === "payments" ? "Payments" : "Test Results"}
                        {t === "payments" && pendingCount > 0 && (
                            <span className={`ml-1 h-4 w-4 rounded-full text-[10px] font-black flex items-center justify-center ${tab === t ? "bg-white/30 text-white" : "bg-amber-100 text-amber-700"}`}>
                                {pendingCount}
                            </span>
                        )}
                        {t === "results" && results.length > 0 && (
                            <span className={`ml-1 h-4 w-4 rounded-full text-[10px] font-black flex items-center justify-center ${tab === t ? "bg-white/30 text-white" : "bg-gray-100 text-gray-600"}`}>
                                {results.length}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : tab === "appointments" ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
                    {appointments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                            <CalendarDays className="h-12 w-12 text-gray-200 mb-4" />
                            <p className="text-sm font-black text-gray-900 mb-1">No appointments yet</p>
                            <p className="text-xs text-gray-400">Your visit history will appear here.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{appointments.length} appointment{appointments.length !== 1 ? "s" : ""}</p>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {appointments.map((appt, i) => {
                                    const badge = STATUS_BADGE[appt.status] || { color: "bg-gray-50 text-gray-600 border-gray-100", label: appt.status };
                                    return (
                                        <motion.div key={appt.id}
                                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                                            className="px-5 py-4 flex items-center justify-between hover:bg-gray-50/50 transition-colors">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center shrink-0">
                                                    <CalendarDays className="h-4.5 w-4.5 text-blue-600" />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-gray-900">{appt.doctorName}</p>
                                                    <p className="text-xs text-gray-400">{appt.specialization || "General"} · {appt.date} at {appt.time}</p>
                                                    {appt.notes && <p className="text-xs text-gray-500 italic mt-0.5 truncate max-w-xs">"{appt.notes}"</p>}
                                                </div>
                                            </div>
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ml-4 ${badge.color}`}>
                                                {badge.label}
                                            </span>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </motion.div>
            ) : tab === "payments" ? (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                    {fees.length === 0 && billGroups.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                            <CreditCard className="h-12 w-12 text-gray-200 mb-4" />
                            <p className="text-sm font-black text-gray-900 mb-1">No payments</p>
                            <p className="text-xs text-gray-400">Your consultation fees and service bills will appear here.</p>
                        </div>
                    ) : (
                    <>
                    {fees.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider">Consultation Fees</h2>
                            {fees.map((fee, i) => {
                                const s = FEE_STATUS[fee.status] || { color: "bg-gray-50 text-gray-600 border-gray-100", label: fee.status, icon: Clock };
                                const StatusIcon = s.icon;
                                return (
                                    <motion.div key={fee.id}
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                        className={`bg-white rounded-2xl border shadow-sm p-5 ${fee.status === "PENDING" ? "border-amber-100" : "border-gray-100"}`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                    fee.status === "PENDING" ? "bg-amber-50" : fee.status === "PAID" ? "bg-green-50" : "bg-blue-50"
                                                }`}>
                                                    <CreditCard className={`h-4.5 w-4.5 ${
                                                        fee.status === "PENDING" ? "text-amber-600" : fee.status === "PAID" ? "text-green-600" : "text-blue-600"
                                                    }`} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900">{fee.consultationType}</p>
                                                    <p className="text-base font-black text-gray-800 mt-0.5">UGX {fee.amount.toLocaleString()}</p>
                                                    {fee.paymentMethod && (
                                                        <p className="text-xs text-gray-400 mt-0.5">
                                                            Paid via {fee.paymentMethod.replace(/_/g, " ")}
                                                            {fee.paymentReference ? ` · Ref: ${fee.paymentReference}` : ""}
                                                        </p>
                                                    )}
                                                    {fee.receiptNo && (
                                                        <p className="text-[10px] font-mono text-gray-300 mt-0.5">{fee.receiptNo}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${s.color}`}>
                                                    <StatusIcon className="h-3 w-3" /> {s.label}
                                                </span>
                                                {fee.status === "PENDING" && (
                                                    <button onClick={() => { setPayingFee(fee); setPayError(""); setPayRef(""); setPayMethod("MOBILE_MONEY"); }}
                                                        className="h-8 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm">
                                                        <CreditCard className="h-3.5 w-3.5" /> Pay Now
                                                    </button>
                                                )}
                                                {fee.status === "PATIENT_PAID" && (
                                                    <p className="text-[10px] text-gray-400 font-medium">Waiting for receptionist confirmation</p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}

                    {billGroups.length > 0 && (
                        <div className="space-y-3">
                            <h2 className="text-xs font-black text-gray-400 uppercase tracking-wider">Service Bills</h2>
                            {billGroups.map((group, i) => {
                                const s = BILL_STATUS[group.status] || { color: "bg-gray-50 text-gray-600 border-gray-100", label: group.status, icon: Clock };
                                const StatusIcon = s.icon;
                                const multi = group.bills.length > 1;
                                return (
                                    <motion.div key={group.key}
                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                        className={`bg-white rounded-2xl border shadow-sm p-5 ${group.status === "PENDING_PAYMENT" ? "border-amber-100" : "border-gray-100"}`}>
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${
                                                    group.status === "PENDING_PAYMENT" ? "bg-amber-50" : group.status === "PAID" ? "bg-green-50" : "bg-gray-50"
                                                }`}>
                                                    <CreditCard className={`h-4.5 w-4.5 ${
                                                        group.status === "PENDING_PAYMENT" ? "text-amber-600" : group.status === "PAID" ? "text-green-600" : "text-gray-400"
                                                    }`} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-black text-gray-900">
                                                        {multi ? `${group.bills.length} items — ${group.bills.map(b => b.billType).join(", ")}` : group.bills[0].billType}
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                                                        {group.bills.map(b => b.description).join(", ")}
                                                    </p>
                                                    <p className="text-base font-black text-gray-800 mt-0.5">UGX {group.totalAmount.toLocaleString()}</p>
                                                    {group.bills[0].receiptNo && (
                                                        <p className="text-[10px] font-mono text-gray-300 mt-0.5">{group.bills[0].receiptNo}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-2 shrink-0">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${s.color}`}>
                                                    <StatusIcon className="h-3 w-3" /> {s.label}
                                                </span>
                                                {group.status === "PENDING_PAYMENT" && (
                                                    <p className="text-[10px] text-gray-400 font-medium text-right max-w-[140px]">Pay at reception or cashier to release this order</p>
                                                )}
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                    </>
                    )}
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                    {results.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                            <FlaskConical className="h-12 w-12 text-gray-200 mb-4" />
                            <p className="text-sm font-black text-gray-900 mb-1">No test results yet</p>
                            <p className="text-xs text-gray-400">Lab and radiology results will appear here once completed.</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {results.map((order, i) => (
                                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${order.orderType === "LAB" ? "bg-amber-50" : "bg-purple-50"}`}>
                                                {order.orderType === "LAB"
                                                    ? <FlaskConical className="h-4.5 w-4.5 text-amber-600" />
                                                    : <Scan className="h-4.5 w-4.5 text-purple-600" />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-gray-900 truncate">{order.detail}</p>
                                                <p className="text-xs text-gray-400">
                                                    {order.orderType === "LAB" ? "Lab" : "Radiology"} · {order.orderedBy ? `Dr. ${order.orderedBy}` : "—"}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 shrink-0">
                                            Completed
                                        </span>
                                    </div>

                                    {order.orderType === "LAB" && Array.isArray(order.results) && order.results.length > 0 && (
                                        <div className="space-y-1.5">
                                            {order.results.map((r, ri) => (
                                                <div key={ri} className="flex items-center justify-between text-xs bg-gray-50 rounded-lg px-3 py-2">
                                                    <span className="text-gray-600">{r.testName}</span>
                                                    <span className={`font-bold ${
                                                        r.flag === "CRITICAL" ? "text-red-600" :
                                                        r.flag === "HIGH" || r.flag === "LOW" ? "text-amber-600" : "text-gray-800"
                                                    }`}>
                                                        {r.value} {r.unit}
                                                        {r.flag && r.flag !== "NORMAL" && <span className="ml-1">({r.flag})</span>}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {order.orderType === "RADIOLOGY" && (
                                        <div className="space-y-2">
                                            {order.findings && (
                                                <div className="bg-gray-50 rounded-xl p-3">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Findings</p>
                                                    <p className="text-xs text-gray-700">{order.findings}</p>
                                                </div>
                                            )}
                                            {order.impression && (
                                                <div className="bg-purple-50 rounded-xl p-3">
                                                    <p className="text-[10px] font-black text-purple-400 uppercase tracking-wider mb-1">Impression</p>
                                                    <p className="text-xs text-purple-900 font-semibold">{order.impression}</p>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </motion.div>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}

            {/* Pay Now Modal */}
            <AnimatePresence>
                {payingFee && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                        onClick={e => { if (e.target === e.currentTarget) setPayingFee(null); }}>
                        <motion.div initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-3xl shadow-2xl border border-gray-100 w-full max-w-md p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className="text-lg font-black text-gray-900">Submit Payment</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">{payingFee.consultationType}</p>
                                </div>
                                <button onClick={() => setPayingFee(null)}
                                    className="h-8 w-8 rounded-xl border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>

                            <div className="mb-5 p-4 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
                                <p className="text-sm text-gray-600 font-semibold">Amount Due</p>
                                <p className="text-xl font-black text-gray-900">UGX {payingFee.amount.toLocaleString()}</p>
                            </div>

                            <form onSubmit={handlePaySubmit} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Payment Method</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {PAYMENT_METHODS.map(m => {
                                            const Icon = m.icon;
                                            return (
                                                <button key={m.value} type="button"
                                                    onClick={() => setPayMethod(m.value)}
                                                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-xs font-bold text-left transition-all ${
                                                        payMethod === m.value
                                                            ? "border-blue-500 bg-blue-50 text-blue-700"
                                                            : "border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                                                    }`}>
                                                    <Icon className="h-4 w-4 shrink-0" />
                                                    <span className="leading-tight">{m.label}</span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>

                                {payMethod !== "CASH" && (
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                                            {payMethod === "MOBILE_MONEY" ? "Transaction ID / Reference" :
                                             payMethod === "BANK_TRANSFER" ? "Transfer Reference" :
                                             payMethod === "VISA" ? "Card Transaction Reference" : "Insurance Claim No."}
                                        </label>
                                        <input
                                            required
                                            placeholder="Enter reference number..."
                                            value={payRef}
                                            onChange={e => setPayRef(e.target.value)}
                                            className="w-full h-11 px-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 placeholder:font-normal focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                        />
                                    </div>
                                )}

                                {payMethod === "CASH" && (
                                    <div className="p-3.5 bg-amber-50 border border-amber-100 rounded-xl text-xs font-semibold text-amber-700 flex gap-2">
                                        <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                        <span>Walk to the reception desk and pay in cash. The receptionist will confirm your payment.</span>
                                    </div>
                                )}

                                <AnimatePresence>
                                    {payError && (
                                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                            className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold">
                                            {payError}
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                <button type="submit" disabled={submitting}
                                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm">
                                    {submitting
                                        ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                        : <><CheckCircle2 className="h-4 w-4" /> Confirm Payment Submitted</>}
                                </button>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

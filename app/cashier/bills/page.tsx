"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, updateDoc, doc, serverTimestamp, addDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    CreditCard, CheckCircle2, Clock, Search, RefreshCw,
    AlertCircle, XCircle, FlaskConical, Scan, Pill, UtensilsCrossed, Activity, ClipboardList, Layers
} from "lucide-react";
import { ExportMenu } from "@/components/ui/ExportMenu";
import { buildReceiptDocument } from "@/lib/receipt";

interface PatientBill {
    id: string;
    patientName: string;
    patientEmail: string;
    description: string;
    billType: string;
    amount: number;
    orderId?: string;
    orderedBy?: string;
    ward?: string;
    visitRef?: string;
    status: "PENDING_PAYMENT" | "PAID" | "CANCELLED";
    createdAt?: any;
    paidAt?: any;
    collectedBy?: string;
    receiptNo?: string;
}

interface BillGroup {
    key: string;
    visitRef?: string;
    patientName: string;
    patientEmail: string;
    ward?: string;
    orderedBy?: string;
    bills: PatientBill[];
    totalAmount: number;
    createdAt?: any;
    receiptNo?: string;
}

const TYPE_ICON: Record<string, any> = {
    MEDICATION: Pill, LAB: FlaskConical, RADIOLOGY: Scan,
    NURSING: Activity, DIET: UtensilsCrossed, PROCEDURE: ClipboardList,
};
const TYPE_COLOR: Record<string, string> = {
    MEDICATION: "bg-blue-50 text-blue-600",
    LAB: "bg-amber-50 text-amber-600",
    RADIOLOGY: "bg-purple-50 text-purple-600",
    NURSING: "bg-teal-50 text-teal-600",
    DIET: "bg-green-50 text-green-600",
    PROCEDURE: "bg-rose-50 text-rose-600",
};

type Tab = "pending" | "paid" | "cancelled";

function groupBills(list: PatientBill[]): BillGroup[] {
    const map = new Map<string, BillGroup>();
    for (const b of list) {
        const key = b.visitRef || b.id;
        if (!map.has(key)) {
            map.set(key, {
                key, visitRef: b.visitRef, patientName: b.patientName, patientEmail: b.patientEmail,
                ward: b.ward, orderedBy: b.orderedBy, bills: [], totalAmount: 0,
                createdAt: b.createdAt, receiptNo: b.receiptNo,
            });
        }
        const g = map.get(key)!;
        g.bills.push(b);
        g.totalAmount += b.amount;
    }
    return Array.from(map.values());
}

export default function CashierBillsPage() {
    const { profile } = useAuth();
    const [tab, setTab] = useState<Tab>("pending");
    const [bills, setBills] = useState<PatientBill[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [counts, setCounts] = useState({ pending: 0, paid: 0, cancelled: 0 });

    useEffect(() => { fetchBills(); }, [tab]);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [p, pa, c] = await Promise.all([
                    getDocs(query(collection(db, "patientBills"), where("status", "==", "PENDING_PAYMENT"))),
                    getDocs(query(collection(db, "patientBills"), where("status", "==", "PAID"))),
                    getDocs(query(collection(db, "patientBills"), where("status", "==", "CANCELLED"))),
                ]);
                setCounts({ pending: p.size, paid: pa.size, cancelled: c.size });
            } catch(e) { console.error(e); }
        };
        fetchCounts();
    }, []);

    const fetchBills = async () => {
        setLoading(true);
        try {
            const statusMap: Record<Tab, string> = { pending: "PENDING_PAYMENT", paid: "PAID", cancelled: "CANCELLED" };
            const q = query(collection(db, "patientBills"), where("status", "==", statusMap[tab]));
            const snap = await getDocs(q);
            setBills(snap.docs.map(d => ({ id: d.id, ...d.data() } as PatientBill)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleApprove = async (group: BillGroup) => {
        setProcessing(group.key);
        try {
            const receiptNo = `RMC-${Date.now().toString().slice(-8)}`;
            for (const bill of group.bills) {
                await updateDoc(doc(db, "patientBills", bill.id), {
                    status: "PAID",
                    paidAt: serverTimestamp(),
                    collectedBy: profile?.name,
                    receiptNo,
                });
                // Only mark PAID on cpoeOrder if it hasn't been dispensed yet
                // (pharmacy may have already advanced the status to DISPENSED)
                if (bill.orderId) {
                    await updateDoc(doc(db, "cpoeOrders", bill.orderId), {
                        paymentStatus: "PAID",
                        paidAt: serverTimestamp(),
                        collectedBy: profile?.name,
                    });
                }
            }
            // Record as income so cashier dashboard totals stay accurate
            const description = group.bills.length > 1
                ? `${group.bills.length} items — ${group.bills.map(b => b.description).join(", ")}`
                : `${group.bills[0].billType} — ${group.bills[0].description}`;
            await addDoc(collection(db, "transactions"), {
                type: "INCOME",
                category: "Service Bills",
                description: `${group.patientName}: ${description}`,
                amount: group.totalAmount,
                paymentMethod: "CASH",
                date: serverTimestamp(),
                recordedBy: profile?.name,
                recordedAt: serverTimestamp(),
                patientId: group.patientEmail,
                receiptNo,
            });
            setBills(prev => prev.filter(b => !group.bills.some(gb => gb.id === b.id)));
            setCounts(prev => ({ ...prev, pending: prev.pending - group.bills.length, paid: prev.paid + group.bills.length }));
        } catch(e) { console.error(e); }
        finally { setProcessing(null); }
    };

    const handleCancel = async (group: BillGroup) => {
        setProcessing(`cancel-${group.key}`);
        try {
            for (const bill of group.bills) {
                await updateDoc(doc(db, "patientBills", bill.id), {
                    status: "CANCELLED",
                    cancelledBy: profile?.name,
                    cancelledAt: serverTimestamp(),
                });
                if (bill.orderId) {
                    await updateDoc(doc(db, "cpoeOrders", bill.orderId), { status: "CANCELLED" });
                }
            }
            setBills(prev => prev.filter(b => !group.bills.some(gb => gb.id === b.id)));
            setCounts(prev => ({ ...prev, pending: prev.pending - group.bills.length, cancelled: prev.cancelled + group.bills.length }));
        } catch(e) { console.error(e); }
        finally { setProcessing(null); }
    };

    const groups = groupBills(bills);
    const filteredGroups = groups.filter(g =>
        !search || g.patientName.toLowerCase().includes(search.toLowerCase()) ||
        g.bills.some(b => b.description.toLowerCase().includes(search.toLowerCase()))
    );

    const totalPending = filteredGroups.reduce((s, g) => s + g.totalAmount, 0);

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Service Bills</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Confirm payment to release routine orders to departments — STAT/URGENT orders proceed regardless</p>
                </div>
                <button onClick={fetchBills} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all shrink-0">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            {tab === "pending" && counts.pending > 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="text-sm font-semibold text-amber-700">
                        {counts.pending} bill{counts.pending !== 1 ? "s" : ""} awaiting payment confirmation — routine department work is held until then.
                    </p>
                </div>
            )}

            <div className="flex gap-2 flex-wrap">
                {([
                    { key: "pending", label: "Awaiting Payment", count: counts.pending },
                    { key: "paid",    label: "Paid & Confirmed",  count: counts.paid },
                    { key: "cancelled", label: "Cancelled",       count: counts.cancelled },
                ] as const).map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                            tab === t.key
                                ? t.key === "pending" ? "bg-amber-500 text-white shadow-sm"
                                : t.key === "paid" ? "bg-green-600 text-white shadow-sm"
                                : "bg-gray-500 text-white shadow-sm"
                                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}>
                        {t.label}
                        {t.count > 0 && (
                            <span className={`h-4.5 min-w-4 px-1 rounded-full text-[10px] font-black flex items-center justify-center ${
                                tab === t.key ? "bg-white/25 text-white" : "bg-gray-100 text-gray-600"
                            }`}>{t.count}</span>
                        )}
                    </button>
                ))}
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search patient or service..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
            </div>

            {tab === "pending" && !loading && filteredGroups.length > 0 && (
                <div className="flex items-center justify-between px-4 py-3 bg-gray-50 rounded-xl border border-gray-100">
                    <p className="text-xs font-bold text-gray-500">{filteredGroups.length} visit{filteredGroups.length !== 1 ? "s" : ""} shown</p>
                    <p className="text-sm font-black text-gray-900">Total: UGX {totalPending.toLocaleString()}</p>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filteredGroups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <CreditCard className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">
                        {tab === "pending" ? "No pending bills" : tab === "paid" ? "No paid bills" : "No cancelled bills"}
                    </p>
                    <p className="text-xs text-gray-400">Bills appear here when doctors submit orders.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filteredGroups.map((group, i) => {
                            const multi = group.bills.length > 1;
                            const first = group.bills[0];
                            const TypeIcon = multi ? Layers : (TYPE_ICON[first.billType] || CreditCard);
                            const typeColor = multi ? "bg-indigo-50 text-indigo-600" : (TYPE_COLOR[first.billType] || "bg-gray-50 text-gray-500");
                            return (
                                <motion.div key={group.key} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                                    className={`bg-white rounded-2xl border shadow-sm p-5 ${tab === "pending" ? "border-amber-100" : "border-gray-100"}`}>
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${typeColor}`}>
                                                <TypeIcon className="h-5 w-5" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-gray-900">{group.patientName}</p>
                                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                                    {multi ? `${group.bills.length} items — ${group.bills.map(b => b.description).join(", ")}` : first.description}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-[10px] font-bold text-gray-400">{multi ? "MULTI-ITEM VISIT" : first.billType}</span>
                                                    {group.ward && <span className="text-[10px] text-gray-400">· {group.ward}</span>}
                                                    {group.orderedBy && <span className="text-[10px] text-gray-400">· Dr. {group.orderedBy}</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <p className="text-lg font-black text-gray-900">UGX {group.totalAmount.toLocaleString()}</p>
                                            {tab === "paid" && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 flex items-center gap-1">
                                                        <CheckCircle2 className="h-3 w-3" /> Paid · {group.receiptNo}
                                                    </span>
                                                    <ExportMenu
                                                        variant="icon"
                                                        label="Receipt"
                                                        data={buildReceiptDocument({
                                                            title: "Service Bill Receipt",
                                                            receiptNo: group.receiptNo,
                                                            patientName: group.patientName,
                                                            items: group.bills.map(b => ({ description: b.description, category: b.billType, amount: b.amount })),
                                                            recordedBy: first.collectedBy,
                                                            date: first.paidAt,
                                                        })}
                                                    />
                                                </div>
                                            )}
                                            {tab === "cancelled" && (
                                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100 flex items-center gap-1">
                                                    <XCircle className="h-3 w-3" /> Cancelled
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    {multi && (
                                        <div className="mt-3 pt-3 border-t border-gray-50 space-y-1.5">
                                            {group.bills.map(b => {
                                                const ItemIcon = TYPE_ICON[b.billType] || CreditCard;
                                                return (
                                                    <div key={b.id} className="flex items-center justify-between text-xs">
                                                        <span className="flex items-center gap-1.5 text-gray-600">
                                                            <ItemIcon className="h-3 w-3 text-gray-400" /> {b.description}
                                                            <span className="text-gray-400">({b.billType})</span>
                                                        </span>
                                                        <span className="font-bold text-gray-700">UGX {b.amount.toLocaleString()}</span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {tab === "pending" && (
                                        <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                            <p className="text-xs text-amber-600 font-semibold flex items-center gap-1.5">
                                                <Clock className="h-3.5 w-3.5" /> Awaiting payment confirmation from patient
                                            </p>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleCancel(group)} disabled={!!processing}
                                                    className="h-9 px-4 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50">
                                                    {processing === `cancel-${group.key}`
                                                        ? <div className="animate-spin h-3.5 w-3.5 border-2 border-red-200 border-t-red-500 rounded-full"/>
                                                        : <><XCircle className="h-3.5 w-3.5"/> Cancel</>}
                                                </button>
                                                <button onClick={() => handleApprove(group)} disabled={!!processing}
                                                    className="h-9 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm">
                                                    {processing === group.key
                                                        ? <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full"/>
                                                        : <><CheckCircle2 className="h-3.5 w-3.5"/> Confirm Payment</>}
                                                </button>
                                            </div>
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

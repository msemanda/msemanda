"use client";

import { useEffect, useState } from "react";
import {
    collection, getDocs, updateDoc, doc, serverTimestamp, query, where, orderBy,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    ClipboardList, CheckCircle2, Clock, RefreshCw,
    Search, User, Pill, AlertCircle, Package,
} from "lucide-react";

interface RxOrder {
    id: string;
    orderText: string;
    amount: number;
    patientName: string;
    patientEmail?: string;
    ward?: string;
    orderedBy?: string;
    orderedAt?: any;
    status: string;
    billId?: string;
    type: string;
}

type Tab = "queued" | "dispensed" | "cancelled";

const TAB_STATUS: Record<Tab, string> = {
    queued:    "PENDING",
    dispensed: "DISPENSED",
    cancelled: "CANCELLED",
};

export default function PrescriptionQueuePage() {
    const { profile } = useAuth();
    const [tab, setTab] = useState<Tab>("queued");
    const [orders, setOrders] = useState<RxOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [counts, setCounts] = useState({ queued: 0, dispensed: 0, cancelled: 0 });

    useEffect(() => { fetchOrders(); }, [tab]);

    useEffect(() => {
        const fetchCounts = async () => {
            try {
                const [q, d, c] = await Promise.all([
                    getDocs(query(collection(db, "cpoeOrders"), where("orderType", "==", "MEDICATION"), where("status", "==", "PENDING"))),
                    getDocs(query(collection(db, "cpoeOrders"), where("orderType", "==", "MEDICATION"), where("status", "==", "DISPENSED"))),
                    getDocs(query(collection(db, "cpoeOrders"), where("orderType", "==", "MEDICATION"), where("status", "==", "CANCELLED"))),
                ]);
                setCounts({ queued: q.size, dispensed: d.size, cancelled: c.size });
            } catch (e) { console.error(e); }
        };
        fetchCounts();
    }, []);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(
                query(collection(db, "cpoeOrders"),
                    where("orderType", "==", "MEDICATION"),
                    where("status", "==", TAB_STATUS[tab]))
            );
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as RxOrder)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDispense = async (order: RxOrder) => {
        setProcessing(order.id);
        try {
            await updateDoc(doc(db, "cpoeOrders", order.id), {
                status: "DISPENSED",
                dispensedBy: profile?.name,
                dispensedAt: serverTimestamp(),
            });
            if (order.billId) {
                await updateDoc(doc(db, "patientBills", order.billId), {
                    status: "DISPENSED",
                    dispensedAt: serverTimestamp(),
                });
            }
            setOrders(prev => prev.filter(o => o.id !== order.id));
            setCounts(prev => ({ ...prev, queued: prev.queued - 1, dispensed: prev.dispensed + 1 }));
        } catch (e) { console.error(e); }
        finally { setProcessing(null); }
    };

    const handleCancel = async (order: RxOrder) => {
        setProcessing(`cancel-${order.id}`);
        try {
            await updateDoc(doc(db, "cpoeOrders", order.id), {
                status: "CANCELLED",
                cancelledBy: profile?.name,
                cancelledAt: serverTimestamp(),
            });
            setOrders(prev => prev.filter(o => o.id !== order.id));
            setCounts(prev => ({ ...prev, queued: prev.queued - 1, cancelled: prev.cancelled + 1 }));
        } catch (e) { console.error(e); }
        finally { setProcessing(null); }
    };

    const filtered = orders.filter(o =>
        !search ||
        o.patientName?.toLowerCase().includes(search.toLowerCase()) ||
        o.orderText?.toLowerCase().includes(search.toLowerCase())
    );

    const tabs: { key: Tab; label: string; count: number; color: string; active: string }[] = [
        { key: "queued",    label: "Awaiting Dispensing", count: counts.queued,    color: "bg-amber-500",  active: "bg-amber-500 text-white" },
        { key: "dispensed", label: "Dispensed",           count: counts.dispensed, color: "bg-green-600",  active: "bg-green-600 text-white" },
        { key: "cancelled", label: "Cancelled",           count: counts.cancelled, color: "bg-gray-400",   active: "bg-gray-500 text-white" },
    ];

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Prescription Queue</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Medication orders from doctors — ready to dispense
                    </p>
                </div>
                <button onClick={fetchOrders}
                    className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all shrink-0">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            {/* Alert banner */}
            {tab === "queued" && counts.queued > 0 && (
                <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                    <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                    <p className="text-sm font-semibold text-amber-700">
                        {counts.queued} prescription{counts.queued !== 1 ? "s" : ""} waiting — ordered by doctor, ready to dispense.
                    </p>
                </div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 flex-wrap">
                {tabs.map(t => (
                    <button key={t.key} onClick={() => setTab(t.key)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                            tab === t.key
                                ? t.active + " shadow-sm"
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

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search patient or medication..." value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <ClipboardList className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">
                        {tab === "queued" ? "No prescriptions in queue" : `No ${tab} prescriptions`}
                    </p>
                    <p className="text-xs text-gray-400">
                        {tab === "queued"
                            ? "Medication orders from doctors appear here."
                            : "Records will appear here once processed."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((order, i) => (
                            <motion.div key={order.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.97 }}
                                transition={{ delay: i * 0.04 }}
                                className={`bg-white rounded-2xl border shadow-sm p-5 ${
                                    tab === "queued" ? "border-amber-100" : "border-gray-100"
                                }`}>
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    {/* Left: patient + order */}
                                    <div className="flex items-start gap-3 min-w-0">
                                        <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                            <Pill className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-black text-gray-900">{order.patientName}</p>
                                                {order.ward && (
                                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500">
                                                        {order.ward}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-gray-700 mt-1 font-medium">{order.detail || order.orderText}</p>
                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                {order.orderedBy && (
                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                        <User className="h-3 w-3" /> Dr. {order.orderedBy}
                                                    </span>
                                                )}
                                                {order.patientEmail && (
                                                    <span className="text-[10px] text-gray-400">{order.patientEmail}</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Right: amount + status */}
                                    <div className="flex flex-col items-end gap-2 shrink-0">
                                        <p className="text-base font-black text-gray-900">
                                            UGX {order.amount?.toLocaleString()}
                                        </p>
                                        {tab === "dispensed" && (
                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Dispensed
                                            </span>
                                        )}
                                        {tab === "cancelled" && (
                                            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-gray-50 text-gray-500 border border-gray-100">
                                                Cancelled
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Actions — only in queued tab */}
                                {tab === "queued" && (
                                    <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                                        <p className="text-xs text-amber-600 font-semibold flex items-center gap-1.5">
                                            <Clock className="h-3.5 w-3.5" /> Ordered by doctor — dispense now, Finance bills separately
                                        </p>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleCancel(order)} disabled={!!processing}
                                                className="h-9 px-4 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50">
                                                {processing === `cancel-${order.id}`
                                                    ? <div className="animate-spin h-3.5 w-3.5 border-2 border-red-200 border-t-red-500 rounded-full" />
                                                    : "Cancel"}
                                            </button>
                                            <button onClick={() => handleDispense(order)} disabled={!!processing}
                                                className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm">
                                                {processing === order.id
                                                    ? <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />
                                                    : <><Package className="h-3.5 w-3.5" /> Mark Dispensed</>}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

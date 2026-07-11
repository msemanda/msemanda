"use client";

import { useEffect, useRef, useState } from "react";
import { collection, getDocs, addDoc, query, where, serverTimestamp } from "firebase/firestore";
import { tsMs } from "@/lib/ts";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    ClipboardList, Plus, FlaskConical, Scan, Pill, UtensilsCrossed,
    Activity, CheckCircle2, Clock, CreditCard, AlertCircle,
    Search, X, User,
} from "lucide-react";

type OrderType = "MEDICATION" | "LAB" | "RADIOLOGY" | "NURSING" | "DIET" | "PROCEDURE";

const ORDER_TYPES: { type: OrderType; label: string; icon: any; color: string; bg: string }[] = [
    { type: "MEDICATION", label: "Medication", icon: Pill,            color: "text-blue-600",   bg: "bg-blue-50" },
    { type: "LAB",        label: "Laboratory", icon: FlaskConical,    color: "text-amber-600",  bg: "bg-amber-50" },
    { type: "RADIOLOGY",  label: "Radiology",  icon: Scan,            color: "text-purple-600", bg: "bg-purple-50" },
    { type: "NURSING",    label: "Nursing",    icon: Activity,        color: "text-teal-600",   bg: "bg-teal-50" },
    { type: "DIET",       label: "Dietary",    icon: UtensilsCrossed, color: "text-green-600",  bg: "bg-green-50" },
    { type: "PROCEDURE",  label: "Procedure",  icon: ClipboardList,   color: "text-rose-600",   bg: "bg-rose-50" },
];

const ORDER_SUGGESTIONS: Record<OrderType, { text: string; amount: number }[]> = {
    MEDICATION: [
        { text: "Amoxicillin 500mg TDS x7d", amount: 15000 },
        { text: "Metformin 500mg BD", amount: 8000 },
        { text: "Amlodipine 5mg OD", amount: 10000 },
        { text: "Paracetamol 1g PRN", amount: 5000 },
        { text: "Omeprazole 20mg OD", amount: 12000 },
        { text: "IV Crystalloids 1L", amount: 20000 },
    ],
    LAB: [
        { text: "Full Blood Count (FBC)", amount: 25000 },
        { text: "Comprehensive Metabolic Panel", amount: 45000 },
        { text: "HbA1c", amount: 35000 },
        { text: "Lipid Profile", amount: 30000 },
        { text: "Thyroid Function Tests (TFTs)", amount: 40000 },
        { text: "Blood Culture x2", amount: 50000 },
        { text: "Urinalysis", amount: 15000 },
        { text: "Malaria RDT", amount: 10000 },
    ],
    RADIOLOGY: [
        { text: "Chest X-Ray PA", amount: 50000 },
        { text: "Abdominal X-Ray", amount: 50000 },
        { text: "CT Chest (with contrast)", amount: 300000 },
        { text: "CT Brain", amount: 280000 },
        { text: "MRI Brain", amount: 450000 },
        { text: "Abdominal Ultrasound", amount: 80000 },
        { text: "Echocardiogram", amount: 150000 },
    ],
    NURSING: [
        { text: "4-hourly vital signs monitoring", amount: 5000 },
        { text: "Strict intake and output monitoring", amount: 5000 },
        { text: "Daily weight", amount: 2000 },
        { text: "Wound dressing BD", amount: 20000 },
        { text: "IV cannula insertion and care", amount: 15000 },
        { text: "Patient fall risk assessment", amount: 2000 },
        { text: "Catheter insertion and care", amount: 25000 },
    ],
    DIET: [
        { text: "Low-salt DASH diet", amount: 15000 },
        { text: "Diabetic diet 1800 kcal", amount: 15000 },
        { text: "Soft diet", amount: 10000 },
        { text: "Clear fluids only", amount: 8000 },
        { text: "High-protein diet", amount: 20000 },
        { text: "Nasogastric tube feeding", amount: 35000 },
    ],
    PROCEDURE: [
        { text: "Suturing (minor wound)", amount: 40000 },
        { text: "Wound debridement", amount: 60000 },
        { text: "Pleural aspiration (thoracentesis)", amount: 120000 },
        { text: "Lumbar puncture", amount: 100000 },
        { text: "Blood transfusion", amount: 150000 },
        { text: "Endoscopy (OGD)", amount: 200000 },
    ],
};

const STATUS_COLOR: Record<string, string> = {
    PENDING:     "bg-amber-50 text-amber-700 border-amber-100",
    IN_PROGRESS: "bg-blue-50 text-blue-600 border-blue-100",
    COMPLETED:   "bg-green-50 text-green-700 border-green-100",
    DISPENSED:   "bg-green-50 text-green-700 border-green-100",
    CANCELLED:   "bg-red-50 text-red-600 border-red-100",
};

export default function CPOEPage() {
    const { profile } = useAuth();
    const [activeType, setActiveType] = useState<OrderType>("MEDICATION");
    const [patients, setPatients]     = useState<any[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [patientSearch, setPatientSearch]     = useState("");
    const [showDropdown, setShowDropdown]       = useState(false);
    const comboRef = useRef<HTMLDivElement>(null);
    const [priority, setPriority] = useState<"ROUTINE" | "URGENT" | "STAT">("ROUTINE");
    const [detail, setDetail] = useState("");
    const [amount, setAmount] = useState("0");
    const [notes, setNotes] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [orders, setOrders] = useState<any[]>([]);
    const [loadingOrders, setLoadingOrders] = useState(true);

    useEffect(() => { fetchPatients(); fetchMyOrders(); }, [profile?.uid]);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (comboRef.current && !comboRef.current.contains(e.target as Node))
                setShowDropdown(false);
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const fetchPatients = async () => {
        if (!profile?.uid) return;
        try {
            const today = new Date().toISOString().split("T")[0];
            const [ipdSnap, apptSnap] = await Promise.all([
                getDocs(query(collection(db, "ipdAdmissions"), where("status", "==", "ADMITTED"))),
                getDocs(query(
                    collection(db, "appointments"),
                    where("doctorId", "==", profile.uid),
                    where("date", "==", today),
                )),
            ]);

            const inpatients = ipdSnap.docs.map(d => ({
                id: d.id, ...d.data(), _source: "IPD",
            })) as any[];

            const outpatients = apptSnap.docs
                .filter(d => !["COMPLETED", "CANCELLED"].includes(d.data().status))
                .map(d => ({
                    id: d.id, ...d.data(),
                    ward: "OPD", bedNumber: null, _source: "OPD",
                })) as any[];

            const all = [...inpatients, ...outpatients];
            setPatients(all);
        } catch(e) { console.error(e); }
    };

    const fetchMyOrders = async () => {
        if (!profile?.uid) return;
        setLoadingOrders(true);
        try {
            const snap = await getDocs(query(collection(db, "cpoeOrders"), where("orderedByUid", "==", profile.uid)));
            const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
            setOrders(all.sort((a: any, b: any) => tsMs(b.createdAt) - tsMs(a.createdAt)).slice(0, 20));
        } catch(e) { console.error(e); }
        finally { setLoadingOrders(false); }
    };

    const handleSuggestion = (s: { text: string; amount: number }) => {
        setDetail(s.text);
        setAmount(s.amount.toString());
    };

    const handleSubmit = async () => {
        if (!detail.trim() || !selectedPatient) return;
        setSubmitting(true);
        try {
            const orderRef = await addDoc(collection(db, "cpoeOrders"), {
                patientName: selectedPatient.patientName,
                patientEmail: selectedPatient.patientEmail,
                ward: selectedPatient.ward,
                orderType: activeType,
                detail: detail.trim(),
                amount: parseFloat(amount) || 0,
                priority,
                notes: notes.trim(),
                orderedBy: profile?.name,
                orderedByUid: profile?.uid,
                status: "PENDING",
                createdAt: serverTimestamp(),
            });

            // Medication is billed at the pharmacy at dispense time, from real stock
            // pricing — the amount here is only an indicative reference for the
            // pharmacist, so no bill is pre-created for MEDICATION orders.
            if (activeType !== "MEDICATION" && parseFloat(amount) > 0) {
                await addDoc(collection(db, "patientBills"), {
                    patientName: selectedPatient.patientName,
                    patientEmail: selectedPatient.patientEmail,
                    description: detail.trim(),
                    billType: activeType,
                    amount: parseFloat(amount),
                    orderId: orderRef.id,
                    orderedBy: profile?.name,
                    status: "PENDING_PAYMENT",
                    ward: selectedPatient.ward,
                    createdAt: serverTimestamp(),
                });
            }

            setSubmitted(true);
            setDetail(""); setAmount("0"); setNotes("");
            setTimeout(() => setSubmitted(false), 3000);
            fetchMyOrders();
        } catch(e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    const activeTypeCfg = ORDER_TYPES.find(t => t.type === activeType)!;

    return (
        <div className="max-w-7xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-blue-600" /> CPOE — Physician Order Entry
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Orders go directly to the department — Finance tracks payment separately</p>
            </div>

            <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                <AlertCircle className="h-5 w-5 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-sm font-semibold text-blue-700">
                    Orders go directly to the relevant department. A bill is generated simultaneously for Finance to track and collect payment.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    {/* Patient combobox */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">Patient (Today's OPD + IPD)</label>
                        <div ref={comboRef} className="relative">
                            {selectedPatient ? (
                                <div className="flex items-center gap-2 h-10 px-3 rounded-xl border border-blue-200 bg-blue-50">
                                    <User className="h-4 w-4 text-blue-500 shrink-0" />
                                    <span className="flex-1 text-sm font-bold text-blue-900 truncate">
                                        {selectedPatient.patientName}
                                        <span className="ml-1.5 text-[10px] font-semibold text-blue-500">
                                            {selectedPatient._source === "IPD" ? `${selectedPatient.ward} Ward` : "OPD"}
                                        </span>
                                    </span>
                                    <button onClick={() => { setSelectedPatient(null); setPatientSearch(""); }}
                                        className="h-5 w-5 rounded-full bg-blue-200 hover:bg-blue-300 flex items-center justify-center text-blue-700 transition-colors shrink-0">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                    <input
                                        value={patientSearch}
                                        onChange={e => { setPatientSearch(e.target.value); setShowDropdown(true); }}
                                        onFocus={() => setShowDropdown(true)}
                                        placeholder={patients.length === 0 ? "No patients scheduled today…" : "Type patient name to search…"}
                                        disabled={patients.length === 0}
                                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 outline-none bg-gray-50 disabled:opacity-50"
                                    />
                                </>
                            )}

                            <AnimatePresence>
                                {showDropdown && !selectedPatient && patients.length > 0 && (
                                    <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                                        className="absolute z-20 top-full mt-1 left-0 right-0 bg-white border border-gray-100 rounded-xl shadow-lg overflow-hidden max-h-52 overflow-y-auto">
                                        {patients
                                            .filter(p => !patientSearch || p.patientName?.toLowerCase().includes(patientSearch.toLowerCase()))
                                            .map(p => (
                                                <button key={p.id} onMouseDown={() => { setSelectedPatient(p); setPatientSearch(""); setShowDropdown(false); }}
                                                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 flex items-center gap-3 transition-colors border-b border-gray-50 last:border-0">
                                                    <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xs shrink-0">
                                                        {p.patientName?.charAt(0)}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-gray-900 truncate">{p.patientName}</p>
                                                        <p className="text-[10px] text-gray-400">
                                                            {p._source === "IPD" ? `${p.ward} Ward · Bed ${p.bedNumber}` : "OPD · Today"}
                                                        </p>
                                                    </div>
                                                </button>
                                            ))
                                        }
                                        {patients.filter(p => !patientSearch || p.patientName?.toLowerCase().includes(patientSearch.toLowerCase())).length === 0 && (
                                            <p className="px-4 py-3 text-xs text-gray-400">No patients match "{patientSearch}"</p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                        {!selectedPatient && patients.length === 0 && (
                            <p className="text-[11px] text-gray-400 mt-1.5">Book an appointment via Receptionist or admit a patient from IPD first.</p>
                        )}
                    </div>

                    {/* Order type */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-3">Order Type</label>
                        <div className="grid grid-cols-6 gap-2">
                            {ORDER_TYPES.map(t => {
                                const Icon = t.icon;
                                return (
                                    <button key={t.type} onClick={() => { setActiveType(t.type); setDetail(""); setAmount("0"); }}
                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                                            activeType === t.type ? `${t.bg} border-current ${t.color}` : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                                        }`}>
                                        <Icon className="h-5 w-5" />
                                        <span className="text-[10px] font-black uppercase tracking-wider leading-none text-center">{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Order detail */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">Order Details</label>

                        <div className="flex flex-wrap gap-1.5">
                            {ORDER_SUGGESTIONS[activeType].map(s => (
                                <button key={s.text} onClick={() => handleSuggestion(s)}
                                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100">
                                    {s.text}
                                </button>
                            ))}
                        </div>

                        <textarea rows={3} value={detail} onChange={e => setDetail(e.target.value)}
                            placeholder={`Enter ${activeType.toLowerCase()} order details or select a suggestion above...`}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all" />

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">
                                    Amount (UGX){activeType === "MEDICATION" && " · Reference only"}
                                </label>
                                <div className="relative">
                                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)}
                                        className="w-full h-10 pl-9 pr-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:border-blue-500 outline-none bg-gray-50" />
                                </div>
                                {activeType === "MEDICATION" && (
                                    <p className="text-[10px] text-gray-400 mt-1">Actual billing happens at the pharmacy, based on real stock pricing at dispense time.</p>
                                )}
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">Priority</label>
                                <div className="flex gap-1.5">
                                    {(["ROUTINE", "URGENT", "STAT"] as const).map(p => (
                                        <button key={p} onClick={() => setPriority(p)}
                                            className={`flex-1 h-10 rounded-xl text-xs font-black border transition-colors ${
                                                priority === p
                                                    ? p === "STAT" ? "bg-red-600 text-white border-red-600"
                                                        : p === "URGENT" ? "bg-amber-500 text-white border-amber-500"
                                                        : "bg-blue-600 text-white border-blue-600"
                                                    : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                                            }`}>{p}</button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">Notes (optional)</label>
                            <input value={notes} onChange={e => setNotes(e.target.value)} placeholder="Additional instructions..."
                                className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-blue-500 outline-none bg-gray-50" />
                        </div>

                        <AnimatePresence>
                            {submitted && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-semibold">
                                    <CheckCircle2 className="h-4 w-4" /> Order sent to department — Finance notified to collect payment
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button onClick={handleSubmit} disabled={!detail.trim() || submitting || !selectedPatient}
                            className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors">
                            {submitting ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : <><Plus className="h-4 w-4" /> Submit Order & Generate Bill</>}
                        </button>
                    </div>
                </div>

                {/* Recent orders */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3.5 border-b border-gray-50">
                        <h3 className="font-bold text-gray-900 text-sm">Recent Orders</h3>
                        <p className="text-[10px] text-gray-400 mt-0.5">Your submitted orders</p>
                    </div>
                    {loadingOrders ? (
                        <div className="flex items-center justify-center py-14"><div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full"/></div>
                    ) : orders.length === 0 ? (
                        <div className="py-14 text-center">
                            <ClipboardList className="h-8 w-8 text-gray-200 mx-auto mb-2"/>
                            <p className="text-xs text-gray-400">No orders yet</p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50 max-h-[500px] overflow-y-auto">
                            {orders.map(o => {
                                const cfg = ORDER_TYPES.find(t => t.type === o.orderType);
                                const Icon = cfg?.icon || ClipboardList;
                                return (
                                    <div key={o.id} className="p-4 hover:bg-gray-50 transition-colors">
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <div className={`p-1.5 rounded-lg ${cfg?.bg || "bg-gray-50"}`}>
                                                <Icon className={`h-3.5 w-3.5 ${cfg?.color || "text-gray-500"}`} />
                                            </div>
                                            <span className="text-xs font-bold text-gray-600 capitalize">{o.orderType}</span>
                                            <span className={`ml-auto text-[10px] font-black px-1.5 py-0.5 rounded ${
                                                o.priority === "STAT" ? "text-red-600 bg-red-50" :
                                                o.priority === "URGENT" ? "text-amber-600 bg-amber-50" : "text-gray-400"
                                            }`}>{o.priority}</span>
                                        </div>
                                        <p className="text-xs font-bold text-gray-900 mb-0.5 truncate">{o.patientName}</p>
                                        <p className="text-xs text-gray-500 mb-2 line-clamp-2">{o.detail}</p>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLOR[o.status] || STATUS_COLOR["PENDING"]}`}>
                                                {o.status.replace(/_/g, " ")}
                                            </span>
                                            {o.amount > 0 && <span className="text-xs font-black text-gray-700">UGX {o.amount.toLocaleString()}</span>}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

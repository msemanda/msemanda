"use client";

import { useEffect, useState } from "react";
import {
    collection, getDocs, addDoc, updateDoc, doc,
    serverTimestamp, query, orderBy, where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Pill, Search, CheckCircle2, AlertTriangle, User,
    Package, X, RefreshCw, Clock, ChevronRight, ClipboardList,
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
    billId?: string;
}

interface DrugStock {
    id: string;
    drugName: string;
    genericName?: string;
    category: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    reorderLevel: number;
}

interface DispenseRecord {
    id: string;
    patientName: string;
    drugName: string;
    quantity: number;
    unit: string;
    totalCost: number;
    dispensedBy?: string;
    notes?: string;
}

export default function PharmacyDispensePage() {
    const { profile } = useAuth();
    const [orders, setOrders]         = useState<RxOrder[]>([]);
    const [drugs, setDrugs]           = useState<DrugStock[]>([]);
    const [records, setRecords]       = useState<DispenseRecord[]>([]);
    const [loading, setLoading]       = useState(true);
    const [saving, setSaving]         = useState(false);
    const [success, setSuccess]       = useState(false);

    // Selected prescription from the queue
    const [selected, setSelected]     = useState<RxOrder | null>(null);

    // Pharmacist-captured fields
    const [selectedDrug, setSelectedDrug] = useState<DrugStock | null>(null);
    const [drugSearch, setDrugSearch] = useState("");
    const [qty, setQty]               = useState("1");
    const [notes, setNotes]           = useState("");
    const [recSearch, setRecSearch]   = useState("");

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordSnap, drugSnap, recSnap] = await Promise.all([
                getDocs(query(collection(db, "cpoeOrders"),
                    where("type", "==", "MEDICATION"),
                    where("status", "==", "PAID"))),
                getDocs(query(collection(db, "pharmacyStock"), orderBy("drugName"))),
                getDocs(query(collection(db, "dispensingRecords"), orderBy("dispensedAt", "desc"))),
            ]);
            setOrders(ordSnap.docs.map(d => ({ id: d.id, ...d.data() } as RxOrder)));
            setDrugs(drugSnap.docs.map(d => ({ id: d.id, ...d.data() } as DrugStock)));
            setRecords(recSnap.docs.map(d => ({ id: d.id, ...d.data() } as DispenseRecord)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const selectOrder = (order: RxOrder) => {
        setSelected(order);
        setSelectedDrug(null);
        setDrugSearch("");
        setQty("1");
        setNotes("");
        // Try to auto-match drug name from order text
        const match = drugs.find(d =>
            order.orderText.toLowerCase().includes(d.drugName.toLowerCase()) ||
            (d.genericName && order.orderText.toLowerCase().includes(d.genericName.toLowerCase()))
        );
        if (match) setSelectedDrug(match);
    };

    const handleDispense = async () => {
        if (!selected || !selectedDrug) return;
        const quantity = parseInt(qty) || 1;
        if (quantity > selectedDrug.quantity) return;

        setSaving(true);
        try {
            const totalCost = quantity * selectedDrug.unitPrice;
            await addDoc(collection(db, "dispensingRecords"), {
                patientName:     selected.patientName,
                patientEmail:    selected.patientEmail || "",
                drugName:        selectedDrug.drugName,
                drugId:          selectedDrug.id,
                quantity,
                unit:            selectedDrug.unit,
                unitPrice:       selectedDrug.unitPrice,
                totalCost,
                prescriptionRef: selected.id,
                orderedBy:       selected.orderedBy || "",
                ward:            selected.ward || "",
                dispensedBy:     profile?.name,
                notes:           notes.trim(),
                dispensedAt:     serverTimestamp(),
            });

            // Deduct stock
            const newQty = selectedDrug.quantity - quantity;
            await updateDoc(doc(db, "pharmacyStock", selectedDrug.id), { quantity: newQty });

            // Mark order dispensed
            await updateDoc(doc(db, "cpoeOrders", selected.id), {
                status: "DISPENSED",
                dispensedBy: profile?.name,
                dispensedAt: serverTimestamp(),
            });

            // Create or update patient bill for cashier to collect payment
            if (selected.billId) {
                // Bill already exists (from CPOE flow) — add dispensing info, keep PENDING_PAYMENT
                await updateDoc(doc(db, "patientBills", selected.billId), {
                    dispensedAt: serverTimestamp(),
                    dispensedBy: profile?.name,
                    amount: totalCost,
                });
            } else {
                // No bill yet — create one so it appears in cashier bills queue
                await addDoc(collection(db, "patientBills"), {
                    patientName:  selected.patientName,
                    patientEmail: selected.patientEmail || "",
                    description:  `${selectedDrug.drugName} × ${quantity} ${selectedDrug.unit}`,
                    billType:     "MEDICATION",
                    amount:       totalCost,
                    orderId:      selected.id,
                    orderedBy:    selected.orderedBy || "",
                    ward:         selected.ward || "",
                    dispensedBy:  profile?.name,
                    status:       "PENDING_PAYMENT",
                    createdAt:    serverTimestamp(),
                });
            }

            // Local state update
            setDrugs(prev => prev.map(d =>
                d.id === selectedDrug.id ? { ...d, quantity: newQty } : d
            ));
            setOrders(prev => prev.filter(o => o.id !== selected.id));
            setRecords(prev => [{
                id: Date.now().toString(),
                patientName: selected.patientName,
                drugName: selectedDrug.drugName,
                quantity,
                unit: selectedDrug.unit,
                totalCost,
                dispensedBy: profile?.name,
                notes: notes.trim(),
            }, ...prev]);

            setSelected(null);
            setSelectedDrug(null);
            setQty("1");
            setNotes("");
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3500);
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const filteredDrugs = drugs.filter(d =>
        d.drugName.toLowerCase().includes(drugSearch.toLowerCase()) ||
        (d.genericName || "").toLowerCase().includes(drugSearch.toLowerCase())
    );

    const filteredRecords = records.filter(r =>
        !recSearch ||
        r.patientName.toLowerCase().includes(recSearch.toLowerCase()) ||
        r.drugName.toLowerCase().includes(recSearch.toLowerCase())
    );

    const qtyNum    = parseInt(qty) || 0;
    const totalCost = selectedDrug ? qtyNum * selectedDrug.unitPrice : 0;
    const overStock = selectedDrug ? qtyNum > selectedDrug.quantity : false;
    const canSubmit = !!selected && !!selectedDrug && !overStock && qtyNum > 0 && !saving;

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-gray-900">Record Dispensing</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Select a paid prescription then confirm the stock item and quantity</p>
                </div>
                <button onClick={fetchData}
                    className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            <AnimatePresence>
                {success && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                        <p className="text-sm font-bold text-green-700">Dispensed — stock updated and order marked complete.</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* ── LEFT: Prescription queue ─────────────────────────────── */}
                <div className="lg:col-span-2 space-y-3">
                    <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">
                        Paid Prescriptions ({orders.length})
                    </h2>

                    {loading ? (
                        <div className="flex items-center justify-center py-14 bg-white rounded-2xl border border-gray-100">
                            <div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                        </div>
                    ) : orders.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                            <ClipboardList className="h-8 w-8 text-gray-200 mb-2" />
                            <p className="text-xs font-black text-gray-700">No paid prescriptions</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">Orders appear here after cashier confirms payment.</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                            {orders.map(order => {
                                const active = selected?.id === order.id;
                                return (
                                    <button key={order.id} onClick={() => selectOrder(order)}
                                        className={`w-full text-left p-4 rounded-2xl border transition-all ${
                                            active
                                                ? "bg-blue-600 border-blue-600 shadow-md shadow-blue-100"
                                                : "bg-white border-gray-100 hover:border-blue-200 hover:bg-blue-50/30"
                                        }`}>
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <p className={`text-xs font-black ${active ? "text-white" : "text-gray-900"}`}>
                                                        {order.patientName}
                                                    </p>
                                                    {order.ward && (
                                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
                                                            active ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                                                        }`}>{order.ward}</span>
                                                    )}
                                                </div>
                                                <p className={`text-[11px] mt-1 font-medium leading-tight ${active ? "text-blue-100" : "text-gray-600"}`}>
                                                    {order.orderText}
                                                </p>
                                                {order.orderedBy && (
                                                    <p className={`text-[10px] mt-1 ${active ? "text-blue-200" : "text-gray-400"}`}>
                                                        Dr. {order.orderedBy}
                                                    </p>
                                                )}
                                            </div>
                                            <ChevronRight className={`h-4 w-4 shrink-0 mt-0.5 ${active ? "text-white" : "text-gray-300"}`} />
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* ── RIGHT: Dispense form ──────────────────────────────────── */}
                <div className="lg:col-span-3 space-y-4">

                    {!selected ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                            <Pill className="h-10 w-10 text-gray-200 mb-3" />
                            <p className="text-sm font-black text-gray-700">Select a prescription</p>
                            <p className="text-xs text-gray-400 mt-1">Pick a paid prescription on the left to begin dispensing.</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-5">

                            {/* Auto-filled order info */}
                            <div className="p-4 bg-blue-50 rounded-xl border border-blue-100 space-y-2">
                                <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">From Doctor's Order</p>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-1.5">
                                    <div>
                                        <p className="text-[10px] text-blue-400 font-semibold">Patient</p>
                                        <p className="text-xs font-black text-blue-900">{selected.patientName}</p>
                                    </div>
                                    {selected.ward && (
                                        <div>
                                            <p className="text-[10px] text-blue-400 font-semibold">Ward</p>
                                            <p className="text-xs font-bold text-blue-900">{selected.ward}</p>
                                        </div>
                                    )}
                                    {selected.orderedBy && (
                                        <div>
                                            <p className="text-[10px] text-blue-400 font-semibold">Ordered by</p>
                                            <p className="text-xs font-bold text-blue-900">Dr. {selected.orderedBy}</p>
                                        </div>
                                    )}
                                    {selected.patientEmail && (
                                        <div>
                                            <p className="text-[10px] text-blue-400 font-semibold">Email</p>
                                            <p className="text-xs font-bold text-blue-900 truncate">{selected.patientEmail}</p>
                                        </div>
                                    )}
                                </div>
                                <div className="pt-1 border-t border-blue-100">
                                    <p className="text-[10px] text-blue-400 font-semibold mb-0.5">Prescription</p>
                                    <p className="text-xs font-black text-blue-900">{selected.orderText}</p>
                                </div>
                            </div>

                            {/* Stock drug to use */}
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Stock Item to Dispense *
                                    {selectedDrug && <span className="ml-2 text-green-600 font-semibold normal-case">auto-matched</span>}
                                </label>
                                {selectedDrug ? (
                                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl border border-green-100">
                                        <div>
                                            <p className="text-xs font-black text-green-900">{selectedDrug.drugName}</p>
                                            <p className="text-[10px] text-green-600">
                                                {selectedDrug.quantity} {selectedDrug.unit} available · UGX {selectedDrug.unitPrice.toLocaleString()} each
                                            </p>
                                        </div>
                                        <button onClick={() => { setSelectedDrug(null); setDrugSearch(""); }}
                                            className="h-6 w-6 rounded-lg bg-green-100 flex items-center justify-center text-green-700 hover:bg-green-200 transition-colors">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        <div className="relative">
                                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                            <input value={drugSearch} onChange={e => setDrugSearch(e.target.value)}
                                                placeholder="Type to search drug inventory..."
                                                className="h-9 w-full pl-8 pr-3 rounded-xl border border-gray-200 text-xs font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                        </div>
                                        {drugSearch && (
                                            <div className="max-h-44 overflow-y-auto border border-gray-100 rounded-xl p-1 bg-white shadow-lg">
                                                {filteredDrugs.length === 0 ? (
                                                    <p className="text-xs text-gray-400 text-center py-4">No matches</p>
                                                ) : filteredDrugs.map(d => (
                                                    <button key={d.id} onClick={() => { setSelectedDrug(d); setDrugSearch(""); }}
                                                        className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50 text-left transition-colors">
                                                        <div>
                                                            <p className="text-xs font-bold text-gray-900">{d.drugName}</p>
                                                            <p className="text-[10px] text-gray-400">{d.genericName || d.category}</p>
                                                        </div>
                                                        <span className={`text-[10px] font-bold ${d.quantity === 0 ? "text-red-500" : d.quantity <= d.reorderLevel ? "text-amber-500" : "text-green-600"}`}>
                                                            {d.quantity} {d.unit}
                                                        </span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Quantity */}
                            {selectedDrug && (
                                <div>
                                    <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5 block">Quantity</label>
                                    <input type="number" min="1" max={selectedDrug.quantity} value={qty}
                                        onChange={e => setQty(e.target.value)}
                                        className={`h-9 w-full px-3 rounded-xl border text-sm font-bold outline-none transition-all focus:ring-2 ${
                                            overStock
                                                ? "border-red-300 focus:ring-red-500/20 bg-red-50"
                                                : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"
                                        }`} />
                                    {overStock ? (
                                        <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> Only {selectedDrug.quantity} {selectedDrug.unit} in stock
                                        </p>
                                    ) : qtyNum > 0 ? (
                                        <p className="text-[10px] text-gray-500 mt-1">
                                            Total: <span className="font-black text-gray-700">UGX {totalCost.toLocaleString()}</span>
                                        </p>
                                    ) : null}
                                </div>
                            )}

                            {/* Notes (only field manually typed) */}
                            <div>
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider mb-1.5 block">
                                    Dispensing Notes <span className="text-gray-300 font-normal normal-case">(dosage, instructions, special handling)</span>
                                </label>
                                <textarea value={notes} onChange={e => setNotes(e.target.value)}
                                    rows={2}
                                    placeholder="e.g. Take 1 tablet 3×/day after meals for 7 days. Avoid alcohol."
                                    className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none" />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3">
                                <button onClick={() => setSelected(null)}
                                    className="h-10 px-4 rounded-xl border border-gray-200 text-gray-500 text-xs font-bold hover:bg-gray-50 transition-colors">
                                    Cancel
                                </button>
                                <button onClick={handleDispense} disabled={!canSubmit}
                                    className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-40 shadow-sm">
                                    {saving
                                        ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                        : <><Package className="h-4 w-4" /> Confirm Dispense</>}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Recent records */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h2 className="text-xs font-black text-gray-500 uppercase tracking-widest">Recent Dispensing</h2>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-gray-400" />
                                <input placeholder="Search..." value={recSearch} onChange={e => setRecSearch(e.target.value)}
                                    className="h-7 pl-7 pr-3 rounded-lg border border-gray-200 bg-white text-xs focus:border-blue-500 outline-none w-40" />
                            </div>
                        </div>
                        {filteredRecords.length === 0 ? (
                            <p className="text-xs text-gray-400 text-center py-8">No records yet.</p>
                        ) : (
                            <div className="space-y-2">
                                {filteredRecords.slice(0, 10).map((r, i) => (
                                    <motion.div key={r.id} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                        className="bg-white rounded-xl border border-gray-100 p-3 flex items-center justify-between gap-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                                                <Pill className="h-3.5 w-3.5 text-blue-600" />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black text-gray-900 truncate">{r.drugName}</p>
                                                <p className="text-[10px] text-gray-400 truncate">{r.patientName} · {r.quantity} {r.unit}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-xs font-black text-gray-700">UGX {r.totalCost?.toLocaleString()}</p>
                                            <p className="text-[10px] text-gray-400">{r.dispensedBy}</p>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import {
    collection, getDocs, addDoc, updateDoc, doc, serverTimestamp, query, orderBy, where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Pill, Search, CheckCircle2, AlertTriangle, User, Package, X, RefreshCw,
} from "lucide-react";

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
    patientEmail?: string;
    drugName: string;
    drugId: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    totalCost: number;
    prescriptionRef?: string;
    dispensedBy?: string;
    dispensedAt?: any;
    notes?: string;
}

export default function PharmacyDispensePage() {
    const { profile } = useAuth();
    const [drugs, setDrugs] = useState<DrugStock[]>([]);
    const [records, setRecords] = useState<DispenseRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [search, setSearch] = useState("");
    const [drugSearch, setDrugSearch] = useState("");
    const [success, setSuccess] = useState(false);

    const [form, setForm] = useState({
        patientName: "",
        patientEmail: "",
        prescriptionRef: "",
        notes: "",
    });
    const [selectedDrug, setSelectedDrug] = useState<DrugStock | null>(null);
    const [qty, setQty] = useState("1");

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [drugSnap, recSnap] = await Promise.all([
                getDocs(query(collection(db, "pharmacyStock"), orderBy("drugName"))),
                getDocs(query(collection(db, "dispensingRecords"), orderBy("dispensedAt", "desc"))),
            ]);
            setDrugs(drugSnap.docs.map(d => ({ id: d.id, ...d.data() } as DrugStock)));
            setRecords(recSnap.docs.map(d => ({ id: d.id, ...d.data() } as DispenseRecord)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDispense = async () => {
        if (!selectedDrug || !form.patientName.trim()) return;
        const quantity = parseInt(qty) || 1;
        if (quantity > selectedDrug.quantity) return;

        setSaving(true);
        try {
            const totalCost = quantity * selectedDrug.unitPrice;
            const record: Omit<DispenseRecord, "id"> = {
                patientName: form.patientName.trim(),
                patientEmail: form.patientEmail.trim(),
                drugName: selectedDrug.drugName,
                drugId: selectedDrug.id,
                quantity,
                unit: selectedDrug.unit,
                unitPrice: selectedDrug.unitPrice,
                totalCost,
                prescriptionRef: form.prescriptionRef.trim(),
                dispensedBy: profile?.name,
                notes: form.notes.trim(),
            };
            const ref = await addDoc(collection(db, "dispensingRecords"), {
                ...record,
                dispensedAt: serverTimestamp(),
            });
            // Deduct from stock
            const newQty = selectedDrug.quantity - quantity;
            await updateDoc(doc(db, "pharmacyStock", selectedDrug.id), { quantity: newQty });
            setDrugs(prev => prev.map(d => d.id === selectedDrug.id ? { ...d, quantity: newQty } : d));
            setRecords(prev => [{ id: ref.id, ...record } as DispenseRecord, ...prev]);
            // Reset form
            setForm({ patientName: "", patientEmail: "", prescriptionRef: "", notes: "" });
            setSelectedDrug(null);
            setQty("1");
            setDrugSearch("");
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (e) { console.error(e); }
        finally { setSaving(false); }
    };

    const filteredDrugs = drugs.filter(d =>
        d.drugName.toLowerCase().includes(drugSearch.toLowerCase()) ||
        (d.genericName || "").toLowerCase().includes(drugSearch.toLowerCase())
    );

    const filteredRecords = records.filter(r =>
        !search || r.patientName.toLowerCase().includes(search.toLowerCase()) ||
        r.drugName.toLowerCase().includes(search.toLowerCase())
    );

    const qtyNum = parseInt(qty) || 0;
    const totalCost = selectedDrug ? qtyNum * selectedDrug.unitPrice : 0;
    const overStock = selectedDrug ? qtyNum > selectedDrug.quantity : false;

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-black text-gray-900">Record Dispensing</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Dispense drugs against a prescription and update stock</p>
                </div>
                <button onClick={fetchData} className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            {/* Success banner */}
            <AnimatePresence>
                {success && (
                    <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-100">
                        <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                        <p className="text-sm font-bold text-green-700">Dispensed successfully — stock updated.</p>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Dispense form */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                        <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                            <Pill className="h-4 w-4 text-blue-600" /> New Dispense
                        </h2>

                        {/* Patient details */}
                        <div className="space-y-3">
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Patient Name *</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                    <input value={form.patientName} onChange={e => setForm(f => ({ ...f, patientName: e.target.value }))}
                                        placeholder="Full patient name"
                                        className="h-9 w-full pl-8 pr-3 rounded-xl border border-gray-200 text-xs font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                                </div>
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Patient Email</label>
                                <input value={form.patientEmail} onChange={e => setForm(f => ({ ...f, patientEmail: e.target.value }))}
                                    placeholder="patient@email.com" type="email"
                                    className="h-9 w-full px-3 rounded-xl border border-gray-200 text-xs font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Prescription Ref</label>
                                <input value={form.prescriptionRef} onChange={e => setForm(f => ({ ...f, prescriptionRef: e.target.value }))}
                                    placeholder="e.g. DR-2024-001"
                                    className="h-9 w-full px-3 rounded-xl border border-gray-200 text-xs font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none" />
                            </div>
                        </div>

                        {/* Drug selector */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Select Drug *</label>
                            {selectedDrug ? (
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl border border-blue-100">
                                    <div>
                                        <p className="text-xs font-black text-blue-900">{selectedDrug.drugName}</p>
                                        <p className="text-[10px] text-blue-600">{selectedDrug.quantity} {selectedDrug.unit} available · UGX {selectedDrug.unitPrice.toLocaleString()} each</p>
                                    </div>
                                    <button onClick={() => setSelectedDrug(null)} className="h-6 w-6 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 hover:bg-blue-200">
                                        <X className="h-3 w-3" />
                                    </button>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <div className="relative">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                                        <input value={drugSearch} onChange={e => setDrugSearch(e.target.value)}
                                            placeholder="Search drug..."
                                            className="h-9 w-full pl-8 pr-3 rounded-xl border border-gray-200 text-xs font-medium focus:border-blue-500 outline-none" />
                                    </div>
                                    {drugSearch && (
                                        <div className="max-h-48 overflow-y-auto space-y-1 border border-gray-100 rounded-xl p-1 bg-white shadow-lg">
                                            {filteredDrugs.length === 0 ? (
                                                <p className="text-xs text-gray-400 text-center py-4">No drugs found</p>
                                            ) : filteredDrugs.map(d => (
                                                <button key={d.id} onClick={() => { setSelectedDrug(d); setDrugSearch(""); }}
                                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors text-left">
                                                    <div>
                                                        <p className="text-xs font-bold text-gray-900">{d.drugName}</p>
                                                        <p className="text-[10px] text-gray-400">{d.category}</p>
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
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Quantity to Dispense</label>
                                <input type="number" min="1" max={selectedDrug.quantity} value={qty} onChange={e => setQty(e.target.value)}
                                    className={`h-9 w-full px-3 rounded-xl border text-sm font-bold focus:ring-2 outline-none transition-all ${overStock ? "border-red-300 focus:ring-red-500/20 bg-red-50" : "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20"}`} />
                                {overStock && (
                                    <p className="text-[10px] text-red-600 font-bold mt-1 flex items-center gap-1">
                                        <AlertTriangle className="h-3 w-3" /> Exceeds available stock ({selectedDrug.quantity})
                                    </p>
                                )}
                                {!overStock && qtyNum > 0 && (
                                    <p className="text-[10px] text-gray-500 mt-1">Total cost: <span className="font-black text-gray-700">UGX {totalCost.toLocaleString()}</span></p>
                                )}
                            </div>
                        )}

                        {/* Notes */}
                        <div>
                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Notes</label>
                            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                                rows={2} placeholder="Dosage instructions, special notes..."
                                className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs font-medium focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none resize-none" />
                        </div>

                        <button onClick={handleDispense}
                            disabled={saving || !selectedDrug || !form.patientName.trim() || overStock || qtyNum <= 0}
                            className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-sm">
                            {saving
                                ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                : <><Pill className="h-4 w-4" /> Dispense & Update Stock</>}
                        </button>
                    </div>
                </div>

                {/* Recent dispensing records */}
                <div className="lg:col-span-3 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-900">Recent Dispensing</h2>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)}
                                className="h-8 pl-8 pr-3 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:border-blue-500 outline-none w-48" />
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-14 bg-white rounded-2xl border border-gray-100">
                            <div className="animate-spin h-7 w-7 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                        </div>
                    ) : filteredRecords.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-14 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                            <Package className="h-10 w-10 text-gray-200 mb-3" />
                            <p className="text-sm font-black text-gray-900 mb-1">No dispensing records yet</p>
                            <p className="text-xs text-gray-400">Records appear here after each dispense.</p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {filteredRecords.slice(0, 20).map((r, i) => (
                                <motion.div key={r.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                                    className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                            <Pill className="h-4 w-4 text-blue-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-xs font-black text-gray-900 truncate">{r.drugName}</p>
                                            <p className="text-[10px] text-gray-400 truncate">{r.patientName} · {r.quantity} {r.unit}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs font-black text-gray-700">UGX {r.totalCost.toLocaleString()}</p>
                                        <p className="text-[10px] text-gray-400">{r.dispensedBy}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

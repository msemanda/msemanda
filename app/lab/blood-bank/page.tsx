"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, Plus, AlertCircle, CheckCircle2, RefreshCw, X } from "lucide-react";
import { collection, getDocs, addDoc, updateDoc, doc, query, orderBy, limit, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/Input";

interface BloodGroup {
    id: string;
    group: string;
    available: number;
    reserved: number;
}

interface BloodRequest {
    id: string;
    patient: string;
    group: string;
    units: number;
    doctor: string;
    status: string;
    time: string;
}

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function BloodBankPage() {
    const { profile } = useAuth();
    const [inventory, setInventory] = useState<BloodGroup[]>([]);
    const [requests, setRequests] = useState<BloodRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [saving, setSaving] = useState(false);
    const [form, setForm] = useState({ donorName: "", group: BLOOD_GROUPS[0], units: "1" });
    const [fulfilling, setFulfilling] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [invSnap, reqSnap] = await Promise.all([
                getDocs(collection(db, "bloodInventory")),
                getDocs(query(collection(db, "bloodRequests"), orderBy("requestedAt"), limit(10))),
            ]);
            setInventory(invSnap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    group: ((r.bloodGroup ?? r.group) as string) ?? "?",
                    available: Number(r.available ?? r.availableUnits ?? 0),
                    reserved: Number(r.reserved ?? r.reservedUnits ?? 0),
                };
            }));
            setRequests(reqSnap.docs.map(d => {
                const r = d.data();
                const at = toDate(r.requestedAt);
                return {
                    id: d.id,
                    patient: ((r.patientName ?? r.patient) as string) ?? "—",
                    group: ((r.bloodGroup ?? r.group) as string) ?? "?",
                    units: Number(r.units ?? 1),
                    doctor: ((r.doctor ?? r.doctorName) as string) ?? "—",
                    status: (r.status as string) ?? "PENDING",
                    time: at ? at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—",
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const handleRecordDonation = async (e: React.FormEvent) => {
        e.preventDefault();
        const units = Number(form.units) || 0;
        if (units <= 0) return;

        setSaving(true);
        try {
            const existing = inventory.find(b => b.group === form.group);
            if (existing) {
                await updateDoc(doc(db, "bloodInventory", existing.id), {
                    available: existing.available + units,
                    lastDonorName: form.donorName.trim(),
                    lastRecordedBy: profile?.name,
                    updatedAt: serverTimestamp(),
                });
            } else {
                await addDoc(collection(db, "bloodInventory"), {
                    bloodGroup: form.group,
                    available: units,
                    reserved: 0,
                    lastDonorName: form.donorName.trim(),
                    lastRecordedBy: profile?.name,
                    createdAt: serverTimestamp(),
                });
            }
            setShowForm(false);
            setForm({ donorName: "", group: BLOOD_GROUPS[0], units: "1" });
            await load();
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    const handleFulfill = async (request: BloodRequest) => {
        setFulfilling(request.id);
        try {
            const matchingStock = inventory.find(b => b.group === request.group);
            if (matchingStock && matchingStock.available >= request.units) {
                await updateDoc(doc(db, "bloodInventory", matchingStock.id), {
                    available: matchingStock.available - request.units,
                });
            }
            await updateDoc(doc(db, "bloodRequests", request.id), {
                status: "FULFILLED",
                fulfilledBy: profile?.name,
                fulfilledAt: serverTimestamp(),
            });
            await load();
        } catch (e) { console.error(e); }
        finally { setFulfilling(null); }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Droplets className="h-6 w-6 text-red-500" /> Blood Bank
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Inventory management and transfusion requests</p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={load} className="text-gray-400 hover:text-red-600 transition-colors">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-bold flex items-center gap-2 transition-colors">
                        <Plus className="h-4 w-4" /> Record Donation
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Record Blood Donation</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleRecordDonation} className="space-y-4">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Donor Name</label>
                                    <Input required placeholder="Donor's full name" value={form.donorName} onChange={e => setForm(p => ({ ...p, donorName: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Blood Group</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-red-500 outline-none"
                                        value={form.group} onChange={e => setForm(p => ({ ...p, group: e.target.value }))}>
                                        {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Units</label>
                                    <Input type="number" min={1} required value={form.units} onChange={e => setForm(p => ({ ...p, units: e.target.value }))} />
                                </div>
                            </div>
                            <button type="submit" disabled={saving}
                                className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {saving ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : "Save Donation"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="font-bold text-gray-900 mb-4">Blood Group Inventory</h2>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-5 w-5 border-[3px] border-red-100 border-t-red-500 rounded-full" />
                    </div>
                ) : inventory.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-xs">No inventory data</p>
                ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {inventory.map((b, i) => {
                            const total = b.available + b.reserved;
                            const pct = total > 0 ? Math.round((b.available / total) * 100) : 0;
                            const isLow = b.available < 5;
                            return (
                                <motion.div
                                    key={b.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: i * 0.05 }}
                                    className={`p-4 rounded-xl border ${isLow ? "border-red-200 bg-red-50" : "border-gray-100 bg-gray-50"}`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="text-2xl font-black text-gray-900">{b.group}</span>
                                        {isLow
                                            ? <AlertCircle className="h-4 w-4 text-red-500" />
                                            : <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        }
                                    </div>
                                    <div className="h-2 bg-white rounded-full overflow-hidden mb-2">
                                        <div className={`h-full rounded-full ${isLow ? "bg-red-500" : "bg-green-500"}`} style={{ width: `${pct}%` }} />
                                    </div>
                                    <div className="text-xs text-gray-600">
                                        <span className="font-bold">{b.available}</span> available &bull; {b.reserved} reserved
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                    <h2 className="font-bold text-gray-900">Transfusion Requests</h2>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-5 w-5 border-[3px] border-red-100 border-t-red-500 rounded-full" />
                    </div>
                ) : requests.length === 0 ? (
                    <p className="text-center text-gray-400 py-8 text-xs">No recent requests</p>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {requests.map((r) => (
                            <div key={r.id} className="px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                                        <span className="text-sm font-black text-red-600">{r.group}</span>
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{r.patient}</p>
                                        <p className="text-xs text-gray-400">{r.units} unit(s) &bull; {r.doctor} &bull; {r.time}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${r.status === "FULFILLED" ? "badge-green" : "badge-yellow"}`}>
                                        {r.status}
                                    </span>
                                    {r.status === "PENDING" && (
                                        <button onClick={() => handleFulfill(r)} disabled={fulfilling === r.id}
                                            className="text-xs font-bold text-blue-600 hover:text-blue-700 disabled:opacity-50 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition-colors">
                                            {fulfilling === r.id ? "Fulfilling…" : "Fulfill"}
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

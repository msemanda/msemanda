"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { fmtDate } from "@/lib/ts";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRightLeft, Plus, Search, RefreshCw, X } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Transfer {
    id: string;
    patientName: string;
    fromWard: string;
    toWard: string;
    reason: string;
    transferredBy: string;
    transferredAt?: any;
}

const WARDS = ["General", "ICU", "Pediatrics", "Maternity", "Surgery", "Orthopedics", "Neurology", "External Hospital"];

export default function IpdTransferPage() {
    const { profile } = useAuth();
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({ patientName: "", fromWard: WARDS[0], toWard: WARDS[1], reason: "" });

    useEffect(() => { fetchTransfers(); }, []);

    const fetchTransfers = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "ipdTransfers"));
            setTransfers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Transfer)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleTransfer = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "ipdTransfers"), {
                patientName: form.patientName.trim(),
                fromWard: form.fromWard,
                toWard: form.toWard,
                reason: form.reason.trim(),
                transferredBy: profile?.name,
                transferredAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ patientName: "", fromWard: WARDS[0], toWard: WARDS[1], reason: "" });
            fetchTransfers();
        } catch(e) { console.error(e); }
        finally { setCreating(false); }
    };

    const filtered = transfers.filter(t =>
        !search || t.patientName.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Patient Transfers</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Record inter-ward and external transfers</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchTransfers} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> Record Transfer
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Record Transfer</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleTransfer} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient Name</label>
                                <Input required placeholder="Full name" value={form.patientName} onChange={e => setForm(p => ({ ...p, patientName: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">From Ward</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.fromWard} onChange={e => setForm(p => ({ ...p, fromWard: e.target.value }))}>
                                        {WARDS.map(w => <option key={w}>{w}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">To Ward</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.toWard} onChange={e => setForm(p => ({ ...p, toWard: e.target.value }))}>
                                        {WARDS.map(w => <option key={w}>{w}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Reason</label>
                                <textarea rows={2} required placeholder="Reason for transfer..." value={form.reason} onChange={e => setForm(p => ({ ...p, reason: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:bg-white focus:border-blue-500 outline-none resize-none" />
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : "Record Transfer"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search patient..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <ArrowRightLeft className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No transfers recorded</p>
                    <p className="text-xs text-gray-400">Record a patient transfer above.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto rounded-xl">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Patient", "From", "To", "Reason", "Transferred By", "Date"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(t => (
                                <tr key={t.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{t.patientName}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{t.fromWard}</td>
                                    <td className="px-4 py-3 text-xs font-semibold text-blue-600">{t.toWard}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500 max-w-[160px] truncate">{t.reason}</td>
                                    <td className="px-4 py-3 text-xs text-gray-500">{t.transferredBy}</td>
                                    <td className="px-4 py-3 text-xs text-gray-400">
                                        {fmtDate(t.transferredAt)}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table></div>
                </div>
            )}
        </div>
    );
}

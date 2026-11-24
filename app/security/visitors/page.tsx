"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, updateDoc, doc, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { fmtDateTime } from "@/lib/ts";
import { AnimatePresence, motion } from "framer-motion";
import { Users, Plus, RefreshCw, X, Search, LogOut as CheckOutIcon } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Visitor {
    id: string;
    visitorName: string;
    purpose: string;
    hostName: string;
    phone: string;
    idNumber: string;
    timeIn?: any;
    timeOut?: any;
    status: "checked_in" | "checked_out";
}

export default function VisitorLogPage() {
    const { profile } = useAuth();
    const [visitors, setVisitors] = useState<Visitor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({ visitorName: "", purpose: "", hostName: "", phone: "", idNumber: "" });

    useEffect(() => { fetchVisitors(); }, []);

    const fetchVisitors = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "visitorLogs"));
            setVisitors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Visitor)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCheckIn = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "visitorLogs"), {
                visitorName: form.visitorName.trim(),
                purpose: form.purpose.trim(),
                hostName: form.hostName.trim(),
                phone: form.phone.trim(),
                idNumber: form.idNumber.trim(),
                status: "checked_in",
                timeIn: serverTimestamp(),
                loggedBy: profile?.name,
                createdAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ visitorName: "", purpose: "", hostName: "", phone: "", idNumber: "" });
            fetchVisitors();
        } catch (e) { console.error(e); }
        finally { setCreating(false); }
    };

    const handleCheckOut = async (v: Visitor) => {
        setUpdating(v.id);
        try {
            await updateDoc(doc(db, "visitorLogs", v.id), { status: "checked_out", timeOut: serverTimestamp() });
            setVisitors(prev => prev.map(x => x.id === v.id ? { ...x, status: "checked_out" } : x));
        } catch (e) { console.error(e); }
        finally { setUpdating(null); }
    };

    const filtered = visitors.filter(v =>
        !search || v.visitorName.toLowerCase().includes(search.toLowerCase()) ||
        v.hostName.toLowerCase().includes(search.toLowerCase())
    );
    const onSite = filtered.filter(v => v.status === "checked_in");
    const departed = filtered.filter(v => v.status === "checked_out");

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Visitor Log</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Check visitors in and out of the premises</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchVisitors} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> Check In Visitor
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Check In Visitor</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleCheckIn} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Visitor Name</label>
                                    <Input required placeholder="Full name" value={form.visitorName} onChange={e => setForm(p => ({ ...p, visitorName: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Phone</label>
                                    <Input placeholder="Phone number" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Purpose of Visit</label>
                                    <Input required placeholder="e.g. Visiting patient" value={form.purpose} onChange={e => setForm(p => ({ ...p, purpose: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Host / Department</label>
                                    <Input required placeholder="Who they're visiting" value={form.hostName} onChange={e => setForm(p => ({ ...p, hostName: e.target.value }))} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">ID Number</label>
                                <Input placeholder="National ID / Passport No." value={form.idNumber} onChange={e => setForm(p => ({ ...p, idNumber: e.target.value }))} />
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : "Check In"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search visitors..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <Users className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No visitors logged</p>
                    <p className="text-xs text-gray-400">Check in a visitor above.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {onSite.length > 0 && (
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">On Site ({onSite.length})</p>
                            <div className="space-y-3">
                                <AnimatePresence>
                                    {onSite.map((v, i) => (
                                        <motion.div key={v.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                            <div className="flex items-center justify-between gap-4 flex-wrap">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <p className="text-sm font-black text-gray-900">{v.visitorName}</p>
                                                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100">On Site</span>
                                                    </div>
                                                    <p className="text-xs text-gray-500">{v.purpose} · Visiting {v.hostName}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">Checked in {fmtDateTime(v.timeIn)}</p>
                                                </div>
                                                <button onClick={() => handleCheckOut(v)} disabled={!!updating}
                                                    className="h-9 px-4 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50">
                                                    {updating === v.id ? <div className="animate-spin h-3.5 w-3.5 border-2 border-gray-300 border-t-transparent rounded-full" /> : <><CheckOutIcon className="h-3.5 w-3.5" /> Check Out</>}
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}

                    {departed.length > 0 && (
                        <div>
                            <p className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2">Departed ({departed.length})</p>
                            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead className="bg-gray-50 border-b border-gray-100">
                                            <tr>{["Visitor", "Host", "Time In", "Time Out"].map(h => (
                                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                                            ))}</tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {departed.map(v => (
                                                <tr key={v.id} className="hover:bg-gray-50/50 transition-colors">
                                                    <td className="px-4 py-3 text-sm font-bold text-gray-900">{v.visitorName}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-500">{v.hostName}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-500">{fmtDateTime(v.timeIn)}</td>
                                                    <td className="px-4 py-3 text-xs text-gray-500">{fmtDateTime(v.timeOut)}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

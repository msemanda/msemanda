"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { fmtDate } from "@/lib/ts";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, Plus, RefreshCw, X, Sun, Moon } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Shift {
    id: string;
    guardName: string;
    post: string;
    shift: "Day" | "Night";
    date: string;
    status: "scheduled" | "on_duty" | "off_duty";
    createdAt?: any;
}

const POSTS = ["Main Gate", "Ward Block", "OPD Entrance", "Parking", "Emergency Entrance", "Perimeter Patrol"];
const STATUS_CONFIG: Record<Shift["status"], { label: string; color: string }> = {
    scheduled: { label: "Scheduled", color: "bg-gray-50 text-gray-500 border-gray-100" },
    on_duty:   { label: "On Duty",   color: "bg-green-50 text-green-700 border-green-100" },
    off_duty:  { label: "Off Duty",  color: "bg-blue-50 text-blue-600 border-blue-100" },
};

export default function SecurityRosterPage() {
    const { profile } = useAuth();
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);
    const [form, setForm] = useState({ guardName: "", post: POSTS[0], shift: "Day" as Shift["shift"], date: new Date().toISOString().slice(0, 10) });

    useEffect(() => { fetchShifts(); }, []);

    const fetchShifts = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "securityShifts"));
            setShifts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Shift)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "securityShifts"), {
                guardName: form.guardName.trim(),
                post: form.post,
                shift: form.shift,
                date: form.date,
                status: "scheduled",
                createdBy: profile?.name,
                createdAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ guardName: "", post: POSTS[0], shift: "Day", date: new Date().toISOString().slice(0, 10) });
            fetchShifts();
        } catch (e) { console.error(e); }
        finally { setCreating(false); }
    };

    const handleStatusChange = async (s: Shift, status: Shift["status"]) => {
        setUpdating(s.id);
        try {
            await updateDoc(doc(db, "securityShifts", s.id), { status, updatedAt: serverTimestamp() });
            setShifts(prev => prev.map(x => x.id === s.id ? { ...x, status } : x));
        } catch (e) { console.error(e); }
        finally { setUpdating(null); }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Duty Roster</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Guard shift schedule and post assignments</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchShifts} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> Assign Shift
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Assign Guard Shift</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Guard Name</label>
                                <Input required placeholder="Guard's full name" value={form.guardName} onChange={e => setForm(p => ({ ...p, guardName: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Post</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.post} onChange={e => setForm(p => ({ ...p, post: e.target.value }))}>
                                        {POSTS.map(p => <option key={p}>{p}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Shift</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.shift} onChange={e => setForm(p => ({ ...p, shift: e.target.value as Shift["shift"] }))}>
                                        <option value="Day">Day</option>
                                        <option value="Night">Night</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Date</label>
                                    <Input type="date" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                                </div>
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : "Assign Shift"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : shifts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <ShieldCheck className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No shifts assigned</p>
                    <p className="text-xs text-gray-400">Assign a guard duty shift above.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {shifts.map((s, i) => {
                            const cfg = STATUS_CONFIG[s.status] || STATUS_CONFIG.scheduled;
                            const ShiftIcon = s.shift === "Day" ? Sun : Moon;
                            return (
                                <motion.div key={s.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                                <ShiftIcon className="h-4 w-4 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{s.guardName}</p>
                                                <p className="text-xs text-gray-500">{s.post} · {s.shift} Shift · {fmtDate(s.date)}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                                            {s.status === "scheduled" && (
                                                <button onClick={() => handleStatusChange(s, "on_duty")} disabled={!!updating}
                                                    className="h-8 px-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold transition-colors disabled:opacity-50">
                                                    Clock In
                                                </button>
                                            )}
                                            {s.status === "on_duty" && (
                                                <button onClick={() => handleStatusChange(s, "off_duty")} disabled={!!updating}
                                                    className="h-8 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-bold transition-colors disabled:opacity-50">
                                                    Clock Out
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

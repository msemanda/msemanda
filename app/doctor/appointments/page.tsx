"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarDays, Search, Clock, Loader2, RefreshCw, Pencil, X, Save, XCircle } from "lucide-react";

interface Appointment {
    id: string;
    patientName: string;
    date: string;
    time: string;
    notes: string;
    status: string;
}

const STATUS_BADGE: Record<string, string> = {
    SCHEDULED:       "bg-blue-50 text-blue-700",
    CONFIRMED:       "bg-blue-50 text-blue-700",
    PENDING_PAYMENT: "bg-amber-50 text-amber-700",
    CALLED:          "bg-purple-50 text-purple-700",
    IN_CONSULTATION: "bg-teal-50 text-teal-700",
    COMPLETED:       "bg-green-50 text-green-700",
    CANCELLED:       "bg-red-50 text-red-500",
};

const FILTERS = ["ALL", "PENDING_PAYMENT", "SCHEDULED", "CALLED", "COMPLETED", "CANCELLED"];

export default function AppointmentsPage() {
    const { profile } = useAuth();
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("ALL");

    // Reschedule modal
    const [editAppt, setEditAppt] = useState<Appointment | null>(null);
    const [editForm, setEditForm] = useState({ date: "", time: "", notes: "" });
    const [rescheduling, setRescheduling] = useState(false);

    const load = async () => {
        if (!profile?.uid) return;
        setLoading(true);
        try {
            const snap = await getDocs(
                query(
                    collection(db, "appointments"),
                    where("doctorId", "==", profile.uid),
                    orderBy("date", "desc"),
                )
            );
            setAppointments(snap.docs.map(d => {
                const data = d.data() as Record<string, string>;
                return {
                    id: d.id,
                    patientName: data.patientName || "Unknown",
                    date: data.date || "",
                    time: data.time || "",
                    notes: data.notes || "",
                    status: data.status || "SCHEDULED",
                };
            }));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [profile?.uid]);

    const openReschedule = (a: Appointment) => {
        setEditAppt(a);
        setEditForm({ date: a.date, time: a.time, notes: a.notes });
    };

    const saveReschedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editAppt) return;
        setRescheduling(true);
        try {
            await updateDoc(doc(db, "appointments", editAppt.id), {
                date: editForm.date,
                time: editForm.time,
                notes: editForm.notes,
                status: "SCHEDULED",
                rescheduledAt: new Date().toISOString(),
            });
            setAppointments(prev => prev.map(a =>
                a.id === editAppt.id
                    ? { ...a, date: editForm.date, time: editForm.time, notes: editForm.notes, status: "SCHEDULED" }
                    : a
            ));
            setEditAppt(null);
        } catch (e) { console.error(e); }
        finally { setRescheduling(false); }
    };

    const markStatus = async (id: string, status: string) => {
        setUpdating(id);
        try {
            await updateDoc(doc(db, "appointments", id), { status });
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        } catch (e) { console.error(e); }
        finally { setUpdating(null); }
    };

    const filtered = appointments.filter(a => {
        const q = search.toLowerCase();
        const matchS = !q || a.patientName.toLowerCase().includes(q) || a.notes.toLowerCase().includes(q);
        const matchF = filter === "ALL" || a.status === filter;
        return matchS && matchF;
    });

    const counts = FILTERS.reduce<Record<string, number>>((acc, f) => {
        acc[f] = f === "ALL" ? appointments.length : appointments.filter(a => a.status === f).length;
        return acc;
    }, {});

    const formatDate = (iso: string) => {
        if (!iso) return "—";
        try { return new Date(iso + "T00:00:00").toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" }); }
        catch { return iso; }
    };

    return (
        <>
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <CalendarDays className="h-6 w-6 text-blue-600" /> My Appointments
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${appointments.filter(a => a.status === "SCHEDULED" || a.status === "CONFIRMED").length} upcoming · ${appointments.length} total`}
                    </p>
                </div>
                <button onClick={load} disabled={loading}
                    className="h-9 w-9 rounded-xl border border-gray-100 bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Search patient or notes..." />
                    </div>
                    <div className="flex gap-1.5 flex-wrap">
                        {FILTERS.map(f => (
                            <button key={f} onClick={() => setFilter(f)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${filter === f ? "bg-blue-600 text-white" : "bg-gray-50 text-gray-500 hover:bg-gray-100"}`}>
                                {f}
                                {counts[f] > 0 && (
                                    <span className={`ml-1 text-[9px] px-1 py-0.5 rounded-full font-black ${filter === f ? "bg-white/20" : "bg-gray-200 text-gray-500"}`}>
                                        {counts[f]}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 gap-2 text-gray-400 text-sm">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading your appointments…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 text-sm">
                        {search || filter !== "ALL" ? "No appointments match your search." : "No appointments found yet."}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {["Patient", "Date", "Time", "Notes", "Status", "Action"].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((a, i) => (
                                    <motion.tr key={a.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                        className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-bold text-gray-900">{a.patientName}</p>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-semibold text-gray-700 whitespace-nowrap">{formatDate(a.date)}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-xs text-gray-600 flex items-center gap-1 whitespace-nowrap">
                                                <Clock className="h-3 w-3 shrink-0" />{a.time || "—"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[180px] truncate">{a.notes || "—"}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full whitespace-nowrap ${STATUS_BADGE[a.status] ?? "bg-gray-50 text-gray-500"}`}>
                                                {a.status.replace("_", " ")}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-1">
                                                {a.status === "PENDING_PAYMENT" && (
                                                    <span className="text-[10px] text-amber-600 font-bold">Awaiting payment confirmation</span>
                                                )}
                                                {(a.status === "SCHEDULED" || a.status === "CONFIRMED" || a.status === "CALLED") && (
                                                    <>
                                                        <button
                                                            onClick={() => openReschedule(a)}
                                                            className="text-[10px] font-bold px-2 py-1 rounded-lg bg-gray-50 text-gray-600 hover:bg-gray-100 transition-colors whitespace-nowrap flex items-center gap-0.5">
                                                            <Pencil className="h-2.5 w-2.5" /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => markStatus(a.id, "COMPLETED")}
                                                            disabled={updating === a.id}
                                                            className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-50 whitespace-nowrap">
                                                            {updating === a.id ? <Loader2 className="h-3 w-3 animate-spin inline" /> : "Mark Done"}
                                                        </button>
                                                    </>
                                                )}
                                                {a.status === "COMPLETED" && <span className="text-[10px] text-gray-300">Done</span>}
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>

        {/* Reschedule modal */}

        <AnimatePresence>
            {editAppt && (
                <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <motion.div
                        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-5">
                            <div>
                                <h3 className="text-lg font-black text-gray-900">Reschedule Appointment</h3>
                                <p className="text-xs text-gray-400 mt-0.5">{editAppt.patientName}</p>
                            </div>
                            <button onClick={() => setEditAppt(null)}
                                className="h-8 w-8 rounded-xl bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <form onSubmit={saveReschedule} className="space-y-4">
                            <div>
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">New Date</label>
                                <input type="date" required
                                    value={editForm.date}
                                    onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:border-blue-500 outline-none bg-gray-50" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">New Time</label>
                                <input type="time" required
                                    value={editForm.time}
                                    onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))}
                                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:border-blue-500 outline-none bg-gray-50" />
                            </div>
                            <div>
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">Notes</label>
                                <input
                                    value={editForm.notes}
                                    onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))}
                                    placeholder="Reason for reschedule (optional)"
                                    className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm text-gray-900 focus:border-blue-500 outline-none bg-gray-50" />
                            </div>
                            <div className="flex gap-2 pt-1">
                                <button type="button" onClick={() => setEditAppt(null)}
                                    className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-600 font-bold text-sm flex items-center justify-center gap-1.5 hover:bg-gray-50 transition-colors">
                                    <XCircle className="h-4 w-4" /> Cancel
                                </button>
                                <button type="submit" disabled={rescheduling}
                                    className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors">
                                    {rescheduling ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="h-4 w-4" /> Save</>}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
        </>
    );
}

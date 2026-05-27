"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { Calendar, Plus, RefreshCw, X } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface HkSchedule {
    id: string;
    title: string;
    location: string;
    frequency: string;
    assignedTo: string;
    nextDue: string;
    createdAt?: any;
}

const LOCATIONS = ["Ward A", "Ward B", "ICU", "Maternity", "Theatre", "OPD", "Corridors", "Toilets", "Kitchen", "Pharmacy", "Lobby"];
const FREQUENCIES = ["Daily", "Twice Daily", "Weekly", "Bi-weekly", "Monthly"];

export default function HousekeepingSchedulePage() {
    const { profile } = useAuth();
    const [schedules, setSchedules] = useState<HkSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [form, setForm] = useState({ title: "", location: LOCATIONS[0], frequency: FREQUENCIES[0], assignedTo: "", nextDue: "" });

    useEffect(() => { fetchSchedules(); }, []);

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "hkSchedules"));
            setSchedules(snap.docs.map(d => ({ id: d.id, ...d.data() } as HkSchedule)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "hkSchedules"), {
                title: form.title.trim(),
                location: form.location,
                frequency: form.frequency,
                assignedTo: form.assignedTo.trim(),
                nextDue: form.nextDue,
                createdBy: profile?.name,
                createdAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ title: "", location: LOCATIONS[0], frequency: FREQUENCIES[0], assignedTo: "", nextDue: "" });
            fetchSchedules();
        } catch(e) { console.error(e); }
        finally { setCreating(false); }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Cleaning Schedule</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Recurring cleaning and sanitation schedules</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchSchedules} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> Add Schedule
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Add Recurring Schedule</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Task Name</label>
                                <Input required placeholder="e.g. Mop ward floors" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Location</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}>
                                        {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Frequency</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.frequency} onChange={e => setForm(p => ({ ...p, frequency: e.target.value }))}>
                                        {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Assigned To</label>
                                    <Input required placeholder="Staff name" value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Next Due Date</label>
                                    <Input type="date" required value={form.nextDue} onChange={e => setForm(p => ({ ...p, nextDue: e.target.value }))} />
                                </div>
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : "Save Schedule"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : schedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <Calendar className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No schedules</p>
                    <p className="text-xs text-gray-400">Add recurring cleaning schedules above.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto rounded-xl">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Task", "Location", "Frequency", "Assigned To", "Next Due"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {schedules.map(s => {
                                const isOverdue = s.nextDue && new Date(s.nextDue) < new Date();
                                return (
                                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3 text-sm font-bold text-gray-900">{s.title}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{s.location}</td>
                                        <td className="px-4 py-3">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-600 border border-blue-100">{s.frequency}</span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{s.assignedTo}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-xs font-bold ${isOverdue ? "text-red-500" : "text-gray-700"}`}>{s.nextDue || "â€”"}</span>
                                            {isOverdue && <span className="ml-2 text-[10px] font-bold text-red-500">Overdue</span>}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table></div>
                </div>
            )}
        </div>
    );
}

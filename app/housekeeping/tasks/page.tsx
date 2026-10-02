"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { Home, Plus, Search, RefreshCw, X, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface HkTask {
    id: string;
    title: string;
    location: string;
    assignedTo: string;
    priority: "low" | "medium" | "high";
    status: "pending" | "in_progress" | "completed";
    createdAt?: any;
    notes?: string;
}

const LOCATIONS = ["Ward A", "Ward B", "ICU", "Maternity", "Theatre", "OPD", "Corridors", "Toilets", "Kitchen", "Pharmacy", "Lobby"];
const STATUS_CONFIG: Record<HkTask["status"], { label: string; color: string; icon: any }> = {
    pending:     { label: "Pending",     color: "bg-gray-50 text-gray-500 border-gray-100",    icon: Clock },
    in_progress: { label: "In Progress", color: "bg-blue-50 text-blue-600 border-blue-100",    icon: PlayCircle },
    completed:   { label: "Completed",   color: "bg-green-50 text-green-700 border-green-100", icon: CheckCircle2 },
};
const PRIORITY_COLOR: Record<string, string> = {
    high: "text-red-500", medium: "text-amber-500", low: "text-gray-400",
};

export default function HousekeepingTasksPage() {
    const { profile } = useAuth();
    const [tasks, setTasks] = useState<HkTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({ title: "", location: LOCATIONS[0], assignedTo: "", priority: "medium" as HkTask["priority"], notes: "" });

    useEffect(() => { fetchTasks(); }, []);

    const fetchTasks = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "hkTasks"));
            setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as HkTask)).filter(t => t.status !== "completed"));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "hkTasks"), {
                title: form.title.trim(),
                location: form.location,
                assignedTo: form.assignedTo.trim(),
                priority: form.priority,
                status: "pending",
                notes: form.notes.trim(),
                createdBy: profile?.name,
                createdAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ title: "", location: LOCATIONS[0], assignedTo: "", priority: "medium", notes: "" });
            fetchTasks();
        } catch(e) { console.error(e); }
        finally { setCreating(false); }
    };

    const handleStatusChange = async (task: HkTask, status: HkTask["status"]) => {
        setUpdating(task.id);
        try {
            await updateDoc(doc(db, "hkTasks", task.id), { status, updatedAt: serverTimestamp() });
            setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status } : t).filter(t => t.status !== "completed"));
        } catch(e) { console.error(e); }
        finally { setUpdating(null); }
    };

    const filtered = tasks.filter(t =>
        !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
        t.location.toLowerCase().includes(search.toLowerCase()) ||
        t.assignedTo.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Cleaning Tasks</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Assign and track housekeeping activities</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchTasks} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> New Task
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Assign Cleaning Task</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Task</label>
                                <Input required placeholder="e.g. Deep clean ward toilets" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Location</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}>
                                        {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Priority</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as HkTask["priority"] }))}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Assign To</label>
                                    <Input required placeholder="Staff name" value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Notes (optional)</label>
                                <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:bg-white focus:border-blue-500 outline-none resize-none" />
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : "Assign Task"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <Home className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No active tasks</p>
                    <p className="text-xs text-gray-400">Assign a housekeeping task above.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((task, i) => {
                            const s = STATUS_CONFIG[task.status];
                            const StatusIcon = s.icon;
                            return (
                                <motion.div key={task.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center justify-between gap-4 flex-wrap">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <p className="text-sm font-black text-gray-900">{task.title}</p>
                                                <span className={`text-[10px] font-bold uppercase ${PRIORITY_COLOR[task.priority] || "text-gray-400"}`}>{task.priority}</span>
                                            </div>
                                            <p className="text-xs text-gray-500">{task.location} · Assigned to {task.assignedTo}</p>
                                            {task.notes && <p className="text-xs text-gray-400 mt-0.5">{task.notes}</p>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1 ${s.color}`}>
                                                <StatusIcon className="h-3 w-3" /> {s.label}
                                            </span>
                                            {task.status === "pending" && (
                                                <button onClick={() => handleStatusChange(task, "in_progress")} disabled={!!updating}
                                                    className="h-8 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-colors disabled:opacity-50">
                                                    Start
                                                </button>
                                            )}
                                            {task.status === "in_progress" && (
                                                <button onClick={() => handleStatusChange(task, "completed")} disabled={!!updating}
                                                    className="h-8 px-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                                                    {updating === task.id ? <div className="animate-spin h-3 w-3 border border-green-400 border-t-transparent rounded-full"/> : <><CheckCircle2 className="h-3.5 w-3.5"/> Done</>}
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

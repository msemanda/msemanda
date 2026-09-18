"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { AnimatePresence, motion } from "framer-motion";
import { Wrench, Plus, Search, RefreshCw, X, CheckCircle2, Clock, PlayCircle } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface MaintRequest {
    id: string;
    equipmentName: string;
    location: string;
    issue: string;
    priority: "low" | "normal" | "high" | "urgent";
    status: "pending" | "in_progress" | "completed";
    requestedBy: string;
    assignedTo?: string;
    createdAt?: any;
}

const LOCATIONS = ["Theatre", "ICU", "Ward A", "Ward B", "OPD", "Radiology", "Lab", "Pharmacy", "Physiotherapy", "Admin"];
const PRIORITY_COLOR: Record<string, string> = {
    urgent: "bg-red-50 text-red-600 border-red-100",
    high:   "bg-amber-50 text-amber-700 border-amber-100",
    normal: "bg-blue-50 text-blue-600 border-blue-100",
    low:    "bg-gray-50 text-gray-500 border-gray-100",
};

export default function MaintenanceRequestsPage() {
    const { profile } = useAuth();
    const [requests, setRequests] = useState<MaintRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [updating, setUpdating] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({ equipmentName: "", location: LOCATIONS[0], issue: "", priority: "normal" as MaintRequest["priority"], assignedTo: "" });

    useEffect(() => { fetchRequests(); }, []);

    const fetchRequests = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "maintRequests"));
            setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as MaintRequest)).filter(r => r.status !== "completed"));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "maintRequests"), {
                equipmentName: form.equipmentName.trim(),
                location: form.location,
                issue: form.issue.trim(),
                priority: form.priority,
                assignedTo: form.assignedTo.trim(),
                requestedBy: profile?.name,
                status: "pending",
                createdAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ equipmentName: "", location: LOCATIONS[0], issue: "", priority: "normal", assignedTo: "" });
            fetchRequests();
        } catch(e) { console.error(e); }
        finally { setCreating(false); }
    };

    const updateStatus = async (req: MaintRequest, status: MaintRequest["status"]) => {
        setUpdating(req.id);
        try {
            await updateDoc(doc(db, "maintRequests", req.id), { status, updatedAt: serverTimestamp() });
            setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status } : r).filter(r => r.status !== "completed"));
        } catch(e) { console.error(e); }
        finally { setUpdating(null); }
    };

    const filtered = requests.filter(r =>
        !search || r.equipmentName.toLowerCase().includes(search.toLowerCase()) ||
        r.location.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Maintenance Requests</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Submit and track equipment maintenance requests</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchRequests} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <Plus className="h-4 w-4" /> New Request
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Submit Maintenance Request</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Equipment Name</label>
                                    <Input required placeholder="e.g. X-Ray Machine" value={form.equipmentName} onChange={e => setForm(p => ({ ...p, equipmentName: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Location</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}>
                                        {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Priority</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value as MaintRequest["priority"] }))}>
                                        <option value="low">Low</option>
                                        <option value="normal">Normal</option>
                                        <option value="high">High</option>
                                        <option value="urgent">Urgent</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Assign To (optional)</label>
                                    <Input placeholder="Technician name" value={form.assignedTo} onChange={e => setForm(p => ({ ...p, assignedTo: e.target.value }))} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Issue Description</label>
                                <textarea rows={3} required placeholder="Describe the problem..." value={form.issue} onChange={e => setForm(p => ({ ...p, issue: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:bg-white focus:border-blue-500 outline-none resize-none" />
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : "Submit Request"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search equipment or location..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <Wrench className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No active requests</p>
                    <p className="text-xs text-gray-400">Submit a maintenance request above.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((req, i) => (
                            <motion.div key={req.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-start justify-between gap-4 flex-wrap">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-black text-gray-900">{req.equipmentName}</p>
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${PRIORITY_COLOR[req.priority]}`}>{req.priority}</span>
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${
                                                req.status === "in_progress" ? "bg-blue-50 text-blue-600 border-blue-100" : "bg-gray-50 text-gray-500 border-gray-100"
                                            }`}>{req.status === "in_progress" ? "In Progress" : "Pending"}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">{req.location} · {req.issue}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">By {req.requestedBy}{req.assignedTo ? ` · Assigned to ${req.assignedTo}` : ""}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {req.status === "pending" && (
                                            <button onClick={() => updateStatus(req, "in_progress")} disabled={!!updating}
                                                className="h-8 px-3 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-600 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                                                <PlayCircle className="h-3.5 w-3.5"/> Start
                                            </button>
                                        )}
                                        {req.status === "in_progress" && (
                                            <button onClick={() => updateStatus(req, "completed")} disabled={!!updating}
                                                className="h-8 px-3 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-xs font-bold transition-colors disabled:opacity-50 flex items-center gap-1">
                                                {updating === req.id ? <div className="animate-spin h-3 w-3 border border-green-400 border-t-transparent rounded-full"/> : <><CheckCircle2 className="h-3.5 w-3.5"/> Resolve</>}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

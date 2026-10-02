"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { fmtDate } from "@/lib/ts";
import { AnimatePresence, motion } from "framer-motion";
import { FileText, Plus, RefreshCw, X, Search } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface Prescription {
    id: string;
    patientName: string;
    odSphere: string; odCylinder: string; odAxis: string;
    osSphere: string; osCylinder: string; osAxis: string;
    add: string; pd: string;
    lensType: string;
    notes: string;
    prescribedBy?: string;
    createdAt?: any;
}

const LENS_TYPES = ["Single Vision", "Bifocal", "Progressive", "Reading Glasses", "Contact Lenses"];

export default function OpticalPrescriptionsPage() {
    const { profile } = useAuth();
    const canWrite = profile?.permissions?.includes("optical_prescriptions") || profile?.role === "ADMIN";
    const [items, setItems] = useState<Prescription[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({
        patientName: "", odSphere: "", odCylinder: "", odAxis: "",
        osSphere: "", osCylinder: "", osAxis: "", add: "", pd: "",
        lensType: LENS_TYPES[0], notes: "",
    });

    useEffect(() => { fetchItems(); }, []);

    const fetchItems = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "opticalPrescriptions"));
            setItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as Prescription)));
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "opticalPrescriptions"), {
                ...form,
                patientName: form.patientName.trim(),
                notes: form.notes.trim(),
                prescribedBy: profile?.name,
                createdAt: serverTimestamp(),
            });
            setShowForm(false);
            setForm({ patientName: "", odSphere: "", odCylinder: "", odAxis: "", osSphere: "", osCylinder: "", osAxis: "", add: "", pd: "", lensType: LENS_TYPES[0], notes: "" });
            fetchItems();
        } catch (e) { console.error(e); }
        finally { setCreating(false); }
    };

    const filtered = items.filter(p => !search || p.patientName.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Optical Prescriptions</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Glasses and contact lens prescriptions</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchItems} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    {canWrite && (
                        <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                            <Plus className="h-4 w-4" /> New Prescription
                        </button>
                    )}
                </div>
            </div>

            <AnimatePresence>
                {showForm && canWrite && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Write Prescription</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleCreate} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient Name</label>
                                <Input required placeholder="Patient's full name" value={form.patientName} onChange={e => setForm(p => ({ ...p, patientName: e.target.value }))} />
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                                            <th className="text-left py-1">Eye</th>
                                            <th className="text-left py-1">Sphere</th>
                                            <th className="text-left py-1">Cylinder</th>
                                            <th className="text-left py-1">Axis</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="py-1 pr-2 font-bold text-gray-700">OD (Right)</td>
                                            <td className="py-1 pr-2"><Input placeholder="-1.00" value={form.odSphere} onChange={e => setForm(p => ({ ...p, odSphere: e.target.value }))} /></td>
                                            <td className="py-1 pr-2"><Input placeholder="-0.50" value={form.odCylinder} onChange={e => setForm(p => ({ ...p, odCylinder: e.target.value }))} /></td>
                                            <td className="py-1"><Input placeholder="90" value={form.odAxis} onChange={e => setForm(p => ({ ...p, odAxis: e.target.value }))} /></td>
                                        </tr>
                                        <tr>
                                            <td className="py-1 pr-2 font-bold text-gray-700">OS (Left)</td>
                                            <td className="py-1 pr-2"><Input placeholder="-1.25" value={form.osSphere} onChange={e => setForm(p => ({ ...p, osSphere: e.target.value }))} /></td>
                                            <td className="py-1 pr-2"><Input placeholder="-0.75" value={form.osCylinder} onChange={e => setForm(p => ({ ...p, osCylinder: e.target.value }))} /></td>
                                            <td className="py-1"><Input placeholder="85" value={form.osAxis} onChange={e => setForm(p => ({ ...p, osAxis: e.target.value }))} /></td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Add</label>
                                    <Input placeholder="+1.50" value={form.add} onChange={e => setForm(p => ({ ...p, add: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">PD (mm)</label>
                                    <Input placeholder="62" value={form.pd} onChange={e => setForm(p => ({ ...p, pd: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Lens Type</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.lensType} onChange={e => setForm(p => ({ ...p, lensType: e.target.value }))}>
                                        {LENS_TYPES.map(l => <option key={l}>{l}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Notes (optional)</label>
                                <textarea rows={2} value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))}
                                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:bg-white focus:border-blue-500 outline-none resize-none" />
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : "Save Prescription"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search by patient..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <FileText className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No prescriptions yet</p>
                    <p className="text-xs text-gray-400">{canWrite ? "Write a prescription above." : "Prescriptions written by the optician will appear here."}</p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((p, i) => (
                            <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                <div className="flex items-center justify-between gap-4 flex-wrap">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <p className="text-sm font-black text-gray-900">{p.patientName}</p>
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 text-cyan-700 border border-cyan-100">{p.lensType}</span>
                                        </div>
                                        <p className="text-xs text-gray-500">OD {p.odSphere || "—"}/{p.odCylinder || "—"}×{p.odAxis || "—"} · OS {p.osSphere || "—"}/{p.osCylinder || "—"}×{p.osAxis || "—"} · Add {p.add || "—"} · PD {p.pd || "—"}</p>
                                        {p.notes && <p className="text-xs text-gray-400 mt-0.5">{p.notes}</p>}
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-xs text-gray-400">{fmtDate(p.createdAt)}</p>
                                        {p.prescribedBy && <p className="text-[10px] text-gray-400">by {p.prescribedBy}</p>}
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

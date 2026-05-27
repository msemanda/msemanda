"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Search, RefreshCw, X, BedDouble } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface IpdAdmission {
    id: string;
    patientName: string;
    patientEmail: string;
    ward: string;
    bedNumber: string;
    doctorName: string;
    diagnosis: string;
    status: "ADMITTED" | "DISCHARGED" | "TRANSFERRED";
    admittedAt?: any;
    dischargedAt?: any;
}

const WARDS = ["General", "ICU", "Pediatrics", "Maternity", "Surgery", "Orthopedics", "Neurology"];
const WARD_BADGE: Record<string, string> = {
    General: "bg-blue-50 text-blue-700 border-blue-100",
    ICU: "bg-red-50 text-red-700 border-red-100",
    Pediatrics: "bg-green-50 text-green-700 border-green-100",
    Maternity: "bg-pink-50 text-pink-700 border-pink-100",
    Surgery: "bg-purple-50 text-purple-700 border-purple-100",
    Orthopedics: "bg-orange-50 text-orange-700 border-orange-100",
    Neurology: "bg-teal-50 text-teal-700 border-teal-100",
};

export default function IpdAdmissionsPage() {
    const { profile } = useAuth();
    const [admissions, setAdmissions] = useState<IpdAdmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState("");
    const [form, setForm] = useState({
        patientName: "", patientEmail: "", ward: WARDS[0],
        bedNumber: "", doctorName: "", diagnosis: "",
    });

    useEffect(() => { fetchAdmissions(); }, []);

    const fetchAdmissions = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "ipdAdmissions"));
            setAdmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as IpdAdmission)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleAdmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        try {
            await addDoc(collection(db, "ipdAdmissions"), {
                patientName: form.patientName.trim(),
                patientEmail: form.patientEmail.toLowerCase().trim(),
                ward: form.ward,
                bedNumber: form.bedNumber.trim(),
                doctorName: form.doctorName.trim(),
                diagnosis: form.diagnosis.trim(),
                status: "ADMITTED",
                admittedAt: serverTimestamp(),
                admittedBy: profile?.name,
            });
            setShowForm(false);
            setForm({ patientName: "", patientEmail: "", ward: WARDS[0], bedNumber: "", doctorName: "", diagnosis: "" });
            fetchAdmissions();
        } catch(e) { console.error(e); }
        finally { setCreating(false); }
    };

    const current = admissions.filter(a => a.status === "ADMITTED");
    const filtered = current.filter(a =>
        !search || a.patientName.toLowerCase().includes(search.toLowerCase()) ||
        a.ward.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Patient Admissions</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Admit and track inpatients across wards</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={fetchAdmissions} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowForm(!showForm)} className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                        <UserPlus className="h-4 w-4" /> Admit Patient
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showForm && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-2xl overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-black text-gray-900">Admit Patient</h2>
                            <button onClick={() => setShowForm(false)} className="h-7 w-7 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        </div>
                        <form onSubmit={handleAdmit} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient Name</label>
                                    <Input required placeholder="Full name" value={form.patientName} onChange={e => setForm(p => ({ ...p, patientName: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient Email</label>
                                    <Input type="email" required placeholder="patient@email.com" value={form.patientEmail} onChange={e => setForm(p => ({ ...p, patientEmail: e.target.value }))} />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Ward</label>
                                    <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                                        value={form.ward} onChange={e => setForm(p => ({ ...p, ward: e.target.value }))}>
                                        {WARDS.map(w => <option key={w}>{w}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Bed Number</label>
                                    <Input required placeholder="e.g. B-12" value={form.bedNumber} onChange={e => setForm(p => ({ ...p, bedNumber: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Attending Doctor</label>
                                    <Input required placeholder="Doctor name" value={form.doctorName} onChange={e => setForm(p => ({ ...p, doctorName: e.target.value }))} />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Diagnosis / Reason</label>
                                <Input required placeholder="Primary diagnosis" value={form.diagnosis} onChange={e => setForm(p => ({ ...p, diagnosis: e.target.value }))} />
                            </div>
                            <button type="submit" disabled={creating}
                                className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                                {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : "Admit Patient"}
                            </button>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex items-center gap-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input placeholder="Search patient or ward..." value={search} onChange={e => setSearch(e.target.value)}
                        className="h-10 pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
                </div>
                <span className="text-xs font-bold text-gray-400">{filtered.length} admitted</span>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <BedDouble className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">No current admissions</p>
                    <p className="text-xs text-gray-400">Admit a patient using the button above.</p>
                </div>
            ) : (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Patient", "Ward", "Bed", "Doctor", "Diagnosis", "Admitted", "Days"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filtered.map(a => {
                                const days = a.admittedAt?.seconds ? Math.floor((Date.now() / 1000 - a.admittedAt.seconds) / 86400) : 0;
                                return (
                                    <tr key={a.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-bold text-gray-900">{a.patientName}</p>
                                            <p className="text-xs text-gray-400">{a.patientEmail}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${WARD_BADGE[a.ward] || "bg-gray-50 text-gray-600 border-gray-100"}`}>{a.ward}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-700">{a.bedNumber || "—"}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{a.doctorName}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500 max-w-[140px] truncate">{a.diagnosis}</td>
                                        <td className="px-4 py-3 text-xs text-gray-400">
                                            {a.admittedAt?.seconds ? new Date(a.admittedAt.seconds * 1000).toLocaleDateString() : "—"}
                                        </td>
                                        <td className="px-4 py-3 text-xs font-bold text-gray-700">{days}d</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

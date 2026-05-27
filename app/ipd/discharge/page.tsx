"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where, updateDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { LogOut, Search, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";

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
}

export default function IpdDischargePage() {
    const { profile } = useAuth();
    const [admissions, setAdmissions] = useState<IpdAdmission[]>([]);
    const [loading, setLoading] = useState(true);
    const [discharging, setDischarging] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [tab, setTab] = useState<"admitted" | "discharged">("admitted");

    useEffect(() => { fetchData(); }, [tab]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const q = query(collection(db, "ipdAdmissions"), where("status", "==", tab === "admitted" ? "ADMITTED" : "DISCHARGED"));
            const snap = await getDocs(q);
            setAdmissions(snap.docs.map(d => ({ id: d.id, ...d.data() } as IpdAdmission)));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleDischarge = async (admission: IpdAdmission) => {
        setDischarging(admission.id);
        try {
            await updateDoc(doc(db, "ipdAdmissions", admission.id), {
                status: "DISCHARGED",
                dischargedAt: serverTimestamp(),
                dischargedBy: profile?.name,
            });
            setAdmissions(prev => prev.filter(a => a.id !== admission.id));
        } catch(e) { console.error(e); }
        finally { setDischarging(null); }
    };

    const filtered = admissions.filter(a =>
        !search || a.patientName.toLowerCase().includes(search.toLowerCase()) ||
        a.ward.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Discharge Management</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Process patient discharges and view discharge history</p>
                </div>
                <button onClick={fetchData} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            <div className="flex gap-2">
                {(["admitted", "discharged"] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${tab === t ? "bg-blue-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                        {t === "admitted" ? "Currently Admitted" : "Discharged"}
                    </button>
                ))}
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input placeholder="Search patient or ward..." value={search} onChange={e => setSearch(e.target.value)}
                    className="h-10 w-full pl-9 pr-4 rounded-xl border border-gray-200 bg-white text-sm font-medium focus:border-blue-500 outline-none" />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <LogOut className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900 mb-1">
                        {tab === "admitted" ? "No admitted patients" : "No discharge records"}
                    </p>
                    <p className="text-xs text-gray-400">
                        {tab === "admitted" ? "Admit patients from the Admissions page." : "Discharged patients will appear here."}
                    </p>
                </div>
            ) : (
                <div className="space-y-3">
                    <AnimatePresence>
                        {filtered.map((a, i) => {
                            const days = a.admittedAt?.seconds ? Math.floor((Date.now() / 1000 - a.admittedAt.seconds) / 86400) : 0;
                            return (
                                <motion.div key={a.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.97 }} transition={{ delay: i * 0.04 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-start justify-between gap-4 flex-wrap">
                                        <div className="flex items-center gap-3">
                                            <div className="h-11 w-11 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-600 text-sm shrink-0">
                                                {a.patientName?.charAt(0) || "?"}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{a.patientName}</p>
                                                <p className="text-xs text-gray-400">{a.patientEmail}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{a.ward} · Bed {a.bedNumber} · Dr. {a.doctorName}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="text-right">
                                                <p className="text-xs text-gray-400">
                                                    {a.admittedAt?.seconds ? new Date(a.admittedAt.seconds * 1000).toLocaleDateString() : "—"}
                                                </p>
                                                <p className="text-xs font-bold text-gray-600">{days} day{days !== 1 ? "s" : ""} stay</p>
                                            </div>
                                            {tab === "admitted" && (
                                                <button onClick={() => handleDischarge(a)} disabled={!!discharging}
                                                    className="h-9 px-4 rounded-xl bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors disabled:opacity-50 shadow-sm">
                                                    {discharging === a.id
                                                        ? <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full"/>
                                                        : <><CheckCircle2 className="h-3.5 w-3.5"/> Discharge</>}
                                                </button>
                                            )}
                                            {tab === "discharged" && (
                                                <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700 border border-green-100 flex items-center gap-1">
                                                    <CheckCircle2 className="h-3 w-3" /> Discharged
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-50">{a.diagnosis}</p>
                                </motion.div>
                            );
                        })}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

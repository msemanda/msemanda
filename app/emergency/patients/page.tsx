"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, Search, RefreshCw, ChevronDown, ArrowRightLeft, Check } from "lucide-react";
import { collection, getDocs, query, where, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";
import { notify } from "@/lib/notify";
import { EmergencyCase } from "@/types";

const TRIAGE_COLOR: Record<string, string> = {
    IMMEDIATE:   "bg-red-50 text-red-700",
    URGENT:      "bg-orange-50 text-orange-700",
    LESS_URGENT: "bg-yellow-50 text-yellow-700",
    NON_URGENT:  "bg-green-50 text-green-700",
};

const STATUS_COLOR: Record<string, string> = {
    WAITING:      "bg-amber-50 text-amber-700",
    IN_TREATMENT: "bg-blue-50 text-blue-700",
    ADMITTED:     "bg-purple-50 text-purple-700",
    DISCHARGED:   "bg-green-50 text-green-700",
    REFERRED:     "bg-orange-50 text-orange-700",
    TRANSFERRED:  "bg-gray-100 text-gray-600",
};

const STATUS_OPTIONS: EmergencyCase["status"][] = ["WAITING", "IN_TREATMENT", "ADMITTED", "DISCHARGED", "REFERRED"];

export default function EDPatients() {
    const [patients, setPatients] = useState<EmergencyCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [managingId, setManagingId] = useState<string | null>(null);
    const [newStatus, setNewStatus] = useState<EmergencyCase["status"]>("WAITING");
    const [referredTo, setReferredTo] = useState("");
    const [referralReason, setReferralReason] = useState("");
    const [saving, setSaving] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(
                query(collection(db, "emergencyCases"), where("status", "!=", "DISCHARGED"))
            );
            const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as EmergencyCase));
            rows.sort((a, b) => {
                const ta = toDate(a.arrivalTime)?.getTime() ?? 0;
                const tb = toDate(b.arrivalTime)?.getTime() ?? 0;
                return tb - ta;
            });
            setPatients(rows);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = patients.filter(p =>
        p.patientName?.toLowerCase().includes(search.toLowerCase())
    );

    const openManage = (p: EmergencyCase) => {
        setManagingId(p.id);
        setNewStatus(p.status);
        setReferredTo(p.referredTo ?? "");
        setReferralReason(p.referralReason ?? "");
    };

    const saveStatus = async (p: EmergencyCase) => {
        if (newStatus === "REFERRED" && (!referredTo.trim() || !referralReason.trim())) return;
        setSaving(true);
        try {
            const update: Record<string, unknown> = { status: newStatus };
            if (newStatus === "REFERRED") {
                update.referredTo = referredTo.trim();
                update.referralReason = referralReason.trim();
                update.referredAt = serverTimestamp();
            }
            await updateDoc(doc(db, "emergencyCases", p.id), update);
            setPatients(prev =>
                newStatus === "DISCHARGED"
                    ? prev.filter(x => x.id !== p.id)
                    : prev.map(x => x.id === p.id ? { ...x, ...update, status: newStatus } as EmergencyCase : x)
            );
            setManagingId(null);
            if (newStatus === "REFERRED") {
                await notify({
                    targetRole: "ADMIN",
                    type:       "referral",
                    title:      `ED patient referred: ${p.patientName}`,
                    body:       `Referred to ${referredTo.trim()} — ${referralReason.trim()}`,
                    link:       "/emergency/patients",
                });
            }
        } catch (e) {
            console.error(e);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Users className="h-6 w-6 text-red-600" /> ED Patients
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${patients.length} patients in emergency`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-red-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-red-500/20"
                    placeholder="Search patient..."
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto rounded-xl">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin h-6 w-6 border-[3px] border-red-100 border-t-red-500 rounded-full" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">
                            {search ? "No patients match your search" : "No patients in emergency"}
                        </p>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {["Patient", "Complaint", "Arrived", "Triage", "Team", "Disposition", "Status", ""].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((p, i) => {
                                    const arrivalDate = toDate(p.arrivalTime);
                                    const arrivedStr = arrivalDate
                                        ? arrivalDate.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                                        : "—";
                                    const anyP = p as any;
                                    const isManaging = managingId === p.id;
                                    return (
                                        <>
                                            <motion.tr
                                                key={p.id}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: i * 0.04 }}
                                                className="hover:bg-gray-50/50"
                                            >
                                                <td className="px-4 py-3">
                                                    <p className="text-sm font-bold text-gray-900">{p.patientName}</p>
                                                    <p className="text-[10px] text-gray-400">{p.age ? `${p.age}y` : "—"}</p>
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-600 max-w-[140px]">{p.chiefComplaint}</td>
                                                <td className="px-4 py-3 text-xs text-gray-500">{arrivedStr}</td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${TRIAGE_COLOR[p.triageLevel] ?? "bg-gray-50 text-gray-600"}`}>
                                                        {p.triageLevel.replace("_", " ")}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 text-[10px] text-gray-500">
                                                    {anyP.assignedDoctor ?? anyP.assignedDoctorId ?? "—"}<br />
                                                    {anyP.assignedNurse ?? anyP.assignedNurseId ?? ""}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-600 max-w-[160px]">
                                                    {p.status === "REFERRED" && p.referredTo
                                                        ? <span className="text-orange-700 font-semibold">Referred to {p.referredTo}</span>
                                                        : p.disposition ?? "—"}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_COLOR[p.status] ?? "bg-gray-50 text-gray-600"}`}>
                                                        {p.status.replace("_", " ")}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3">
                                                    <button
                                                        onClick={() => isManaging ? setManagingId(null) : openManage(p)}
                                                        className="flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-red-600 transition-colors"
                                                    >
                                                        Manage <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isManaging ? "rotate-180" : ""}`} />
                                                    </button>
                                                </td>
                                            </motion.tr>
                                            <AnimatePresence>
                                                {isManaging && (
                                                    <motion.tr
                                                        initial={{ opacity: 0 }}
                                                        animate={{ opacity: 1 }}
                                                        exit={{ opacity: 0 }}
                                                    >
                                                        <td colSpan={8} className="bg-gray-50 px-4 py-4 border-t border-b border-gray-100">
                                                            <div className="flex flex-wrap items-end gap-3">
                                                                <div>
                                                                    <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Update Status</label>
                                                                    <select
                                                                        value={newStatus}
                                                                        onChange={e => setNewStatus(e.target.value as EmergencyCase["status"])}
                                                                        className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-semibold text-gray-700 outline-none focus:border-red-500"
                                                                    >
                                                                        {STATUS_OPTIONS.map(s => (
                                                                            <option key={s} value={s}>{s.replace("_", " ")}</option>
                                                                        ))}
                                                                    </select>
                                                                </div>
                                                                {newStatus === "REFERRED" && (
                                                                    <>
                                                                        <div>
                                                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Referred To</label>
                                                                            <input
                                                                                value={referredTo}
                                                                                onChange={e => setReferredTo(e.target.value)}
                                                                                placeholder="e.g. Mulago Referral Hospital"
                                                                                className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium outline-none focus:border-red-500 w-56"
                                                                            />
                                                                        </div>
                                                                        <div>
                                                                            <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block mb-1">Reason</label>
                                                                            <input
                                                                                value={referralReason}
                                                                                onChange={e => setReferralReason(e.target.value)}
                                                                                placeholder="e.g. Needs ICU / specialist care"
                                                                                className="h-9 px-3 rounded-lg border border-gray-200 bg-white text-xs font-medium outline-none focus:border-red-500 w-64"
                                                                            />
                                                                        </div>
                                                                    </>
                                                                )}
                                                                <button
                                                                    onClick={() => saveStatus(p)}
                                                                    disabled={saving || (newStatus === "REFERRED" && (!referredTo.trim() || !referralReason.trim()))}
                                                                    className="h-9 px-4 rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                                                                >
                                                                    {saving
                                                                        ? <div className="animate-spin h-3.5 w-3.5 border-2 border-white/30 border-t-white rounded-full" />
                                                                        : newStatus === "REFERRED" ? <ArrowRightLeft className="h-3.5 w-3.5" /> : <Check className="h-3.5 w-3.5" />}
                                                                    Save
                                                                </button>
                                                            </div>
                                                        </td>
                                                    </motion.tr>
                                                )}
                                            </AnimatePresence>
                                        </>
                                    );
                                })}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

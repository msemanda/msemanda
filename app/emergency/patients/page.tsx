"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Search, RefreshCw } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";
import { EmergencyCase } from "@/types";

const TRIAGE_COLOR: Record<string, string> = {
    IMMEDIATE:   "bg-red-50 text-red-700",
    URGENT:      "bg-orange-50 text-orange-700",
    LESS_URGENT: "bg-yellow-50 text-yellow-700",
    NON_URGENT:  "bg-green-50 text-green-700",
};

export default function EDPatients() {
    const [patients, setPatients] = useState<EmergencyCase[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

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
                                    {["Patient", "Complaint", "Arrived", "Triage", "Team", "Disposition", "Status"].map(h => (
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
                                    return (
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
                                            <td className="px-4 py-3 text-xs text-gray-600 max-w-[160px]">{p.disposition ?? "—"}</td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${p.status === "IN_TREATMENT" ? "bg-blue-50 text-blue-700" : "bg-amber-50 text-amber-700"}`}>
                                                    {p.status.replace("_", " ")}
                                                </span>
                                            </td>
                                        </motion.tr>
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

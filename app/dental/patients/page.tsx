"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Search, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";

interface DentalPatient {
    id: string;
    name: string;
    age?: number;
    gender?: string;
    concern: string;
    lastVisit: string;
    nextAppt: string | null;
    status: string;
}

const STATUS_BADGE: Record<string, string> = {
    ACTIVE:       "bg-blue-50 text-blue-700",
    FOLLOW_UP:    "bg-amber-50 text-amber-700",
    IN_TREATMENT: "bg-purple-50 text-purple-700",
    POST_OP:      "bg-green-50 text-green-700",
};

export default function DentalPatients() {
    const [patients, setPatients] = useState<DentalPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "dentalRecords"));
            setPatients(snap.docs.map(d => {
                const r = d.data();
                const lastVisitDate = toDate(r.date ?? r.lastVisit);
                const nextApptDate  = toDate(r.followUpDate ?? r.nextAppt);
                return {
                    id: d.id,
                    name:      (r.patientName as string) ?? "—",
                    age:       r.age as number | undefined,
                    gender:    r.gender as string | undefined,
                    concern:   ((r.concern ?? r.findings ?? r.procedure) as string) ?? "—",
                    lastVisit: lastVisitDate ? lastVisitDate.toLocaleDateString("en-CA") : "—",
                    nextAppt:  nextApptDate  ? nextApptDate.toLocaleDateString("en-CA")  : null,
                    status:    (r.status as string) ?? "ACTIVE",
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Users className="h-6 w-6 text-pink-600" /> Dental Patients
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${filtered.length} patients`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-pink-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500/20"
                    placeholder="Search patient..."
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin h-6 w-6 border-[3px] border-pink-100 border-t-pink-500 rounded-full" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">
                            {search ? "No patients match your search" : "No dental records found"}
                        </p>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {["Patient", "Age/Gender", "Chief Concern", "Last Visit", "Next Appointment", "Status"].map(h => (
                                        <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {filtered.map((p, i) => (
                                    <motion.tr
                                        key={p.id}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.04 }}
                                        className="hover:bg-gray-50/50 transition-colors"
                                    >
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="h-7 w-7 rounded-lg bg-pink-50 flex items-center justify-center text-pink-700 font-black text-xs">
                                                    {p.name.charAt(0)}
                                                </div>
                                                <span className="text-sm font-bold text-gray-900">{p.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-600">
                                            {p.age ? `${p.age}y` : "—"}{p.gender ? ` / ${p.gender}` : ""}
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-700 max-w-[180px]">{p.concern}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{p.lastVisit}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{p.nextAppt ?? "—"}</td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[p.status] ?? "bg-gray-50 text-gray-600"}`}>
                                                {p.status.replace("_", " ")}
                                            </span>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

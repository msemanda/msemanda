"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Scan, Calendar, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";

interface DentalXray {
    id: string;
    patient: string;
    type: string;
    tooth: string;
    date: string;
    tech: string;
    findings: string;
    status: string;
}

const TYPE_COLOR: Record<string, string> = {
    "Periapical":      "bg-pink-50 text-pink-700",
    "Panoramic (OPG)": "bg-purple-50 text-purple-700",
    "Bitewing":        "bg-blue-50 text-blue-700",
    "CBCT":            "bg-indigo-50 text-indigo-700",
};

export default function DentalXrays() {
    const [xrays, setXrays] = useState<DentalXray[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "dentalXrays"));
            setXrays(snap.docs.map(d => {
                const r = d.data();
                const dt = toDate(r.date ?? r.takenAt);
                return {
                    id: d.id,
                    patient: ((r.patientName ?? r.patient) as string) ?? "—",
                    type: (r.type as string) ?? "—",
                    tooth: ((r.tooth ?? r.region) as string) ?? "—",
                    date: dt ? dt.toLocaleDateString("en-CA") : ((r.date as string) ?? "—"),
                    tech: ((r.tech ?? r.technician) as string) ?? "—",
                    findings: (r.findings as string) ?? "—",
                    status: (r.status as string) ?? "REPORTED",
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Scan className="h-6 w-6 text-pink-600" /> Dental X-Rays
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${xrays.length} radiographs on file`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-pink-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-pink-100 border-t-pink-500 rounded-full" />
                </div>
            ) : xrays.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">No dental X-rays on file</p>
            ) : (
                <div className="space-y-3">
                    {xrays.map((x, i) => (
                        <motion.div key={x.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-pink-50 flex items-center justify-center">
                                        <Scan className="h-5 w-5 text-pink-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">{x.patient}</p>
                                        <p className="text-xs text-gray-400 flex items-center gap-1"><Calendar className="h-3 w-3" />{x.date} · {x.tech}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${TYPE_COLOR[x.type] || "bg-gray-50 text-gray-600"}`}>{x.type}</span>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-green-50 text-green-700">{x.status}</span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">Tooth/Region: <span className="font-semibold text-gray-700">{x.tooth}</span></p>
                            <div className="bg-gray-50 rounded-xl p-3">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Radiographic Findings</p>
                                <p className="text-xs text-gray-700">{x.findings}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

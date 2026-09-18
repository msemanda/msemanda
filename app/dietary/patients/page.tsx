"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Search, RefreshCw } from "lucide-react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";

interface DietaryPatient {
    id: string;
    name: string;
    age?: number;
    ward: string;
    condition: string;
    bmi?: number;
    hasPlan: boolean;
    lastAssessment: string | null;
}

export default function DietaryPatients() {
    const [patients, setPatients] = useState<DietaryPatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(
                query(collection(db, "ipdAdmissions"), where("dietaryReferral", "==", "true"))
            );
            setPatients(snap.docs.map(d => {
                const r = d.data();
                const assessDate = toDate(r.lastDietaryAssessment ?? r.lastAssessment);
                return {
                    id:             d.id,
                    name:           (r.patientName as string) ?? "—",
                    age:            r.age as number | undefined,
                    ward:           ((r.bedNumber ?? r.ward) as string) ?? "—",
                    condition:      (r.dietaryCondition ?? r.diagnosis as string) ?? "—",
                    bmi:            r.bmi as number | undefined,
                    hasPlan:        Boolean(r.hasDietPlan ?? r.hasPlan),
                    lastAssessment: assessDate ? assessDate.toLocaleDateString("en-CA") : null,
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
                        <Users className="h-6 w-6 text-emerald-600" /> Patients
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${filtered.length} patients referred for dietary management`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-emerald-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500/20"
                    placeholder="Search patient..."
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="overflow-x-auto rounded-xl">
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <div className="animate-spin h-6 w-6 border-[3px] border-emerald-100 border-t-emerald-500 rounded-full" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">
                            {search ? "No patients match your search" : "No dietary referrals found"}
                        </p>
                    ) : (
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    {["Patient", "Ward/Bed", "Condition", "BMI", "Diet Plan", "Last Assessment"].map(h => (
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
                                                <div className="h-7 w-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-700 font-black text-xs">
                                                    {p.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{p.name}</p>
                                                    {p.age && <p className="text-[10px] text-gray-400">{p.age}y</p>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-xs font-semibold text-blue-600">{p.ward}</td>
                                        <td className="px-4 py-3 text-xs text-gray-600 max-w-[180px]">{p.condition}</td>
                                        <td className="px-4 py-3 text-xs font-bold text-gray-700">
                                            {p.bmi != null ? (
                                                <>
                                                    {p.bmi}
                                                    <span className={`ml-1 text-[10px] ${p.bmi > 30 ? "text-red-500" : p.bmi < 20 ? "text-amber-500" : "text-green-600"}`}>
                                                        {p.bmi > 30 ? "Obese" : p.bmi < 20 ? "Underweight" : "Normal"}
                                                    </span>
                                                </>
                                            ) : "—"}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${p.hasPlan ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-600"}`}>
                                                {p.hasPlan ? "Active" : "Pending"}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-xs text-gray-400">{p.lastAssessment ?? "—"}</td>
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

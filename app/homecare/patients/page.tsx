"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Users, Search, MapPin, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { toDate } from "@/lib/ts";

interface HomeCarePatient {
    id: string;
    name: string;
    age: number | null;
    address: string;
    condition: string;
    services: string[];
    nextVisit: string | null;
    status: string;
}

export default function HomecarePatients() {
    const [patients, setPatients] = useState<HomeCarePatient[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "homeCarePatients"));
            setPatients(snap.docs.map(d => {
                const r = d.data();
                const nextDate = toDate(r.nextVisit ?? r.nextVisitDate);
                return {
                    id: d.id,
                    name: ((r.patientName ?? r.name) as string) ?? "—",
                    age: r.age != null ? Number(r.age) : null,
                    address: (r.address as string) ?? "—",
                    condition: (r.condition as string) ?? "—",
                    services: Array.isArray(r.services) ? (r.services as string[]) : [],
                    nextVisit: nextDate ? nextDate.toLocaleDateString("en-CA") : null,
                    status: (r.status as string) ?? "ACTIVE",
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
                        <Users className="h-6 w-6 text-teal-600" /> My Patients
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${filtered.length} home care patients`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-teal-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20"
                    placeholder="Search patient..." />
            </div>
            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-teal-100 border-t-teal-500 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">
                    {search ? "No patients match your search" : "No home care patients found"}
                </p>
            ) : (
                <div className="space-y-3">
                    {filtered.map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-black text-sm">
                                        {p.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">
                                            {p.name}{p.age != null && <span className="ml-1 text-xs font-normal text-gray-400">{p.age}y</span>}
                                        </p>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <MapPin className="h-3 w-3 text-gray-400" />{p.address}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">{p.condition}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0 ml-3">
                                    <p className="text-[10px] text-gray-400">Next visit</p>
                                    <p className="text-xs font-bold text-teal-600">{p.nextVisit ?? "—"}</p>
                                </div>
                            </div>
                            {p.services.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {p.services.map(s => (
                                        <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100">
                                            {s}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

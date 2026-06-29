"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Ambulance, MapPin, Phone, Clock, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface AmbulanceUnit {
    id: string;
    callsign: string;
    unitId: string;
    crew: string[];
    status: string;
    destination: string | null;
    eta: string | null;
}

interface AmbulanceCall {
    id: string;
    caller: string;
    type: string;
    location: string;
    time: string;
    unit: string;
    status: string;
}

const STATUS_STYLE: Record<string, string> = {
    AVAILABLE:     "bg-green-50 text-green-700",
    DISPATCHED:    "bg-red-50 text-red-700",
    EN_ROUTE_BACK: "bg-blue-50 text-blue-700",
    MAINTENANCE:   "bg-gray-50 text-gray-500",
};

export default function AmbulancePage() {
    const [units, setUnits] = useState<AmbulanceUnit[]>([]);
    const [calls, setCalls] = useState<AmbulanceCall[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const [unitsSnap, callsSnap] = await Promise.all([
                getDocs(collection(db, "ambulanceUnits")),
                getDocs(collection(db, "ambulanceCalls")),
            ]);
            setUnits(unitsSnap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    callsign: (r.callsign as string) ?? "—",
                    unitId: ((r.unitId ?? r.vehicleId) as string) ?? d.id,
                    crew: Array.isArray(r.crew) ? (r.crew as string[]) : [],
                    status: (r.status as string) ?? "AVAILABLE",
                    destination: (r.destination as string | null) ?? null,
                    eta: (r.eta as string | null) ?? null,
                };
            }));
            setCalls(callsSnap.docs.map(d => {
                const r = d.data();
                return {
                    id: d.id,
                    caller: (r.caller as string) ?? "—",
                    type: (r.type as string) ?? "—",
                    location: (r.location as string) ?? "—",
                    time: (r.time as string) ?? "—",
                    unit: (r.unit as string) ?? "—",
                    status: (r.status as string) ?? "PENDING",
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const availableCount = units.filter(u => u.status === "AVAILABLE").length;
    const dispatchedCount = units.filter(u => u.status === "DISPATCHED").length;

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Ambulance className="h-6 w-6 text-red-600" /> Ambulance Dispatch
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${availableCount} units available · ${dispatchedCount} dispatched`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-red-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-red-100 border-t-red-500 rounded-full" />
                </div>
            ) : (
                <>
                    {units.length === 0 ? (
                        <p className="text-center text-gray-400 py-8 text-xs font-bold uppercase tracking-widest">No ambulance units found</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {units.map((u, i) => (
                                <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <Ambulance className="h-5 w-5 text-red-500" />
                                            <span className="text-sm font-black text-gray-900">{u.callsign}</span>
                                            <span className="text-[10px] text-gray-400">{u.unitId}</span>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[u.status] ?? "bg-gray-50 text-gray-500"}`}>{u.status.replace(/_/g, " ")}</span>
                                    </div>
                                    <div className="space-y-1.5 text-xs text-gray-600">
                                        {u.crew.map(c => <p key={c} className="flex items-center gap-1"><Phone className="h-3 w-3 text-gray-300" />{c}</p>)}
                                        {u.destination && <p className="flex items-center gap-1 text-red-600 font-semibold"><MapPin className="h-3 w-3" />{u.destination}</p>}
                                        {u.eta && <p className="flex items-center gap-1 text-blue-600 font-semibold"><Clock className="h-3 w-3" />ETA: {u.eta}</p>}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-3.5 border-b border-gray-50">
                            <h2 className="text-sm font-black text-gray-900">Today's Calls</h2>
                        </div>
                        {calls.length === 0 ? (
                            <p className="text-center text-gray-400 py-8 text-xs">No calls today</p>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {calls.map((c, i) => (
                                    <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                        className="px-5 py-4 flex items-center justify-between">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">{c.type} — {c.caller}</p>
                                            <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin className="h-3 w-3" />{c.location} · {c.time}</p>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0 ml-3">
                                            <span className="text-[10px] text-gray-400">{c.unit}</span>
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${c.status === "COMPLETED" ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{c.status}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}

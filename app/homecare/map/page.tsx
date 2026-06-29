"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { MapPin, Navigation, Clock, RefreshCw } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

interface RouteStop {
    id: string;
    order: number;
    patient: string;
    address: string;
    area: string;
    time: string;
    status: string;
    distance: string;
}

const STATUS_STYLE: Record<string, { badge: string; dot: string; bg: string }> = {
    COMPLETED:   { badge: "bg-green-50 text-green-700",  dot: "bg-green-500",              bg: "bg-green-100" },
    IN_PROGRESS: { badge: "bg-blue-50 text-blue-700",    dot: "bg-blue-500 animate-pulse",  bg: "bg-blue-100" },
    UPCOMING:    { badge: "bg-gray-50 text-gray-500",    dot: "bg-gray-300",               bg: "bg-gray-100" },
};

export default function RouteMapPage() {
    const [stops, setStops] = useState<RouteStop[]>([]);
    const [loading, setLoading] = useState(true);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "homeCareRoutes"));
            setStops(
                snap.docs
                    .map(d => {
                        const r = d.data();
                        return {
                            id: d.id,
                            order: Number(r.order ?? r.stopNumber ?? 0),
                            patient: ((r.patientName ?? r.patient) as string) ?? "—",
                            address: (r.address as string) ?? "—",
                            area: (r.area as string) ?? "—",
                            time: (r.time as string) ?? "—",
                            status: (r.status as string) ?? "UPCOMING",
                            distance: (r.distance as string) ?? "—",
                        };
                    })
                    .sort((a, b) => a.order - b.order)
            );
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    return (
        <div className="max-w-3xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <MapPin className="h-6 w-6 text-teal-600" /> Route Map
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `Today's visit route — ${stops.length} stops`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-teal-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-br from-teal-50 to-blue-50 h-40 flex items-center justify-center border-b border-gray-100">
                    <div className="text-center">
                        <Navigation className="h-10 w-10 text-teal-400 mx-auto mb-2" />
                        <p className="text-sm font-bold text-gray-500">Route visualization</p>
                        <p className="text-xs text-gray-400">Kampala Metropolitan Area</p>
                    </div>
                </div>

                <div className="p-5">
                    {loading ? (
                        <div className="flex items-center justify-center py-8">
                            <div className="animate-spin h-5 w-5 border-[3px] border-teal-100 border-t-teal-500 rounded-full" />
                        </div>
                    ) : stops.length === 0 ? (
                        <p className="text-center text-gray-400 py-8 text-xs font-bold uppercase tracking-widest">No route stops for today</p>
                    ) : (
                        <div className="relative">
                            <div className="absolute left-5 top-5 bottom-5 w-px bg-gray-100" />
                            <div className="space-y-5">
                                {stops.map((stop, i) => {
                                    const style = STATUS_STYLE[stop.status] ?? STATUS_STYLE.UPCOMING;
                                    return (
                                        <motion.div key={stop.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                                            className="flex items-center gap-4">
                                            <div className="relative z-10 shrink-0">
                                                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${style.bg}`}>
                                                    <span className="text-sm font-black text-gray-700">{stop.order}</span>
                                                </div>
                                            </div>
                                            <div className="flex-1 bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-bold text-gray-900">{stop.patient}</p>
                                                    <p className="text-xs text-gray-400 flex items-center gap-1"><MapPin className="h-3 w-3" />{stop.address}</p>
                                                    <p className="text-[10px] text-gray-400 flex items-center gap-1 mt-0.5"><Clock className="h-3 w-3" />{stop.time} · {stop.distance} from prev</p>
                                                </div>
                                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${style.badge}`}>{stop.status.replace("_", " ")}</span>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

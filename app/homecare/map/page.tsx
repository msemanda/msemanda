"use client";

import { motion } from "framer-motion";
import { MapPin, Navigation, Clock } from "lucide-react";

const route = [
    { order: 1, patient: "Agnes Kiwanuka", address: "Naguru Hill Road", area: "Naguru", time: "08:00", status: "COMPLETED", distance: "3.2 km" },
    { order: 2, patient: "John Mwesiga", address: "Ntinda, Plot 12", area: "Ntinda", time: "10:00", status: "IN_PROGRESS", distance: "2.1 km" },
    { order: 3, patient: "Robert Sembuya", address: "Bukoto, near Shell", area: "Bukoto", time: "12:30", status: "UPCOMING", distance: "1.8 km" },
    { order: 4, patient: "Mary Naluwooza", address: "Kireka trading center", area: "Kireka", time: "14:00", status: "UPCOMING", distance: "5.4 km" },
];

const STATUS_STYLE: Record<string, { badge: string; dot: string }> = {
    COMPLETED: { badge: "bg-green-50 text-green-700", dot: "bg-green-500" },
    IN_PROGRESS: { badge: "bg-blue-50 text-blue-700", dot: "bg-blue-500 animate-pulse" },
    UPCOMING: { badge: "bg-gray-50 text-gray-500", dot: "bg-gray-300" },
};

export default function RoutMapPage() {
    return (
        <div className="max-w-3xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <MapPin className="h-6 w-6 text-teal-600" /> Route Map
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Today's visit route — {route.length} stops · ~12.5 km total</p>
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
                    <div className="relative">
                        <div className="absolute left-5 top-5 bottom-5 w-px bg-gray-100" />
                        <div className="space-y-5">
                            {route.map((stop, i) => {
                                const style = STATUS_STYLE[stop.status];
                                return (
                                    <motion.div key={stop.order} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.07 }}
                                        className="flex items-center gap-4">
                                        <div className="relative z-10 shrink-0">
                                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${stop.status === "COMPLETED" ? "bg-green-100" : stop.status === "IN_PROGRESS" ? "bg-blue-100" : "bg-gray-100"}`}>
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
                </div>
            </div>
        </div>
    );
}

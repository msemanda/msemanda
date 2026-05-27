"use client";

import { motion } from "framer-motion";
import { Ambulance, MapPin, Phone, Clock } from "lucide-react";

const units = [
    { id: "AMB-01", callsign: "Alpha 1", crew: ["EMT Ssali Brian", "Driver Mugisha Ronald"], status: "DISPATCHED", destination: "Kawempe — RTA victim", eta: "12 min", departed: "10:35" },
    { id: "AMB-02", callsign: "Alpha 2", crew: ["EMT Nakato Joyce", "Driver Byaruhanga Peter"], status: "EN_ROUTE_BACK", destination: "Returning from Mulago", eta: "8 min", departed: "09:00" },
    { id: "AMB-03", callsign: "Bravo 1", crew: ["EMT Tumusiime David", "Driver Ssemanda Moses"], status: "AVAILABLE", destination: null, eta: null, departed: null },
    { id: "AMB-04", callsign: "Bravo 2", crew: ["EMT Atim Grace", "Driver Okello James"], status: "MAINTENANCE", destination: null, eta: null, departed: null },
];

const calls = [
    { id: "C001", caller: "Bystander — Kawempe", type: "RTA", location: "Kawempe roundabout", time: "10:33", unit: "AMB-01", status: "DISPATCHED" },
    { id: "C002", caller: "Self — Nakawa", type: "Chest pain", location: "Nakawa market", time: "09:50", unit: "AMB-02", status: "COMPLETED" },
    { id: "C003", caller: "Family — Ntinda", type: "Stroke", location: "Ntinda estate", time: "08:20", unit: "AMB-02", status: "COMPLETED" },
];

const STATUS_STYLE: Record<string, string> = {
    AVAILABLE: "bg-green-50 text-green-700",
    DISPATCHED: "bg-red-50 text-red-700",
    EN_ROUTE_BACK: "bg-blue-50 text-blue-700",
    MAINTENANCE: "bg-gray-50 text-gray-500",
};

export default function AmbulancePage() {
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Ambulance className="h-6 w-6 text-red-600" /> Ambulance Dispatch
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {units.filter(u => u.status === "AVAILABLE").length} units available · {units.filter(u => u.status === "DISPATCHED").length} dispatched
                </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {units.map((u, i) => (
                    <motion.div key={u.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                                <Ambulance className="h-5 w-5 text-red-500" />
                                <span className="text-sm font-black text-gray-900">{u.callsign}</span>
                                <span className="text-[10px] text-gray-400">{u.id}</span>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[u.status]}`}>{u.status.replace("_", " ")}</span>
                        </div>
                        <div className="space-y-1.5 text-xs text-gray-600">
                            {u.crew.map(c => <p key={c} className="flex items-center gap-1"><Phone className="h-3 w-3 text-gray-300" />{c}</p>)}
                            {u.destination && <p className="flex items-center gap-1 text-red-600 font-semibold"><MapPin className="h-3 w-3" />{u.destination}</p>}
                            {u.eta && <p className="flex items-center gap-1 text-blue-600 font-semibold"><Clock className="h-3 w-3" />ETA: {u.eta}</p>}
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50">
                    <h2 className="text-sm font-black text-gray-900">Today's Calls</h2>
                </div>
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
            </div>
        </div>
    );
}

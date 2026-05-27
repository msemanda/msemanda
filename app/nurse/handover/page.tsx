"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserCheck, AlertTriangle, CheckCircle2 } from "lucide-react";

const handoverItems = [
    { bed: "A-01", patient: "John Mwesiga", priority: "STABLE", outgoingNotes: "IV fluids running, vitals stable, next BP check at 14:00", pendingOrders: ["HbA1c result pending", "Dietitian consult scheduled"] },
    { bed: "A-02", patient: "Grace Nakato", priority: "MONITOR", outgoingNotes: "BP 160/100 at 13:00, Metoprolol given, keep on continuous BP monitoring", pendingOrders: ["Cardiology review at 16:00"] },
    { bed: "B-03", patient: "Sarah Namutebi", priority: "CRITICAL", outgoingNotes: "O2 sats 88-91% on 4L, doctor notified, await ICU review", pendingOrders: ["ABG repeat at 15:00", "Chest X-ray ordered"] },
    { bed: "B-01", patient: "Patrick Ssemanda", priority: "STABLE", outgoingNotes: "Post-op day 3, wound clean and dry, tolerating oral feeds", pendingOrders: ["Wound review tomorrow morning"] },
    { bed: "C-02", patient: "James Okello", priority: "MONITOR", outgoingNotes: "Nebulization given at 12:30, next dose at 16:30, SpO2 95%", pendingOrders: ["Pulmonology follow-up pending"] },
];

const PRIORITY_STYLE: Record<string, string> = {
    STABLE: "bg-green-50 text-green-700 border-green-100",
    MONITOR: "bg-amber-50 text-amber-700 border-amber-100",
    CRITICAL: "bg-red-50 text-red-700 border-red-100",
};

export default function HandoverPage() {
    const [acknowledged, setAcknowledged] = useState<string[]>([]);

    const toggle = (bed: string) =>
        setAcknowledged(prev => prev.includes(bed) ? prev.filter(b => b !== bed) : [...prev, bed]);

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <UserCheck className="h-6 w-6 text-green-600" /> Shift Handover
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {acknowledged.length}/{handoverItems.length} patients acknowledged
                    </p>
                </div>
                <div className="text-xs font-bold text-gray-400 bg-white border border-gray-100 rounded-xl px-3 py-2">
                    Morning → Evening handover
                </div>
            </div>

            <div className="space-y-3">
                {handoverItems.map((item, i) => {
                    const isAck = acknowledged.includes(item.bed);
                    return (
                        <motion.div key={item.bed} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className={`bg-white rounded-2xl border shadow-sm p-5 transition-all ${isAck ? "border-green-100 bg-green-50/30" : "border-gray-100"}`}>
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-green-100 flex items-center justify-center text-green-700 font-black text-sm">{item.bed}</div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">{item.patient}</p>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${PRIORITY_STYLE[item.priority]}`}>{item.priority}</span>
                                    </div>
                                </div>
                                <button onClick={() => toggle(item.bed)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${isAck ? "bg-green-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    {isAck ? "Acknowledged" : "Acknowledge"}
                                </button>
                            </div>
                            <p className="text-xs text-gray-700 mb-2">{item.outgoingNotes}</p>
                            {item.pendingOrders.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                    {item.pendingOrders.map(o => (
                                        <span key={o} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100 flex items-center gap-1">
                                            <AlertTriangle className="h-2.5 w-2.5" /> {o}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </motion.div>
                    );
                })}
            </div>
        </div>
    );
}

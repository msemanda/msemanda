"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Plus, FlaskConical, Scan, Pill, UtensilsCrossed, Activity, CheckCircle2, Clock } from "lucide-react";

type OrderType = "MEDICATION" | "LAB" | "RADIOLOGY" | "NURSING" | "DIET";

const ORDER_TYPES: { type: OrderType; label: string; icon: any; color: string; bg: string }[] = [
    { type: "MEDICATION", label: "Medication", icon: Pill, color: "text-blue-600", bg: "bg-blue-50" },
    { type: "LAB", label: "Laboratory", icon: FlaskConical, color: "text-amber-600", bg: "bg-amber-50" },
    { type: "RADIOLOGY", label: "Radiology", icon: Scan, color: "text-purple-600", bg: "bg-purple-50" },
    { type: "NURSING", label: "Nursing", icon: Activity, color: "text-teal-600", bg: "bg-teal-50" },
    { type: "DIET", label: "Dietary", icon: UtensilsCrossed, color: "text-green-600", bg: "bg-green-50" },
];

const ORDER_SUGGESTIONS: Record<OrderType, string[]> = {
    MEDICATION: ["Amoxicillin 500mg TDS x7d", "Metformin 500mg BD", "Amlodipine 5mg OD", "Paracetamol 1g PRN", "Omeprazole 20mg OD"],
    LAB: ["Full Blood Count (FBC)", "Comprehensive Metabolic Panel", "HbA1c", "Lipid Profile", "Thyroid Function Tests", "Blood Culture x2", "Urinalysis"],
    RADIOLOGY: ["Chest X-Ray PA", "CT Chest+Abdomen (contrast)", "MRI Brain", "Abdominal Ultrasound", "Echocardiogram"],
    NURSING: ["4-hourly vital signs", "Strict I&O monitoring", "Daily weight", "Wound dressing BD", "IV cannula care", "Patient fall risk assessment"],
    DIET: ["Low-salt DASH diet", "Diabetic diet 1800 kcal", "Soft diet", "Clear fluids only", "High-protein diet", "Gluten-free diet"],
};

const recentOrders = [
    { id: "OR001", patient: "John Mwesiga", type: "MEDICATION", detail: "Metformin 500mg BD", priority: "ROUTINE", status: "ACKNOWLEDGED", time: "09:15" },
    { id: "OR002", patient: "Grace Nakato", type: "LAB", detail: "FBC, RFTs, LFTs", priority: "URGENT", status: "IN_PROGRESS", time: "09:30" },
    { id: "OR003", patient: "Patrick Ssemanda", type: "RADIOLOGY", detail: "Chest X-Ray PA", priority: "URGENT", status: "PENDING", time: "09:45" },
    { id: "OR004", patient: "Sarah Namutebi", type: "NURSING", detail: "4-hourly vital signs", priority: "ROUTINE", status: "COMPLETED", time: "08:00" },
];

const STATUS_CLASS: Record<string, string> = {
    PENDING: "badge-yellow",
    ACKNOWLEDGED: "badge-blue",
    IN_PROGRESS: "badge-blue",
    COMPLETED: "badge-green",
    CANCELLED: "badge-red",
};

export default function CPOEPage() {
    const [activeType, setActiveType] = useState<OrderType>("MEDICATION");
    const [selectedPatient, setSelectedPatient] = useState("John Mwesiga");
    const [priority, setPriority] = useState<"ROUTINE" | "URGENT" | "STAT">("ROUTINE");
    const [detail, setDetail] = useState("");
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = () => {
        setSubmitted(true);
        setTimeout(() => { setSubmitted(false); setDetail(""); }, 2500);
    };

    return (
        <div className="max-w-7xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-blue-600" /> CPOE — Physician Order Entry
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Computerized physician order entry with clinical decision support</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Order entry form */}
                <div className="lg:col-span-2 space-y-4">
                    {/* Patient selector */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">Patient</label>
                        <select
                            value={selectedPatient}
                            onChange={(e) => setSelectedPatient(e.target.value)}
                            className="w-full h-10 px-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none bg-gray-50"
                        >
                            {["John Mwesiga", "Grace Nakato", "Patrick Ssemanda", "Sarah Namutebi"].map(p => (
                                <option key={p}>{p}</option>
                            ))}
                        </select>
                    </div>

                    {/* Order type selector */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-3">Order Type</label>
                        <div className="grid grid-cols-5 gap-2">
                            {ORDER_TYPES.map((t) => {
                                const Icon = t.icon;
                                return (
                                    <button
                                        key={t.type}
                                        onClick={() => { setActiveType(t.type); setDetail(""); }}
                                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                                            activeType === t.type
                                                ? `${t.bg} border-current ${t.color}`
                                                : "bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100"
                                        }`}
                                    >
                                        <Icon className="h-5 w-5" />
                                        <span className="text-[10px] font-black uppercase tracking-wider">{t.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Order detail */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block">Order Details</label>

                        {/* Suggestions */}
                        <div className="flex flex-wrap gap-1.5">
                            {ORDER_SUGGESTIONS[activeType].map((s) => (
                                <button key={s} onClick={() => setDetail(s)}
                                    className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors border border-blue-100">
                                    {s}
                                </button>
                            ))}
                        </div>

                        <textarea
                            rows={3}
                            value={detail}
                            onChange={(e) => setDetail(e.target.value)}
                            placeholder={`Enter ${activeType.toLowerCase()} order details or select a suggestion above...`}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 text-sm text-gray-900 resize-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />

                        {/* Priority */}
                        <div>
                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-wider block mb-1.5">Priority</label>
                            <div className="flex gap-2">
                                {(["ROUTINE", "URGENT", "STAT"] as const).map((p) => (
                                    <button key={p} onClick={() => setPriority(p)}
                                        className={`flex-1 py-2 rounded-xl text-xs font-black border transition-colors ${
                                            priority === p
                                                ? p === "STAT" ? "bg-red-600 text-white border-red-600"
                                                    : p === "URGENT" ? "bg-amber-500 text-white border-amber-500"
                                                    : "bg-blue-600 text-white border-blue-600"
                                                : "bg-gray-50 text-gray-500 border-gray-100 hover:bg-gray-100"
                                        }`}>{p}</button>
                                ))}
                            </div>
                        </div>

                        <AnimatePresence>
                            {submitted && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                    className="flex items-center gap-2 p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-sm font-semibold">
                                    <CheckCircle2 className="h-4 w-4" /> Order submitted successfully
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            onClick={handleSubmit}
                            disabled={!detail.trim()}
                            className="w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            <Plus className="h-4 w-4" /> Submit Order
                        </button>
                    </div>
                </div>

                {/* Recent orders */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-4 py-3.5 border-b border-gray-50">
                        <h3 className="font-bold text-gray-900 text-sm">Recent Orders</h3>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {recentOrders.map((o) => {
                            const cfg = ORDER_TYPES.find(t => t.type === o.type);
                            const Icon = cfg?.icon || ClipboardList;
                            return (
                                <div key={o.id} className="p-4 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-2 mb-1.5">
                                        <div className={`p-1.5 rounded-lg ${cfg?.bg}`}>
                                            <Icon className={`h-3.5 w-3.5 ${cfg?.color}`} />
                                        </div>
                                        <span className="text-xs font-bold text-gray-600">{o.type}</span>
                                        <span className="ml-auto text-[10px] text-gray-400 flex items-center gap-0.5">
                                            <Clock className="h-3 w-3" /> {o.time}
                                        </span>
                                    </div>
                                    <p className="text-xs font-bold text-gray-900 mb-0.5">{o.patient}</p>
                                    <p className="text-xs text-gray-500 mb-2">{o.detail}</p>
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${STATUS_CLASS[o.status]}`}>
                                        {o.status.replace("_", " ")}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

"use client";

import { motion } from "framer-motion";
import { FlaskConical, Clock, CheckCircle2, AlertCircle, Droplets, TrendingUp, Search } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

const stats = [
    { label: "Pending Orders", value: "18", icon: Clock, color: "text-amber-600", bg: "bg-amber-50", trend: "+3 today" },
    { label: "Completed Today", value: "47", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", trend: "On target" },
    { label: "Critical Values", value: "3", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50", trend: "Needs attention" },
    { label: "Blood Bank Units", value: "124", icon: Droplets, color: "text-blue-600", bg: "bg-blue-50", trend: "All groups in stock" },
];

const pendingOrders = [
    { id: "LB001", patient: "John Mwesiga", test: "CBC, LFTs, RFTs", priority: "URGENT", orderedAt: "08:15", doctor: "Dr. Katongo" },
    { id: "LB002", patient: "Grace Nakato", test: "Blood Culture", priority: "STAT", orderedAt: "08:30", doctor: "Dr. Ssekibala" },
    { id: "LB003", patient: "Patrick Ssemanda", test: "HbA1c, Lipid Profile", priority: "ROUTINE", orderedAt: "09:00", doctor: "Dr. Namubiru" },
    { id: "LB004", patient: "Sarah Namutebi", test: "D-Dimer, Troponin", priority: "STAT", orderedAt: "09:10", doctor: "Dr. Bwire" },
    { id: "LB005", patient: "James Okello", test: "Urinalysis, Urea", priority: "ROUTINE", orderedAt: "09:45", doctor: "Dr. Katongo" },
];

const PRIORITY: Record<string, string> = {
    STAT: "badge-red",
    URGENT: "badge-yellow",
    ROUTINE: "badge-blue",
};

export default function LabDashboard() {
    const { profile } = useAuth();

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Lab Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Welcome, <span className="font-bold text-blue-600">{profile?.name}</span> &bull; {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}</p>
                </div>
                <Link href="/lab/orders" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" /> View All Orders
                </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
                            <div className={`inline-flex p-2.5 rounded-xl ${s.bg} mb-3`}>
                                <Icon className={`h-5 w-5 ${s.color}`} />
                            </div>
                            <p className="text-2xl font-black text-gray-900">{s.value}</p>
                            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
                            <p className="text-[10px] text-gray-400 mt-1">{s.trend}</p>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Pending orders */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                        <h2 className="font-bold text-gray-900">Pending Test Orders</h2>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 rounded-lg border-0 outline-none focus:ring-2 focus:ring-blue-500/20 w-40 transition-all" placeholder="Search..." />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {pendingOrders.map((o) => (
                            <div key={o.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-gray-400">#{o.id}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY[o.priority]}`}>{o.priority}</span>
                                    </div>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" /> {o.orderedAt}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-gray-900">{o.patient}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{o.test} &bull; <span className="text-gray-400">{o.doctor}</span></p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick panel */}
                <div className="space-y-4">
                    {/* Turnaround stats */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" /> Turnaround Times
                        </h3>
                        <div className="space-y-3">
                            {[
                                { test: "CBC", avg: "45 min", target: "60 min", pct: 75 },
                                { test: "Blood Culture", avg: "48 hrs", target: "48 hrs", pct: 100 },
                                { test: "Urinalysis", avg: "30 min", target: "30 min", pct: 100 },
                                { test: "LFTs/RFTs", avg: "90 min", target: "120 min", pct: 75 },
                            ].map((item) => (
                                <div key={item.test}>
                                    <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                                        <span>{item.test}</span>
                                        <span className="text-gray-400">{item.avg}</span>
                                    </div>
                                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full rounded-full ${item.pct >= 100 ? "bg-green-500" : "bg-blue-500"}`} style={{ width: `${item.pct}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Blood bank summary */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-red-500" /> Blood Bank
                        </h3>
                        <div className="grid grid-cols-4 gap-1.5">
                            {[
                                { group: "A+", units: 18 }, { group: "A-", units: 6 },
                                { group: "B+", units: 22 }, { group: "B-", units: 4 },
                                { group: "O+", units: 31 }, { group: "O-", units: 8 },
                                { group: "AB+", units: 12 }, { group: "AB-", units: 3 },
                            ].map((b) => (
                                <div key={b.group} className={`text-center p-1.5 rounded-lg ${b.units < 5 ? "bg-red-50 border border-red-100" : "bg-gray-50"}`}>
                                    <p className="text-xs font-black text-gray-900">{b.group}</p>
                                    <p className={`text-[10px] font-bold ${b.units < 5 ? "text-red-600" : "text-gray-500"}`}>{b.units}u</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

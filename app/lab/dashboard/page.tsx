"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { FlaskConical, Clock, CheckCircle2, AlertCircle, Droplets, TrendingUp, Search } from "lucide-react";
import Link from "next/link";

interface LabOrder {
    id: string;
    patientName: string;
    tests: string;
    priority: string;
    status: string;
    orderedAt: string;
    orderedBy: string;
}

interface BloodUnit {
    id: string;
    bloodGroup: string;
    units: number;
}

const PRIORITY: Record<string, string> = {
    STAT:    "badge-red",
    URGENT:  "badge-yellow",
    ROUTINE: "badge-blue",
};

export default function LabDashboard() {
    const { profile } = useAuth();
    const [orders, setOrders]     = useState<LabOrder[]>([]);
    const [blood, setBlood]       = useState<BloodUnit[]>([]);
    const [search, setSearch]     = useState("");
    const [loading, setLoading]   = useState(true);

    useEffect(() => {
        async function load() {
            try {
                const [orderSnap, bloodSnap] = await Promise.all([
                    getDocs(query(collection(db, "labOrders"), orderBy("orderedAt", "desc"))),
                    getDocs(collection(db, "bloodBank")),
                ]);
                setOrders(orderSnap.docs.map(d => ({ id: d.id, ...d.data() } as LabOrder)));
                setBlood(bloodSnap.docs.map(d => ({ id: d.id, ...d.data() } as BloodUnit)));
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        }
        load();
    }, []);

    const pending   = orders.filter(o => o.status === "PENDING");
    const completed = orders.filter(o => o.status === "COMPLETED");
    const critical  = orders.filter(o => o.priority === "STAT");
    const totalBlood = blood.reduce((sum, b) => sum + (b.units ?? 0), 0);

    const filtered = pending.filter(o =>
        !search || o.patientName?.toLowerCase().includes(search.toLowerCase()) || o.tests?.toLowerCase().includes(search.toLowerCase())
    );

    const stats = [
        { label: "Pending Orders",   value: String(pending.length),   icon: Clock,        color: "text-amber-600", bg: "bg-amber-50", trend: `${pending.length} awaiting` },
        { label: "Completed Today",  value: String(completed.length), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50", trend: "On target" },
        { label: "STAT Orders",      value: String(critical.length),  icon: AlertCircle,  color: "text-red-600",   bg: "bg-red-50",   trend: critical.length > 0 ? "Needs attention" : "All clear" },
        { label: "Blood Bank Units", value: String(totalBlood),       icon: Droplets,     color: "text-blue-600",  bg: "bg-blue-50",  trend: `${blood.length} blood groups` },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Lab Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Welcome, <span className="font-bold text-blue-600">{profile?.name}</span> &bull;{" "}
                        {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}
                    </p>
                </div>
                <Link href="/lab/orders" className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold transition-colors flex items-center gap-2">
                    <FlaskConical className="h-4 w-4" /> View All Orders
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
                            <div className={`inline-flex p-2.5 rounded-xl ${s.bg} mb-3`}>
                                <Icon className={`h-5 w-5 ${s.color}`} />
                            </div>
                            <p className="text-2xl font-black text-gray-900">{loading ? "—" : s.value}</p>
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
                            <input
                                className="pl-8 pr-3 py-1.5 text-xs bg-gray-50 rounded-lg border-0 outline-none focus:ring-2 focus:ring-blue-500/20 w-40 transition-all"
                                placeholder="Search…"
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {loading && <div className="px-5 py-8 text-center text-sm text-gray-400">Loading orders…</div>}
                        {!loading && filtered.length === 0 && (
                            <div className="px-5 py-8 text-center text-sm text-gray-400">No pending orders</div>
                        )}
                        {filtered.map((o) => (
                            <div key={o.id} className="px-5 py-3.5 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center justify-between mb-1">
                                    <div className="flex items-center gap-2">
                                        <span className="text-[10px] font-black text-gray-400">#{o.id.slice(-6).toUpperCase()}</span>
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY[o.priority] ?? "badge-blue"}`}>{o.priority}</span>
                                    </div>
                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {o.orderedAt ? new Date(o.orderedAt).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}
                                    </span>
                                </div>
                                <p className="text-sm font-bold text-gray-900">{o.patientName}</p>
                                <p className="text-xs text-gray-500 mt-0.5">{o.tests} &bull; <span className="text-gray-400">{o.orderedBy}</span></p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right panel */}
                <div className="space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-blue-600" /> Order Summary
                        </h3>
                        <div className="space-y-3">
                            {[
                                { label: "Pending",   count: pending.length,   color: "bg-amber-500" },
                                { label: "Completed", count: completed.length, color: "bg-green-500" },
                                { label: "STAT",      count: critical.length,  color: "bg-red-500"   },
                            ].map((item) => {
                                const total = orders.length || 1;
                                return (
                                    <div key={item.label}>
                                        <div className="flex justify-between text-xs font-semibold text-gray-600 mb-1">
                                            <span>{item.label}</span>
                                            <span className="text-gray-400">{item.count}</span>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div className={`h-full rounded-full ${item.color}`} style={{ width: `${Math.round((item.count / total) * 100)}%` }} />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
                            <Droplets className="h-4 w-4 text-red-500" /> Blood Bank
                        </h3>
                        {!loading && blood.length === 0 && (
                            <p className="text-xs text-gray-400">No blood bank records</p>
                        )}
                        <div className="grid grid-cols-4 gap-1.5">
                            {blood.map((b) => (
                                <div key={b.id} className={`text-center p-1.5 rounded-lg ${(b.units ?? 0) < 5 ? "bg-red-50 border border-red-100" : "bg-gray-50"}`}>
                                    <p className="text-xs font-black text-gray-900">{b.bloodGroup}</p>
                                    <p className={`text-[10px] font-bold ${(b.units ?? 0) < 5 ? "text-red-600" : "text-gray-500"}`}>{b.units}u</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

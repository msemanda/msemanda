"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import { BedDouble, UserPlus, LogOut, ArrowRightLeft, Activity } from "lucide-react";
import Link from "next/link";

export default function IpdDashboard() {
    const [stats, setStats] = useState({ admitted: 0, available: 0, discharged: 0, transferred: 0, totalBeds: 60 });
    const [recent, setRecent] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetch = async () => {
            try {
                const snap = await getDocs(collection(db, "ipdAdmissions"));
                const all = snap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                const admitted = all.filter(a => a.status === "ADMITTED").length;
                const discharged = all.filter(a => a.status === "DISCHARGED").length;
                const transferred = all.filter(a => a.status === "TRANSFERRED").length;
                setStats({ admitted, available: Math.max(0, 60 - admitted), discharged, transferred, totalBeds: 60 });
                setRecent(all.filter(a => a.status === "ADMITTED").slice(0, 8));
            } catch(e) { console.error(e); }
            finally { setLoading(false); }
        };
        fetch();
    }, []);

    const occupancy = Math.round((stats.admitted / stats.totalBeds) * 100);

    const cards = [
        { label: "Currently Admitted", value: stats.admitted, icon: BedDouble, color: "bg-blue-50 text-blue-600", border: "border-blue-100", href: "/ipd/admissions" },
        { label: "Available Beds", value: stats.available, icon: BedDouble, color: "bg-green-50 text-green-600", border: "border-green-100", href: "/ipd/beds" },
        { label: "Discharged Today", value: stats.discharged, icon: LogOut, color: "bg-gray-50 text-gray-500", border: "border-gray-100", href: "/ipd/discharge" },
        { label: "Transferred", value: stats.transferred, icon: ArrowRightLeft, color: "bg-purple-50 text-purple-600", border: "border-purple-100", href: "/ipd/transfer" },
    ];

    const WARD_BADGE: Record<string,string> = {
        General: "bg-blue-50 text-blue-700 border-blue-100",
        ICU: "bg-red-50 text-red-700 border-red-100",
        Pediatrics: "bg-green-50 text-green-700 border-green-100",
        Maternity: "bg-pink-50 text-pink-700 border-pink-100",
        Surgery: "bg-purple-50 text-purple-700 border-purple-100",
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">IP Management & ADT</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Inpatient admissions, discharge and transfers</p>
                </div>
                <Link href="/ipd/admissions" className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                    <UserPlus className="h-4 w-4" /> Admit Patient
                </Link>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((c, i) => {
                    const Icon = c.icon;
                    return (
                        <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                            className={`bg-white rounded-2xl border ${c.border} shadow-sm p-5`}>
                            <div className={`h-10 w-10 rounded-xl ${c.color} flex items-center justify-center mb-3`}>
                                <Icon className="h-5 w-5" />
                            </div>
                            <p className="text-2xl font-black text-gray-900">{loading ? "—" : c.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5 font-medium">{c.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            {/* Occupancy bar */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-black text-gray-900 flex items-center gap-2"><Activity className="h-4 w-4 text-blue-600"/>Bed Occupancy</p>
                    <span className="text-sm font-black text-gray-900">{loading ? "—" : occupancy}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${occupancy}%` }} transition={{ delay: 0.3, duration: 0.8 }}
                        className={`h-full rounded-full ${occupancy > 85 ? "bg-red-500" : occupancy > 65 ? "bg-amber-500" : "bg-blue-500"}`}/>
                </div>
                <p className="text-xs text-gray-400 mt-2">{stats.admitted} of {stats.totalBeds} beds occupied</p>
            </div>

            {/* Current inpatients */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                    <p className="text-sm font-black text-gray-900">Current Inpatients</p>
                    <Link href="/ipd/admissions" className="text-xs font-bold text-blue-600 hover:underline">Manage all</Link>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-14"><div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full"/></div>
                ) : recent.length === 0 ? (
                    <div className="py-14 text-center">
                        <BedDouble className="h-10 w-10 text-gray-200 mx-auto mb-3"/>
                        <p className="text-sm font-black text-gray-900">No inpatients</p>
                        <p className="text-xs text-gray-400 mt-1">Admitted patients appear here.</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>{["Patient", "Ward", "Bed", "Doctor", "Admitted On", "Days"].map(h => (
                                <th key={h} className="px-4 py-3 text-left text-[10px] font-black text-gray-400 uppercase tracking-wider">{h}</th>
                            ))}</tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {recent.map(p => {
                                const days = p.admittedAt?.seconds ? Math.floor((Date.now()/1000 - p.admittedAt.seconds) / 86400) : 0;
                                return (
                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <p className="text-sm font-bold text-gray-900">{p.patientName}</p>
                                            <p className="text-xs text-gray-400">{p.patientEmail}</p>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${WARD_BADGE[p.ward] || "bg-gray-50 text-gray-600 border-gray-100"}`}>{p.ward || "—"}</span>
                                        </td>
                                        <td className="px-4 py-3 text-sm font-bold text-gray-700">{p.bedNumber || "—"}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{p.doctorName || "—"}</td>
                                        <td className="px-4 py-3 text-xs text-gray-500">{p.admittedAt?.seconds ? new Date(p.admittedAt.seconds*1000).toLocaleDateString() : "—"}</td>
                                        <td className="px-4 py-3 text-xs font-bold text-gray-700">{days}d</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

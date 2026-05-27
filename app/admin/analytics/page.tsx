"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import {
    Users, CreditCard, BedDouble, FlaskConical, AlertOctagon,
    Activity, TrendingUp, RefreshCw, Calendar, Stethoscope
} from "lucide-react";

interface Stats {
    totalPatients: number;
    totalUsers: number;
    totalRevenue: number;
    pendingFees: number;
    confirmedFees: number;
    admissions: number;
    appointments: number;
    labOrders: number;
    incidents: number;
    infections: number;
}

export default function AdminAnalyticsPage() {
    const [stats, setStats] = useState<Stats>({
        totalPatients: 0, totalUsers: 0, totalRevenue: 0, pendingFees: 0,
        confirmedFees: 0, admissions: 0, appointments: 0, labOrders: 0,
        incidents: 0, infections: 0,
    });
    const [loading, setLoading] = useState(true);
    const [transactions, setTransactions] = useState<any[]>([]);

    useEffect(() => { fetchData(); }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [
                usersSnap, feesSnap, admSnap, apptSnap,
                labSnap, incSnap, infSnap, txSnap,
            ] = await Promise.all([
                getDocs(collection(db, "users")),
                getDocs(collection(db, "consultationFees")),
                getDocs(collection(db, "ipdAdmissions")),
                getDocs(collection(db, "appointments")),
                getDocs(collection(db, "labOrders")),
                getDocs(collection(db, "incidents")),
                getDocs(collection(db, "infectionIncidents")),
                getDocs(collection(db, "transactions")),
            ]);

            const users = usersSnap.docs.map(d => ({ ...d.data() })) as any[];
            const fees = feesSnap.docs.map(d => ({ ...d.data() })) as any[];
            const txList = txSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

            const revenue = txList.filter(t => t.type === "income").reduce((s, t) => s + (t.amount || 0), 0);
            const feeRevenue = fees.filter(f => f.status === "PAID").reduce((s, f) => s + (f.amount || 0), 0);

            setStats({
                totalUsers: users.length,
                totalPatients: users.filter(u => u.role === "PATIENT").length,
                totalRevenue: revenue + feeRevenue,
                pendingFees: fees.filter(f => f.status === "PENDING" || f.status === "PATIENT_PAID").length,
                confirmedFees: fees.filter(f => f.status === "PAID").length,
                admissions: admSnap.docs.filter(d => d.data().status === "ADMITTED").length,
                appointments: apptSnap.size,
                labOrders: labSnap.size,
                incidents: incSnap.size,
                infections: infSnap.docs.filter(d => d.data().status === "active").length,
            });
            setTransactions(txList.slice(0, 8));
        } catch(e) { console.error(e); }
        finally { setLoading(false); }
    };

    const cards = [
        { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-blue-50 text-blue-600", border: "border-blue-100" },
        { label: "Registered Patients", value: stats.totalPatients, icon: Stethoscope, color: "bg-indigo-50 text-indigo-600", border: "border-indigo-100" },
        { label: "Current Inpatients", value: stats.admissions, icon: BedDouble, color: "bg-teal-50 text-teal-600", border: "border-teal-100" },
        { label: "Total Appointments", value: stats.appointments, icon: Calendar, color: "bg-purple-50 text-purple-600", border: "border-purple-100" },
        { label: "Lab Orders", value: stats.labOrders, icon: FlaskConical, color: "bg-cyan-50 text-cyan-600", border: "border-cyan-100" },
        { label: "Total Revenue (UGX)", value: stats.totalRevenue.toLocaleString(), icon: TrendingUp, color: "bg-green-50 text-green-600", border: "border-green-100" },
        { label: "Pending Payments", value: stats.pendingFees, icon: CreditCard, color: "bg-amber-50 text-amber-600", border: "border-amber-100" },
        { label: "Active Infections", value: stats.infections, icon: Activity, color: "bg-red-50 text-red-500", border: "border-red-100" },
        { label: "Incidents Reported", value: stats.incidents, icon: AlertOctagon, color: "bg-orange-50 text-orange-500", border: "border-orange-100" },
    ];

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Analytics & MIS Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Hospital-wide management information and key metrics</p>
                </div>
                <button onClick={fetchData} className="h-10 w-10 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {cards.map((c, i) => {
                    const Icon = c.icon;
                    return (
                        <motion.div key={c.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className={`bg-white rounded-2xl border ${c.border} shadow-sm p-5`}>
                            <div className={`h-9 w-9 rounded-xl ${c.color} flex items-center justify-center mb-3`}>
                                <Icon className="h-4 w-4" />
                            </div>
                            <p className="text-xl font-black text-gray-900">{loading ? "—" : c.value}</p>
                            <p className="text-xs text-gray-500 mt-0.5 font-medium">{c.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-2 gap-6">
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        <p className="text-sm font-black text-gray-900">Fee Payment Summary</p>
                    </div>
                    <div className="p-5 space-y-4">
                        {[
                            { label: "Confirmed Payments", value: stats.confirmedFees, color: "bg-green-500", bg: "bg-green-50 text-green-700" },
                            { label: "Pending / Unconfirmed", value: stats.pendingFees, color: "bg-amber-500", bg: "bg-amber-50 text-amber-700" },
                        ].map(item => {
                            const total = stats.confirmedFees + stats.pendingFees;
                            const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
                            return (
                                <div key={item.label}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <p className="text-xs font-bold text-gray-700">{item.label}</p>
                                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${item.bg}`}>{loading ? "—" : item.value}</span>
                                    </div>
                                    <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div className={`h-full ${item.color} rounded-full transition-all duration-700`} style={{ width: loading ? "0%" : `${pct}%` }}/>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-50">
                        <p className="text-sm font-black text-gray-900">Recent Transactions</p>
                    </div>
                    {loading ? (
                        <div className="flex items-center justify-center py-14"><div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full"/></div>
                    ) : transactions.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-14">No transactions yet</p>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {transactions.map(tx => (
                                <div key={tx.id} className="px-5 py-3 flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-bold text-gray-900 truncate max-w-[180px]">{tx.description}</p>
                                        <p className="text-[10px] text-gray-400">{tx.category}</p>
                                    </div>
                                    <p className={`text-xs font-black ${tx.type === "income" ? "text-green-600" : "text-red-500"}`}>
                                        {tx.type === "income" ? "+" : "-"}UGX {(tx.amount || 0).toLocaleString()}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

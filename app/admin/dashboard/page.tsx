"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import {
    Users,
    Stethoscope,
    Calendar,
    CreditCard,
    TrendingUp,
    Search,
    Bell,
    Activity,
    ArrowRight
} from "lucide-react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

export default function AdminDashboard() {
    const { profile } = useAuth();
    const [stats, setStats] = useState([
        { name: "Total Patients", value: "...", icon: Users, color: "text-cyan-600", bg: "bg-cyan-50" },
        { name: "Verified Doctors", value: "...", icon: Stethoscope, color: "text-teal-600", bg: "bg-teal-50" },
        { name: "Consultations", value: "...", icon: Calendar, color: "text-sky-600", bg: "bg-sky-50" },
        { name: "Wallet Revenue", value: "...", icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-50" },
    ]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        setLoading(true);
        try {
            // Patients
            const patientsQ = query(collection(db, "users"), where("role", "==", "PATIENT"));
            const patientsSnapshot = await getDocs(patientsQ);

            // Verified Doctors
            const doctorsQ = query(collection(db, "users"), where("role", "==", "DOCTOR"), where("approved", "==", true));
            const doctorsSnapshot = await getDocs(doctorsQ);

            // Consultations (patients where status is "true")
            const consultQ = query(collection(db, "users"), where("role", "==", "PATIENT"), where("status", "==", "true"));
            const consultSnapshot = await getDocs(consultQ);

            // Revenue (sum of bills netAmount)
            const billsSnapshot = await getDocs(collection(db, "bills"));
            let totalRevenue = 0;
            billsSnapshot.forEach(doc => {
                totalRevenue += doc.data().netAmount || 0;
            });

            setStats([
                { name: "Total Patients", value: patientsSnapshot.size.toString(), icon: Users, color: "text-cyan-600", bg: "bg-cyan-50" },
                { name: "Verified Doctors", value: doctorsSnapshot.size.toString(), icon: Stethoscope, color: "text-teal-600", bg: "bg-teal-50" },
                { name: "Consultations", value: consultSnapshot.size.toString(), icon: Calendar, color: "text-sky-600", bg: "bg-sky-50" },
                { name: "Wallet Revenue", value: `$${totalRevenue.toLocaleString()}`, icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-50" },
            ]);
        } catch (error) {
            console.error("Error fetching admin stats:", error);
        } finally {
            setLoading(false);
        }
    };

    const [recentPatients, setRecentPatients] = useState<any[]>([]);

    useEffect(() => {
        const fetchRecentActivity = async () => {
            try {
                const q = query(
                    collection(db, "users"),
                    where("role", "==", "PATIENT"),
                    // We could order by createdAt if it existed on all, but let's just get a few for now
                    // In a real app we'd use: orderBy("createdAt", "desc"), limit(5)
                );
                const snapshot = await getDocs(q);
                // Sort by createdAt manually if needed, or just take first few
                const recent = snapshot.docs
                    .map(doc => ({ ...doc.data(), uid: doc.id }))
                    .sort((a: any, b: any) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
                    .slice(0, 3);
                setRecentPatients(recent);
            } catch (error) {
                console.error("Error fetching recent activity:", error);
            }
        };
        fetchRecentActivity();
    }, []);

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-slate-900 tracking-tight">Admin Dashboard</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Rhona Medical Center — system overview</p>
                </div>
                <div className="flex items-center gap-2">
                    <button className="h-9 w-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-slate-400 hover:text-cyan-600 transition-all shadow-sm">
                        <Search className="h-4 w-4" />
                    </button>
                    <button className="h-9 w-9 rounded-xl bg-white border border-gray-200 flex items-center justify-center text-slate-400 hover:text-cyan-600 transition-all shadow-sm relative">
                        <Bell className="h-4 w-4" />
                        <span className="absolute top-2 right-2 h-1.5 w-1.5 bg-cyan-500 rounded-full" />
                    </button>
                    <div className="h-9 px-4 rounded-xl bg-slate-900 text-cyan-400 font-black text-[10px] uppercase tracking-wider flex items-center gap-2 shadow-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" /> Live
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.name}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.08 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 group hover:border-cyan-100 transition-all cursor-default"
                        >
                            <div className="flex flex-col gap-3">
                                <div className={cn(stat.bg, stat.color, "h-9 w-9 rounded-xl flex items-center justify-center shadow-sm shrink-0")}>
                                    <Icon className="h-4.5 w-4.5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">{stat.name}</p>
                                    <p className="text-xl font-black text-slate-900">{stat.value}</p>
                                </div>
                                <div className="flex items-center text-[10px] font-bold text-teal-600 bg-teal-50 w-fit px-2 py-1 rounded-lg">
                                    <TrendingUp className="h-2.5 w-2.5 mr-1" /> Stable
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-black text-gray-900">Recent Network Activity</h2>
                        <button className="text-xs font-bold text-cyan-600 hover:underline">View all</button>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-4 space-y-3">
                            {recentPatients.length === 0 ? (
                                <p className="text-center text-gray-400 py-8 text-xs font-bold uppercase tracking-widest">No Recent Activity</p>
                            ) : (
                                recentPatients.map((p, i) => (
                                    <div key={p.uid} className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50 transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-gray-100 flex items-center justify-center font-black text-cyan-600 text-xs shadow-sm shrink-0">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-gray-900 truncate">{p.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold truncate">ID: {p.uid.substring(0, 12)}</p>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-bold px-2.5 py-1 rounded-full shrink-0 ml-2",
                                            p.status === "true" ? "bg-teal-50 text-teal-700" : "bg-cyan-50 text-cyan-700"
                                        )}>
                                            {p.status === "true" ? "Complete" : "Pending"}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h2 className="text-sm font-black text-gray-900">System Performance</h2>
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-6 opacity-10">
                            <Activity className="h-24 w-24" />
                        </div>
                        <div className="relative z-10 flex flex-col gap-4">
                            <div>
                                <h3 className="text-base font-black mb-0.5">Live Nodes</h3>
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Central Processing</p>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                        <span>Server Load</span>
                                        <span>42%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: "42%" }} className="h-full bg-cyan-400" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                                        <span>Database Latency</span>
                                        <span>12ms</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: "15%" }} className="h-full bg-teal-400" />
                                    </div>
                                </div>
                                <Button className="w-full bg-white text-gray-900 hover:bg-cyan-50 h-10 rounded-xl shadow-md text-xs font-bold">
                                    Open Health Console
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

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
        <div className="space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-5xl font-black text-slate-900 tracking-tighter leading-none">Intelligence <span className="text-gradient-cyan">Ledger.</span></h1>
                    <p className="text-slate-500 font-medium italic">Autonomous monitoring of the Rhona Medical Center network.</p>
                </div>
                <div className="flex items-center gap-4">
                    <button className="h-14 w-14 rounded-[20px] bg-white/40 backdrop-blur-md border border-white flex items-center justify-center text-slate-400 hover:text-cyan-600 hover:border-cyan-100 transition-all shadow-premium group">
                        <Search className="h-6 w-6 group-hover:scale-110 transition-transform" />
                    </button>
                    <button className="h-14 w-14 rounded-[20px] bg-white/40 backdrop-blur-md border border-white flex items-center justify-center text-slate-400 hover:text-cyan-600 hover:border-cyan-100 transition-all shadow-premium relative group">
                        <Bell className="h-6 w-6 group-hover:rotate-12 transition-transform" />
                        <span className="absolute top-4 right-4 h-2.5 w-2.5 bg-cyan-500 rounded-full border-2 border-white shadow-[0_0_8px_rgba(6,182,212,0.5)]" />
                    </button>
                    <div className="h-14 px-8 rounded-[20px] bg-slate-900 text-cyan-400 font-black text-[11px] uppercase tracking-[0.2em] flex items-center shadow-2xl shadow-slate-900/40 border border-slate-800">
                        <div className="w-2 h-2 rounded-full bg-cyan-400 mr-3 animate-pulse shadow-[0_0_10px_rgba(34,211,238,1)]" /> Operational Live
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                        <motion.div
                            key={stat.name}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.1 }}
                            whileHover={{ y: -5, scale: 1.02 }}
                            className="bg-white/70 backdrop-blur-xl p-8 rounded-[40px] shadow-premium border border-white/60 group hover:border-cyan-200 transition-all cursor-default relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.1] transition-all duration-700 group-hover:scale-110">
                                <Icon className="h-28 w-28 text-cyan-900" />
                            </div>
                            <div className="flex flex-col space-y-4">
                                <div className={cn(stat.bg, stat.color, "h-14 w-14 rounded-2xl flex items-center justify-center group-hover:rotate-12 transition-transform shadow-sm")}>
                                    <Icon className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-3">{stat.name}</p>
                                    <p className="text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                                </div>
                                <div className="flex items-center text-[10px] font-black text-teal-600 bg-teal-50/50 w-fit px-3 py-1.5 rounded-xl border border-teal-100/30">
                                    <TrendingUp className="h-3 w-3 mr-1.5" /> SYSTEM STABLE
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mt-12">
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-gray-900">Recent Network Activity</h2>
                        <button className="text-xs font-black text-cyan-600 uppercase tracking-widest hover:underline">View Ledger</button>
                    </div>
                    <div className="bg-glass rounded-[40px] border border-white shadow-premium overflow-hidden font-medium">
                        <div className="p-8 space-y-6">
                            {recentPatients.length === 0 ? (
                                <p className="text-center text-gray-400 py-10 font-bold uppercase tracking-widest text-xs">No Recent Activity Detected</p>
                            ) : (
                                recentPatients.map((p, i) => (
                                    <div key={p.uid} className="flex items-center justify-between p-4 rounded-3xl hover:bg-white/50 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-cyan-600 text-xs shadow-sm">
                                                {p.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-gray-900">{p.name}</p>
                                                <p className="text-xs text-gray-400 uppercase tracking-tighter font-bold">Identity Node: {p.uid.substring(0, 12)}</p>
                                            </div>
                                        </div>
                                        <span className={cn(
                                            "text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest",
                                            p.status === "true" ? "bg-teal-50 text-teal-700" : "bg-cyan-50 text-cyan-700"
                                        )}>
                                            {p.status === "true" ? "Session Complete" : "Awaiting Validation"}
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <h2 className="text-xl font-black text-gray-900">System Performance</h2>
                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-[40px] p-8 text-white shadow-2xl relative overflow-hidden h-[400px]">
                        <div className="absolute top-0 right-0 p-10 opacity-10">
                            <Activity className="h-40 w-40" />
                        </div>
                        <div className="relative z-10 flex flex-col h-full">
                            <h3 className="text-2xl font-black mb-2">Live Nodes</h3>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-10">Central Processing</p>

                            <div className="mt-auto space-y-6">
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span>Server Load</span>
                                        <span>42%</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: "42%" }} className="h-full bg-cyan-400" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
                                        <span>Database Latency</span>
                                        <span>12ms</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: "15%" }} className="h-full bg-teal-400" />
                                    </div>
                                </div>
                                <Button className="w-full bg-white text-gray-900 hover:bg-cyan-50 h-14 rounded-2xl shadow-xl mt-4">
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

"use client";

import { useAuth } from "@/context/AuthContext";
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

    const stats = [
        { name: "Total Patients", value: "128", icon: Users, color: "text-cyan-600", bg: "bg-cyan-50" },
        { name: "Verified Doctors", value: "24", icon: Stethoscope, color: "text-teal-600", bg: "bg-teal-50" },
        { name: "Consultations", value: "56", icon: Calendar, color: "text-sky-600", bg: "bg-sky-50" },
        { name: "Wallet Revenue", value: "$18,240", icon: CreditCard, color: "text-indigo-600", bg: "bg-indigo-50" },
    ];

    return (
        <div className="space-y-12 pb-20">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">System <span className="text-gradient-cyan">Intelligence</span></h1>
                    <p className="text-gray-500 font-medium">Monitoring the core heartbeat of the E-Health network.</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-cyan-600 hover:border-cyan-100 transition-all shadow-sm">
                        <Search className="h-5 w-5" />
                    </button>
                    <button className="h-12 w-12 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-gray-400 hover:text-cyan-600 hover:border-cyan-100 transition-all shadow-sm relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-3 right-3 h-2 w-2 bg-red-500 rounded-full border-2 border-white" />
                    </button>
                    <div className="h-12 px-6 rounded-2xl bg-cyan-600 text-white font-black text-sm flex items-center shadow-lg shadow-cyan-600/20 cursor-pointer hover:bg-cyan-700 transition-all">
                        Operational Live
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
                            className="bg-white p-8 rounded-[32px] shadow-premium border border-gray-100 group hover:border-cyan-200 transition-all cursor-default relative overflow-hidden"
                        >
                            <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                <Icon className="h-24 w-24 text-cyan-900" />
                            </div>
                            <div className="flex flex-col space-y-4">
                                <div className={`${stat.bg} ${stat.color} h-14 w-14 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                                    <Icon className="h-7 w-7" />
                                </div>
                                <div>
                                    <p className="text-[11px] font-black text-gray-600 uppercase tracking-widest leading-none mb-2">{stat.name}</p>
                                    <p className="text-3xl font-black text-gray-900 tracking-tight">{stat.value}</p>
                                </div>
                                <div className="flex items-center text-[10px] font-bold text-teal-600 bg-teal-50 w-fit px-2 py-1 rounded-lg">
                                    <TrendingUp className="h-3 w-3 mr-1" /> +12% vs last month
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
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex items-center justify-between p-4 rounded-3xl hover:bg-white/50 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="h-12 w-12 rounded-2xl bg-gray-100 flex items-center justify-center font-black text-gray-400 text-xs">
                                            {String.fromCharCode(65 + i)}P
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-900">New Patient Registration</p>
                                            <p className="text-xs text-gray-400">UUID: patient_0x42384{i}</p>
                                        </div>
                                    </div>
                                    <span className="text-[10px] font-black bg-cyan-50 text-cyan-700 px-3 py-1.5 rounded-full uppercase tracking-widest">Awaiting Validation</span>
                                </div>
                            ))}
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

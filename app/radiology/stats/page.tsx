"use client";

import { motion } from "framer-motion";
import { BarChart3 } from "lucide-react";

const stats = [
    { label: "X-Ray", count: 142, color: "bg-blue-500", pct: 71 },
    { label: "Ultrasound", count: 38, color: "bg-teal-500", pct: 19 },
    { label: "CT Scan", count: 14, color: "bg-purple-500", pct: 7 },
    { label: "MRI", count: 6, color: "bg-indigo-500", pct: 3 },
];
const monthly = [
    { month: "Jan", count: 178 }, { month: "Feb", count: 195 }, { month: "Mar", count: 210 },
    { month: "Apr", count: 188 }, { month: "May", count: 200 },
];
const turnaround = [
    { modality: "X-Ray", avg: "22 min" }, { modality: "Ultrasound", avg: "35 min" },
    { modality: "CT Scan", avg: "55 min" }, { modality: "MRI", avg: "75 min" },
];

const max = Math.max(...monthly.map(m => m.count));

export default function RadiologyStatsPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-violet-600" /> Radiology Statistics
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Imaging volume and performance metrics</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[{ label: "This Month", value: "200", sub: "studies" }, { label: "Pending", value: "4", sub: "orders" }, { label: "Avg TAT", value: "38 min", sub: "turnaround" }, { label: "Reports Due", value: "2", sub: "today" }].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                        <p className="text-3xl font-black text-gray-900">{s.value}</p>
                        <p className="text-xs text-gray-400 mt-1">{s.label} {s.sub}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-black text-gray-900 mb-4">Studies by Modality (MTD)</h2>
                    <div className="space-y-3">
                        {stats.map(s => (
                            <div key={s.label}>
                                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                                    <span>{s.label}</span><span>{s.count}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ delay: 0.3, duration: 0.6 }}
                                        className={`h-full rounded-full ${s.color}`} />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-black text-gray-900 mb-4">Monthly Volume</h2>
                    <div className="flex items-end gap-3 h-32">
                        {monthly.map(m => (
                            <div key={m.month} className="flex-1 flex flex-col items-center gap-1">
                                <span className="text-[10px] font-bold text-gray-500">{m.count}</span>
                                <motion.div initial={{ height: 0 }} animate={{ height: `${(m.count / max) * 100}%` }} transition={{ delay: 0.4, duration: 0.5 }}
                                    className="w-full bg-violet-500 rounded-t-lg min-h-[4px]" />
                                <span className="text-[10px] text-gray-400">{m.month}</span>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:col-span-2">
                    <h2 className="text-sm font-black text-gray-900 mb-4">Average Turnaround Time</h2>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {turnaround.map(t => (
                            <div key={t.modality} className="bg-gray-50 rounded-xl p-4 text-center">
                                <p className="text-xl font-black text-violet-600">{t.avg}</p>
                                <p className="text-xs text-gray-500 mt-1">{t.modality}</p>
                            </div>
                        ))}
                    </div>
                </motion.div>
            </div>
        </div>
    );
}

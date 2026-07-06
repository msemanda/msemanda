"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fmtDate, tsMs } from "@/lib/ts";
import { motion } from "framer-motion";
import { Eye, FileText, PackageCheck } from "lucide-react";
import Link from "next/link";

export default function OpticalDashboard() {
    const [stats, setStats] = useState({ examsToday: 0, totalPrescriptions: 0, awaitingPickup: 0 });
    const [recentExams, setRecentExams] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const [examsSnap, prescriptionsSnap, ordersSnap] = await Promise.all([
                    getDocs(collection(db, "opticalExams")),
                    getDocs(collection(db, "opticalPrescriptions")),
                    getDocs(collection(db, "opticalOrders")),
                ]);

                const exams = examsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];
                const orders = ordersSnap.docs.map(d => ({ id: d.id, ...d.data() })) as any[];

                const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);
                setStats({
                    examsToday: exams.filter(e => tsMs(e.createdAt) >= startOfToday.getTime()).length,
                    totalPrescriptions: prescriptionsSnap.docs.length,
                    awaitingPickup: orders.filter(o => o.status === "ready").length,
                });
                setRecentExams(exams.sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt)).slice(0, 8));
            } catch (e) { console.error(e); }
            finally { setLoading(false); }
        };
        load();
    }, []);

    const cards = [
        { label: "Exams Today", value: stats.examsToday, icon: Eye, color: "bg-cyan-50 text-cyan-600", border: "border-cyan-100", href: "/optical/exams" },
        { label: "Total Prescriptions", value: stats.totalPrescriptions, icon: FileText, color: "bg-blue-50 text-blue-600", border: "border-blue-100", href: "/optical/prescriptions" },
        { label: "Orders Awaiting Pickup", value: stats.awaitingPickup, icon: PackageCheck, color: "bg-amber-50 text-amber-600", border: "border-amber-100", href: "/optical/dispensing" },
    ];

    return (
        <div className="space-y-6 pb-10">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Optical Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Eye exams, prescriptions, and dispensing overview</p>
                </div>
                <Link href="/optical/exams" className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                    <Eye className="h-4 w-4" /> New Exam
                </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center justify-between">
                    <p className="text-sm font-black text-gray-900">Recent Exams</p>
                    <Link href="/optical/exams" className="text-xs font-bold text-blue-600 hover:underline">View all</Link>
                </div>
                {loading ? (
                    <div className="flex items-center justify-center py-14"><div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full" /></div>
                ) : recentExams.length === 0 ? (
                    <div className="py-14 text-center">
                        <Eye className="h-10 w-10 text-gray-200 mx-auto mb-3" />
                        <p className="text-sm font-black text-gray-900">No exams recorded</p>
                        <p className="text-xs text-gray-400 mt-1">Recorded eye exams will appear here.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {recentExams.map(e => (
                            <div key={e.id} className="px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-gray-50/50 transition-colors">
                                <div>
                                    <p className="text-sm font-bold text-gray-900">{e.patientName}</p>
                                    <p className="text-xs text-gray-400">{e.diagnosis || "No diagnosis recorded"}</p>
                                </div>
                                <span className="text-[10px] font-bold text-gray-400">{fmtDate(e.createdAt)}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

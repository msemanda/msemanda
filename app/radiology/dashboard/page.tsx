"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { toDate, tsMs } from "@/lib/ts";
import { motion } from "framer-motion";
import { Scan, Clock, CheckCircle2, AlertCircle, FileImage } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { SkeletonStatCard, SkeletonRow } from "@/components/ui/Skeleton";

interface RadiologyOrder {
    id: string;
    patientName: string;
    detail: string;
    priority: string;
    status: string;
    orderedBy: string;
    createdAt: any;
}

const PRIORITY_VARIANT: Record<string, BadgeVariant> = { STAT: "red", URGENT: "yellow", ROUTINE: "blue" };
const STATUS_VARIANT:   Record<string, BadgeVariant> = { PENDING: "blue", IN_PROGRESS: "yellow", COMPLETED: "green" };

export default function RadiologyDashboard() {
    const { profile }   = useAuth();
    const [orders, setOrders] = useState<RadiologyOrder[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDocs(query(collection(db, "cpoeOrders"), where("orderType", "==", "RADIOLOGY")))
            .then(snap => {
                const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as RadiologyOrder));
                rows.sort((a, b) => tsMs(b.createdAt) - tsMs(a.createdAt));
                setOrders(rows);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const pending    = orders.filter(o => o.status === "PENDING").length;
    const completed  = orders.filter(o => o.status === "COMPLETED").length;
    const reports    = orders.filter(o => o.status === "IN_PROGRESS").length;
    const urgent     = orders.filter(o => (o.priority === "STAT" || o.priority === "URGENT") && o.status !== "COMPLETED").length;

    const stats = [
        { label: "Pending Scans",    value: String(pending),   icon: Clock,        color: "text-amber-600", bg: "bg-amber-50" },
        { label: "Completed",        value: String(completed), icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
        { label: "Reports Pending",  value: String(reports),   icon: FileImage,    color: "text-blue-600",  bg: "bg-blue-50"  },
        { label: "Urgent Studies",   value: String(urgent),    icon: AlertCircle,  color: "text-red-600",   bg: "bg-red-50"   },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Radiology Dashboard</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Welcome, <span className="font-bold text-blue-600">{profile?.name}</span> &bull; Imaging Overview
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/radiology/orders" className="px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-sm font-bold transition-colors flex items-center gap-2">
                        <Scan className="h-4 w-4" /> Imaging Orders
                    </Link>
                    <Link href="/radiology/worklist" className="px-4 py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold transition-colors flex items-center gap-2">
                        <FileImage className="h-4 w-4" /> Worklist
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
                    : stats.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <Card key={s.label} variant="interactive" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="p-6">
                                <div className={`inline-flex p-2.5 rounded-xl ${s.bg} mb-3`}><Icon className={`h-5 w-5 ${s.color}`} /></div>
                                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                                <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
                            </Card>
                        );
                    })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <Scan className="h-4 w-4 text-blue-600" /> Recent Studies
                    </h2>
                    <span className="text-xs text-gray-400 font-semibold">{orders.length} studies</span>
                </div>
                <div className="divide-y divide-gray-50">
                    {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
                    {!loading && orders.length === 0 && (
                        <div className="px-5 py-8 text-center text-sm text-gray-400">No radiology orders yet</div>
                    )}
                    {orders.slice(0, 10).map((item, i) => (
                        <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                            className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900">{item.patientName}</p>
                                <p className="text-xs text-gray-500">
                                    {item.detail} &bull; {item.orderedBy}
                                    {item.createdAt && ` · ${toDate(item.createdAt)?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) ?? ""}`}
                                </p>
                            </div>
                            <Badge variant={PRIORITY_VARIANT[item.priority] ?? "blue"} size="sm">{item.priority}</Badge>
                            <Badge variant={STATUS_VARIANT[item.status] ?? "blue"}>{item.status?.replace("_", " ")}</Badge>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

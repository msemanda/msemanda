"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, updateDoc, doc, getDoc, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import {
    Users, Calendar, Clock, ChevronRight,
    ClipboardList, FileText, Activity, RefreshCw,
    CheckCircle2, Loader2,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { SkeletonRow } from "@/components/ui/Skeleton";

interface QueueEntry {
    id: string;
    patientName: string;
    patientEmail: string;
    patientId?: string;
    time: string;
    notes: string;
    status: string;
    feeId?: string;
    feeStatus?: string;
}

const STATUS_VARIANT: Record<string, BadgeVariant> = {
    SCHEDULED:        "neutral",
    CONFIRMED:        "neutral",
    PENDING_PAYMENT:  "yellow",
    CALLED:           "yellow",
    COMPLETED:        "green",
    CANCELLED:        "red",
};

export default function DoctorDashboard() {
    const { profile } = useAuth();
    const [queue, setQueue] = useState<QueueEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [completing, setCompleting] = useState<string | null>(null);

    const today = new Date().toISOString().split("T")[0];

    const load = async () => {
        if (!profile?.uid) return;
        setLoading(true);
        try {
            const snap = await getDocs(
                query(
                    collection(db, "appointments"),
                    where("doctorId", "==", profile.uid),
                    where("date", "==", today),
                    orderBy("time"),
                )
            );
            const rows = snap.docs.map(d => {
                const data = d.data() as Record<string, string>;
                return {
                    id: d.id,
                    patientName: data.patientName || "Unknown",
                    patientEmail: data.patientEmail || "",
                    patientId: data.patientId || "",
                    time: data.time || "",
                    notes: data.notes || "",
                    status: data.status || "SCHEDULED",
                    feeId: data.feeId || "",
                };
            });

            // appointment.status is only synced one-way when a fee gets
            // approved and is never re-validated — cross-check the real fee
            // status directly so the doctor can't act before Finance clears it.
            const withFees = await Promise.all(rows.map(async r => {
                if (!r.feeId) return { ...r, feeStatus: undefined };
                try {
                    const feeSnap = await getDoc(doc(db, "consultationFees", r.feeId));
                    return { ...r, feeStatus: feeSnap.exists() ? (feeSnap.data().status as string) : undefined };
                } catch { return { ...r, feeStatus: undefined }; }
            }));
            setQueue(withFees);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    useEffect(() => { load(); }, [profile?.uid]);

    const markDone = async (id: string) => {
        setCompleting(id);
        try {
            await updateDoc(doc(db, "appointments", id), { status: "COMPLETED" });
            setQueue(prev => prev.map(q => q.id === id ? { ...q, status: "COMPLETED" } : q));
        } catch (e) { console.error(e); }
        finally { setCompleting(null); }
    };

    // A slot is only actionable once its linked consultation fee is actually
    // PAID — checked live against consultationFees, not the appointment's own
    // (unreliable) status field.
    const isCleared = (q: QueueEntry) => q.feeStatus === "PAID";
    const active = queue.filter(q => q.status !== "COMPLETED" && q.status !== "CANCELLED");
    const pendingPayment = queue.filter(q => q.status !== "COMPLETED" && q.status !== "CANCELLED" && !isCleared(q)).length;
    const done   = queue.filter(q => q.status === "COMPLETED").length;

    return (
        <div className="max-w-7xl mx-auto space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-black text-gray-900">
                        Welcome, <span className="text-cyan-600">{profile?.name?.split(" ")[0] || "Doctor"}</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        You have <span className="text-cyan-600 font-black">{active.length}</span> patient{active.length !== 1 ? "s" : ""} scheduled today.
                        {pendingPayment > 0 && (
                            <span className="text-amber-600 font-bold"> · {pendingPayment} awaiting payment</span>
                        )}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={load} disabled={loading}
                        className="h-9 w-9 rounded-xl border border-gray-100 bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-cyan-600 transition-colors disabled:opacity-50">
                        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    </button>
                    <div className="flex bg-white border border-gray-100 shadow-sm rounded-2xl overflow-hidden">
                        <div className="px-5 py-3 border-r border-gray-100 text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Today</p>
                            <p className="text-lg font-black text-cyan-600">{String(queue.length).padStart(2, "0")}</p>
                        </div>
                        <div className="px-5 py-3 text-center">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Done</p>
                            <p className="text-lg font-black text-green-500">{String(done).padStart(2, "0")}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Consultation queue */}
                <div className="lg:col-span-8">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-50 flex justify-between items-center">
                            <h2 className="text-sm font-black text-gray-900 flex items-center gap-2">
                                <Users className="h-4 w-4 text-cyan-600" /> Today's Consultation Queue
                            </h2>
                            <Link href="/doctor/appointments"
                                className="text-xs font-bold text-cyan-600 hover:underline">
                                All Appointments
                            </Link>
                        </div>

                        {loading ? (
                            <div className="divide-y divide-gray-50">{Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}</div>
                        ) : queue.length === 0 ? (
                            <div className="py-16 text-center">
                                <div className="h-14 w-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Calendar className="h-7 w-7 text-gray-200" />
                                </div>
                                <p className="text-sm font-bold text-gray-500">No appointments for today.</p>
                                <p className="text-xs text-gray-400 mt-1">
                                    The receptionist books appointments via{" "}
                                    <span className="font-mono font-bold">/receptionist/book</span>.
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {queue.map((entry, idx) => (
                                    <motion.div key={entry.id}
                                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                                        className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${entry.status === "COMPLETED" ? "opacity-40" : "hover:bg-cyan-50/20"}`}>
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-100 to-teal-50 flex items-center justify-center text-cyan-700 font-black text-sm shrink-0">
                                                {entry.patientName.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-gray-900 truncate">{entry.patientName}</p>
                                                <div className="flex items-center gap-3 flex-wrap">
                                                    <span className="text-xs text-gray-400 flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />{entry.time || "—"}
                                                    </span>
                                                    {entry.notes && (
                                                        <span className="text-xs text-gray-400 truncate max-w-[180px]">{entry.notes}</span>
                                                    )}
                                                    <Badge variant={STATUS_VARIANT[entry.status] ?? "neutral"} size="sm">{entry.status}</Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2 shrink-0">
                                            {entry.status === "COMPLETED" ? (
                                                <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Completed
                                                </span>
                                            ) : entry.status === "CANCELLED" ? (
                                                <span className="text-xs text-gray-400 font-bold">Cancelled</span>
                                            ) : !isCleared(entry) ? (
                                                <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" /> Awaiting payment
                                                </span>
                                            ) : (
                                                <>
                                                    <Link href={`/doctor/diagnose/${entry.patientId || entry.id}`}
                                                        className="h-9 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors">
                                                        Start <ChevronRight className="h-3.5 w-3.5" />
                                                    </Link>
                                                    <button onClick={() => markDone(entry.id)} disabled={completing === entry.id}
                                                        className="h-9 px-3 rounded-xl border border-gray-100 text-gray-400 hover:text-green-600 hover:border-green-100 text-xs font-bold flex items-center gap-1 transition-colors disabled:opacity-50">
                                                        {completing === entry.id
                                                            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            : <><CheckCircle2 className="h-3.5 w-3.5" /> Done</>}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-4 space-y-4">
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h3 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                            <ClipboardList className="h-4 w-4 text-cyan-600" /> Quick Access
                        </h3>
                        <div className="space-y-2">
                            <Link href="/doctor/diagnostics"
                                className="flex items-center gap-2 w-full h-10 px-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-cyan-200 text-gray-700 font-bold text-xs transition-colors">
                                <FileText className="h-3.5 w-3.5 text-gray-400" /> Diagnostic History
                            </Link>
                            <Link href="/doctor/patients"
                                className="flex items-center gap-2 w-full h-10 px-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-cyan-200 text-gray-700 font-bold text-xs transition-colors">
                                <Users className="h-3.5 w-3.5 text-gray-400" /> My Patients
                            </Link>
                            <Link href="/doctor/cpoe"
                                className="flex items-center gap-2 w-full h-10 px-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-white hover:border-cyan-200 text-gray-700 font-bold text-xs transition-colors">
                                <ClipboardList className="h-3.5 w-3.5 text-gray-400" /> CPOE — Order Entry
                            </Link>
                        </div>
                    </div>

                    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-5 text-white shadow-xl">
                        <h3 className="text-sm font-black mb-1">Today's Summary</h3>
                        <p className="text-gray-400 text-xs mb-4">
                            {done} of {queue.length} appointment{queue.length !== 1 ? "s" : ""} completed today.
                        </p>
                        <div className="space-y-1.5">
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }}
                                    animate={{ width: queue.length > 0 ? `${Math.round((done / queue.length) * 100)}%` : "0%" }}
                                    className="h-full bg-cyan-400 transition-all" />
                            </div>
                            <div className="flex justify-between text-[10px] font-bold text-gray-500">
                                <span>Progress</span>
                                <span className="text-cyan-400">
                                    {queue.length > 0 ? Math.round((done / queue.length) * 100) : 0}%
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

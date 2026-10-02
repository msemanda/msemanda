"use client";

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Search, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { collection, getDocs, doc, updateDoc, serverTimestamp, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { toDate } from "@/lib/ts";

interface BloodRequest {
    id: string;
    patient: string;
    bed: string;
    bloodGroup: string;
    units: number;
    reason: string;
    doctor: string;
    requestedAt: string;
    urgency: string;
    status: string;
}

const URGENCY_BADGE: Record<string, string> = {
    EMERGENCY: "bg-red-50 text-red-700 border-red-100",
    URGENT: "bg-amber-50 text-amber-700 border-amber-100",
    ROUTINE: "bg-gray-50 text-gray-600 border-gray-100",
};
const STATUS_BADGE: Record<string, string> = {
    PENDING: "bg-amber-50 text-amber-700",
    APPROVED: "bg-blue-50 text-blue-700",
    ISSUED: "bg-green-50 text-green-700",
    DECLINED: "bg-red-50 text-red-500",
};

export default function BloodRequestsPage() {
    const { profile } = useAuth();
    const [requests, setRequests] = useState<BloodRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [processing, setProcessing] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "bloodRequests"));
            setRequests(snap.docs.map(d => {
                const r = d.data();
                const at = toDate(r.requestedAt);
                return {
                    id: d.id,
                    patient: ((r.patientName ?? r.patient) as string) ?? "—",
                    bed: ((r.bed ?? r.bedNumber) as string) ?? "—",
                    bloodGroup: ((r.bloodGroup ?? r.group) as string) ?? "?",
                    units: Number(r.units ?? 1),
                    reason: ((r.reason ?? r.indication) as string) ?? "—",
                    doctor: ((r.doctor ?? r.doctorName) as string) ?? "—",
                    requestedAt: at
                        ? at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })
                        : ((r.requestedAt as string) ?? "—"),
                    urgency: (r.urgency as string) ?? "ROUTINE",
                    status: (r.status as string) ?? "PENDING",
                };
            }));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const filtered = requests.filter(r =>
        r.patient.toLowerCase().includes(search.toLowerCase()) ||
        r.bloodGroup.includes(search.toUpperCase())
    );
    const pendingCount = requests.filter(r => r.status === "PENDING").length;

    const handleDecline = async (id: string) => {
        setProcessing(id);
        try {
            await updateDoc(doc(db, "bloodRequests", id), {
                status: "DECLINED",
                declinedBy: profile?.name,
                declinedAt: serverTimestamp(),
            });
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status: "DECLINED" } : r));
        } catch (e) { console.error(e); }
        finally { setProcessing(null); }
    };

    const handleApproveIssue = async (r: BloodRequest) => {
        setProcessing(r.id);
        try {
            const invSnap = await getDocs(query(collection(db, "bloodInventory"), where("bloodGroup", "==", r.bloodGroup)));
            const stockDoc = invSnap.docs[0];
            if (stockDoc) {
                const available = Number(stockDoc.data().available ?? 0);
                await updateDoc(doc(db, "bloodInventory", stockDoc.id), {
                    available: Math.max(0, available - r.units),
                });
            }
            await updateDoc(doc(db, "bloodRequests", r.id), {
                status: "ISSUED",
                issuedBy: profile?.name,
                issuedAt: serverTimestamp(),
            });
            setRequests(prev => prev.map(x => x.id === r.id ? { ...x, status: "ISSUED" } : x));
        } catch (e) { console.error(e); }
        finally { setProcessing(null); }
    };

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <FlaskConical className="h-6 w-6 text-red-600" /> Blood Requests
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${pendingCount} pending requests`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-red-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Search patient or blood group..." />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-red-100 border-t-red-500 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">
                    {search ? "No results match your search" : "No blood requests found"}
                </p>
            ) : (
                <div className="space-y-3">
                    {filtered.map((r, i) => (
                        <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-700 font-black text-sm">
                                        {r.bloodGroup}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">
                                            {r.patient}
                                            <span className="ml-2 text-xs font-normal text-gray-400">Bed {r.bed}</span>
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {r.doctor} · {r.requestedAt} · {r.units} unit{r.units > 1 ? "s" : ""}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${URGENCY_BADGE[r.urgency] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>
                                        {r.urgency}
                                    </span>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[r.status] ?? "bg-gray-50 text-gray-600"}`}>
                                        {r.status}
                                    </span>
                                </div>
                            </div>
                            <p className="text-xs text-gray-600 ml-13">{r.reason}</p>
                            {r.status === "PENDING" && (
                                <div className="flex gap-2 mt-3 justify-end">
                                    <button onClick={() => handleDecline(r.id)} disabled={processing === r.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 disabled:opacity-50 transition-colors">
                                        <XCircle className="h-3.5 w-3.5" /> Decline
                                    </button>
                                    <button onClick={() => handleApproveIssue(r)} disabled={processing === r.id}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 disabled:opacity-50 transition-colors">
                                        <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Issue
                                    </button>
                                </div>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

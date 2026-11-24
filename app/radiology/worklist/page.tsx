"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Scan, RefreshCw, User } from "lucide-react";
import { collection, getDocs, doc, updateDoc, query, where, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { notify, resolvePatientUid } from "@/lib/notify";
import { toDate } from "@/lib/ts";

interface WorklistItem {
    id: string;
    patientName: string;
    patientEmail?: string;
    patientId?: string | null;
    detail: string;
    priority: string;
    orderedBy?: string;
    orderedByUid?: string;
    createdAt?: any;
    status: string;
}

const STATUS_STYLE: Record<string, string> = {
    IN_PROGRESS: "bg-blue-50 text-blue-700 border-blue-100",
    PENDING:     "bg-amber-50 text-amber-700 border-amber-100",
    COMPLETED:   "bg-green-50 text-green-700 border-green-100",
};
const PRIORITY_BADGE: Record<string, string> = {
    STAT:    "bg-red-50 text-red-600",
    URGENT:  "bg-amber-50 text-amber-700",
    ROUTINE: "bg-blue-50 text-blue-700",
};

export default function WorklistPage() {
    const { profile } = useAuth();
    const [worklist, setWorklist] = useState<WorklistItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [reporting, setReporting] = useState<string | null>(null);
    const [findings, setFindings] = useState("");
    const [impression, setImpression] = useState("");
    const [submitting, setSubmitting] = useState(false);

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const snap = await getDocs(query(collection(db, "cpoeOrders"), where("orderType", "==", "RADIOLOGY")));
            const rows = snap.docs
                .map(d => {
                    const r = d.data();
                    return {
                        id: d.id,
                        patientName: (r.patientName as string) ?? "—",
                        patientEmail: r.patientEmail as string | undefined,
                        patientId: r.patientId ?? null,
                        detail: (r.detail as string) ?? "—",
                        priority: (r.priority as string) ?? "ROUTINE",
                        orderedBy: r.orderedBy as string | undefined,
                        orderedByUid: r.orderedByUid as string | undefined,
                        createdAt: r.createdAt,
                        status: (r.status as string) ?? "PENDING",
                    } as WorklistItem;
                })
                .filter(w => w.status !== "PENDING"); // not yet accepted in Imaging Orders
            setWorklist(rows);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { load(); }, [load]);

    const openReport = (item: WorklistItem) => {
        setReporting(item.id);
        setFindings("");
        setImpression("");
    };

    const submitReport = async (item: WorklistItem) => {
        if (!findings.trim()) return;
        setSubmitting(true);
        try {
            await updateDoc(doc(db, "cpoeOrders", item.id), {
                findings: findings.trim(),
                impression: impression.trim(),
                status: "COMPLETED",
                reportedBy: profile?.name,
                reportedAt: serverTimestamp(),
            });

            if (item.orderedByUid) {
                await notify({
                    targetUid: item.orderedByUid,
                    type: "radiology_result",
                    title: `Radiology report ready — ${item.patientName}`,
                    body: `${item.detail} completed`,
                    link: "/doctor/emr",
                });
            }
            const patientUid = await resolvePatientUid(item.patientId, item.patientEmail);
            if (patientUid) {
                await notify({
                    targetUid: patientUid,
                    type: "radiology_result",
                    title: "Your radiology report is ready",
                    body: `${item.detail} — view it in your records.`,
                    link: "/patient/records",
                });
            }

            setReporting(null);
            await load();
        } catch (e) { console.error(e); }
        finally { setSubmitting(false); }
    };

    const scanningCount = worklist.filter(w => w.status === "IN_PROGRESS").length;
    const completedCount = worklist.filter(w => w.status === "COMPLETED").length;

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <Scan className="h-6 w-6 text-violet-600" /> Worklist
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${scanningCount} awaiting report · ${completedCount} completed`}
                    </p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-violet-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-16">
                    <div className="animate-spin h-6 w-6 border-[3px] border-violet-100 border-t-violet-500 rounded-full" />
                </div>
            ) : worklist.length === 0 ? (
                <p className="text-center text-gray-400 py-16 text-xs font-bold uppercase tracking-widest">
                    No orders yet. Accept an order in Imaging Orders first.
                </p>
            ) : (
                <div className="space-y-3">
                    {worklist.map((w, i) => (
                        <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="h-10 w-10 rounded-xl bg-violet-50 flex items-center justify-center shrink-0">
                                        <User className="h-4.5 w-4.5 text-violet-600" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-gray-900 truncate">{w.patientName}</p>
                                        <p className="text-xs text-violet-700 font-semibold truncate">{w.detail}</p>
                                        <p className="text-[10px] text-gray-400 mt-0.5">
                                            {w.orderedBy ? `Dr. ${w.orderedBy}` : "—"} · {toDate(w.createdAt)?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) ?? "—"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_BADGE[w.priority] ?? PRIORITY_BADGE.ROUTINE}`}>{w.priority}</span>
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[w.status] ?? "bg-gray-50 text-gray-600 border-gray-100"}`}>{w.status.replace("_", " ")}</span>
                                    {w.status === "IN_PROGRESS" && (
                                        <button onClick={() => openReport(w)} className="text-xs font-bold text-white bg-violet-600 hover:bg-violet-700 px-3 py-1.5 rounded-lg transition-colors">
                                            Report
                                        </button>
                                    )}
                                </div>
                            </div>

                            <AnimatePresence>
                                {reporting === w.id && (
                                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                        className="mt-4 pt-4 border-t border-gray-50 space-y-3 overflow-hidden">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Findings</label>
                                            <textarea rows={3} value={findings} onChange={e => setFindings(e.target.value)}
                                                placeholder="Describe what was observed on imaging..."
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 resize-none" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">Impression</label>
                                            <textarea rows={2} value={impression} onChange={e => setImpression(e.target.value)}
                                                placeholder="Summary conclusion..."
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20 resize-none" />
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => setReporting(null)}
                                                className="px-4 py-2 text-xs font-bold text-gray-500 hover:bg-gray-50 rounded-xl transition-colors">
                                                Cancel
                                            </button>
                                            <button onClick={() => submitReport(w)} disabled={submitting || !findings.trim()}
                                                className="px-4 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-xl transition-colors">
                                                {submitting ? "Saving…" : "Submit Report"}
                                            </button>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { RadiologyOrder } from "@/types";
import { motion } from "framer-motion";
import { FileImage, Search, Download, RefreshCw, Scan } from "lucide-react";

const MODALITY_COLOR: Record<string, string> = {
    "X-RAY": "bg-blue-50 text-blue-700",
    CT: "bg-purple-50 text-purple-700",
    MRI: "bg-indigo-50 text-indigo-700",
    ULTRASOUND: "bg-teal-50 text-teal-700",
    PET: "bg-pink-50 text-pink-700",
    MAMMOGRAPHY: "bg-rose-50 text-rose-700",
};

const PRIORITY_COLOR: Record<string, string> = {
    ROUTINE: "bg-gray-50 text-gray-600",
    URGENT: "bg-amber-50 text-amber-700",
    STAT: "bg-red-50 text-red-700",
};

export default function RadiologyReportsPage() {
    const [orders, setOrders] = useState<RadiologyOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchReports = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "radiologyOrders"),
                where("status", "==", "COMPLETED"),
                orderBy("reportedAt", "desc")
            );
            const snap = await getDocs(q);
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as RadiologyOrder)));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReports(); }, []);

    const filtered = orders.filter(o => {
        const q = search.toLowerCase();
        return !q ||
            (o.patientName || "").toLowerCase().includes(q) ||
            o.bodyPart.toLowerCase().includes(q) ||
            o.modality.toLowerCase().includes(q) ||
            o.patientId.toLowerCase().includes(q);
    });

    const handlePrint = (order: RadiologyOrder) => {
        const w = window.open("", "_blank");
        if (!w) return;
        w.document.write(`
            <html><head><title>Radiology Report — ${order.patientName || order.patientId}</title>
            <style>body{font-family:sans-serif;padding:32px;max-width:700px;margin:auto}h1{font-size:20px}h2{font-size:14px;color:#555;border-bottom:1px solid #eee;padding-bottom:6px;margin-top:20px}p{font-size:13px;color:#333;margin:6px 0}.label{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:#888;margin-bottom:4px}.box{background:#f8f8f8;border-radius:8px;padding:12px;margin-top:6px}@media print{button{display:none}}</style>
            </head><body>
            <h1>Radiology Report</h1>
            <p><strong>Patient:</strong> ${order.patientName || order.patientId}</p>
            <p><strong>Modality:</strong> ${order.modality} &nbsp; <strong>Body Part:</strong> ${order.bodyPart} &nbsp; <strong>Priority:</strong> ${order.priority}</p>
            <p><strong>Reported:</strong> ${order.reportedAt?.seconds ? new Date(order.reportedAt.seconds * 1000).toLocaleString() : "—"}</p>
            ${order.findings ? `<h2>Findings</h2><div class="box"><p>${order.findings}</p></div>` : ""}
            ${order.impression ? `<h2>Impression</h2><div class="box"><p>${order.impression}</p></div>` : ""}
            <br/><button onclick="window.print()">Print / Save PDF</button>
            </body></html>
        `);
        w.document.close();
    };

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <FileImage className="h-6 w-6 text-violet-600" /> Radiology Reports
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${orders.length} completed ${orders.length === 1 ? "report" : "reports"}`}
                    </p>
                </div>
                <button onClick={fetchReports}
                    className="h-9 w-9 rounded-xl border border-gray-100 bg-white shadow-sm text-gray-400 hover:text-violet-600 hover:border-violet-100 flex items-center justify-center transition-colors">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-violet-500/20"
                    placeholder="Search patient, modality or body part..." />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-violet-100 border-t-violet-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <Scan className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900">No completed reports</p>
                    <p className="text-xs text-gray-400 mt-1">Reports appear here when imaging orders are marked Completed.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((order, i) => (
                        <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <span className={`text-[10px] font-black px-2.5 py-1.5 rounded-xl shrink-0 ${MODALITY_COLOR[order.modality] || "bg-gray-50 text-gray-700"}`}>
                                        {order.modality}
                                    </span>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">
                                            {order.patientName || order.patientId} — {order.bodyPart}
                                        </p>
                                        <p className="text-xs text-gray-400">
                                            {order.reportedAt?.seconds
                                                ? new Date(order.reportedAt.seconds * 1000).toLocaleString()
                                                : "—"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${PRIORITY_COLOR[order.priority]}`}>
                                        {order.priority}
                                    </span>
                                    <button onClick={() => handlePrint(order)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                        <Download className="h-3.5 w-3.5" /> PDF
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {order.findings ? (
                                    <div className="bg-gray-50 rounded-xl p-3">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Findings</p>
                                        <p className="text-xs text-gray-700">{order.findings}</p>
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-400 italic bg-gray-50 rounded-xl p-3">No findings recorded.</p>
                                )}
                                {order.impression && (
                                    <div className="bg-violet-50 rounded-xl p-3">
                                        <p className="text-[10px] font-black text-violet-400 uppercase tracking-wider mb-1">Impression</p>
                                        <p className="text-xs text-violet-900 font-semibold">{order.impression}</p>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

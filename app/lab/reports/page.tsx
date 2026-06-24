"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { fmtDateTime } from "@/lib/ts";
import { db } from "@/lib/firebase";
import { LabOrder } from "@/types";
import { motion } from "framer-motion";
import { BarChart3, Search, Download, FileText, RefreshCw, FlaskConical } from "lucide-react";

const FLAG_COLORS: Record<string, string> = {
    NORMAL: "bg-green-50 text-green-700 border-green-100",
    HIGH: "bg-red-50 text-red-700 border-red-100",
    LOW: "bg-amber-50 text-amber-700 border-amber-100",
    CRITICAL: "bg-red-100 text-red-800 border-red-200 font-black",
};

const PRIORITY_COLOR: Record<string, string> = {
    ROUTINE: "bg-gray-50 text-gray-600",
    URGENT: "bg-amber-50 text-amber-700",
    STAT: "bg-red-50 text-red-700",
};

export default function LabReportsPage() {
    const [orders, setOrders] = useState<LabOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchReports = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "labOrders"),
                where("status", "==", "COMPLETED"),
                orderBy("completedAt", "desc")
            );
            const snap = await getDocs(q);
            setOrders(snap.docs.map(d => ({ id: d.id, ...d.data() } as LabOrder)));
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
            o.tests.some(t => t.toLowerCase().includes(q)) ||
            o.patientId.toLowerCase().includes(q);
    });

    const handlePrint = (order: LabOrder) => {
        const w = window.open("", "_blank");
        if (!w) return;
        w.document.write(`
            <html><head><title>Lab Report — ${order.patientName || order.patientId}</title>
            <style>body{font-family:sans-serif;padding:32px;max-width:700px;margin:auto}h1{font-size:20px}h2{font-size:14px;color:#555;border-bottom:1px solid #eee;padding-bottom:6px}table{width:100%;border-collapse:collapse;margin-top:12px}td,th{padding:8px 10px;text-align:left;border-bottom:1px solid #f0f0f0;font-size:13px}th{background:#f8f8f8;font-weight:700}@media print{button{display:none}}</style>
            </head><body>
            <h1>Laboratory Report</h1>
            <p><strong>Patient:</strong> ${order.patientName || order.patientId} &nbsp; <strong>Priority:</strong> ${order.priority}</p>
            <p><strong>Ordered:</strong> ${fmtDateTime(order.orderedAt)} &nbsp; <strong>Completed:</strong> ${fmtDateTime(order.completedAt)}</p>
            <h2>Tests Ordered</h2>
            <p>${order.tests.join(", ")}</p>
            ${order.results?.length ? `
            <h2>Results</h2>
            <table><tr><th>Test</th><th>Value</th><th>Unit</th><th>Ref Range</th><th>Flag</th></tr>
            ${order.results.map(r => `<tr><td>${r.testName}</td><td>${r.value}</td><td>${r.unit}</td><td>${r.referenceRange}</td><td>${r.flag || "—"}</td></tr>`).join("")}
            </table>` : ""}
            ${order.notes ? `<h2>Notes</h2><p>${order.notes}</p>` : ""}
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
                        <BarChart3 className="h-6 w-6 text-amber-600" /> Lab Reports
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${orders.length} completed ${orders.length === 1 ? "report" : "reports"}`}
                    </p>
                </div>
                <button onClick={fetchReports}
                    className="h-9 w-9 rounded-xl border border-gray-100 bg-white shadow-sm text-gray-400 hover:text-amber-600 hover:border-amber-100 flex items-center justify-center transition-colors">
                    <RefreshCw className="h-4 w-4" />
                </button>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-amber-500/20"
                    placeholder="Search patient or test..." />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-amber-100 border-t-amber-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <FlaskConical className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900">No completed reports</p>
                    <p className="text-xs text-gray-400 mt-1">Reports appear here when lab orders are marked Completed.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filtered.map((order, i) => (
                        <motion.div key={order.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-9 w-9 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                                        <FileText className="h-4 w-4 text-amber-600" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">{order.patientName || order.patientId}</p>
                                        <p className="text-xs text-gray-400">{fmtDateTime(order.completedAt)}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${PRIORITY_COLOR[order.priority]}`}>
                                        {order.priority}
                                    </span>
                                    <button onClick={() => handlePrint(order)}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-100 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors">
                                        <Download className="h-3.5 w-3.5" /> PDF
                                    </button>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {order.tests.map(t => (
                                    <span key={t} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-100">{t}</span>
                                ))}
                            </div>

                            {order.results && order.results.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b border-gray-50">
                                                <th className="text-left pb-2 text-[10px] font-black text-gray-400 uppercase tracking-wider pr-4">Test</th>
                                                <th className="text-left pb-2 text-[10px] font-black text-gray-400 uppercase tracking-wider pr-4">Value</th>
                                                <th className="text-left pb-2 text-[10px] font-black text-gray-400 uppercase tracking-wider pr-4">Unit</th>
                                                <th className="text-left pb-2 text-[10px] font-black text-gray-400 uppercase tracking-wider pr-4">Ref Range</th>
                                                <th className="text-left pb-2 text-[10px] font-black text-gray-400 uppercase tracking-wider">Flag</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {order.results.map((r, ri) => (
                                                <tr key={ri}>
                                                    <td className="py-2 pr-4 font-semibold text-gray-800">{r.testName}</td>
                                                    <td className="py-2 pr-4 font-black text-gray-900">{r.value}</td>
                                                    <td className="py-2 pr-4 text-gray-500">{r.unit}</td>
                                                    <td className="py-2 pr-4 text-gray-400">{r.referenceRange}</td>
                                                    <td className="py-2">
                                                        {r.flag && (
                                                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${FLAG_COLORS[r.flag]}`}>
                                                                {r.flag}
                                                            </span>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <p className="text-xs text-gray-400 italic bg-gray-50 rounded-xl p-3">No results recorded yet.</p>
                            )}

                            {order.notes && (
                                <p className="text-xs text-gray-600 bg-gray-50 rounded-xl p-3 mt-3">{order.notes}</p>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

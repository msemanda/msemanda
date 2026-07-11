"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { fmtDateTime, tsMs } from "@/lib/ts";
import { db } from "@/lib/firebase";
import { LabOrder } from "@/types";
import { motion } from "framer-motion";
import { BarChart3, Search, FileText, RefreshCw, FlaskConical, Activity } from "lucide-react";
import { ExportMenu } from "@/components/ui/ExportMenu";
import type { ReportDocument, ReportSection } from "@/lib/export";

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

type Period = "day" | "week" | "month" | "year";

const PERIODS: { value: Period; label: string }[] = [
    { value: "day",   label: "Today" },
    { value: "week",  label: "This Week" },
    { value: "month", label: "This Month" },
    { value: "year",  label: "This Year" },
];

function periodStart(period: Period): number {
    const now = new Date();
    switch (period) {
        case "day":
            return new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
        case "week": {
            const day = now.getDay(); // 0 = Sunday
            const diffToMonday = day === 0 ? 6 : day - 1;
            const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - diffToMonday);
            return monday.getTime();
        }
        case "month":
            return new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        case "year":
            return new Date(now.getFullYear(), 0, 1).getTime();
    }
}

export default function LabReportsPage() {
    const [orders, setOrders] = useState<LabOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [period, setPeriod] = useState<Period>("week");

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

    const periodOrders = useMemo(() => {
        const cutoff = periodStart(period);
        return orders.filter(o => tsMs(o.completedAt) >= cutoff);
    }, [orders, period]);

    const summary = useMemo(() => {
        const testCounts: Record<string, number> = {};
        let totalTests = 0;
        const priorityCounts: Record<string, number> = { ROUTINE: 0, URGENT: 0, STAT: 0 };
        for (const o of periodOrders) {
            totalTests += o.tests.length;
            for (const t of o.tests) testCounts[t] = (testCounts[t] ?? 0) + 1;
            priorityCounts[o.priority] = (priorityCounts[o.priority] ?? 0) + 1;
        }
        const topTests = Object.entries(testCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 6)
            .map(([name, count]) => ({ name, count }));
        const maxTest = Math.max(...topTests.map(t => t.count), 1);
        return { totalReports: periodOrders.length, totalTests, topTests, maxTest, priorityCounts };
    }, [periodOrders]);

    const filtered = periodOrders.filter(o => {
        const q = search.toLowerCase();
        return !q ||
            (o.patientName || "").toLowerCase().includes(q) ||
            o.tests.some(t => t.toLowerCase().includes(q)) ||
            o.patientId.toLowerCase().includes(q);
    });

    const buildLabRecordDocument = (order: LabOrder): ReportDocument => {
        const sections: ReportSection[] = [
            {
                kind: "keyvalue",
                fields: [
                    { label: "Patient", value: order.patientName || order.patientId },
                    { label: "Priority", value: order.priority },
                    { label: "Ordered", value: fmtDateTime(order.orderedAt) },
                    { label: "Completed", value: fmtDateTime(order.completedAt) },
                ],
            },
            { kind: "text", heading: "Tests Ordered", text: order.tests.join(", ") },
        ];
        if (order.results?.length) {
            sections.push({
                kind: "table",
                heading: "Results",
                columns: [
                    { key: "testName", label: "Test" },
                    { key: "value", label: "Value" },
                    { key: "unit", label: "Unit" },
                    { key: "referenceRange", label: "Ref Range" },
                    { key: "flag", label: "Flag" },
                ],
                rows: order.results.map(r => ({
                    testName: r.testName,
                    value: r.value,
                    unit: r.unit,
                    referenceRange: r.referenceRange,
                    flag: r.flag || "—",
                })),
            });
        }
        if (order.notes) sections.push({ kind: "text", heading: "Notes", text: order.notes });
        return { title: `Lab Report — ${order.patientName || order.patientId}`, sections };
    };

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <BarChart3 className="h-6 w-6 text-amber-600" /> Lab Reports
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${orders.length} completed ${orders.length === 1 ? "report" : "reports"} overall`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchReports}
                        className="h-9 w-9 rounded-xl border border-gray-100 bg-white shadow-sm text-gray-400 hover:text-amber-600 hover:border-amber-100 flex items-center justify-center transition-colors">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <ExportMenu data={{
                        title: "Lab Reports",
                        subtitle: `${PERIODS.find(p => p.value === period)?.label} · ${periodOrders.length} reports`,
                        columns: [
                            { key: "patient", label: "Patient" }, { key: "tests", label: "Tests" },
                            { key: "priority", label: "Priority" }, { key: "completedAt", label: "Completed" },
                        ],
                        rows: periodOrders.map(o => ({
                            patient: o.patientName || o.patientId, tests: o.tests.join("; "),
                            priority: o.priority, completedAt: fmtDateTime(o.completedAt),
                        })),
                    }} />
                </div>
            </div>

            <div className="flex gap-2 flex-wrap">
                {PERIODS.map(p => (
                    <button key={p.value} onClick={() => setPeriod(p.value)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${period === p.value ? "bg-amber-600 text-white shadow-sm" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}>
                        {p.label}
                    </button>
                ))}
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Reports", value: summary.totalReports, sub: PERIODS.find(p => p.value === period)?.label ?? "" },
                    { label: "Tests Run", value: summary.totalTests, sub: "individual tests" },
                    { label: "STAT / Urgent", value: summary.priorityCounts.STAT + summary.priorityCounts.URGENT, sub: "priority orders" },
                    { label: "Routine", value: summary.priorityCounts.ROUTINE, sub: "priority orders" },
                ].map((s, i) => (
                    <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
                        <p className="text-2xl font-black text-gray-900">{loading ? "…" : s.value}</p>
                        <p className="text-xs text-gray-400 mt-1">{s.label}{s.sub ? ` · ${s.sub}` : ""}</p>
                    </motion.div>
                ))}
            </div>

            {!loading && summary.topTests.length > 0 && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h2 className="text-sm font-black text-gray-900 mb-4 flex items-center gap-2">
                        <Activity className="h-4 w-4 text-amber-600" /> Most Requested Tests — {PERIODS.find(p => p.value === period)?.label}
                    </h2>
                    <div className="space-y-3">
                        {summary.topTests.map(t => (
                            <div key={t.name}>
                                <div className="flex justify-between text-xs font-semibold text-gray-700 mb-1">
                                    <span>{t.name}</span><span>{t.count}</span>
                                </div>
                                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${(t.count / summary.maxTest) * 100}%` }}
                                        transition={{ duration: 0.5 }}
                                        className="h-full rounded-full bg-amber-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </motion.div>
            )}

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
                                    <ExportMenu variant="icon" label="Export report" data={buildLabRecordDocument(order)} />
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

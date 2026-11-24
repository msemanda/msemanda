"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { fmtDate } from "@/lib/ts";
import { db } from "@/lib/firebase";
import { HomeCareVisit } from "@/types";
import { motion } from "framer-motion";
import { ClipboardList, Calendar, RefreshCw, MapPin } from "lucide-react";
import { ExportMenu } from "@/components/ui/ExportMenu";

const STATUS_COLOR: Record<string, string> = {
    COMPLETED: "bg-green-50 text-green-700 border-green-100",
    SCHEDULED: "bg-blue-50 text-blue-700 border-blue-100",
    CANCELLED: "bg-gray-50 text-gray-500 border-gray-100",
    MISSED: "bg-red-50 text-red-700 border-red-100",
};

export default function VisitReports() {
    const [visits, setVisits] = useState<HomeCareVisit[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const fetchReports = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "homeCareVisits"),
                where("status", "in", ["COMPLETED", "MISSED"]),
                orderBy("visitDate", "desc")
            );
            const snap = await getDocs(q);
            setVisits(snap.docs.map(d => ({ id: d.id, ...d.data() } as HomeCareVisit)));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchReports(); }, []);

    const filtered = visits.filter(v => {
        const q = search.toLowerCase();
        return !q ||
            (v.patientName || "").toLowerCase().includes(q) ||
            v.patientId.toLowerCase().includes(q) ||
            v.services.some(s => s.toLowerCase().includes(q));
    });

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-teal-600" /> Visit Reports
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${visits.length} completed ${visits.length === 1 ? "visit" : "visits"}`}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchReports}
                        className="h-9 w-9 rounded-xl border border-gray-100 bg-white shadow-sm text-gray-400 hover:text-teal-600 hover:border-teal-100 flex items-center justify-center transition-colors">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <ExportMenu data={{
                        title: "Home Care Visit Reports",
                        subtitle: `${visits.length} visits`,
                        columns: [
                            { key: "patient", label: "Patient" }, { key: "visitDate", label: "Visit Date" },
                            { key: "services", label: "Services" }, { key: "status", label: "Status" },
                        ],
                        rows: visits.map(v => ({
                            patient: v.patientName || v.patientId, visitDate: fmtDate(v.visitDate),
                            services: v.services.join("; "), status: v.status,
                        })),
                    }} />
                </div>
            </div>

            <div className="relative max-w-sm">
                <ClipboardList className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20"
                    placeholder="Search patient or service..." />
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-teal-100 border-t-teal-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <MapPin className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900">No visit reports yet</p>
                    <p className="text-xs text-gray-400 mt-1">Reports appear here when home care visits are completed.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filtered.map((visit, i) => (
                        <motion.div key={visit.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <p className="text-sm font-black text-gray-900">{visit.patientName || visit.patientId}</p>
                                    <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                                        <Calendar className="h-3 w-3" />
                                        {fmtDate(visit.visitDate)}
                                        {visit.duration ? ` · ${visit.duration} min` : ""}
                                    </p>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_COLOR[visit.status]}`}>
                                    {visit.status}
                                </span>
                            </div>

                            {visit.services.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 mb-4">
                                    {visit.services.map(s => (
                                        <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100">{s}</span>
                                    ))}
                                </div>
                            )}

                            {visit.vitals && (
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                                    {[
                                        { label: "BP", value: visit.vitals.bloodPressure },
                                        { label: "HR", value: visit.vitals.heartRate ? `${visit.vitals.heartRate} bpm` : null },
                                        { label: "Temp", value: visit.vitals.temperature ? `${visit.vitals.temperature}°C` : null },
                                        { label: "SpO₂", value: visit.vitals.oxygenSaturation ? `${visit.vitals.oxygenSaturation}%` : null },
                                    ].filter(v => v.value).map(v => (
                                        <div key={v.label} className="bg-gray-50 rounded-xl p-2.5 text-center">
                                            <p className="text-[10px] text-gray-400 uppercase tracking-wider">{v.label}</p>
                                            <p className="text-xs font-bold text-gray-800 mt-0.5">{v.value}</p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {visit.notes && (
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">Notes</p>
                                    <p className="text-xs text-gray-700">{visit.notes}</p>
                                </div>
                            )}

                            {visit.nextVisit && (
                                <p className="text-[10px] text-teal-600 font-semibold mt-3 flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Next visit: {fmtDate(visit.nextVisit)}
                                </p>
                            )}
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}

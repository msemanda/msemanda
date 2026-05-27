"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { FlaskConical, Search, CheckCircle2, XCircle } from "lucide-react";

const requests = [
    { id: "BR001", patient: "Sarah Namutebi", bed: "B-03", bloodGroup: "O+", units: 2, reason: "Acute blood loss — GI bleed", doctor: "Dr. Bwire", requestedAt: "09:15", urgency: "EMERGENCY", status: "PENDING" },
    { id: "BR002", patient: "Alice Nakirya", bed: "C-04", bloodGroup: "A+", units: 1, reason: "Anaemia (Hb 7.2 g/dL)", doctor: "Dr. Bwire", requestedAt: "10:00", urgency: "URGENT", status: "APPROVED" },
    { id: "BR003", patient: "Robert Mugisha", bed: "D-02", bloodGroup: "B+", units: 2, reason: "Pre-operative preparation — cardiac surgery", doctor: "Dr. Katongo", requestedAt: "11:30", urgency: "ROUTINE", status: "PENDING" },
    { id: "BR004", patient: "John Mwesiga", bed: "A-01", bloodGroup: "O+", units: 1, reason: "Intra-operative transfusion", doctor: "Dr. Namubiru", requestedAt: "07:45", urgency: "EMERGENCY", status: "ISSUED" },
];

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
    const [search, setSearch] = useState("");
    const filtered = requests.filter(r => r.patient.toLowerCase().includes(search.toLowerCase()) || r.bloodGroup.includes(search.toUpperCase()));

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <FlaskConical className="h-6 w-6 text-red-600" /> Blood Requests
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{requests.filter(r => r.status === "PENDING").length} pending requests</p>
            </div>

            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/20"
                    placeholder="Search patient or blood group..." />
            </div>

            <div className="space-y-3">
                {filtered.map((r, i) => (
                    <motion.div key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center text-red-700 font-black text-sm">{r.bloodGroup}</div>
                                <div>
                                    <p className="text-sm font-black text-gray-900">{r.patient}
                                        <span className="ml-2 text-xs font-normal text-gray-400">Bed {r.bed}</span>
                                    </p>
                                    <p className="text-xs text-gray-400">{r.doctor} · {r.requestedAt} · {r.units} unit{r.units > 1 ? "s" : ""}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${URGENCY_BADGE[r.urgency]}`}>{r.urgency}</span>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_BADGE[r.status]}`}>{r.status}</span>
                            </div>
                        </div>
                        <p className="text-xs text-gray-600 ml-13">{r.reason}</p>
                        {r.status === "PENDING" && (
                            <div className="flex gap-2 mt-3 justify-end">
                                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-100 text-red-500 text-xs font-bold hover:bg-red-50 transition-colors">
                                    <XCircle className="h-3.5 w-3.5" /> Decline
                                </button>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600 text-white text-xs font-bold hover:bg-red-700 transition-colors">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Approve & Issue
                                </button>
                            </div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

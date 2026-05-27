"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Search } from "lucide-react";

const patients = [
    { id: "P001", name: "John Mwesiga", age: 45, gender: "M", referredBy: "Dr. Katongo", condition: "Post-stroke rehabilitation — left hemiplegia", sessions: 8, progress: "IMPROVING", nextSession: "2026-05-28" },
    { id: "P003", name: "Patrick Ssemanda", age: 32, gender: "M", referredBy: "Dr. Namubiru", condition: "Post-op knee replacement physiotherapy", sessions: 3, progress: "IMPROVING", nextSession: "2026-05-27" },
    { id: "P007", name: "Robert Mugisha", age: 61, gender: "M", referredBy: "Dr. Katongo", condition: "Lower back pain — lumbar spondylosis", sessions: 12, progress: "STABLE", nextSession: "2026-05-29" },
    { id: "P008", name: "Agnes Nantale", age: 44, gender: "F", referredBy: "Dr. Namubiru", condition: "Shoulder impingement syndrome", sessions: 5, progress: "IMPROVING", nextSession: "2026-05-28" },
    { id: "P009", name: "Mary Nakato", age: 52, gender: "F", referredBy: "Dr. Ssekibala", condition: "Diabetic peripheral neuropathy", sessions: 2, progress: "STABLE", nextSession: "2026-05-30" },
];

const PROGRESS_BADGE: Record<string, string> = {
    IMPROVING: "bg-green-50 text-green-700",
    STABLE: "bg-amber-50 text-amber-700",
    DECLINING: "bg-red-50 text-red-600",
};

export default function PhysioPatients() {
    const [search, setSearch] = useState("");
    const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.condition.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-orange-500" /> My Patients
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{filtered.length} patients in physiotherapy</p>
            </div>
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-orange-500/20"
                    placeholder="Search name or condition..." />
            </div>
            <div className="space-y-3">
                {filtered.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-black text-sm">{p.name.charAt(0)}</div>
                            <div>
                                <p className="text-sm font-black text-gray-900">{p.name} <span className="text-xs font-normal text-gray-400">{p.age}y / {p.gender}</span></p>
                                <p className="text-xs text-gray-500">{p.condition}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Ref: {p.referredBy} · {p.sessions} sessions completed · Next: {p.nextSession}</p>
                            </div>
                        </div>
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${PROGRESS_BADGE[p.progress]}`}>{p.progress}</span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

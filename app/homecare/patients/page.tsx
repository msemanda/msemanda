"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Users, Search, MapPin } from "lucide-react";

const patients = [
    { id: "HC001", name: "John Mwesiga", age: 45, address: "Ntinda, Plot 12", condition: "Post-stroke home rehab", services: ["Physiotherapy", "Medication admin", "Vitals monitoring"], nextVisit: "2026-05-28", caregiver: "HC Nurse Nakato", status: "ACTIVE" },
    { id: "HC002", name: "Agnes Kiwanuka", age: 78, address: "Naguru Hill Road", condition: "Palliative care — terminal cancer", services: ["Pain management", "Wound care", "Family support"], nextVisit: "2026-05-27", caregiver: "HC Nurse Ssali", status: "ACTIVE" },
    { id: "HC003", name: "Robert Sembuya", age: 62, address: "Bukoto, near Shell", condition: "Diabetic foot wound care", services: ["Daily wound dressing", "Glucose monitoring"], nextVisit: "2026-05-29", caregiver: "HC Nurse Nakato", status: "ACTIVE" },
    { id: "HC004", name: "Mary Naluwooza", age: 55, address: "Kireka trading center", condition: "Post-op recovery — hip replacement", services: ["Physiotherapy", "Medication review", "Vitals"], nextVisit: "2026-05-30", caregiver: "HC Nurse Ssali", status: "ACTIVE" },
];

export default function HomecarePatients() {
    const [search, setSearch] = useState("");
    const filtered = patients.filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Users className="h-6 w-6 text-teal-600" /> My Patients
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{filtered.length} home care patients</p>
            </div>
            <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-teal-500/20"
                    placeholder="Search patient..." />
            </div>
            <div className="space-y-3">
                {filtered.map((p, i) => (
                    <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-black text-sm">{p.name.charAt(0)}</div>
                                <div>
                                    <p className="text-sm font-black text-gray-900">{p.name} <span className="text-xs font-normal text-gray-400">{p.age}y</span></p>
                                    <p className="text-xs text-gray-500 flex items-center gap-1"><MapPin className="h-3 w-3 text-gray-400" />{p.address}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">{p.condition}</p>
                                </div>
                            </div>
                            <div className="text-right shrink-0 ml-3">
                                <p className="text-[10px] text-gray-400">Next visit</p>
                                <p className="text-xs font-bold text-teal-600">{p.nextVisit}</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {p.services.map(s => (
                                <span key={s} className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-100">{s}</span>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

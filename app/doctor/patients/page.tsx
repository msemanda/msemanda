"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { UserCheck, Search, Phone, Mail, CalendarDays } from "lucide-react";

const patients = [
    { id: "P001", name: "John Mwesiga", age: 45, gender: "M", phone: "+256 701 234 567", email: "j.mwesiga@email.com", problem: "Type 2 DM + Hypertension", lastVisit: "2026-05-24", status: "ACTIVE" },
    { id: "P002", name: "Grace Nakato", age: 67, gender: "F", phone: "+256 702 345 678", email: "g.nakato@email.com", problem: "Hypertensive crisis", lastVisit: "2026-05-23", status: "ACTIVE" },
    { id: "P003", name: "Patrick Ssemanda", age: 32, gender: "M", phone: "+256 703 456 789", email: "p.ssemanda@email.com", problem: "Post-op appendectomy follow-up", lastVisit: "2026-05-22", status: "FOLLOW_UP" },
    { id: "P004", name: "Sarah Namutebi", age: 29, gender: "F", phone: "+256 704 567 890", email: "s.namutebi@email.com", problem: "Pneumonia", lastVisit: "2026-05-25", status: "ACTIVE" },
    { id: "P005", name: "James Okello", age: 55, gender: "M", phone: "+256 705 678 901", email: "j.okello@email.com", problem: "COPD exacerbation", lastVisit: "2026-05-20", status: "FOLLOW_UP" },
    { id: "P006", name: "Alice Nakirya", age: 38, gender: "F", phone: "+256 706 789 012", email: "a.nakirya@email.com", problem: "Renal failure - CKD Stage 3", lastVisit: "2026-05-21", status: "ACTIVE" },
    { id: "P007", name: "Robert Mugisha", age: 61, gender: "M", phone: "+256 707 890 123", email: "r.mugisha@email.com", problem: "Cardiac arrhythmia", lastVisit: "2026-05-18", status: "STABLE" },
    { id: "P008", name: "Agnes Nantale", age: 44, gender: "F", phone: "+256 708 901 234", email: "a.nantale@email.com", problem: "Hypothyroidism", lastVisit: "2026-05-15", status: "STABLE" },
];

const STATUS_BADGE: Record<string, string> = {
    ACTIVE: "bg-blue-50 text-blue-700 border-blue-100",
    FOLLOW_UP: "bg-amber-50 text-amber-700 border-amber-100",
    STABLE: "bg-green-50 text-green-700 border-green-100",
};

export default function MyPatientsPage() {
    const [search, setSearch] = useState("");
    const filtered = patients.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.problem.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <UserCheck className="h-6 w-6 text-blue-600" /> My Patients
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">{filtered.length} patients under your care</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Search by name or condition..." />
                    </div>
                </div>
                <div className="divide-y divide-gray-50">
                    {filtered.map((p, i) => (
                        <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                            className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-start justify-between">
                                <div className="flex items-start gap-3">
                                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                                        {p.name.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">{p.name}
                                            <span className="ml-2 text-xs font-normal text-gray-400">{p.age}y / {p.gender}</span>
                                        </p>
                                        <p className="text-xs text-gray-500 mt-0.5">{p.problem}</p>
                                        <div className="flex items-center gap-3 mt-1.5">
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1"><Phone className="h-3 w-3" />{p.phone}</span>
                                            <span className="text-[10px] text-gray-400 flex items-center gap-1"><CalendarDays className="h-3 w-3" />Last: {p.lastVisit}</span>
                                        </div>
                                    </div>
                                </div>
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_BADGE[p.status]}`}>
                                    {p.status.replace("_", " ")}
                                </span>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { UserCheck, Search, Phone, CalendarDays, Loader2, RefreshCw, Mail } from "lucide-react";

interface PatientSummary {
    key: string;
    name: string;
    email: string;
    phone?: string;
    lastVisit: string;
    lastNotes: string;
    visitCount: number;
    latestStatus: string;
}

const APPT_STATUS_MAP: Record<string, { label: string; badge: string }> = {
    SCHEDULED:       { label: "SCHEDULED",       badge: "bg-gray-50 text-gray-500 border-gray-100" },
    CONFIRMED:       { label: "CONFIRMED",       badge: "bg-gray-50 text-gray-500 border-gray-100" },
    PENDING_PAYMENT: { label: "AWAITING PAYMENT", badge: "bg-amber-50 text-amber-700 border-amber-100" },
    CALLED:          { label: "CALLED",          badge: "bg-purple-50 text-purple-700 border-purple-100" },
    COMPLETED:       { label: "COMPLETED",       badge: "bg-green-50 text-green-700 border-green-100" },
    IN_CONSULTATION: { label: "IN CONSULTATION", badge: "bg-blue-50 text-blue-700 border-blue-100" },
    CANCELLED:       { label: "CANCELLED",       badge: "bg-red-50 text-red-500 border-red-100" },
};

export default function MyPatientsPage() {
    const { profile } = useAuth();
    const [patients, setPatients] = useState<PatientSummary[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const load = async () => {
        if (!profile?.uid) return;
        setLoading(true);
        try {
            const snap = await getDocs(
                query(
                    collection(db, "appointments"),
                    where("doctorId", "==", profile.uid),
                    orderBy("date", "desc"),
                )
            );

            // Deduplicate by patientEmail — keep most-recent appointment's data
            const map = new Map<string, PatientSummary>();
            snap.docs.forEach(d => {
                const data = d.data() as Record<string, string>;
                const key = data.patientEmail || data.patientName;
                if (!key) return;
                if (map.has(key)) {
                    // Already have a more recent entry — just increment visitCount
                    map.get(key)!.visitCount++;
                } else {
                    map.set(key, {
                        key,
                        name: data.patientName || "Unknown",
                        email: data.patientEmail || "",
                        phone: "",
                        lastVisit: data.date || "",
                        lastNotes: data.notes || "",
                        visitCount: 1,
                        latestStatus: data.status || "SCHEDULED",
                    });
                }
            });

            setPatients(Array.from(map.values()));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { load(); }, [profile?.uid]);

    const filtered = patients.filter(p => {
        const q = search.toLowerCase();
        return !q || p.name.toLowerCase().includes(q) || p.lastNotes.toLowerCase().includes(q) || p.email.toLowerCase().includes(q);
    });

    const formatDate = (iso: string) => {
        if (!iso) return "—";
        try { return new Date(iso + "T00:00:00").toLocaleDateString("en-UG", { day: "2-digit", month: "short", year: "numeric" }); }
        catch { return iso; }
    };

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <UserCheck className="h-6 w-6 text-blue-600" /> My Patients
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {loading ? "Loading…" : `${filtered.length} patient${filtered.length !== 1 ? "s" : ""} with appointments under your care`}
                    </p>
                </div>
                <button onClick={load} disabled={loading}
                    className="h-9 w-9 rounded-xl border border-gray-100 bg-white shadow-sm flex items-center justify-center text-gray-400 hover:text-blue-600 transition-colors disabled:opacity-50">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-3.5 border-b border-gray-50 flex items-center gap-3">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 text-sm bg-gray-50 rounded-xl border-0 outline-none focus:ring-2 focus:ring-blue-500/20"
                            placeholder="Search by name, email or notes..." />
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20 gap-2 text-gray-400 text-sm">
                        <Loader2 className="h-5 w-5 animate-spin" /> Loading your patients…
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="text-center py-20 text-gray-400 text-sm">
                        {search ? "No patients match your search." : "No appointments found for your account yet."}
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {filtered.map((p, i) => {
                            const statusCfg = APPT_STATUS_MAP[p.latestStatus] ?? APPT_STATUS_MAP.SCHEDULED;
                            return (
                                <motion.div key={p.key} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
                                    className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex items-start gap-3 min-w-0">
                                            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white font-black text-sm shrink-0">
                                                {p.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-gray-900 truncate">{p.name}</p>
                                                {p.lastNotes && (
                                                    <p className="text-xs text-gray-500 mt-0.5 truncate">{p.lastNotes}</p>
                                                )}
                                                <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                    {p.email && (
                                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                            <Mail className="h-3 w-3 shrink-0" />{p.email}
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                                        <CalendarDays className="h-3 w-3 shrink-0" />Last: {formatDate(p.lastVisit)}
                                                    </span>
                                                    <span className="text-[10px] text-gray-400">
                                                        {p.visitCount} visit{p.visitCount !== 1 ? "s" : ""}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 whitespace-nowrap ${statusCfg.badge}`}>
                                            {statusCfg.label}
                                        </span>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

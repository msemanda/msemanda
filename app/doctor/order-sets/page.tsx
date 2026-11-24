"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, Search, ChevronRight, User, CheckCircle2, Loader2 } from "lucide-react";

const orderSets = [
    {
        id: "OS001",
        name: "Acute Myocardial Infarction (STEMI)",
        category: "Cardiology",
        orders: ["ECG stat", "Troponin-I STAT", "CK-MB STAT", "Chest X-Ray PA", "Aspirin 300mg STAT", "Clopidogrel 600mg STAT", "IV Heparin infusion", "Oxygen 4L/min via nasal prongs", "IV access x2, Normal Saline", "Continuous cardiac monitoring", "Cardiology consult URGENT"],
    },
    {
        id: "OS002",
        name: "Community-Acquired Pneumonia (CAP)",
        category: "Respiratory",
        orders: ["CBC with differential", "CRP, Procalcitonin", "Sputum culture x2", "Blood culture x2", "Chest X-Ray PA", "SpO₂ monitoring", "Amoxicillin-Clavulanate 875mg BD IV", "Azithromycin 500mg OD IV", "Paracetamol 1g TDS PRN", "Oxygen therapy if SpO₂ < 94%", "Respiratory physiotherapy"],
    },
    {
        id: "OS003",
        name: "Diabetic Ketoacidosis (DKA)",
        category: "Endocrinology",
        orders: ["Blood glucose STAT", "ABG STAT", "Electrolytes (Na, K, Cl, Bicarb)", "Serum ketones", "ECG", "IV Normal Saline 1L over 1hr", "Insulin infusion protocol", "Potassium replacement protocol", "Strict I&O monitoring", "2-hourly blood glucose", "Endocrinology consult"],
    },
    {
        id: "OS004",
        name: "Post-Operative General Care",
        category: "Surgery",
        orders: ["Vital signs q4h", "Pain score assessment", "IV Paracetamol 1g TDS", "Morphine PCA if severe pain", "Wound dressing BD", "DVT prophylaxis - Enoxaparin 40mg OD", "TED stockings", "Early mobilization", "Dietitian consult for nutrition", "Physiotherapy referral"],
    },
    {
        id: "OS005",
        name: "Sepsis 1-Hour Bundle",
        category: "Emergency",
        orders: ["Blood culture x2 BEFORE antibiotics", "Serum Lactate STAT", "FBC, CMP, Coagulation", "Procalcitonin", "IV access x2", "IV Normal Saline 30mL/kg STAT", "Piperacillin-Tazobactam 4.5g IV STAT", "Vasopressor if MAP < 65 despite fluids", "Foley catheter for strict I&O", "ICU consult", "Repeat Lactate in 2hrs"],
    },
];

interface ActivePatient {
    id: string;
    patientName: string;
    patientEmail?: string;
    ward?: string;
}

export default function OrderSetsPage() {
    const { profile } = useAuth();
    const [search, setSearch] = useState("");
    const [expanded, setExpanded] = useState<string | null>(null);
    const [selectedCategory, setSelectedCategory] = useState("All");

    const [patients, setPatients] = useState<ActivePatient[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<ActivePatient | null>(null);
    const [applying, setApplying] = useState<string | null>(null);
    const [applied, setApplied] = useState<string | null>(null);

    useEffect(() => {
        const fetchPatients = async () => {
            if (!profile?.uid) return;
            try {
                const today = new Date().toISOString().split("T")[0];
                const [ipdSnap, apptSnap] = await Promise.all([
                    getDocs(query(collection(db, "ipdAdmissions"), where("status", "==", "ADMITTED"))),
                    getDocs(query(
                        collection(db, "appointments"),
                        where("doctorId", "==", profile.uid),
                        where("date", "==", today),
                    )),
                ]);
                const inpatients = ipdSnap.docs.map(d => ({ id: d.id, ...d.data(), ward: (d.data() as any).ward || "IPD" })) as ActivePatient[];
                const outpatients = apptSnap.docs
                    .filter(d => !["COMPLETED", "CANCELLED", "PENDING_PAYMENT"].includes((d.data() as any).status))
                    .map(d => ({ id: d.id, patientName: (d.data() as any).patientName, patientEmail: (d.data() as any).patientEmail, ward: "OPD" })) as ActivePatient[];
                setPatients([...inpatients, ...outpatients]);
            } catch (e) { console.error(e); }
        };
        fetchPatients();
    }, [profile?.uid]);

    const categories = ["All", ...Array.from(new Set(orderSets.map(o => o.category)))];
    const filtered = orderSets.filter(o =>
        (selectedCategory === "All" || o.category === selectedCategory) &&
        o.name.toLowerCase().includes(search.toLowerCase())
    );

    const handleApply = async (os: typeof orderSets[number]) => {
        if (!selectedPatient) return;
        setApplying(os.id);
        try {
            await Promise.all(os.orders.map(orderText =>
                addDoc(collection(db, "cpoeOrders"), {
                    orderType: "PROCEDURE",
                    detail: orderText,
                    patientName: selectedPatient.patientName,
                    patientEmail: selectedPatient.patientEmail || "",
                    ward: selectedPatient.ward || "",
                    orderSet: os.name,
                    amount: 0,
                    priority: "ROUTINE",
                    notes: "",
                    orderedBy: profile?.name,
                    orderedByUid: profile?.uid,
                    status: "PENDING",
                    createdAt: serverTimestamp(),
                })
            ));
            setApplied(os.id);
            setTimeout(() => setApplied(null), 3000);
        } catch (e) { console.error(e); }
        finally { setApplying(null); }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2"><Stethoscope className="h-6 w-6 text-blue-600" /> Clinical Order Sets</h1>
                <p className="text-sm text-gray-500 mt-0.5">Standardized order-set templates — select a patient, then apply one to send its orders to CPOE</p>
            </div>

            {/* Patient selector — required before Apply can do anything real */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <User className="h-3.5 w-3.5" /> Patient
                </label>
                <select
                    className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                    value={selectedPatient?.id || ""}
                    onChange={e => setSelectedPatient(patients.find(p => p.id === e.target.value) || null)}
                >
                    <option value="">Select a patient…</option>
                    {patients.map(p => (
                        <option key={p.id} value={p.id}>{p.patientName} · {p.ward}</option>
                    ))}
                </select>
                {patients.length === 0 && (
                    <p className="text-[11px] text-gray-400 mt-1.5">No active inpatients or today's appointments found for you.</p>
                )}
            </div>

            {/* Filter bar */}
            <div className="flex items-center gap-3 flex-wrap">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 text-sm bg-white rounded-xl border border-gray-100 outline-none focus:ring-2 focus:ring-blue-500/20 shadow-sm" placeholder="Search order sets..." />
                </div>
                <div className="flex gap-1.5">
                    {categories.map(c => (
                        <button key={c} onClick={() => setSelectedCategory(c)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${selectedCategory === c ? "bg-blue-600 text-white" : "bg-white text-gray-500 border border-gray-100 hover:bg-gray-50"}`}>
                            {c}
                        </button>
                    ))}
                </div>
            </div>

            {/* Order set cards */}
            <div className="space-y-3">
                {filtered.map((os, i) => (
                    <motion.div key={os.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        <div
                            onClick={() => setExpanded(expanded === os.id ? null : os.id)}
                            className="w-full px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <p className="text-sm font-bold text-gray-900">{os.name}</p>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-blue">{os.category}</span>
                                </div>
                                <p className="text-xs text-gray-400">{os.orders.length} orders</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <AnimatePresence mode="wait">
                                    {applied === os.id ? (
                                        <motion.span key="applied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="px-3 py-1.5 rounded-lg bg-green-50 text-green-700 text-xs font-bold flex items-center gap-1.5">
                                            <CheckCircle2 className="h-3.5 w-3.5" /> Sent to CPOE
                                        </motion.span>
                                    ) : (
                                        <motion.button key="apply" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            onClick={(e) => { e.stopPropagation(); handleApply(os); }}
                                            disabled={!selectedPatient || applying === os.id}
                                            title={!selectedPatient ? "Select a patient first" : undefined}
                                            className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors flex items-center gap-1.5"
                                        >
                                            {applying === os.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Apply"}
                                        </motion.button>
                                    )}
                                </AnimatePresence>
                                <ChevronRight className={`h-4 w-4 text-gray-400 transition-transform ${expanded === os.id ? "rotate-90" : ""}`} />
                            </div>
                        </div>
                        {expanded === os.id && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} className="border-t border-gray-50 px-5 py-4 bg-gray-50/50">
                                <ul className="space-y-1.5">
                                    {os.orders.map((order, idx) => (
                                        <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
                                            <div className="h-1.5 w-1.5 rounded-full bg-blue-400 shrink-0" />
                                            {order}
                                        </li>
                                    ))}
                                </ul>
                            </motion.div>
                        )}
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

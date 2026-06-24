"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";
import { Apple, Users, UtensilsCrossed, AlertCircle } from "lucide-react";

interface DietPlan {
    id: string;
    patientName: string;
    diagnosis?: string;
    dietType?: string;
    targetCalories?: number;
    restrictions?: string[];
    bedNumber?: string;
    wardName?: string;
    status: string;
}

interface MenuEntry {
    id: string;
    date: string;
    breakfast?: string[];
    lunch?: string[];
    dinner?: string[];
}

export default function DietaryDashboard() {
    const { profile } = useAuth();
    const [plans, setPlans]   = useState<DietPlan[]>([]);
    const [menu, setMenu]     = useState<MenuEntry | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const today = new Date().toISOString().split("T")[0];
        Promise.all([
            getDocs(query(
                collection(db, "orders"),
                where("orderType", "==", "DIET"),
                where("status", "==", "ACTIVE"),
                orderBy("createdAt", "desc"),
            )),
            getDocs(query(collection(db, "categories"), where("type", "==", "MENU"), where("date", "==", today))),
        ])
            .then(([planSnap, menuSnap]) => {
                setPlans(planSnap.docs.map(d => ({ id: d.id, ...d.data() } as DietPlan)));
                if (!menuSnap.empty) {
                    setMenu({ id: menuSnap.docs[0].id, ...menuSnap.docs[0].data() } as MenuEntry);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const specialDiets = plans.filter(p => p.dietType && p.dietType !== "Standard");
    const alerts       = plans.filter(p => (p.restrictions?.length ?? 0) > 2);
    const seenToday    = plans.filter(p => p.status === "SEEN_TODAY").length;

    const stats = [
        { label: "Active Diet Plans",    value: String(plans.length),        icon: UtensilsCrossed, color: "text-green-600",  bg: "bg-green-50"  },
        { label: "Patients Seen Today",  value: String(seenToday),           icon: Users,           color: "text-blue-600",   bg: "bg-blue-50"   },
        { label: "Special Diets",        value: String(specialDiets.length), icon: Apple,           color: "text-orange-600", bg: "bg-orange-50" },
        { label: "Nutrition Alerts",     value: String(alerts.length),       icon: AlertCircle,     color: "text-red-600",    bg: "bg-red-50"    },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Dietary Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Welcome, <span className="font-bold text-green-600">{profile?.name}</span> &bull; Nutrition & Dietary Services
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
                            <div className={`inline-flex p-2.5 rounded-xl ${s.bg} mb-3`}><Icon className={`h-5 w-5 ${s.color}`} /></div>
                            <p className="text-2xl font-black text-gray-900">{loading ? "—" : s.value}</p>
                            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Diet plans */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50">
                        <h2 className="font-bold text-gray-900">Active Diet Plans</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {loading && <div className="px-5 py-8 text-center text-sm text-gray-400">Loading diet plans…</div>}
                        {!loading && plans.length === 0 && (
                            <div className="px-5 py-8 text-center text-sm text-gray-400">No active diet plans — create DIET orders from the doctor&apos;s CPOE module</div>
                        )}
                        {plans.map((p, i) => (
                            <motion.div key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                className="px-5 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between mb-1">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">
                                            {p.patientName}
                                            {(p.bedNumber || p.wardName) && (
                                                <span className="text-gray-400 font-normal text-xs ml-1">
                                                    ({p.wardName}{p.bedNumber ? ` · Bed ${p.bedNumber}` : ""})
                                                </span>
                                            )}
                                        </p>
                                        <p className="text-xs text-gray-500">{p.diagnosis}</p>
                                    </div>
                                    {p.targetCalories && (
                                        <div className="text-right">
                                            <p className="text-sm font-black text-green-600">{p.targetCalories} kcal</p>
                                            <p className="text-[10px] text-gray-400">daily target</p>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                    {p.dietType && <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-green">{p.dietType}</span>}
                                    {(p.restrictions ?? []).map((r) => (
                                        <span key={r} className="text-[10px] font-semibold px-2 py-0.5 rounded-full badge-red">{r}</span>
                                    ))}
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* Today's menu */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-900 text-sm mb-4 flex items-center gap-2">
                        <Apple className="h-4 w-4 text-green-600" /> Today&apos;s Standard Menu
                    </h3>
                    {loading && <p className="text-xs text-gray-400">Loading menu…</p>}
                    {!loading && !menu && (
                        <p className="text-xs text-gray-400">No menu configured for today. Add a menu entry in the categories collection with type &quot;MENU&quot;.</p>
                    )}
                    {menu && (
                        <div className="space-y-4">
                            {(["breakfast", "lunch", "dinner"] as const).map((meal) => {
                                const items = menu[meal] ?? [];
                                if (items.length === 0) return null;
                                return (
                                    <div key={meal}>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1.5 capitalize">{meal}</p>
                                        <ul className="space-y-1">
                                            {items.map((item) => (
                                                <li key={item} className="text-xs text-gray-700 flex items-center gap-1.5">
                                                    <div className="h-1.5 w-1.5 rounded-full bg-green-400 shrink-0" />
                                                    {item}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

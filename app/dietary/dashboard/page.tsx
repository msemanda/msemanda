"use client";

import { motion } from "framer-motion";
import { Apple, Users, UtensilsCrossed, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const stats = [
    { label: "Active Diet Plans", value: "31", icon: UtensilsCrossed, color: "text-green-600", bg: "bg-green-50" },
    { label: "Patients Seen Today", value: "7", icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Special Diets", value: "14", icon: Apple, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "Nutrition Alerts", value: "3", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
];

const dietPlans = [
    { patient: "John Mwesiga", diagnosis: "Type 2 Diabetes", diet: "Low-carb diabetic", calories: 1800, restrictions: ["Sugar", "White rice"], ward: "A-01" },
    { patient: "Grace Nakato", diagnosis: "Hypertension", diet: "DASH Diet", calories: 2000, restrictions: ["Salt", "Saturated fats"], ward: "A-02" },
    { patient: "Patrick Ssemanda", diagnosis: "Post-op surgery", diet: "Soft diet", calories: 1500, restrictions: ["Solid foods", "Spicy"], ward: "B-01" },
    { patient: "Sarah Namutebi", diagnosis: "Celiac disease", diet: "Gluten-free", calories: 2200, restrictions: ["Gluten", "Wheat"], ward: "B-03" },
    { patient: "James Okello", diagnosis: "Renal failure", diet: "Low-protein, Low-potassium", calories: 1600, restrictions: ["Bananas", "High protein"], ward: "C-02" },
];

const todayMenu = {
    breakfast: ["Oatmeal porridge", "Boiled eggs (2)", "Fresh orange juice", "Whole wheat bread"],
    lunch: ["Steamed chicken breast", "Brown rice", "Mixed vegetables", "Clear soup"],
    dinner: ["Grilled fish (tilapia)", "Mashed sweet potatoes", "Steamed broccoli", "Low-fat milk"],
};

export default function DietaryDashboard() {
    const { profile } = useAuth();

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Dietary Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">Welcome, <span className="font-bold text-green-600">{profile?.name}</span> &bull; Nutrition & Dietary Services</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
                            <div className={`inline-flex p-2.5 rounded-xl ${s.bg} mb-3`}><Icon className={`h-5 w-5 ${s.color}`} /></div>
                            <p className="text-2xl font-black text-gray-900">{s.value}</p>
                            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Diet plans table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50">
                        <h2 className="font-bold text-gray-900">Active Diet Plans</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {dietPlans.map((p, i) => (
                            <motion.div key={p.patient} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                                className="px-5 py-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between mb-1">
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{p.patient} <span className="text-gray-400 font-normal text-xs">({p.ward})</span></p>
                                        <p className="text-xs text-gray-500">{p.diagnosis}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm font-black text-green-600">{p.calories} kcal</p>
                                        <p className="text-[10px] text-gray-400">daily target</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2 mt-1.5">
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full badge-green">{p.diet}</span>
                                    {p.restrictions.map((r) => (
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
                    <div className="space-y-4">
                        {Object.entries(todayMenu).map(([meal, items]) => (
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
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

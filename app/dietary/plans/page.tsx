"use client";

import { motion } from "framer-motion";
import { UtensilsCrossed } from "lucide-react";

const plans = [
    { patient: "John Mwesiga", condition: "Type 2 DM + Hypertension", calories: 1800, restrictions: ["Low sugar", "Low sodium", "Low GI"], breakfast: ["Oats porridge", "Boiled egg", "Black tea (no sugar)"], lunch: ["Brown rice", "Green grams", "Steamed fish", "Salad"], dinner: ["Sweet potato", "Bean stew", "Steamed vegetables"], dietitian: "Dietitian Nakato" },
    { patient: "Alice Nakirya", condition: "CKD Stage 3", calories: 1600, restrictions: ["Low potassium", "Low phosphorus", "Low protein", "Low sodium"], breakfast: ["White rice porridge", "Apple (peeled)", "Black tea"], lunch: ["White rice", "Chicken (boiled, small portion)", "Cucumber"], dinner: ["Cassava", "Egg white omelette", "Cabbage"], dietitian: "Dietitian Nakato" },
    { patient: "Sarah Namutebi", condition: "Pneumonia — recovery", calories: 2200, restrictions: ["High protein", "High calorie"], breakfast: ["Porridge with milk", "Eggs ×2", "Whole wheat bread", "Orange juice"], lunch: ["Whole grain rice", "Beef stew", "Beans", "Mixed vegetables"], dinner: ["Irish potatoes", "Chicken soup", "Spinach"], dietitian: "Dietitian Nakato" },
];

export default function DietPlans() {
    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <UtensilsCrossed className="h-6 w-6 text-emerald-600" /> Diet Plans
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">{plans.length} active diet plans</p>
            </div>
            <div className="space-y-4">
                {plans.map((p, i) => (
                    <motion.div key={p.patient} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <div className="flex items-start justify-between mb-3">
                            <div>
                                <p className="text-sm font-black text-gray-900">{p.patient}</p>
                                <p className="text-xs text-gray-500">{p.condition} · {p.calories} kcal/day</p>
                            </div>
                            <div className="flex flex-wrap gap-1 justify-end">
                                {p.restrictions.map(r => (
                                    <span key={r} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-600 border border-red-100">{r}</span>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            {[{ label: "Breakfast", items: p.breakfast }, { label: "Lunch", items: p.lunch }, { label: "Dinner", items: p.dinner }].map(meal => (
                                <div key={meal.label} className="bg-emerald-50/50 rounded-xl p-3">
                                    <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider mb-2">{meal.label}</p>
                                    <ul className="space-y-0.5">
                                        {meal.items.map(item => (
                                            <li key={item} className="text-xs text-gray-700">• {item}</li>
                                        ))}
                                    </ul>
                                </div>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-400 mt-3">Prepared by {p.dietitian}</p>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

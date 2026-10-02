"use client";

import { motion } from "framer-motion";
import { Apple } from "lucide-react";

const tips = [
    { category: "Diabetes Management", items: ["Choose low GI foods (oats, brown rice, sweet potatoes)", "Limit sugar and refined carbohydrates", "Eat regular small meals — avoid skipping", "Increase fibre intake (vegetables, legumes, whole grains)", "Limit saturated fats and fried foods"] },
    { category: "Heart Health", items: ["Reduce sodium — avoid adding extra salt", "Increase omega-3 fatty acids (fish, groundnuts)", "Choose lean proteins (chicken, fish, beans)", "Increase fruits and vegetables — aim for 5 portions/day", "Avoid trans fats and processed foods"] },
    { category: "Weight Management", items: ["Practice portion control — use a smaller plate", "Eat slowly and mindfully", "Stay hydrated — drink 8 glasses of water daily", "Limit high-calorie drinks (sodas, juices, alcohol)", "Include physical activity with dietary changes"] },
    { category: "General Wellness", items: ["Eat a rainbow — variety of coloured fruits and vegetables", "Include probiotics (yoghurt, fermented foods)", "Limit ultra-processed foods", "Cook at home more often", "Plan meals in advance to avoid unhealthy choices"] },
];

const foodGroups = [
    { group: "Carbohydrates", examples: "Brown rice, sweet potato, oats, millet, cassava", recommendation: "Make 1/4 of your plate", color: "bg-amber-50 border-amber-100" },
    { group: "Proteins", examples: "Chicken, fish, beans, lentils, eggs, groundnuts", recommendation: "Make 1/4 of your plate", color: "bg-blue-50 border-blue-100" },
    { group: "Vegetables", examples: "Spinach, cabbage, carrots, tomatoes, broccoli", recommendation: "Make 1/2 of your plate", color: "bg-green-50 border-green-100" },
    { group: "Fats", examples: "Avocado, olive oil, groundnuts (small amounts)", recommendation: "Use sparingly", color: "bg-yellow-50 border-yellow-100" },
];

export default function WellnessNutrition() {
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Apple className="h-6 w-6 text-violet-600" /> Nutrition Hub
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Evidence-based nutrition guidance for wellness programs</p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {foodGroups.map((f, i) => (
                    <motion.div key={f.group} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className={`rounded-2xl border p-4 ${f.color}`}>
                        <p className="text-xs font-black text-gray-900 mb-1">{f.group}</p>
                        <p className="text-[10px] text-gray-600 mb-2">{f.examples}</p>
                        <p className="text-[10px] font-bold text-violet-600">{f.recommendation}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {tips.map((t, i) => (
                    <motion.div key={t.category} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.06 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-sm font-black text-gray-900 mb-3">{t.category}</h2>
                        <ul className="space-y-2">
                            {t.items.map(item => (
                                <li key={item} className="text-xs text-gray-700 flex items-start gap-2">
                                    <Apple className="h-3 w-3 text-violet-400 shrink-0 mt-0.5" />{item}
                                </li>
                            ))}
                        </ul>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

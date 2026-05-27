"use client";

import { motion } from "framer-motion";
import { Apple } from "lucide-react";

const menu = {
    breakfast: [
        { item: "Oats porridge", calories: 180, protein: "6g", tags: ["Low GI", "High Fibre"] },
        { item: "Millet porridge", calories: 160, protein: "5g", tags: ["Gluten free"] },
        { item: "Boiled eggs (×2)", calories: 140, protein: "12g", tags: ["High Protein"] },
        { item: "Whole wheat bread (2 slices)", calories: 160, protein: "6g", tags: [] },
        { item: "Fresh fruit salad", calories: 80, protein: "1g", tags: ["Low Calorie", "Vitamin C"] },
    ],
    lunch: [
        { item: "Brown rice + bean stew", calories: 420, protein: "18g", tags: ["High Fibre", "High Protein"] },
        { item: "Steamed fish + matooke", calories: 380, protein: "22g", tags: ["Low Fat"] },
        { item: "Chicken soup + bread", calories: 340, protein: "28g", tags: ["High Protein"] },
        { item: "Green grams + ugali", calories: 400, protein: "16g", tags: ["Low GI"] },
    ],
    dinner: [
        { item: "Sweet potato + vegetable stew", calories: 280, protein: "8g", tags: ["Low Sodium", "High Fibre"] },
        { item: "Cassava + groundnut sauce", calories: 320, protein: "10g", tags: [] },
        { item: "Millet bread + bean stew", calories: 360, protein: "14g", tags: ["High Fibre"] },
    ],
    snacks: [
        { item: "Banana", calories: 90, protein: "1g", tags: [] },
        { item: "Groundnuts (30g)", calories: 170, protein: "8g", tags: ["High Protein"] },
        { item: "Yoghurt (plain)", calories: 100, protein: "10g", tags: ["Probiotic"] },
    ],
};

export default function FoodMenu() {
    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Apple className="h-6 w-6 text-emerald-600" /> Hospital Food Menu
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Standard ward diet options — nutritional values per serving</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(menu).map(([meal, items], gi) => (
                    <motion.div key={meal} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: gi * 0.08 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        <h2 className="text-sm font-black text-gray-900 capitalize mb-4">{meal}</h2>
                        <div className="space-y-2">
                            {items.map(item => (
                                <div key={item.item} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-800">{item.item}</p>
                                        <div className="flex gap-1.5 mt-0.5">
                                            {item.tags.map(t => (
                                                <span key={t} className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0 ml-3">
                                        <p className="text-xs font-bold text-gray-700">{item.calories} kcal</p>
                                        <p className="text-[10px] text-gray-400">{item.protein} protein</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

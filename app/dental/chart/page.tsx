"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ClipboardList } from "lucide-react";

// Standard FDI tooth numbering — 32 adult teeth
const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
const UPPER_LEFT  = [21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_LEFT  = [31, 32, 33, 34, 35, 36, 37, 38];
const LOWER_RIGHT = [41, 42, 43, 44, 45, 46, 47, 48];

const CONDITIONS: Record<number, { label: string; color: string }> = {
    16: { label: "Caries", color: "bg-red-400" },
    26: { label: "Filling", color: "bg-blue-400" },
    36: { label: "Crown", color: "bg-yellow-400" },
    38: { label: "Extracted", color: "bg-gray-400" },
    46: { label: "Caries", color: "bg-red-400" },
};

const LEGEND = [
    { label: "Healthy", color: "bg-green-200" },
    { label: "Caries", color: "bg-red-400" },
    { label: "Filling", color: "bg-blue-400" },
    { label: "Crown", color: "bg-yellow-400" },
    { label: "Extracted", color: "bg-gray-400" },
];

function ToothRow({ teeth, label }: { teeth: number[]; label: string }) {
    const [selected, setSelected] = useState<number | null>(null);
    return (
        <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2 text-center">{label}</p>
            <div className="flex justify-center gap-1.5">
                {teeth.map(t => {
                    const cond = CONDITIONS[t];
                    return (
                        <button key={t} onClick={() => setSelected(selected === t ? null : t)}
                            className={`relative flex flex-col items-center group`}>
                            <div className={`w-9 h-10 rounded-lg border-2 flex items-center justify-center text-[9px] font-black transition-all ${cond ? `${cond.color} text-white border-transparent` : "bg-green-50 text-green-700 border-green-100 hover:border-green-300"} ${selected === t ? "ring-2 ring-blue-500 scale-110" : ""}`}>
                                {t}
                            </div>
                            {cond && <span className="text-[8px] text-gray-400 mt-0.5">{cond.label}</span>}
                        </button>
                    );
                })}
            </div>
        </div>
    );
}

export default function DentalChart() {
    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <ClipboardList className="h-6 w-6 text-pink-600" /> Dental Chart
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">FDI tooth numbering system</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6">
                <div className="flex justify-center gap-4 flex-wrap">
                    {LEGEND.map(l => (
                        <div key={l.label} className="flex items-center gap-1.5">
                            <div className={`w-3 h-3 rounded ${l.color}`} />
                            <span className="text-[10px] text-gray-500">{l.label}</span>
                        </div>
                    ))}
                </div>
                <div className="border-b border-dashed border-gray-100 pb-6 space-y-4">
                    <ToothRow teeth={UPPER_RIGHT} label="Upper Right (18→11)" />
                    <ToothRow teeth={UPPER_LEFT} label="Upper Left (21→28)" />
                </div>
                <div className="space-y-4 pt-2">
                    <ToothRow teeth={LOWER_LEFT} label="Lower Left (31→38)" />
                    <ToothRow teeth={LOWER_RIGHT} label="Lower Right (41→48)" />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-sm font-black text-gray-900 mb-3">Charted Findings</h2>
                <div className="space-y-2">
                    {Object.entries(CONDITIONS).map(([tooth, cond]) => (
                        <div key={tooth} className="flex items-center gap-3 text-xs">
                            <span className={`h-6 w-8 rounded-md ${cond.color} text-white flex items-center justify-center font-black text-[10px]`}>{tooth}</span>
                            <span className="font-semibold text-gray-700">{cond.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

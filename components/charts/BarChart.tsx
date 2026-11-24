"use client";

import { motion } from "framer-motion";
import { colorFor } from "./palette";

export interface BarDatum {
    label: string;
    value: number;
    color?: string;
}

interface BarChartProps {
    data: BarDatum[];
    formatValue?: (v: number) => string;
    className?: string;
}

/** Horizontal bar chart — single series, no legend needed (title names the metric). */
export function BarChart({ data, formatValue = (v) => v.toLocaleString(), className = "" }: BarChartProps) {
    const max = Math.max(...data.map(d => d.value), 1);

    if (data.length === 0) {
        return <p className="text-xs text-gray-400 text-center py-10">No data</p>;
    }

    return (
        <div className={`space-y-3 ${className}`}>
            {data.map((d, i) => {
                const pct = Math.max((d.value / max) * 100, 2);
                const color = d.color ?? colorFor(i);
                return (
                    <div key={d.label} className="group">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-bold text-gray-700 truncate pr-2">{d.label}</span>
                            <span className="text-xs font-black text-gray-900 shrink-0 tabular-nums">{formatValue(d.value)}</span>
                        </div>
                        <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden relative">
                            <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${pct}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="h-full rounded-full transition-[filter] group-hover:brightness-110"
                                style={{ backgroundColor: color }}
                                title={`${d.label}: ${formatValue(d.value)}`}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

"use client";

import { useState } from "react";
import { colorFor } from "./palette";

export interface DonutDatum {
    label: string;
    value: number;
    color?: string;
}

interface DonutChartProps {
    data: DonutDatum[];
    formatValue?: (v: number) => string;
    size?: number;
    className?: string;
}

function polarToCartesian(cx: number, cy: number, r: number, angleDeg: number) {
    const rad = ((angleDeg - 90) * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(cx: number, cy: number, rOuter: number, rInner: number, startAngle: number, endAngle: number) {
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    const oStart = polarToCartesian(cx, cy, rOuter, endAngle);
    const oEnd = polarToCartesian(cx, cy, rOuter, startAngle);
    const iStart = polarToCartesian(cx, cy, rInner, startAngle);
    const iEnd = polarToCartesian(cx, cy, rInner, endAngle);
    return [
        `M ${oStart.x} ${oStart.y}`,
        `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${oEnd.x} ${oEnd.y}`,
        `L ${iStart.x} ${iStart.y}`,
        `A ${rInner} ${rInner} 0 ${largeArc} 1 ${iEnd.x} ${iEnd.y}`,
        "Z",
    ].join(" ");
}

/** Donut chart — categorical shares. Always paired with a legend (≥2 series). */
export function DonutChart({ data, formatValue = (v) => v.toLocaleString(), size = 180, className = "" }: DonutChartProps) {
    const [hovered, setHovered] = useState<number | null>(null);
    const total = data.reduce((s, d) => s + d.value, 0);

    if (data.length === 0 || total === 0) {
        return <p className="text-xs text-gray-400 text-center py-10">No data</p>;
    }

    const cx = size / 2, cy = size / 2;
    const rOuter = size / 2;
    const rInner = rOuter * 0.62;

    let cursor = 0;
    const segments = data.map((d, i) => {
        const fraction = d.value / total;
        const start = cursor * 360;
        const end = (cursor + fraction) * 360;
        cursor += fraction;
        return { ...d, start, end, index: i, color: d.color ?? colorFor(i), pct: fraction * 100 };
    });

    const active = hovered !== null ? segments[hovered] : null;

    return (
        <div className={`flex flex-col sm:flex-row items-center gap-6 ${className}`}>
            <div className="relative shrink-0" style={{ width: size, height: size }}>
                <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                    {segments.map(s => (
                        <path
                            key={s.label}
                            d={arcPath(cx, cy, rOuter, rInner, s.start, s.end)}
                            fill={s.color}
                            stroke="#fff"
                            strokeWidth={2}
                            opacity={hovered === null || hovered === s.index ? 1 : 0.35}
                            onMouseEnter={() => setHovered(s.index)}
                            onMouseLeave={() => setHovered(null)}
                            className="cursor-pointer transition-opacity"
                        >
                            <title>{`${s.label}: ${formatValue(s.value)} (${s.pct.toFixed(1)}%)`}</title>
                        </path>
                    ))}
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <p className="text-lg font-black text-gray-900 tabular-nums">
                        {active ? formatValue(active.value) : formatValue(total)}
                    </p>
                    <p className="text-[10px] text-gray-400 font-semibold text-center px-3 truncate max-w-[80px]">
                        {active ? active.label : "Total"}
                    </p>
                </div>
            </div>

            {/* Legend — required for ≥2 series */}
            <div className="flex-1 w-full space-y-1.5">
                {segments.map(s => (
                    <div
                        key={s.label}
                        onMouseEnter={() => setHovered(s.index)}
                        onMouseLeave={() => setHovered(null)}
                        className={`flex items-center gap-2 py-1 px-1.5 rounded-lg transition-colors cursor-default ${hovered === s.index ? "bg-gray-50" : ""}`}
                    >
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                        <span className="text-xs font-semibold text-gray-700 truncate flex-1">{s.label}</span>
                        <span className="text-xs font-black text-gray-900 tabular-nums shrink-0">{formatValue(s.value)}</span>
                        <span className="text-[10px] text-gray-400 tabular-nums shrink-0 w-10 text-right">{s.pct.toFixed(0)}%</span>
                    </div>
                ))}
            </div>
        </div>
    );
}

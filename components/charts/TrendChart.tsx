"use client";

import { useRef, useState } from "react";
import { colorFor } from "./palette";

export interface TrendSeries {
    label: string;
    values: number[];
    color?: string;
}

interface TrendChartProps {
    categories: string[];
    series: TrendSeries[];
    formatValue?: (v: number) => string;
    height?: number;
    className?: string;
}

/** Line/area trend chart — one shared axis, multi-series, crosshair + tooltip on hover. */
export function TrendChart({ categories, series, formatValue = (v) => v.toLocaleString(), height = 220, className = "" }: TrendChartProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [hoverIndex, setHoverIndex] = useState<number | null>(null);

    const width = 640;
    const padding = { top: 16, right: 16, bottom: 28, left: 8 };
    const innerW = width - padding.left - padding.right;
    const innerH = height - padding.top - padding.bottom;

    const allValues = series.flatMap(s => s.values);
    const max = Math.max(...allValues, 1);
    const n = categories.length;

    if (n === 0 || series.length === 0) {
        return <p className="text-xs text-gray-400 text-center py-10">No data</p>;
    }

    const xFor = (i: number) => padding.left + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
    const yFor = (v: number) => padding.top + innerH - (v / max) * innerH;

    const linePath = (values: number[]) =>
        values.map((v, i) => `${i === 0 ? "M" : "L"} ${xFor(i)} ${yFor(v)}`).join(" ");

    const areaPath = (values: number[]) =>
        `${linePath(values)} L ${xFor(values.length - 1)} ${padding.top + innerH} L ${xFor(0)} ${padding.top + innerH} Z`;

    const handleMove = (e: React.MouseEvent<SVGSVGElement>) => {
        const rect = e.currentTarget.getBoundingClientRect();
        const relX = ((e.clientX - rect.left) / rect.width) * width;
        const idx = Math.round(((relX - padding.left) / innerW) * (n - 1));
        setHoverIndex(Math.min(Math.max(idx, 0), n - 1));
    };

    const showArea = series.length === 1;

    return (
        <div className={className} ref={containerRef}>
            <div className="relative">
                <svg
                    viewBox={`0 0 ${width} ${height}`}
                    className="w-full"
                    style={{ height }}
                    onMouseMove={handleMove}
                    onMouseLeave={() => setHoverIndex(null)}
                >
                    {/* gridlines */}
                    {[0, 0.5, 1].map(f => (
                        <line key={f} x1={padding.left} x2={width - padding.right}
                            y1={padding.top + innerH * (1 - f)} y2={padding.top + innerH * (1 - f)}
                            stroke="#f3f4f6" strokeWidth={1} />
                    ))}

                    {series.map((s, i) => {
                        const color = s.color ?? colorFor(i);
                        return (
                            <g key={s.label}>
                                {showArea && <path d={areaPath(s.values)} fill={color} opacity={0.1} stroke="none" />}
                                <path d={linePath(s.values)} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                                {hoverIndex !== null && (
                                    <circle cx={xFor(hoverIndex)} cy={yFor(s.values[hoverIndex])} r={4} fill={color} stroke="#fff" strokeWidth={2} />
                                )}
                            </g>
                        );
                    })}

                    {/* crosshair */}
                    {hoverIndex !== null && (
                        <line x1={xFor(hoverIndex)} x2={xFor(hoverIndex)} y1={padding.top} y2={padding.top + innerH}
                            stroke="#d1d5db" strokeWidth={1} />
                    )}

                    {/* x-axis labels — sparse to avoid crowding */}
                    {categories.map((c, i) => {
                        const skip = n > 8 && i % Math.ceil(n / 8) !== 0;
                        if (skip) return null;
                        return (
                            <text key={c} x={xFor(i)} y={height - 8} textAnchor="middle" className="fill-gray-400" fontSize={10} fontWeight={600}>
                                {c}
                            </text>
                        );
                    })}
                </svg>

                {hoverIndex !== null && (
                    <div
                        className="absolute top-2 pointer-events-none bg-gray-900 text-white rounded-lg shadow-lg px-3 py-2 text-xs z-10"
                        style={{ left: `${(xFor(hoverIndex) / width) * 100}%`, transform: "translateX(-50%)" }}
                    >
                        <p className="font-bold mb-1 text-[10px] text-gray-300">{categories[hoverIndex]}</p>
                        {series.map((s, i) => (
                            <div key={s.label} className="flex items-center gap-2 whitespace-nowrap">
                                <span className="h-1.5 w-3 rounded-full shrink-0" style={{ backgroundColor: s.color ?? colorFor(i) }} />
                                <span className="font-black tabular-nums">{formatValue(s.values[hoverIndex])}</span>
                                <span className="text-gray-400">{s.label}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {series.length > 1 && (
                <div className="flex flex-wrap gap-4 mt-2 pt-2 border-t border-gray-50">
                    {series.map((s, i) => (
                        <div key={s.label} className="flex items-center gap-1.5">
                            <span className="w-3 h-[3px] rounded-full" style={{ backgroundColor: s.color ?? colorFor(i) }} />
                            <span className="text-[10px] text-gray-500 font-semibold">{s.label}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// Categorical hues — fixed order, never cycled. Validated CVD-safe via
// dataviz skill's validate_palette.js against surface #fcfcfb (light mode).
// These are the same hex values as the Tailwind classes already used across
// the app (blue-600, green-600, amber-500, red-500, purple-600, teal-600,
// indigo-600, cyan-600), kept in fixed assignment order.
export const CATEGORICAL = [
    "#2563eb", // blue
    "#16a34a", // green
    "#f59e0b", // amber — WARN on contrast vs surface; always paired with a direct label/legend, never color-alone
    "#ef4444", // red
    "#9333ea", // purple
    "#0d9488", // teal
    "#4f46e5", // indigo
    "#0891b2", // cyan
];

export const STATUS = {
    good: "#16a34a",
    warning: "#f59e0b",
    serious: "#f97316",
    critical: "#ef4444",
};

export function colorFor(index: number): string {
    return CATEGORICAL[index % CATEGORICAL.length];
}

import React from "react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "blue" | "green" | "red" | "yellow" | "purple" | "teal" | "neutral";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
    size?: "sm" | "md";
}

export function Badge({ className, variant = "neutral", size = "md", ...props }: BadgeProps) {
    const sizes = {
        sm: "px-2 py-0.5 text-[10px]",
        md: "px-2.5 py-1 text-[11px]",
    };

    const neutral = "bg-gray-50 text-gray-600 border border-gray-100";

    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-full font-bold whitespace-nowrap",
                sizes[size],
                variant === "neutral" ? neutral : `badge-${variant}`,
                className
            )}
            {...props}
        />
    );
}

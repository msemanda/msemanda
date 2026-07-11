"use client";

import { useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TooltipProps {
    content: ReactNode;
    children: ReactNode;
    side?: "top" | "bottom" | "left" | "right";
    className?: string;
}

const sideStyles: Record<NonNullable<TooltipProps["side"]>, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-1.5",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-1.5",
    left: "right-full top-1/2 -translate-y-1/2 mr-1.5",
    right: "left-full top-1/2 -translate-y-1/2 ml-1.5",
};

export function Tooltip({ content, children, side = "top", className }: TooltipProps) {
    const [open, setOpen] = useState(false);

    return (
        <span
            className="relative inline-flex"
            onMouseEnter={() => setOpen(true)}
            onMouseLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
        >
            {children}
            <AnimatePresence>
                {open && (
                    <motion.span
                        role="tooltip"
                        initial={{ opacity: 0, y: side === "top" ? 2 : -2 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: side === "top" ? 2 : -2 }}
                        transition={{ duration: 0.12 }}
                        className={cn(
                            "absolute z-[120] whitespace-nowrap rounded-lg bg-gray-900 px-2.5 py-1.5 text-[11px] font-semibold text-white shadow-lg pointer-events-none",
                            sideStyles[side],
                            className
                        )}
                    >
                        {content}
                    </motion.span>
                )}
            </AnimatePresence>
        </span>
    );
}

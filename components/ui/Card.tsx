import React from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLMotionProps<"div"> {
    variant?: "default" | "flat" | "interactive";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
    ({ className, variant = "default", children, ...props }, ref) => {
        const variants = {
            default: "bg-white rounded-2xl border border-gray-100 shadow-sm",
            flat: "bg-white rounded-2xl border border-gray-100",
            interactive: "bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer hover:shadow-premium transition-shadow duration-200",
        };

        return (
            <motion.div
                ref={ref}
                whileHover={variant === "interactive" ? { y: -2 } : undefined}
                whileTap={variant === "interactive" ? { scale: 0.99 } : undefined}
                className={cn(variants[variant], className)}
                {...props}
            >
                {children}
            </motion.div>
        );
    }
);
Card.displayName = "Card";

export function CardHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("px-5 pt-5 pb-3 flex items-center justify-between gap-3", className)} {...props} />;
}

export function CardTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
    return <h3 className={cn("text-sm font-black text-gray-900 tracking-tight", className)} {...props} />;
}

export function CardDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
    return <p className={cn("text-xs text-gray-400 mt-0.5", className)} {...props} />;
}

export function CardBody({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("px-5 pb-5", className)} {...props} />;
}

export function CardFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
    return <div className={cn("px-5 py-3 border-t border-gray-50", className)} {...props} />;
}

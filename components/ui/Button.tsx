import React from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: "primary" | "secondary" | "outline" | "ghost";
    size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = "primary", size = "md", ...props }, ref) => {
        const baseStyles = "inline-flex items-center justify-center rounded-2xl font-bold transition-all active:scale-95 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-primary/20 disabled:opacity-50 disabled:pointer-events-none tracking-tight";

        const variants = {
            primary: "bg-cyan-primary text-white hover:bg-cyan-dark shadow-lg shadow-cyan-600/20 hover:shadow-cyan-600/30",
            secondary: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100",
            outline: "border-2 border-gray-100 bg-transparent hover:bg-gray-50 hover:border-gray-200 text-gray-700",
            ghost: "bg-transparent hover:bg-cyan-50 text-cyan-700",
        };

        const sizes = {
            sm: "h-9 px-4 text-xs",
            md: "h-12 px-6 text-sm",
            lg: "h-14 px-10 text-lg",
        };

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            />
        );
    }
);
Button.displayName = "Button";

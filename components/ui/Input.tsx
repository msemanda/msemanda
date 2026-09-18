import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> { }

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, ...props }, ref) => {
        return (
            <input
                type={type}
                className={cn(
                    "flex h-12 w-full rounded-2xl border border-gray-200 bg-gray-50/20 px-4 py-2 text-sm transition-all placeholder:text-gray-400 focus:bg-white focus:border-cyan-primary focus:ring-4 focus:ring-cyan-primary/10 outline-none disabled:cursor-not-allowed disabled:opacity-50 shadow-sm focus:shadow-premium",
                    className
                )}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = "Input";

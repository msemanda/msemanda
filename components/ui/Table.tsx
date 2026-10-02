import React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
    return (
        <div className="w-full overflow-x-auto">
            <table className={cn("w-full text-left border-collapse", className)}>{children}</table>
        </div>
    );
}

export function TableHead({ className, children }: { className?: string; children: React.ReactNode }) {
    return <thead className={cn("border-b border-gray-100", className)}>{children}</thead>;
}

export function TableBody({ className, children }: { className?: string; children: React.ReactNode }) {
    return <tbody className={cn("divide-y divide-gray-50", className)}>{children}</tbody>;
}

export function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
    return <tr className={cn("hover:bg-gray-50/70 transition-colors", className)} {...props} />;
}

export function TableHeaderCell({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
    return (
        <th
            className={cn(
                "text-left text-[10px] font-black text-gray-400 uppercase tracking-wider px-3 py-2.5",
                className
            )}
            {...props}
        />
    );
}

export function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
    return <td className={cn("px-3 py-2.5 text-xs text-gray-700", className)} {...props} />;
}

export function TableEmptyState({ colSpan, message = "No data" }: { colSpan: number; message?: string }) {
    return (
        <tr>
            <td colSpan={colSpan} className="text-center text-xs text-gray-400 py-10">
                {message}
            </td>
        </tr>
    );
}

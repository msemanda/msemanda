import type { CSSProperties } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
    style?: CSSProperties;
}

export function Skeleton({ className, style }: SkeletonProps) {
    return <div className={cn("rounded-lg bg-gray-100 motion-safe:animate-shimmer", className)} style={style} />;
}

export function SkeletonText({ className, width = "100%" }: { className?: string; width?: string }) {
    return <Skeleton className={cn("h-3", className)} style={{ width }} />;
}

export function SkeletonCircle({ size = 36, className }: { size?: number; className?: string }) {
    return <Skeleton className={cn("rounded-full shrink-0", className)} style={{ width: size, height: size }} />;
}

export function SkeletonStatCard() {
    return (
        <div className="stat-card">
            <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-9 w-9 rounded-xl" />
                <Skeleton className="h-4 w-10 rounded-full" />
            </div>
            <Skeleton className="h-6 w-16 mb-2" />
            <Skeleton className="h-3 w-24" />
        </div>
    );
}

export function SkeletonRow() {
    return (
        <div className="flex items-center gap-3 px-4 py-3">
            <SkeletonCircle size={32} />
            <div className="flex-1 min-w-0 space-y-1.5">
                <Skeleton className="h-3 w-1/3" />
                <Skeleton className="h-2.5 w-1/2" />
            </div>
            <Skeleton className="h-5 w-14 rounded-full" />
        </div>
    );
}

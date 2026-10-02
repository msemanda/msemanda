import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
    size?: number;
    className?: string;
    ring?: boolean;
}

export function Logo({ size = 36, className, ring = true }: LogoProps) {
    return (
        <Image
            src="/imgs/logo-mark.png"
            alt="RHD Medical Services"
            width={size}
            height={size}
            priority
            className={cn(
                "rounded-full object-cover shrink-0 bg-white",
                ring && "ring-1 ring-black/5 shadow-sm",
                className
            )}
        />
    );
}

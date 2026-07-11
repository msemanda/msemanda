"use client";

import { createContext, useContext, type ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface TabsContextValue {
    value: string;
    onChange: (value: string) => void;
    layoutId: string;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext(component: string) {
    const ctx = useContext(TabsContext);
    if (!ctx) throw new Error(`<${component}> must be used inside <Tabs>`);
    return ctx;
}

interface TabsProps {
    value: string;
    onChange: (value: string) => void;
    children: ReactNode;
    className?: string;
    id?: string;
}

export function Tabs({ value, onChange, children, className, id = "tabs" }: TabsProps) {
    return (
        <TabsContext.Provider value={{ value, onChange, layoutId: `${id}-indicator` }}>
            <div className={className}>{children}</div>
        </TabsContext.Provider>
    );
}

export function TabList({ className, children }: { className?: string; children: ReactNode }) {
    return (
        <div role="tablist" className={cn("flex items-center gap-1 border-b border-gray-100", className)}>
            {children}
        </div>
    );
}

export function Tab({ value, children }: { value: string; children: ReactNode }) {
    const { value: active, onChange, layoutId } = useTabsContext("Tab");
    const isActive = active === value;

    return (
        <button
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(value)}
            className={cn(
                "relative px-4 py-2.5 text-xs font-bold transition-colors",
                isActive ? "text-blue-700" : "text-gray-500 hover:text-gray-800"
            )}
        >
            {children}
            {isActive && (
                <motion.div
                    layoutId={layoutId}
                    className="absolute left-0 right-0 -bottom-px h-0.5 bg-blue-600 rounded-full"
                    transition={{ duration: 0.2 }}
                />
            )}
        </button>
    );
}

export function TabPanels({ className, children }: { className?: string; children: ReactNode }) {
    return <div className={cn("pt-4", className)}>{children}</div>;
}

export function TabPanel({ value, children }: { value: string; children: ReactNode }) {
    const { value: active } = useTabsContext("TabPanel");
    if (active !== value) return null;
    return (
        <div role="tabpanel">
            {children}
        </div>
    );
}

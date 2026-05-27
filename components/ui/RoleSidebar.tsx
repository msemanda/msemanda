"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut, HeartPulse, LucideIcon, Menu, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

export interface SidebarItem {
    name: string;
    href: string;
    icon: LucideIcon;
    permission?: string;
}

export interface SidebarGroup {
    label: string;
    items: SidebarItem[];
}

interface RoleSidebarProps {
    groups: SidebarGroup[];
    roleLabel: string;
    accentColor?: string;
}

export function RoleSidebar({ groups, roleLabel }: RoleSidebarProps) {
    const pathname = usePathname();
    const { logout, profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    // Close sidebar on route change (mobile navigation)
    useEffect(() => { setIsOpen(false); }, [pathname]);

    const canSee = (item: SidebarItem) => {
        if (!item.permission) return true;
        if (!profile?.permissions) return true;
        return profile.permissions.includes(item.permission);
    };

    const SidebarContent = () => (
        <>
            {/* Logo */}
            <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                <Link href="/" className="flex items-center gap-2.5 group" onClick={() => setIsOpen(false)}>
                    <div className="p-2 bg-blue-600 rounded-xl shadow-sm group-hover:scale-105 transition-transform shrink-0">
                        <HeartPulse className="h-4 w-4 text-white" />
                    </div>
                    <div>
                        <span className="text-sm font-black text-gray-900 tracking-tight">RHONA</span>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{roleLabel}</p>
                    </div>
                </Link>
                <button
                    className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                    onClick={() => setIsOpen(false)}
                >
                    <X className="h-4 w-4" />
                </button>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-2 px-2">
                {groups.map((group) => {
                    const visibleItems = group.items.filter(canSee);
                    if (visibleItems.length === 0) return null;
                    return (
                        <div key={group.label}>
                            <p className="module-header">{group.label}</p>
                            <nav className="space-y-0.5 mb-1">
                                {visibleItems.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "group relative flex items-center rounded-xl px-3 py-2.5 text-xs font-semibold transition-all duration-150",
                                                isActive
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            )}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="sidebar-indicator"
                                                    className="absolute left-0 w-1 h-4 bg-blue-600 rounded-r-full"
                                                />
                                            )}
                                            <Icon className={cn(
                                                "mr-2.5 h-3.5 w-3.5 shrink-0 transition-colors",
                                                isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                                            )} />
                                            <span className="truncate">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    );
                })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-50 shrink-0">
                <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 mb-2">
                    <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center font-black text-blue-700 text-xs shrink-0">
                        {profile?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{profile?.name || "User"}</p>
                        <p className="text-[10px] text-gray-400 truncate">{profile?.email}</p>
                    </div>
                </div>
                <button
                    onClick={() => logout()}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    Sign Out
                </button>
            </div>
        </>
    );

    return (
        <>
            {/* Mobile backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[45] bg-black/50 md:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile hamburger trigger */}
            <button
                className="fixed top-3 left-3 z-[45] md:hidden h-9 w-9 bg-white rounded-xl shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors"
                onClick={() => setIsOpen(true)}
                aria-label="Open menu"
            >
                <Menu className="h-4 w-4" />
            </button>

            {/* Sidebar panel — fixed on mobile, static in flex on desktop */}
            <div className={cn(
                "h-screen w-60 flex flex-col bg-white border-r border-gray-100 shadow-[1px_0_0_0_rgba(0,0,0,0.04)]",
                "fixed inset-y-0 left-0 z-[50] transition-transform duration-300",
                "md:static md:translate-x-0 md:shrink-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <SidebarContent />
            </div>
        </>
    );
}

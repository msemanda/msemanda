"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut, HeartPulse, LucideIcon } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

export interface SidebarItem {
    name: string;
    href: string;
    icon: LucideIcon;
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

export function RoleSidebar({ groups, roleLabel, accentColor = "blue" }: RoleSidebarProps) {
    const pathname = usePathname();
    const { logout, profile } = useAuth();

    const activeClass = `bg-${accentColor}-50 text-${accentColor}-700`;
    const hoverClass = `hover:bg-gray-50 hover:text-${accentColor}-600`;
    const iconActiveClass = `text-${accentColor}-600`;
    const indicatorClass = `bg-${accentColor}-600`;

    return (
        <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-100 shadow-[1px_0_0_0_rgba(0,0,0,0.04)] z-50">
            {/* Logo */}
            <div className="p-5 border-b border-gray-50">
                <Link href="/" className="flex items-center gap-3 group">
                    <div className={`p-2 bg-blue-600 rounded-xl shadow-sm group-hover:scale-105 transition-transform`}>
                        <HeartPulse className="h-5 w-5 text-white" />
                    </div>
                    <div>
                        <span className="text-sm font-black text-gray-900 tracking-tight">E-HEALTH</span>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">{roleLabel}</p>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <div className="flex-1 overflow-y-auto py-3 px-3">
                {groups.map((group) => (
                    <div key={group.label}>
                        <p className="module-header">{group.label}</p>
                        <nav className="space-y-0.5 mb-1">
                            {group.items.map((item) => {
                                const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
                                const Icon = item.icon;
                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={cn(
                                            "group relative flex items-center rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-150",
                                            isActive
                                                ? "bg-blue-50 text-blue-700"
                                                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                        )}
                                    >
                                        {isActive && (
                                            <motion.div
                                                layoutId="sidebar-indicator"
                                                className="absolute left-0 w-1 h-5 bg-blue-600 rounded-r-full"
                                            />
                                        )}
                                        <Icon className={cn(
                                            "mr-3 h-4 w-4 shrink-0 transition-colors",
                                            isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                                        )} />
                                        <span className="truncate">{item.name}</span>
                                    </Link>
                                );
                            })}
                        </nav>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-50">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 mb-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center font-black text-blue-700 text-xs shrink-0">
                        {profile?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-gray-900 truncate">{profile?.name || "User"}</p>
                        <p className="text-[10px] text-gray-400 truncate">{profile?.email}</p>
                    </div>
                </div>
                <button
                    onClick={() => logout()}
                    className="flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 hover:bg-red-50 transition-colors"
                >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                </button>
            </div>
        </div>
    );
}

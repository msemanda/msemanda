"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    UserPlus,
    UserCheck,
    Calendar,
    FileText,
    LogOut,
    HeartPulse,
    ChevronRight,
    Search,
    Bell
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion } from "framer-motion";

const menuItems = [
    { name: "Command Center", href: "/admin/dashboard", icon: LayoutDashboard, tag: "Overview" },
    { name: "Registry Access", href: "/admin/register", icon: UserPlus, tag: "Admin" },
    { name: "Medical Network", href: "/admin/invite-doctors", icon: UserCheck, tag: "Physicians" },
    { name: "Patient Flow", href: "/admin/schedule-patients", icon: Calendar, tag: "Queues" },
    { name: "Identity Validation", href: "/admin/validate-patient", icon: FileText, tag: "KYC" },
    { name: "Revenue Desk", href: "/admin/generate-bill", icon: FileText, tag: "Billing" },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout, profile } = useAuth();

    return (
        <div className="flex h-screen w-72 flex-col border-r border-gray-100 bg-white shadow-[20px_0_40px_rgba(0,0,0,0.02)] z-50">
            <div className="p-8">
                <Link href="/" className="flex items-center group mb-10">
                    <div className="p-2.5 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-2xl shadow-lg shadow-cyan-600/20 group-hover:rotate-6 transition-transform">
                        <HeartPulse className="h-6 w-6 text-white" />
                    </div>
                    <span className="ml-3 text-2xl font-black text-gray-900 tracking-tighter">E-HEALTH</span>
                </Link>

                <div className="space-y-1">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 mb-4">Master Operations</p>
                    <nav className="space-y-1.5">
                        {menuItems.map((item) => {
                            const isActive = pathname === item.href;
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    className={cn(
                                        "group relative flex items-center justify-between rounded-2xl px-4 py-3.5 text-sm font-bold transition-all duration-300",
                                        isActive
                                            ? "bg-cyan-50 text-cyan-700 shadow-sm"
                                            : "text-gray-500 hover:bg-gray-50 hover:text-cyan-600"
                                    )}
                                >
                                    <div className="flex items-center">
                                        <Icon className={cn("mr-3.5 h-5 w-5 transition-transform duration-300 group-hover:scale-110", isActive ? "text-cyan-600" : "text-gray-400 group-hover:text-cyan-500")} />
                                        <span>{item.name}</span>
                                    </div>
                                    {isActive ? (
                                        <motion.div layoutId="sidebar-active" className="absolute left-0 w-1.5 h-8 bg-cyan-600 rounded-r-full" />
                                    ) : (
                                        <span className="text-[9px] font-black opacity-0 group-hover:opacity-100 transition-opacity bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded-md uppercase tracking-tighter">
                                            {item.tag}
                                        </span>
                                    )}
                                </Link>
                            );
                        })}
                    </nav>
                </div>
            </div>

            <div className="flex-1" />

            <div className="p-6 border-t border-gray-50">
                <div className="bg-gray-50/50 rounded-3xl p-4 mb-4 flex items-center gap-3 border border-gray-100">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-500 to-cyan-700 p-[2px]">
                        <div className="h-full w-full rounded-[10px] bg-white flex items-center justify-center font-black text-cyan-700 text-xs">
                            {profile?.name?.charAt(0) || "A"}
                        </div>
                    </div>
                    <div className="flex-1 overflow-hidden">
                        <p className="text-xs font-black text-gray-900 truncate">{profile?.name || "System Admin"}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">Root Access</p>
                    </div>
                </div>

                <button
                    onClick={() => logout()}
                    className="flex w-full items-center justify-center rounded-2xl px-4 py-3.5 text-sm font-bold text-red-500 bg-red-50/50 hover:bg-red-50 transition-all border border-red-100/50"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Terminate Session
                </button>
            </div>
        </div>
    );
}

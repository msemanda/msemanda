"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { LogOut, ChevronDown } from "lucide-react";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";
import { NotificationBell } from "@/components/ui/NotificationBell";

interface TopNavProps {
    role: string;
}

const ROLE_COLORS: Record<string, string> = {
    DOCTOR: "bg-blue-50 text-blue-700 border-blue-100",
    PATIENT: "bg-green-50 text-green-700 border-green-100",
    PHARMACY: "bg-purple-50 text-purple-700 border-purple-100",
    NURSE: "bg-teal-50 text-teal-700 border-teal-100",
    LAB_TECH: "bg-amber-50 text-amber-700 border-amber-100",
    RADIOLOGY_TECH: "bg-sky-50 text-sky-700 border-sky-100",
    PHYSIOTHERAPIST: "bg-orange-50 text-orange-700 border-orange-100",
    DENTIST: "bg-pink-50 text-pink-700 border-pink-100",
    DIETITIAN: "bg-lime-50 text-lime-700 border-lime-100",
    EMERGENCY_STAFF: "bg-red-50 text-red-700 border-red-100",
    RECEPTIONIST: "bg-indigo-50 text-indigo-700 border-indigo-100",
    ADMIN: "bg-gray-50 text-gray-700 border-gray-200",
    CASHIER: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
    CLEANER: "bg-slate-50 text-slate-700 border-slate-100",
    SECURITY: "bg-zinc-50 text-zinc-700 border-zinc-100",
    OPTICIAN: "bg-cyan-50 text-cyan-700 border-cyan-100",
    OPTICIAN_ASSISTANT: "bg-cyan-50 text-cyan-600 border-cyan-100",
};

export function TopNav({ role }: TopNavProps) {
    const { profile, logout } = useAuth();
    const roleColor = ROLE_COLORS[role] || "bg-blue-50 text-blue-700 border-blue-100";
    const roleLabel = role.replace(/_/g, " ");

    return (
        <header className="h-14 border-b border-gray-100 bg-white px-6 flex items-center justify-between sticky top-0 z-40 shadow-[0_1px_0_rgba(0,0,0,0.04)]">
            {/* Left */}
            <div className="flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2 group">
                    <Logo size={28} className="group-hover:scale-105 transition-transform" />
                    <span className="text-sm font-black text-gray-900 tracking-tight">RHD</span>
                </Link>
                <div className="h-4 w-px bg-gray-200" />
                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${roleColor}`}>
                    {roleLabel}
                </span>
            </div>

            {/* Right */}
            <div className="flex items-center gap-3">
                <NotificationBell />

                <div className="h-4 w-px bg-gray-100" />

                <div className="flex items-center gap-2.5 cursor-pointer group">
                    <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xs">
                        {profile?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="hidden sm:block">
                        <p className="text-xs font-bold text-gray-900 leading-none">{profile?.name || "User"}</p>
                        <p className="text-[10px] text-gray-400 leading-none mt-0.5 truncate max-w-[120px]">{profile?.email}</p>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
                </div>

                <button
                    onClick={() => logout()}
                    className="h-8 px-3 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-1.5 border border-transparent hover:border-red-100"
                >
                    <LogOut className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Sign Out</span>
                </button>
            </div>
        </header>
    );
}

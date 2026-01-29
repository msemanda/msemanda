"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { LogOut, User, Bell, ShieldCheck, HeartPulse } from "lucide-react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface TopNavProps {
    role: string;
}

export function TopNav({ role }: TopNavProps) {
    const { profile, logout } = useAuth();

    return (
        <header className="h-20 border-b border-gray-100 bg-white/80 backdrop-blur-md px-10 flex items-center justify-between sticky top-0 z-40">
            <div className="flex items-center gap-10">
                <Link href="/" className="flex items-center group transition-opacity hover:opacity-80">
                    <div className="p-2 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-xl shadow-lg shadow-cyan-600/10 group-hover:rotate-6 transition-transform">
                        <HeartPulse className="h-5 w-5 text-white" />
                    </div>
                    <span className="ml-3 text-lg font-black text-gray-900 tracking-tighter uppercase">E-HEALTH</span>
                </Link>
                <div className="h-5 w-px bg-gray-200" />
                <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Workspace</span>
                    <span className="px-3 py-1 rounded-full bg-cyan-50 text-cyan-600 text-[9px] font-black uppercase tracking-widest border border-cyan-100/50">
                        {role} NODE
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-8">
                <div className="flex items-center gap-2">
                    <button className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-400 transition-colors relative">
                        <Bell className="h-5 w-5" />
                        <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-cyan-500 rounded-full border-2 border-white shadow-sm" />
                    </button>
                    <button className="h-10 w-10 flex items-center justify-center rounded-xl hover:bg-gray-50 text-gray-400 transition-colors">
                        <ShieldCheck className="h-5 w-5" />
                    </button>
                </div>

                <div className="h-8 w-px bg-gray-100" />

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-4 group cursor-pointer">
                        <div className="text-right">
                            <p className="text-xs font-black text-gray-900 group-hover:text-cyan-600 transition-colors">{profile?.name || "Member"}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter truncate max-w-[120px]">{profile?.email}</p>
                        </div>
                        <div className="h-10 w-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 border border-gray-200 group-hover:border-cyan-200 transition-all">
                            <User className="h-5 w-5" />
                        </div>
                    </div>

                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => logout()}
                        className="h-10 px-4 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 border border-transparent hover:border-red-100 transition-all"
                    >
                        <LogOut className="h-4 w-4" />
                        Exit
                    </Button>
                </div>
            </div>
        </header>
    );
}

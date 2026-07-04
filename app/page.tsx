"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { HeartPulse, ArrowRight, ShieldCheck, Stethoscope, FlaskConical, Pill, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

function getRolePath(role: string): string {
    const map: Record<string, string> = {
        ADMIN: "/admin/dashboard", DOCTOR: "/doctor/dashboard", NURSE: "/nurse/dashboard",
        PATIENT: "/patient/dashboard", PHARMACY: "/pharmacy/dashboard", LAB_TECH: "/lab/dashboard",
        RADIOLOGY_TECH: "/radiology/dashboard", PHYSIOTHERAPIST: "/physiotherapy/dashboard",
        DENTIST: "/dental/dashboard", DIETITIAN: "/dietary/dashboard",
        EMERGENCY_STAFF: "/emergency/dashboard", RECEPTIONIST: "/receptionist/dashboard",
        CASHIER: "/cashier/dashboard",
    };
    return map[role] || "/login";
}

const modules = [
    { label: "Doctors", icon: Stethoscope, color: "bg-teal-50 text-teal-600 border-teal-100" },
    { label: "Laboratory", icon: FlaskConical, color: "bg-amber-50 text-amber-600 border-amber-100" },
    { label: "Pharmacy", icon: Pill, color: "bg-sky-50 text-sky-600 border-sky-100" },
    { label: "Emergency", icon: ShieldCheck, color: "bg-red-50 text-red-600 border-red-100" },
    { label: "Wellness", icon: Sparkles, color: "bg-purple-50 text-purple-600 border-purple-100" },
];

export default function HomePage() {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && profile) {
            router.replace(getRolePath(profile.role));
        }
    }, [profile, loading, router]);

    // While checking auth, show nothing (prevents flash)
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
            </div>
        );
    }

    // Already logged in — redirect is in progress
    if (profile) return null;

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-teal-50/20 flex flex-col">
            {/* Navbar */}
            <header className="flex items-center justify-between px-6 py-4 border-b border-white/60 bg-white/70 backdrop-blur-md sticky top-0 z-40">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-600 rounded-xl shadow-sm shadow-blue-600/20">
                        <HeartPulse className="h-4.5 w-4.5 text-white" />
                    </div>
                    <span className="text-base font-black text-gray-900 tracking-tight">RHD Medical Services</span>
                </div>
                <div className="flex items-center gap-2">
                    <Link href="/login"
                        className="h-8 px-4 rounded-lg text-xs font-bold text-gray-600 hover:bg-gray-100 flex items-center transition-colors">
                        Sign In
                    </Link>
                    <Link href="/setup"
                        className="h-8 px-4 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-1.5 transition-colors shadow-sm shadow-blue-600/20">
                        Get Started <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                </div>
            </header>

            {/* Hero */}
            <main className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
                    className="max-w-xl mx-auto space-y-5">

                    <div className="inline-flex items-center gap-2 bg-white border border-blue-100 rounded-full px-3.5 py-1.5 shadow-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">System Online · Kampala, Uganda</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl font-black text-gray-900 leading-tight tracking-tight">
                        Integrated Healthcare<br />
                        <span className="text-blue-600">Management System</span>
                    </h1>

                    <p className="text-sm text-gray-500 font-medium leading-relaxed max-w-md mx-auto">
                        Connecting doctors, nurses, lab technicians, pharmacists and every other clinical role in one seamless workspace.
                    </p>

                    <div className="flex items-center justify-center gap-3 pt-2">
                        <Link href="/login"
                            className="h-10 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm shadow-blue-600/20">
                            Sign In <ArrowRight className="h-4 w-4" />
                        </Link>
                        <Link href="/setup"
                            className="h-10 px-6 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
                            Set Up Account
                        </Link>
                    </div>
                </motion.div>

                {/* Module pills */}
                <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25, duration: 0.5 }}
                    className="mt-12 flex flex-wrap items-center justify-center gap-2 max-w-lg mx-auto">
                    {modules.map((m, i) => {
                        const Icon = m.icon;
                        return (
                            <motion.div key={m.label} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 + i * 0.07 }}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold ${m.color}`}>
                                <Icon className="h-3.5 w-3.5" />
                                {m.label}
                            </motion.div>
                        );
                    })}
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.65 }}
                        className="px-3 py-1.5 rounded-full border border-gray-100 bg-gray-50 text-xs font-bold text-gray-400">
                        +8 more modules
                    </motion.div>
                </motion.div>
            </main>

            <footer className="py-4 px-6 border-t border-gray-100 bg-white/50 text-center">
                <p className="text-[11px] text-gray-400 font-medium">© 2026 RHD Medical Services · Kansanga, Kampala · All rights reserved</p>
            </footer>
        </div>
    );
}

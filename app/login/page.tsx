"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Input } from "@/components/ui/Input";
import { UserRole } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
    HeartPulse,
    Mail,
    Lock,
    ShieldCheck,
    UserCircle,
    ArrowRight,
    Sparkles,
    ChevronDown
} from "lucide-react";
import Link from "next/link";

const ROLES: { value: UserRole; label: string }[] = [
    { value: "ADMIN", label: "System Administrator" },
    { value: "PATIENT", label: "Patient" },
    { value: "DOCTOR", label: "Medical Practitioner" },
    { value: "RECEPTIONIST", label: "Receptionist" },
    { value: "PHARMACY", label: "Pharmacist" },
    { value: "NURSE", label: "Nurse" },
    { value: "LAB_TECH", label: "Laboratory Technician" },
    { value: "RADIOLOGY_TECH", label: "Radiology Technician" },
    { value: "PHYSIOTHERAPIST", label: "Physiotherapist" },
    { value: "DENTIST", label: "Dentist" },
    { value: "DIETITIAN", label: "Dietitian" },
    { value: "EMERGENCY_STAFF", label: "Emergency Staff" },
];

function getRoleDashboard(role: UserRole): string {
    switch (role) {
        case "ADMIN": return "/admin/dashboard";
        case "PATIENT": return "/patient/dashboard";
        case "DOCTOR": return "/doctor/dashboard";
        case "PHARMACY": return "/pharmacy/dashboard";
        case "NURSE": return "/nurse/dashboard";
        case "LAB_TECH": return "/lab/dashboard";
        case "RADIOLOGY_TECH": return "/radiology/dashboard";
        case "PHYSIOTHERAPIST": return "/physiotherapy/dashboard";
        case "DENTIST": return "/dental/dashboard";
        case "DIETITIAN": return "/dietary/dashboard";
        case "EMERGENCY_STAFF": return "/emergency/dashboard";
        case "RECEPTIONIST": return "/receptionist/dashboard";
        default: return "/login";
    }
}

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>("PATIENT");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            if (user.email === "semandamoses91@gmail.com") {
                router.push("/admin/dashboard");
                return;
            }

            const docSnap = await getDoc(doc(db, "users", user.uid));
            if (docSnap.exists()) {
                const userData = docSnap.data();
                if (userData.role === role) {
                    router.push(getRoleDashboard(role));
                } else {
                    setError(`Role mismatch. This account is registered as ${userData.role}.`);
                    await auth.signOut();
                }
            } else {
                setError("No profile found. Please contact your administrator.");
                await auth.signOut();
            }
        } catch (err: any) {
            setError(err.message || "Failed to sign in. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6"
            style={{ backgroundImage: "radial-gradient(at 50% 0%, rgba(37,99,235,0.06) 0, transparent 60%), radial-gradient(at 100% 100%, rgba(22,163,74,0.05) 0, transparent 50%)" }}>
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center group mb-6">
                        <div className="p-2.5 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg shadow-blue-600/20 group-hover:scale-105 transition-transform">
                            <HeartPulse className="h-6 w-6 text-white" />
                        </div>
                        <span className="ml-3 text-2xl font-black text-gray-900 tracking-tighter">RHONA</span>
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Rhona Medical Center</h1>
                    <p className="text-gray-500 mt-2 font-medium text-sm">Sign in to your clinical workspace</p>
                </div>

                <div className="bg-white rounded-3xl shadow-premium border border-gray-100 p-8">
                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Your Role</label>
                            <div className="relative">
                                <UserCircle className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-blue-500 z-10" />
                                <select
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                    className="w-full h-11 pl-10 pr-10 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 appearance-none focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
                                >
                                    {ROLES.map(r => (
                                        <option key={r.value} value={r.value}>{r.label}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                                <Input
                                    type="email"
                                    placeholder="staff@hospital.com"
                                    className="pl-10 font-medium"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                                <Input
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                />
                            </div>
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex gap-2.5"
                                >
                                    <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm shadow-blue-600/20"
                        >
                            {loading ? "Signing in..." : "Sign In"}
                            {!loading && <ArrowRight className="h-4 w-4" />}
                        </button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-gray-50 text-center">
                        <p className="text-sm text-gray-500">
                            Have an invitation?{" "}
                            <Link href="/setup" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                                Set up your account
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-8 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3.5 w-3.5 text-blue-500" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">HIPAA Compliant</span>
                    </div>
                    <div className="h-1 w-1 bg-gray-300 rounded-full" />
                    <div className="flex items-center gap-1.5">
                        <Sparkles className="h-3.5 w-3.5 text-green-500" />
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Encrypted</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserRole } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { AuthButton } from "@/components/ui/AuthButton";
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

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [role, setRole] = useState<UserRole>("PATIENT");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const { signInWithGoogle } = useAuth();
    const router = useRouter();

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                if (userData.role === role) {
                    router.push(`/${role.toLowerCase()}/dashboard`);
                } else {
                    setError(`Invalid role selection for this account. Expected ${userData.role}.`);
                    await auth.signOut();
                }
            } else {
                setError("User profile not found. Please register first.");
                await auth.signOut();
            }
        } catch (err: any) {
            if (err.code === "auth/permission-denied" || err.message.includes("permissions")) {
                setError("Firebase Permission Error: Please update your Firestore rules.");
            } else {
                setError(err.message || "Failed to login. Please check your credentials.");
            }
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError("");
        try {
            await signInWithGoogle();
            const user = auth.currentUser;
            if (user) {
                try {
                    const docRef = doc(db, "users", user.uid);
                    const docSnap = await getDoc(docRef);

                    if (docSnap.exists()) {
                        const userData = docSnap.data();
                        router.push(`/${userData.role.toLowerCase()}/dashboard`);
                    } else {
                        router.push(`/patient/register`);
                    }
                } catch (firestoreErr: any) {
                    router.push(`/patient/register`);
                }
            }
        } catch (err: any) {
            setError(err.message || "Failed to login with Google");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_0%,rgba(8,145,178,0.08),transparent_50%)]">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-10">
                    <Link href="/" className="inline-flex items-center group mb-6">
                        <div className="p-2.5 bg-gradient-to-br from-cyan-600 to-teal-600 rounded-2xl shadow-lg shadow-cyan-600/20 group-hover:rotate-6 transition-transform">
                            <HeartPulse className="h-6 w-6 text-white" />
                        </div>
                        <span className="ml-3 text-2xl font-black text-gray-900 tracking-tighter">E-HEALTH</span>
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Portal Access</h1>
                    <p className="text-gray-500 mt-2 font-medium">Verify your identity to enter the medical workspace</p>
                </div>

                <div className="bg-glass rounded-[32px] shadow-premium p-8 border border-white/60">
                    <div className="space-y-6">
                        <AuthButton onClick={handleGoogleLogin} disabled={loading} text="Continue with Google" />

                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-100"></div>
                            </div>
                            <div className="relative flex justify-center text-xs uppercase tracking-widest font-black text-gray-400">
                                <span className="bg-white px-4 rounded-full">Or secure email</span>
                            </div>
                        </div>

                        <form onSubmit={handleEmailLogin} className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Work Persona</label>
                                <div className="relative group">
                                    <UserCircle className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-cyan-600 transition-colors z-10" />
                                    <select
                                        value={role}
                                        onChange={(e) => setRole(e.target.value as UserRole)}
                                        className="relative w-full h-12 pl-12 pr-10 rounded-2xl border border-gray-200 bg-gray-50/20 text-sm font-bold text-gray-700 appearance-none focus:bg-white focus:border-cyan-primary focus:ring-4 focus:ring-cyan-primary/10 outline-none transition-all cursor-pointer"
                                    >
                                        <option value="ADMIN">System Administrator</option>
                                        <option value="PATIENT">Verified Patient</option>
                                        <option value="DOCTOR">Medical Practitioner</option>
                                        <option value="PHARMACY">Smart Pharmacy</option>
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Email Address</label>
                                <div className="relative group">
                                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-cyan-600 transition-colors" />
                                    <Input
                                        type="email"
                                        placeholder="dr.smith@hospital.com"
                                        className="pl-12 font-medium"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400 group-focus-within:text-cyan-600 transition-colors" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-12"
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
                                        className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-xs font-bold flex gap-3 shadow-sm"
                                    >
                                        <ShieldCheck className="h-5 w-5 shrink-0" />
                                        <span>{error}</span>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            <Button type="submit" className="w-full h-14 group text-base" disabled={loading}>
                                {loading ? "Authenticating..." : "Authorize Entry"}
                                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </form>
                    </div>

                    <div className="mt-8 pt-8 border-t border-gray-100/50 text-center">
                        <p className="text-sm text-gray-500 font-medium tracking-tight">
                            Don't have a portal account?{" "}
                            <Link href="/patient/register" className="text-cyan-600 font-black hover:text-cyan-700 transition-colors">
                                Apply Now
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-10 flex items-center justify-center gap-6">
                    <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-cyan-600" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hi-PPA Compliant</span>
                    </div>
                    <div className="h-1 w-1 bg-gray-300 rounded-full" />
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-cyan-600" />
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Next-Gen Security</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

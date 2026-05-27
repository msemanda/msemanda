"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserProfile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldAlert,
    Lock,
    Settings as UserSettings,
    ShieldCheck,
    ArrowRight,
    HeartPulse
} from "lucide-react";

export default function AdminRegistrationPage() {
    const { user: authUser } = useAuth();
    const [formData, setFormData] = useState({
        name: authUser?.displayName || "",
        email: authUser?.email || "",
        password: "",
        confirmPassword: "",
        address: "",
        dob: "",
        gender: "",
        role: "ADMIN",
    });

    // Update form if user becomes available
    React.useEffect(() => {
        if (authUser) {
            setFormData(prev => ({
                ...prev,
                name: prev.name || authUser.displayName || "",
                email: prev.email || authUser.email || "",
            }));
        }
    }, [authUser]);

    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!authUser && formData.password !== formData.confirmPassword) {
            return setError("Passwords do not match");
        }
        if (!authUser && !formData.password) {
            return setError("Password is required");
        }

        setLoading(true);
        setError("");

        try {
            let user = authUser;

            if (!user) {
                const userCredential = await createUserWithEmailAndPassword(
                    auth,
                    formData.email,
                    formData.password
                );
                user = userCredential.user;
            }

            const profile: UserProfile = {
                uid: user.uid,
                email: formData.email,
                name: formData.name,
                role: "ADMIN",
                address: formData.address,
                dob: formData.dob,
                gender: formData.gender,
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(db, "users", user.uid), profile);
            setSuccess(true);
        } catch (err: any) {
            console.error("Registration error:", err);
            if (err.code === 'permission-denied') {
                setError("Firebase Permission Error: Please ensure your Firestore Security Rules allow document creation in the 'users' collection.");
            } else {
                setError(err.message || "Failed to register admin");
            }
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center p-6 bg-[radial-gradient(circle_at_50%_0%,rgba(8,145,178,0.08),transparent_50%)]">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center space-y-8 max-w-md bg-glass p-12 rounded-[32px] shadow-premium"
                >
                    <div className="h-20 w-20 bg-cyan-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ShieldAlert className="h-10 w-10 text-cyan-600" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Admin Registered</h2>
                    <p className="text-gray-500 font-medium leading-relaxed">System administrator account has been initialized. You now have full control over the healthcare platform.</p>
                    <Button onClick={() => window.location.href = "/login"} className="w-full">Enter Command Center</Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-20 px-6 bg-[radial-gradient(circle_at_50%_0%,rgba(8,145,178,0.08),transparent_50%)]">
            <div className="max-w-4xl mx-auto">
                <Link href="/" className="inline-flex items-center group mb-12 hover:opacity-80 transition-opacity">
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:rotate-6 transition-transform">
                        <HeartPulse className="h-5 w-5 text-cyan-600" />
                    </div>
                    <span className="ml-3 text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Return to Main Interface</span>
                </Link>

                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl font-black tracking-tight text-gray-900">System <span className="text-gradient-cyan">Administrator</span></h1>
                    <p className="text-lg text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">Initialize the core administration layer of Rhona Medical Center.</p>
                </div>
                <div className="bg-glass rounded-[40px] shadow-premium p-10 lg:p-12 border border-white/60">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="space-y-6">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                <UserSettings className="text-cyan-600 h-5 w-5" /> Core Identity
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Admin Name</label>
                                    <Input
                                        required
                                        placeholder="System Operator"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Email</label>
                                    <Input
                                        type="email"
                                        required
                                        placeholder="admin@rhonamedical.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Birth Date</label>
                                        <Input
                                            placeholder="DD-MM-YYYY"
                                            value={formData.dob}
                                            onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Gender</label>
                                        <Input
                                            placeholder="Select"
                                            value={formData.gender}
                                            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                <Lock className="text-cyan-600 h-5 w-5" /> Access & Location
                            </h3>
                            <div className="space-y-4">
                                {!authUser && (
                                    <>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Root Password</label>
                                            <Input
                                                type="password"
                                                required
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm Root</label>
                                            <Input
                                                type="password"
                                                required
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                    </>
                                )}
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Official Address</label>
                                    <textarea
                                        className="w-full h-24 rounded-2xl border border-gray-200 bg-gray-50/20 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:bg-white focus:border-cyan-primary focus:ring-4 focus:ring-cyan-primary/10 outline-none shadow-sm focus:shadow-premium"
                                        rows={3}
                                        placeholder="Command center location"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold flex gap-3 shadow-sm"
                            >
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="pt-6">
                        <Button type="submit" className="w-full h-16 text-lg group shadow-premium" disabled={loading}>
                            {loading ? "Initializing System Admin..." : "Finalize Admin Setup"}
                            <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

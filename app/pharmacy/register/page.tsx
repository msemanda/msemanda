"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { motion, AnimatePresence } from "framer-motion";
import {
    Store,
    ShieldCheck,
    Activity,
    Sparkles,
    ArrowRight,
    HeartPulse
} from "lucide-react";

export default function PharmacyRegistrationPage() {
    const { user: authUser } = useAuth();
    const [formData, setFormData] = useState({
        name: authUser?.displayName || "",
        email: authUser?.email || "",
        password: "",
        confirmPassword: "",
        address: "",
        pharmacistName: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

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

            await setDoc(doc(db, "users", user.uid), {
                uid: user.uid,
                email: formData.email,
                name: formData.name, // Pharmacy/Outlet Name
                role: "PHARMACY",
                address: formData.address,
                pharmacistName: formData.pharmacistName,
                createdAt: serverTimestamp(),
            });

            setSuccess(true);
        } catch (err: any) {
            console.error("Registration error:", err);
            if (err.code === 'permission-denied') {
                setError("Firebase Permission Error: Please ensure your Firestore Security Rules allow document creation in the 'users' collection.");
            } else {
                setError(err.message || "Failed to register pharmacy");
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
                        <Store className="h-10 w-10 text-cyan-600" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Pharmacy Linked</h2>
                    <p className="text-gray-500 font-medium leading-relaxed">Your pharmaceutical outlet has been successfully integrated. You can now begin managing prescriptions in your dashboard.</p>
                    <Button onClick={() => window.location.href = "/login"} className="w-full">Open Dashboard</Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-20 px-6 bg-[radial-gradient(circle_at_50%_0%,rgba(8,145,178,0.08),transparent_50%)]">
            <div className="max-w-5xl mx-auto">
                <Link href="/" className="inline-flex items-center group mb-12 hover:opacity-80 transition-opacity">
                    <div className="p-2 bg-white rounded-xl shadow-sm border border-gray-100 group-hover:rotate-6 transition-transform">
                        <HeartPulse className="h-5 w-5 text-cyan-600" />
                    </div>
                    <span className="ml-3 text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Return to Main Interface</span>
                </Link>

                <div className="bg-glass rounded-[40px] shadow-premium overflow-hidden border border-white/60">
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                        <div className="p-12 bg-gradient-to-br from-cyan-600 to-teal-700 text-white flex flex-col justify-center">
                            <h1 className="text-5xl font-black mb-8 tracking-tighter leading-tight">Pharmacy <br />Integration</h1>
                            <p className="text-cyan-50/80 mb-10 text-lg font-medium leading-relaxed">Join our digital healthcare ecosystem. Link your pharmacy to receive real-time prescriptions from certified doctors across the platform.</p>
                            <div className="space-y-5">
                                <div className="flex items-center space-x-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 group hover:bg-white/20 transition-all cursor-default">
                                    <Activity className="h-5 w-5 text-cyan-200" />
                                    <span className="text-sm font-bold tracking-tight">Real-time Prescription Sync</span>
                                </div>
                                <div className="flex items-center space-x-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 group hover:bg-white/20 transition-all cursor-default">
                                    <Sparkles className="h-5 w-5 text-cyan-200" />
                                    <span className="text-sm font-bold tracking-tight">Automated Patient Billing Connectivity</span>
                                </div>
                                <div className="flex items-center space-x-4 bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 group hover:bg-white/20 transition-all cursor-default">
                                    <ShieldCheck className="h-5 w-5 text-cyan-200" />
                                    <span className="text-sm font-bold tracking-tight">Verified Physician Network</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit} className="p-10 lg:p-12 space-y-8 bg-white/50">
                            <div className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Outlet Entity Name</label>
                                    <Input
                                        required
                                        placeholder="e.g. City Central Pharmacy"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Chief Pharmacist</label>
                                    <Input
                                        required
                                        placeholder="Lead Registered Pharmacist"
                                        value={formData.pharmacistName}
                                        onChange={(e) => setFormData({ ...formData, pharmacistName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Business Email</label>
                                    <Input
                                        type="email"
                                        required
                                        placeholder="contact@pharmacy.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Office Address</label>
                                    <Input
                                        required
                                        placeholder="Physical business location"
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                                {!authUser && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Password</label>
                                            <Input
                                                type="password"
                                                required
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Confirm</label>
                                            <Input
                                                type="password"
                                                required
                                                placeholder="••••••••"
                                                value={formData.confirmPassword}
                                                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                )}
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

                            <Button type="submit" className="w-full h-16 text-lg group shadow-premium" disabled={loading}>
                                {loading ? "Registering Outlet..." : "Activate Pharmacy Portal"}
                                <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                            </Button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

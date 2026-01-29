"use client";

import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserProfile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
    HeartPulse,
    ShieldCheck,
    Lock,
    Activity,
    Stethoscope,
    ArrowRight,
    CheckCircle2
} from "lucide-react";

export default function PatientRegistrationPage() {
    const { user: authUser } = useAuth();
    const [formData, setFormData] = useState({
        name: authUser?.displayName || "",
        email: authUser?.email || "",
        password: "",
        confirmPassword: "",
        fatherName: "",
        age: "",
        address: "",
        problem: "",
    });
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    // Update form if user becomes available (e.g. after Google Login redirects here)
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

        // Only check password if user is NOT authenticated via Google/etc
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
                role: "PATIENT",
                address: formData.address,
                createdAt: serverTimestamp(),
            };

            await setDoc(doc(db, "users", user.uid), {
                ...profile,
                fatherName: formData.fatherName,
                age: parseInt(formData.age),
                problem: formData.problem,
                status: "false", // Legacy status
            });

            setSuccess(true);
        } catch (err: any) {
            console.error("Registration error:", err);
            if (err.code === 'permission-denied') {
                setError("Firebase Permission Error: Please ensure your Firestore Security Rules allow document creation in the 'users' collection.");
            } else {
                setError(err.message || "Failed to register patient");
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
                        <CheckCircle2 className="h-10 w-10 text-cyan-600" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Registration Complete!</h2>
                    <p className="text-gray-500 font-medium leading-relaxed">Your portal access has been initialized. You can now enter the medical workspace.</p>
                    <Button onClick={() => window.location.href = "/login"} className="w-full">Proceed to Login</Button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-20 px-6 bg-[radial-gradient(circle_at_50%_0%,rgba(8,145,178,0.08),transparent_50%)]">
            <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16 space-y-4">
                    <h1 className="text-5xl font-black tracking-tight text-gray-900">Patient <span className="text-gradient-cyan">Onboarding</span></h1>
                    <p className="text-lg text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">Join the next-gen healthcare ecosystem and manage your records with precision.</p>
                </div>

                <div className="bg-glass rounded-[40px] shadow-premium p-10 lg:p-12 border border-white/60">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="space-y-6">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                <Activity className="text-cyan-600 h-5 w-5" /> Basic Information
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Identity Name</label>
                                    <Input
                                        required
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Work/Personal Email</label>
                                    <Input
                                        type="email"
                                        required
                                        placeholder="john@example.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Emergency Contact</label>
                                        <Input
                                            required
                                            placeholder="Guardian Name"
                                            value={formData.fatherName}
                                            onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Age</label>
                                        <Input
                                            type="number"
                                            required
                                            placeholder="25"
                                            value={formData.age}
                                            onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                <Stethoscope className="text-cyan-600 h-5 w-5" /> Clinical Context
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Symptom Description</label>
                                    <textarea
                                        className="w-full h-32 rounded-2xl border border-gray-200 bg-gray-50/20 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:bg-white focus:border-cyan-primary focus:ring-4 focus:ring-cyan-primary/10 outline-none shadow-sm focus:shadow-premium"
                                        rows={4}
                                        required
                                        placeholder="Describe your primary medical concern..."
                                        value={formData.problem}
                                        onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Residential Residence</label>
                                    <textarea
                                        className="w-full h-24 rounded-2xl border border-gray-200 bg-gray-50/20 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:bg-white focus:border-cyan-primary focus:ring-4 focus:ring-cyan-primary/10 outline-none shadow-sm focus:shadow-premium"
                                        rows={3}
                                        required
                                        placeholder="Your current permanent address..."
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>
                    </div>

                    {!authUser && (
                        <section className="space-y-6 pt-10 mt-10 border-t border-gray-100/50">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                <Lock className="text-cyan-600 h-5 w-5" /> Account Security
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Secure Password</label>
                                    <Input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Verify Password</label>
                                    <Input
                                        type="password"
                                        required
                                        placeholder="••••••••"
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>
                    )}

                    <AnimatePresence>
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold flex gap-3"
                            >
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <Button type="submit" className="w-full h-16 text-lg group shadow-premium" disabled={loading}>
                        {loading ? "Initializing Account..." : "Finalize Registration"}
                        <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

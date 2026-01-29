"use client";

import React, { useState } from "react";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserProfile, DoctorProfile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
    Activity,
    Lock,
    UserCircle,
    ShieldCheck,
    ArrowRight,
    UserRoundCheck,
    HeartPulse
} from "lucide-react";

export default function DoctorRegistrationPage() {
    const { user: authUser } = useAuth();
    const [formData, setFormData] = useState({
        name: authUser?.displayName || "",
        email: authUser?.email || "",
        password: "",
        confirmPassword: "",
        address: "",
        age: "",
        specialization: "",
        qualification: "",
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

            const profile: DoctorProfile = {
                uid: user.uid,
                email: formData.email,
                name: formData.name,
                role: "DOCTOR",
                address: formData.address,
                age: parseInt(formData.age),
                specialization: formData.specialization,
                qualification: formData.qualification,
                createdAt: serverTimestamp(),
            };

            // In legacy, status is 'false' until admin authenticates
            // We'll store an 'approved' field
            await setDoc(doc(db, "users", user.uid), {
                ...profile,
                approved: false,
            });

            setSuccess(true);
        } catch (err: any) {
            console.error("Registration error:", err);
            if (err.code === 'permission-denied') {
                setError("Firebase Permission Error: Please ensure your Firestore Security Rules allow document creation in the 'users' collection.");
            } else {
                setError(err.message || "Failed to register doctor");
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
                        <UserRoundCheck className="h-10 w-10 text-cyan-600" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">Enrollment Received</h2>
                    <p className="text-gray-500 font-medium leading-relaxed">Your professional profile has been submitted for verification. An administrator will review your credentials shortly.</p>
                    <Button onClick={() => window.location.href = "/login"} className="w-full">Back to Portal</Button>
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
                    <h1 className="text-5xl font-black tracking-tight text-gray-900">Medical <span className="text-gradient-cyan">Practitioner</span></h1>
                    <p className="text-lg text-gray-500 font-medium max-w-xl mx-auto leading-relaxed">Join our elite network of verified healthcare professionals and scale your practice digital.</p>
                </div>

                <div className="bg-glass rounded-[40px] shadow-premium p-10 lg:p-12 border border-white/60">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                        <section className="space-y-6">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                <UserCircle className="text-cyan-600 h-5 w-5" /> Persona Information
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Full Professional Name</label>
                                    <Input
                                        required
                                        placeholder="Dr. John Smith"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Medical Email</label>
                                    <Input
                                        type="email"
                                        required
                                        placeholder="dr.smith@e-health.com"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Current Age</label>
                                    <Input
                                        type="number"
                                        required
                                        placeholder="35"
                                        value={formData.age}
                                        onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                                    />
                                </div>
                            </div>
                        </section>

                        <section className="space-y-6">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-3">
                                <Activity className="text-cyan-600 h-5 w-5" /> Professional Credentials
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Field of Expertise</label>
                                    <Input
                                        required
                                        placeholder="e.g. Cardiology, Neurology"
                                        value={formData.specialization}
                                        onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Academic Qualifications</label>
                                    <Input
                                        required
                                        placeholder="e.g. MBBS, MD, FRCP"
                                        value={formData.qualification}
                                        onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-black text-gray-400 uppercase tracking-widest ml-1">Practice Location</label>
                                    <Input
                                        required
                                        placeholder="Clinic or Hospital address"
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
                                className="p-4 rounded-2xl bg-red-50 border border-red-100 text-red-600 text-[11px] font-bold flex gap-3 shadow-sm"
                            >
                                <ShieldCheck className="h-5 w-5 shrink-0" />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <div className="pt-6">
                        <Button type="submit" className="w-full h-16 text-lg group shadow-premium" disabled={loading}>
                            {loading ? "Registering Practitioner..." : "Initiate Enrollment"}
                            <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

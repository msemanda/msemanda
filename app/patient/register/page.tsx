"use client";

import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserProfile } from "@/types";

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
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-md">
                    <h2 className="text-2xl font-bold text-green-600">Registration Successful!</h2>
                    <p className="text-gray-600">Your patient profile has been created. You can now log in to view your health records.</p>
                    <Button onClick={() => window.location.href = "/login"}>Back to Login</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 font-premium">Patient Registration</h1>
                <p className="mt-2 text-lg text-gray-600">Efficient healthcare management at your fingertips</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Basic Information</h3>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Patient Full Name</label>
                            <Input
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                            <Input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Father's Name</label>
                            <Input
                                required
                                value={formData.fatherName}
                                onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Age</label>
                            <Input
                                type="number"
                                required
                                value={formData.age}
                                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                            />
                        </div>
                    </section>

                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Medical Information</h3>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Problem / Symptoms</label>
                            <textarea
                                className="w-full h-32 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                                rows={4}
                                required
                                value={formData.problem}
                                onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Resident Address</label>
                            <textarea
                                className="w-full h-24 rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3 text-sm transition-all placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none"
                                rows={3}
                                required
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </section>
                </div>

                {!authUser && (
                    <section className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-semibold">Account Security</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Password</label>
                                <Input
                                    type="password"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700">Confirm Password</label>
                                <Input
                                    type="password"
                                    required
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                />
                            </div>
                        </div>
                    </section>
                )}

                {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">{error}</p>}

                <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
                    {loading ? "Registering Patient..." : "Register Account"}
                </Button>
            </form>
        </div>
    );
}

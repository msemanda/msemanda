"use client";

import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserProfile, DoctorProfile } from "@/types";

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
            setError(err.message || "Failed to register doctor");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-md">
                    <h2 className="text-2xl font-bold text-blue-600">Registration Complete!</h2>
                    <p className="text-gray-600">Your account has been created. Please wait for an administrator to authenticate your profile before you can log in.</p>
                    <Button onClick={() => window.location.href = "/login"}>Back to Login</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-3xl mx-auto py-12 px-4">
            <div className="text-center mb-10">
                <h1 className="text-4xl font-bold tracking-tight text-gray-900 font-premium">Doctor Enrollment</h1>
                <p className="mt-2 text-lg text-gray-600">Join our network of healthcare professionals</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <section className="space-y-4">
                        <h3 className="text-lg font-semibold border-b pb-2">Personal Information</h3>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Full Name</label>
                            <Input
                                required
                                placeholder="Dr. John Doe"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Email Address</label>
                            <Input
                                type="email"
                                required
                                placeholder="doctor@e-health.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                        <h3 className="text-lg font-semibold border-b pb-2">Professional Details</h3>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Specialization</label>
                            <Input
                                required
                                placeholder="e.g. Cardiology"
                                value={formData.specialization}
                                onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Qualification</label>
                            <Input
                                required
                                placeholder="e.g. MBBS, MD"
                                value={formData.qualification}
                                onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Address / Clinic Location</label>
                            <Input
                                required
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                    </section>
                </div>

                {!authUser && (
                    <section className="space-y-4 pt-4 border-t">
                        <h3 className="text-lg font-semibold">Secure Your Account</h3>
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

                <div className="pt-6">
                    <Button type="submit" className="w-full py-6 text-lg" disabled={loading}>
                        {loading ? "Processing Registration..." : "Complete Enrollment"}
                    </Button>
                </div>
            </form>
        </div>
    );
}

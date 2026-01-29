"use client";

import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

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
            <div className="flex min-h-screen items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-md">
                    <h2 className="text-2xl font-bold text-green-600">Pharmacy Linked Successfully!</h2>
                    <p className="text-gray-600">Your pharmaceutical outlet is now part of the E-Health network. You can log in and begin processing prescriptions.</p>
                    <Button onClick={() => window.location.href = "/login"}>Login</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-12 px-4 shadow-2xl my-20 rounded-3xl overflow-hidden border">
            <div className="grid grid-cols-1 lg:grid-cols-2">
                <div className="p-10 bg-indigo-600 text-white flex flex-col justify-center">
                    <h1 className="text-4xl font-bold font-premium mb-6 tracking-tight">Pharmacy Integration</h1>
                    <p className="text-indigo-100 mb-8 leading-relaxed">Join our digital healthcare ecosystem. Link your pharmacy to receive real-time prescriptions from certified doctors across the platform.</p>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-3 text-sm">
                            <div className="h-2 w-2 bg-indigo-300 rounded-full" />
                            <span>Real-time Prescription Sync</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm">
                            <div className="h-2 w-2 bg-indigo-300 rounded-full" />
                            <span>Automated Patient Billing Connectivity</span>
                        </div>
                        <div className="flex items-center space-x-3 text-sm">
                            <div className="h-2 w-2 bg-indigo-300 rounded-full" />
                            <span>Verified Physician Network</span>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-10 space-y-6 bg-white">
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Outlet Name</label>
                            <Input
                                required
                                placeholder="e.g. City Central Pharmacy"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Chief Pharmacist</label>
                            <Input
                                required
                                placeholder="Name of lead pharmacist"
                                value={formData.pharmacistName}
                                onChange={(e) => setFormData({ ...formData, pharmacistName: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Business Email</label>
                            <Input
                                type="email"
                                required
                                placeholder="contact@pharmacy.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Office Address</label>
                            <Input
                                required
                                value={formData.address}
                                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            />
                        </div>
                        {!authUser && (
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest text-[10px]">Password</label>
                                    <Input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest text-[10px]">Confirm</label>
                                    <Input
                                        type="password"
                                        required
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-100">{error}</p>}

                    <Button type="submit" className="w-full py-6 text-lg bg-indigo-600 hover:bg-indigo-700" disabled={loading}>
                        {loading ? "Registering Outlet..." : "Register Pharmacy"}
                    </Button>
                </form>
            </div>
        </div>
    );
}

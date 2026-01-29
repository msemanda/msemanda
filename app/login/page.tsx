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

            // Verify role in Firestore
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const userData = docSnap.data();
                if (userData.role === role) {
                    // Redirect based on role
                    router.push(`/${role.toLowerCase()}/dashboard`);
                } else {
                    setError(`Invalid role selection for this account. Expected ${userData.role}.`);
                    await auth.signOut();
                }
            } else {
                setError("User profile not found.");
                await auth.signOut();
            }
        } catch (err: any) {
            setError(err.message || "Failed to login");
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
                        // Redirect to registration if profile missing
                        router.push(`/patient/register`);
                    }
                } catch (firestoreErr: any) {
                    if (firestoreErr.code === 'permission-denied') {
                        // If we can't read the profile, assume it doesn't exist or rules are blocking new users
                        // Redirect to register anyway
                        router.push(`/patient/register`);
                    } else {
                        throw firestoreErr;
                    }
                }
            }
        } catch (err: any) {
            setError(err.message || "Failed to login with Google");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8 bg-white p-10 rounded-xl shadow-lg">
                <div>
                    <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900 font-premium">
                        Sign in to E-Health
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 font-medium">
                        Access your healthcare platform securely
                    </p>
                </div>

                <div className="mt-8 space-y-6">
                    <AuthButton onClick={handleGoogleLogin} disabled={loading} />

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200" />
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="bg-white px-2 text-gray-500 font-medium uppercase tracking-widest text-[10px]">Or continue with email</span>
                        </div>
                    </div>

                    <form className="space-y-6" onSubmit={handleEmailLogin}>
                        <div className="space-y-4">
                            <div>
                                <label htmlFor="role" className="block text-sm font-bold text-gray-700 mb-1">
                                    I am a
                                </label>
                                <select
                                    id="role"
                                    value={role}
                                    onChange={(e) => setRole(e.target.value as UserRole)}
                                    className="block w-full rounded-xl border-2 border-gray-100 bg-gray-50 px-4 py-3 text-sm font-semibold text-gray-700 focus:border-blue-500 focus:ring-blue-500 transition-all outline-none"
                                >
                                    <option value="ADMIN">Administrator</option>
                                    <option value="PATIENT">Patient</option>
                                    <option value="DOCTOR">Doctor</option>
                                    <option value="PHARMACY">Pharmacy</option>
                                </select>
                            </div>
                            <div>
                                <Input
                                    id="email-address"
                                    name="email"
                                    type="email"
                                    required
                                    placeholder="Email address"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="rounded-xl border-2 border-gray-100 bg-gray-50"
                                />
                            </div>
                            <div>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    required
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="rounded-xl border-2 border-gray-100 bg-gray-50"
                                />
                            </div>
                        </div>

                        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">{error}</p>}

                        <Button type="submit" className="w-full h-12 rounded-xl shadow-lg shadow-blue-100 text-lg" disabled={loading}>
                            {loading ? "Signing in..." : "Sign in"}
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

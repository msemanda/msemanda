"use client";

import React, { useState } from "react";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { notify } from "@/lib/notify";
import { DEFAULT_ROLE_PERMISSIONS } from "@/lib/permissions";
import { UserRole, UserProfile } from "@/types";
import { motion, AnimatePresence } from "framer-motion";
import {
    Mail, Lock, ArrowRight, ShieldCheck,
    CheckCircle2, User, KeyRound, Stethoscope,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import Link from "next/link";
import { Logo } from "@/components/ui/Logo";

function getRoleDashboard(role: UserRole): string {
    switch (role) {
        case "ADMIN":           return "/admin/dashboard";
        case "PATIENT":         return "/patient/dashboard";
        case "DOCTOR":          return "/doctor/dashboard";
        case "PHARMACY":        return "/pharmacy/dashboard";
        case "NURSE":           return "/nurse/dashboard";
        case "LAB_TECH":        return "/lab/dashboard";
        case "RADIOLOGY_TECH":  return "/radiology/dashboard";
        case "PHYSIOTHERAPIST": return "/physiotherapy/dashboard";
        case "DENTIST":         return "/dental/dashboard";
        case "DIETITIAN":       return "/dietary/dashboard";
        case "EMERGENCY_STAFF": return "/emergency/dashboard";
        case "RECEPTIONIST":    return "/receptionist/dashboard";
        case "CASHIER":         return "/cashier/dashboard";
        case "CLEANER":         return "/housekeeping/dashboard";
        case "SECURITY":        return "/security/dashboard";
        case "OPTICIAN":
        case "OPTICIAN_ASSISTANT": return "/optical/dashboard";
        default:                return "/login";
    }
}

const ROLE_LABELS: Record<string, string> = {
    ADMIN: "System Administrator", PATIENT: "Patient", DOCTOR: "Medical Practitioner",
    PHARMACY: "Pharmacist", NURSE: "Nurse", LAB_TECH: "Laboratory Technician",
    RADIOLOGY_TECH: "Radiology Technician", PHYSIOTHERAPIST: "Physiotherapist",
    DENTIST: "Dentist", DIETITIAN: "Dietitian", EMERGENCY_STAFF: "Emergency Staff",
    RECEPTIONIST: "Receptionist", CASHIER: "Cashier / Accounts",
    CLEANER: "Cleaner", SECURITY: "Security / Askari",
    OPTICIAN: "Optician", OPTICIAN_ASSISTANT: "Optician Assistant",
};

const ROLE_COLORS: Record<string, string> = {
    ADMIN: "bg-purple-50 text-purple-700 border-purple-100",
    PATIENT: "bg-blue-50 text-blue-700 border-blue-100",
    DOCTOR: "bg-teal-50 text-teal-700 border-teal-100",
    PHARMACY: "bg-sky-50 text-sky-700 border-sky-100",
    NURSE: "bg-green-50 text-green-700 border-green-100",
    LAB_TECH: "bg-amber-50 text-amber-700 border-amber-100",
    RADIOLOGY_TECH: "bg-violet-50 text-violet-700 border-violet-100",
    PHYSIOTHERAPIST: "bg-orange-50 text-orange-700 border-orange-100",
    DENTIST: "bg-pink-50 text-pink-700 border-pink-100",
    DIETITIAN: "bg-emerald-50 text-emerald-700 border-emerald-100",
    EMERGENCY_STAFF: "bg-red-50 text-red-700 border-red-100",
    RECEPTIONIST: "bg-indigo-50 text-indigo-700 border-indigo-100",
    CASHIER: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100",
    CLEANER: "bg-slate-50 text-slate-700 border-slate-100",
    SECURITY: "bg-zinc-50 text-zinc-700 border-zinc-100",
    OPTICIAN: "bg-cyan-50 text-cyan-700 border-cyan-100",
    OPTICIAN_ASSISTANT: "bg-cyan-50 text-cyan-600 border-cyan-100",
};

const SUPERADMIN_EMAIL = "semandamoses91@gmail.com";

type Step = "email" | "setup" | "done";

interface InviteData {
    role: UserRole;
    invitedBy: string;
    specialization?: string;
    title?: string;
    phone?: string;
    isSuperadmin?: boolean;
}

export default function SetupPage() {
    const [step, setStep]                   = useState<Step>("email");
    const [email, setEmail]                 = useState("");
    const [invite, setInvite]               = useState<InviteData | null>(null);
    const [name, setName]                   = useState("");
    const [password, setPassword]           = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [error, setError]                 = useState("");
    const [loading, setLoading]             = useState(false);

    // ── Step 1: check invitation in Firestore ─────────────────────────────────
    const checkInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        const normalEmail = email.toLowerCase().trim();

        if (normalEmail === SUPERADMIN_EMAIL) {
            setInvite({ role: "ADMIN", invitedBy: "System", isSuperadmin: true });
            setName("System Administrator");
            setStep("setup");
            return;
        }

        setLoading(true);
        try {
            const snap = await getDoc(doc(db, "invites", normalEmail));
            if (!snap.exists()) {
                setError("No invitation found for this email. Please contact your administrator.");
            } else if (snap.data().used) {
                setError("This invitation has already been used. Contact your administrator if you need a new one.");
            } else {
                const d = snap.data();
                setInvite({
                    role:           d.role as UserRole,
                    invitedBy:      d.invitedBy || "Administrator",
                    specialization: d.specialization || "",
                    title:          d.title || "",
                    phone:          d.phone || "",
                });
                setStep("setup");
            }
        } catch {
            setError("Unable to verify invitation. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // ── Step 2: create account ────────────────────────────────────────────────
    const handleSetup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (password !== confirmPassword) { setError("Passwords do not match."); return; }
        if (password.length < 6)          { setError("Password must be at least 6 characters."); return; }
        if (!invite) return;

        setLoading(true);
        setError("");

        try {
            const uid = crypto.randomUUID();

            // Create auth record in Neon
            const res = await fetch("/api/auth/register", {
                method:  "POST",
                headers: { "Content-Type": "application/json" },
                body:    JSON.stringify({
                    uid,
                    email:       email.toLowerCase().trim(),
                    password,
                    name:        name.trim(),
                    role:        invite.role,
                    permissions: DEFAULT_ROLE_PERMISSIONS[invite.role] ?? [],
                }),
                credentials: "same-origin",
            });

            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Failed to create account. Please try again.");
                return;
            }

            // If this email already had an auth record (e.g. a second invite was
            // sent to re-activate a lost/expired one), the server keeps the
            // ORIGINAL uid rather than the fresh one generated above — use
            // data.uid, not the local `uid`, so the profile below lands on the
            // same record the login flow resolves to, instead of an orphaned one.
            const canonicalUid = data.uid as string;

            // Mark invite as used in Firestore (if not superadmin)
            if (!invite.isSuperadmin) {
                await updateDoc(doc(db, "invites", email.toLowerCase().trim()), {
                    used:   true,
                    usedAt: serverTimestamp(),
                    uid:    canonicalUid,
                });
            }

            // Create/update the staff profile so this person shows up in User
            // Management — /api/auth/register only creates login credentials,
            // not this profile. Merge so re-activating an existing account
            // doesn't wipe out unrelated fields already on the profile.
            await setDoc(doc(db, "users", canonicalUid), {
                uid:            canonicalUid,
                name:           name.trim(),
                email:          email.toLowerCase().trim(),
                role:           invite.role,
                phone:          invite.phone || "",
                title:          invite.title || "",
                specialization: invite.specialization || "",
                permissions:    [],
                createdAt:      serverTimestamp(),
            }, { merge: true });

            if (!invite.isSuperadmin) {
                await notify({
                    targetRole: "ADMIN",
                    type:       "account_setup",
                    title:      `${name.trim()} completed account setup`,
                    body:       `New ${invite.role.replace("_", " ").toLowerCase()} account activated`,
                    link:       "/admin/users",
                });
            }

            setStep("done");
            setTimeout(() => {
                window.location.href = getRoleDashboard(invite.role);
            }, 2000);
        } catch {
            setError("Failed to create account. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="min-h-screen bg-gray-50 flex items-center justify-center p-6"
            style={{ backgroundImage: "radial-gradient(at 50% 0%, rgba(37,99,235,0.06) 0, transparent 60%), radial-gradient(at 100% 100%, rgba(22,163,74,0.05) 0, transparent 50%)" }}
        >
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md"
            >
                <div className="text-center mb-8">
                    <Link href="/" className="inline-flex items-center group mb-6">
                        <Logo size={64} className="shadow-lg group-hover:scale-105 transition-transform" />
                    </Link>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">Account Setup</h1>
                    <p className="text-gray-500 mt-2 font-medium text-sm">Activate your invitation to get started</p>
                </div>

                {step === "done" ? (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white rounded-3xl shadow-premium border border-gray-100 p-10 text-center"
                    >
                        <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                            <CheckCircle2 className="h-8 w-8 text-green-600" />
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 mb-2">Account Created</h2>
                        <p className="text-gray-500 text-sm">Redirecting you to your workspace…</p>
                    </motion.div>

                ) : step === "email" ? (
                    <div className="bg-white rounded-3xl shadow-premium border border-gray-100 p-8">
                        <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                            <Stethoscope className="h-5 w-5 text-blue-600 shrink-0" />
                            <p className="text-xs font-semibold text-blue-700">
                                Access is by invitation only. Enter the email address your administrator used to invite you.
                            </p>
                        </div>
                        <form onSubmit={checkInvite} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Invited Email Address</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                                    <Input
                                        type="email"
                                        placeholder="your@email.com"
                                        className="pl-10 font-medium"
                                        required
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
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
                                {loading ? "Checking…" : "Check Invitation"}
                                {!loading && <ArrowRight className="h-4 w-4" />}
                            </button>
                        </form>

                        <div className="mt-6 pt-6 border-t border-gray-50 text-center">
                            <p className="text-sm text-gray-500">
                                Already have an account?{" "}
                                <Link href="/login" className="text-blue-600 font-bold hover:text-blue-700 transition-colors">
                                    Sign in
                                </Link>
                            </p>
                        </div>
                    </div>

                ) : (
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white rounded-3xl shadow-premium border border-gray-100 p-8"
                    >
                        {invite?.isSuperadmin ? (
                            <div className="mb-6 p-4 bg-purple-50 rounded-2xl border border-purple-100">
                                <p className="text-[10px] font-bold text-purple-400 uppercase tracking-wider mb-1">System Bootstrap</p>
                                <p className="text-sm font-bold text-purple-900">{email}</p>
                                <p className="text-xs text-purple-600 mt-1">Setting up the superadmin account — no invitation required.</p>
                            </div>
                        ) : (
                            <div className="mb-6 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Invitation for</p>
                                <p className="text-sm font-bold text-gray-900">{email}</p>
                                <div className="mt-2 flex items-center gap-2">
                                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${ROLE_COLORS[invite?.role || "PATIENT"]}`}>
                                        {ROLE_LABELS[invite?.role || "PATIENT"]}
                                    </span>
                                    <span className="text-[10px] text-gray-400">by {invite?.invitedBy}</span>
                                </div>
                            </div>
                        )}

                        <form onSubmit={handleSetup} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder="Your full name"
                                        className="pl-10 font-medium"
                                        required
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Password</label>
                                <div className="relative">
                                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                                    <Input
                                        type="password"
                                        placeholder="Min. 6 characters"
                                        className="pl-10"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Confirm Password</label>
                                <div className="relative">
                                    <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-gray-400" />
                                    <Input
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10"
                                        required
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
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
                                {loading ? "Creating Account…" : "Create My Account"}
                                {!loading && <ArrowRight className="h-4 w-4" />}
                            </button>
                        </form>
                    </motion.div>
                )}
            </motion.div>
        </div>
    );
}

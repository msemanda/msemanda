"use client";

import React, { useEffect, useState } from "react";
import {
    collection, query, where, getDocs, doc,
    setDoc, deleteDoc, serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fmtDate } from "@/lib/ts";
import { useAuth } from "@/context/AuthContext";
import { UserRole } from "@/types";
import {
    Mail, Send, Trash2, CheckCircle2, Clock,
    UserPlus, ShieldCheck, RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Input } from "@/components/ui/Input";

const STAFF_ROLES: { value: UserRole; label: string }[] = [
    { value: "PATIENT", label: "Patient" },
    { value: "DOCTOR", label: "Doctor" },
    { value: "RECEPTIONIST", label: "Receptionist" },
    { value: "NURSE", label: "Nurse" },
    { value: "LAB_TECH", label: "Lab Technician" },
    { value: "RADIOLOGY_TECH", label: "Radiology Technician" },
    { value: "PHYSIOTHERAPIST", label: "Physiotherapist" },
    { value: "DENTIST", label: "Dentist" },
    { value: "DIETITIAN", label: "Dietitian" },
    { value: "EMERGENCY_STAFF", label: "Emergency Staff" },
    { value: "PHARMACY", label: "Pharmacist" },
    { value: "CASHIER", label: "Cashier / Accounts" },
];

const ROLE_COLORS: Record<string, string> = {
    PATIENT: "bg-blue-50 text-blue-700 border-blue-100",
    DOCTOR: "bg-teal-50 text-teal-700 border-teal-100",
    RECEPTIONIST: "bg-indigo-50 text-indigo-700 border-indigo-100",
    NURSE: "bg-green-50 text-green-700 border-green-100",
    LAB_TECH: "bg-amber-50 text-amber-700 border-amber-100",
    RADIOLOGY_TECH: "bg-purple-50 text-purple-700 border-purple-100",
    PHYSIOTHERAPIST: "bg-orange-50 text-orange-700 border-orange-100",
    DENTIST: "bg-pink-50 text-pink-700 border-pink-100",
    DIETITIAN: "bg-emerald-50 text-emerald-700 border-emerald-100",
    EMERGENCY_STAFF: "bg-red-50 text-red-700 border-red-100",
    PHARMACY: "bg-sky-50 text-sky-700 border-sky-100",
};

interface InviteRecord {
    email: string;
    role: UserRole;
    invitedBy: string;
    invitedAt: any;
    used: boolean;
    uid?: string;
}

type Tab = "send" | "pending" | "used";

export default function InviteStaffPage() {
    const { profile } = useAuth();
    const [tab, setTab] = useState<Tab>("send");
    const [inviteEmail, setInviteEmail] = useState("");
    const [inviteRole, setInviteRole] = useState<UserRole>("DOCTOR");
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState("");
    const [sendSuccess, setSendSuccess] = useState("");
    const [invites, setInvites] = useState<InviteRecord[]>([]);
    const [loadingInvites, setLoadingInvites] = useState(false);
    const [revoking, setRevoking] = useState<string | null>(null);

    useEffect(() => {
        if (tab !== "send") fetchInvites(tab === "used");
    }, [tab]);

    const fetchInvites = async (used: boolean) => {
        setLoadingInvites(true);
        try {
            const q = query(collection(db, "invites"), where("used", "==", used));
            const snap = await getDocs(q);
            setInvites(snap.docs.map(d => ({ email: d.id, ...d.data() } as InviteRecord)));
        } catch (err) {
            console.error("Error fetching invites:", err);
        } finally {
            setLoadingInvites(false);
        }
    };

    const handleSendInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setSendError("");
        setSendSuccess("");
        const email = inviteEmail.toLowerCase().trim();
        try {
            await setDoc(doc(db, "invites", email), {
                email,
                role: inviteRole,
                invitedBy: profile?.name || "Administrator",
                invitedAt: serverTimestamp(),
                used: false,
            });
            setSendSuccess(`Invitation created for ${email} as ${STAFF_ROLES.find(r => r.value === inviteRole)?.label}.`);
            setInviteEmail("");
        } catch (err: any) {
            setSendError(err.message || "Failed to create invitation.");
        } finally {
            setSending(false);
        }
    };

    const handleRevoke = async (email: string) => {
        setRevoking(email);
        try {
            await deleteDoc(doc(db, "invites", email));
            setInvites(prev => prev.filter(i => i.email !== email));
        } catch (err) {
            console.error("Error revoking invite:", err);
        } finally {
            setRevoking(null);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Staff Invitations</h1>
                <p className="text-sm text-gray-500 mt-0.5">Send role-specific invitations — staff use them at <span className="font-bold text-blue-600">/setup</span> to create their account</p>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 flex gap-1.5 w-fit">
                {(["send", "pending", "used"] as Tab[]).map(t => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold capitalize transition-all ${
                            tab === t ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
                        }`}
                    >
                        {t === "send" ? "Send Invite" : t === "pending" ? "Pending" : "Used"}
                    </button>
                ))}
            </div>

            {/* Send Invite Form */}
            {tab === "send" && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-lg">
                    <div className="flex items-center gap-3 mb-5">
                        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-gray-900">New Invitation</h2>
                            <p className="text-xs text-gray-400">Staff will receive a link to /setup</p>
                        </div>
                    </div>

                    <form onSubmit={handleSendInvite} className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="email"
                                    placeholder="staff@hospital.com"
                                    className="pl-10"
                                    required
                                    value={inviteEmail}
                                    onChange={(e) => setInviteEmail(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Role</label>
                            <select
                                value={inviteRole}
                                onChange={(e) => setInviteRole(e.target.value as UserRole)}
                                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer"
                            >
                                {STAFF_ROLES.map(r => (
                                    <option key={r.value} value={r.value}>{r.label}</option>
                                ))}
                            </select>
                        </div>

                        <AnimatePresence>
                            {sendError && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                    className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex gap-2">
                                    <ShieldCheck className="h-4 w-4 shrink-0" />
                                    <span>{sendError}</span>
                                </motion.div>
                            )}
                            {sendSuccess && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                    className="p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-xs font-semibold flex gap-2">
                                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                                    <span>{sendSuccess}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={sending}
                            className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                        >
                            {sending ? (
                                <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                            ) : (
                                <><Send className="h-4 w-4" /> Create Invitation</>
                            )}
                        </button>
                    </form>

                    <div className="mt-5 p-3.5 bg-gray-50 rounded-xl border border-gray-100 text-xs text-gray-500 font-medium">
                        The invitee can activate their account at <span className="font-bold text-gray-700">/setup</span> using this email address. Share that link with them directly.
                    </div>
                </motion.div>
            )}

            {/* Pending / Used Invites */}
            {tab !== "send" && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-500">
                            {tab === "pending" ? "Awaiting activation" : "Already activated"}
                        </p>
                        <button onClick={() => fetchInvites(tab === "used")}
                            className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline">
                            <RefreshCw className="h-3.5 w-3.5" /> Refresh
                        </button>
                    </div>

                    {loadingInvites ? (
                        <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                            <div className="animate-spin h-8 w-8 border-3 border-blue-100 border-t-blue-600 rounded-full" />
                        </div>
                    ) : invites.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                            <Clock className="h-10 w-10 text-gray-200 mb-3" />
                            <p className="text-sm font-black text-gray-900 mb-1">No {tab} invitations</p>
                            <p className="text-xs text-gray-400">
                                {tab === "pending" ? "Send an invite from the Send Invite tab." : "No invitations have been used yet."}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence>
                                {invites.map((invite, idx) => (
                                    <motion.div
                                        key={invite.email}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${ROLE_COLORS[invite.role] || "bg-gray-50 text-gray-600 border-gray-100"}`}>
                                                {STAFF_ROLES.find(r => r.value === invite.role)?.label || invite.role}
                                            </span>
                                            {invite.used ? (
                                                <span className="text-[10px] font-bold text-green-600 flex items-center gap-1">
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Used
                                                </span>
                                            ) : (
                                                <span className="text-[10px] font-bold text-amber-600 flex items-center gap-1">
                                                    <Clock className="h-3.5 w-3.5" /> Pending
                                                </span>
                                            )}
                                        </div>

                                        <p className="text-sm font-black text-gray-900 break-all">{invite.email}</p>
                                        <p className="text-xs text-gray-400 mt-1">
                                            by {invite.invitedBy} · {fmtDate(invite.invitedAt, "recently")}
                                        </p>

                                        {!invite.used && (
                                            <button
                                                onClick={() => handleRevoke(invite.email)}
                                                disabled={revoking === invite.email}
                                                className="mt-3 w-full h-9 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60"
                                            >
                                                {revoking === invite.email ? (
                                                    <div className="animate-spin h-3.5 w-3.5 border-2 border-red-200 border-t-red-500 rounded-full" />
                                                ) : (
                                                    <><Trash2 className="h-3.5 w-3.5" /> Revoke</>
                                                )}
                                            </button>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

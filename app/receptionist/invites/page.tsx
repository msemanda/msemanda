"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, setDoc, deleteDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { fmtDate } from "@/lib/ts";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Clock, CheckCircle2, Trash2, RefreshCw, Mail, UserPlus, ShieldCheck } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface InviteRecord {
    email: string;
    invitedBy: string;
    invitedAt: any;
    used: boolean;
}

export default function ReceptionistInvitesPage() {
    const { profile } = useAuth();
    const [invites, setInvites] = useState<InviteRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [email, setEmail] = useState("");
    const [sending, setSending] = useState(false);
    const [sendError, setSendError] = useState("");
    const [sendSuccess, setSendSuccess] = useState("");
    const [revoking, setRevoking] = useState<string | null>(null);
    const [tab, setTab] = useState<"pending" | "used">("pending");

    useEffect(() => {
        fetchInvites();
    }, [tab]);

    const fetchInvites = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "invites"),
                where("role", "==", "PATIENT"),
                where("used", "==", tab === "used")
            );
            const snap = await getDocs(q);
            setInvites(snap.docs.map(d => ({ email: d.id, ...d.data() } as InviteRecord)));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        setSending(true);
        setSendError("");
        setSendSuccess("");
        const normalEmail = email.toLowerCase().trim();
        try {
            const existing = await getDoc(doc(db, "invites", normalEmail));
            if (existing.exists() && !existing.data().used) {
                setSendError("An active invitation already exists for this email.");
                return;
            }
            await setDoc(doc(db, "invites", normalEmail), {
                email: normalEmail,
                role: "PATIENT",
                invitedBy: profile?.name || "Reception",
                invitedAt: serverTimestamp(),
                used: false,
            });
            setSendSuccess(`Invitation created for ${normalEmail}. Share the /setup link with the patient.`);
            setEmail("");
            if (tab === "pending") fetchInvites();
        } catch (err: any) {
            setSendError(err.message || "Failed to create invitation.");
        } finally {
            setSending(false);
        }
    };

    const revoke = async (inviteEmail: string) => {
        setRevoking(inviteEmail);
        try {
            await deleteDoc(doc(db, "invites", inviteEmail));
            setInvites(prev => prev.filter(i => i.email !== inviteEmail));
        } catch (err) {
            console.error(err);
        } finally {
            setRevoking(null);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Patient Invitations</h1>
                <p className="text-sm text-gray-500 mt-0.5">Send patients an invite so they can create their account at <span className="font-mono font-bold">/setup</span></p>
            </div>

            {/* Send form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 max-w-lg">
                <div className="flex items-center gap-3 mb-5">
                    <div className="h-10 w-10 bg-teal-50 rounded-xl flex items-center justify-center">
                        <UserPlus className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                        <h2 className="text-base font-black text-gray-900">New Patient Invitation</h2>
                        <p className="text-xs text-gray-400">Enter the patient's email to create an invite</p>
                    </div>
                </div>
                <form onSubmit={handleSend} className="space-y-3">
                    <div className="relative">
                        <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            type="email"
                            placeholder="patient@email.com"
                            className="pl-10"
                            required
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                        />
                    </div>
                    <AnimatePresence>
                        {sendError && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                className="p-3 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex gap-2">
                                <ShieldCheck className="h-4 w-4 shrink-0" /><span>{sendError}</span>
                            </motion.div>
                        )}
                        {sendSuccess && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                className="p-3 rounded-xl bg-green-50 border border-green-100 text-green-700 text-xs font-semibold flex gap-2">
                                <CheckCircle2 className="h-4 w-4 shrink-0" /><span>{sendSuccess}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <button type="submit" disabled={sending}
                        className="w-full h-11 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                        {sending
                            ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                            : <><Send className="h-4 w-4" /> Send Invitation</>}
                    </button>
                </form>
            </div>

            {/* List */}
            <div>
                <div className="flex items-center gap-3 mb-4">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-1.5 flex gap-1">
                        {(["pending", "used"] as const).map(t => (
                            <button key={t} onClick={() => setTab(t)}
                                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold capitalize transition-all ${tab === t ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-50"}`}>
                                {t}
                            </button>
                        ))}
                    </div>
                    <button onClick={fetchInvites}
                        className="h-9 w-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-400 hover:text-blue-600 hover:border-blue-200 transition-all">
                        <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-16 bg-white rounded-2xl border border-gray-100">
                        <div className="animate-spin h-8 w-8 border-[3px] border-teal-100 border-t-teal-600 rounded-full" />
                    </div>
                ) : invites.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                        <Clock className="h-10 w-10 text-gray-200 mb-3" />
                        <p className="text-sm font-black text-gray-900 mb-1">No {tab} invitations</p>
                        <p className="text-xs text-gray-400">
                            {tab === "pending" ? "Send an invite above." : "No invitations have been used yet."}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <AnimatePresence>
                            {invites.map((invite, idx) => (
                                <motion.div key={invite.email}
                                    initial={{ opacity: 0, y: 12 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    transition={{ delay: idx * 0.04 }}
                                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                                    <div className="flex items-start justify-between mb-3">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${invite.used ? "bg-green-50 text-green-700 border-green-100" : "bg-amber-50 text-amber-700 border-amber-100"}`}>
                                            {invite.used ? "Used" : "Pending"}
                                        </span>
                                    </div>
                                    <p className="text-sm font-black text-gray-900 break-all">{invite.email}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        by {invite.invitedBy} · {fmtDate(invite.invitedAt, "recently")}
                                    </p>
                                    {!invite.used && (
                                        <button onClick={() => revoke(invite.email)} disabled={revoking === invite.email}
                                            className="mt-3 w-full h-9 rounded-xl border border-red-100 text-red-500 hover:bg-red-50 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors disabled:opacity-60">
                                            {revoking === invite.email
                                                ? <div className="animate-spin h-3.5 w-3.5 border-2 border-red-200 border-t-red-500 rounded-full" />
                                                : <><Trash2 className="h-3.5 w-3.5" /> Revoke</>}
                                        </button>
                                    )}
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    </div>
                )}
            </div>
        </div>
    );
}

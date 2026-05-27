"use client";

import { useState } from "react";
import { doc, setDoc, serverTimestamp, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    UserPlus, Mail, Phone, FileText, Send,
    CheckCircle2, ShieldCheck, ArrowRight, AlertCircle
} from "lucide-react";
import { Input } from "@/components/ui/Input";

type Step = "form" | "done";

export default function AdmitPatientPage() {
    const { profile } = useAuth();
    const [step, setStep] = useState<Step>("form");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [sendInvite, setSendInvite] = useState(true);
    const [admittedEmail, setAdmittedEmail] = useState("");

    const [form, setForm] = useState({
        patientName: "",
        patientEmail: "",
        phone: "",
        problem: "",
        assignedDoctorId: "",
    });

    const update = (field: string, value: string) =>
        setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const email = form.patientEmail.toLowerCase().trim();

        try {
            // Create admission record
            const admissionId = `adm_${Date.now()}`;
            await setDoc(doc(db, "admissions", admissionId), {
                patientName: form.patientName.trim(),
                patientEmail: email,
                phone: form.phone.trim(),
                problem: form.problem.trim(),
                assignedDoctorId: form.assignedDoctorId.trim() || null,
                admittedBy: profile?.uid,
                admittedByName: profile?.name,
                admittedAt: serverTimestamp(),
                inviteSent: sendInvite,
                status: "ADMITTED",
            });

            // Create patient invite if requested
            if (sendInvite) {
                const existingInvite = await getDoc(doc(db, "invites", email));
                if (!existingInvite.exists() || existingInvite.data().used) {
                    await setDoc(doc(db, "invites", email), {
                        email,
                        role: "PATIENT",
                        invitedBy: profile?.name || "Reception",
                        invitedAt: serverTimestamp(),
                        used: false,
                        admissionId,
                    });
                }
            }

            setAdmittedEmail(email);
            setStep("done");
        } catch (err: any) {
            setError(err.message || "Failed to admit patient. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const reset = () => {
        setStep("form");
        setForm({ patientName: "", patientEmail: "", phone: "", problem: "", assignedDoctorId: "" });
        setSendInvite(true);
        setError("");
    };

    if (step === "done") {
        return (
            <div className="max-w-lg mx-auto py-10">
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center"
                >
                    <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Patient Admitted</h2>
                    {sendInvite && (
                        <div className="mt-4 p-4 bg-teal-50 rounded-2xl border border-teal-100 text-left">
                            <p className="text-xs font-bold text-teal-700 flex items-center gap-2 mb-1">
                                <Send className="h-3.5 w-3.5" /> Invitation Created
                            </p>
                            <p className="text-sm text-teal-800">
                                <span className="font-bold">{admittedEmail}</span> can now visit{" "}
                                <span className="font-mono font-bold">/setup</span> to create their account.
                            </p>
                        </div>
                    )}
                    <div className="mt-6 flex gap-3">
                        <button onClick={reset}
                            className="flex-1 h-11 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors">
                            Admit Another
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pb-10">
            <div className="mb-6">
                <h1 className="text-2xl font-black text-gray-900">Admit Walk-in Patient</h1>
                <p className="text-sm text-gray-500 mt-0.5">Register the patient at the desk and optionally send them an invite to create their account online</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="p-6 border-b border-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <UserPlus className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-black text-gray-900">Patient Details</h2>
                            <p className="text-xs text-gray-400">Collected at the reception desk</p>
                        </div>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                            <Input
                                required
                                placeholder="Patient full name"
                                value={form.patientName}
                                onChange={e => update("patientName", e.target.value)}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Phone Number</label>
                            <div className="relative">
                                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                    type="tel"
                                    placeholder="+256 700 000 000"
                                    className="pl-10"
                                    value={form.phone}
                                    onChange={e => update("phone", e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Email Address</label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                type="email"
                                required
                                placeholder="patient@email.com"
                                className="pl-10"
                                value={form.patientEmail}
                                onChange={e => update("patientEmail", e.target.value)}
                            />
                        </div>
                        <p className="text-[11px] text-gray-400 ml-1">Used to send the account setup invitation</p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Chief Complaint / Reason for Visit</label>
                        <div className="relative">
                            <FileText className="absolute left-3.5 top-3.5 h-4 w-4 text-gray-400" />
                            <textarea
                                required
                                rows={3}
                                placeholder="Describe the patient's main complaint or reason for visit..."
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                                value={form.problem}
                                onChange={e => update("problem", e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Invite toggle */}
                    <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-black text-teal-800 flex items-center gap-2">
                                    <Send className="h-4 w-4" /> Send Account Invitation
                                </p>
                                <p className="text-xs text-teal-600 mt-1">
                                    Creates an invite so the patient can register at <span className="font-mono font-bold">/setup</span> using their email
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSendInvite(!sendInvite)}
                                className={`relative shrink-0 h-6 w-11 rounded-full transition-colors ${sendInvite ? "bg-teal-600" : "bg-gray-200"}`}
                            >
                                <div className={`absolute top-1 h-4 w-4 bg-white rounded-full shadow transition-transform ${sendInvite ? "translate-x-6" : "translate-x-1"}`} />
                            </button>
                        </div>
                        {!sendInvite && (
                            <div className="mt-3 flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl p-2.5 border border-amber-100">
                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>Patient will not be able to view their records online without an invitation.</span>
                            </div>
                        )}
                    </div>

                    <AnimatePresence>
                        {error && (
                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                                className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex gap-2">
                                <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" />
                                <span>{error}</span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-600/20"
                    >
                        {loading ? (
                            <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                        ) : (
                            <>Admit Patient {sendInvite && "& Send Invite"} <ArrowRight className="h-4 w-4" /></>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}

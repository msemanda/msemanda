"use client";

import React, { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/types";
import { CheckCircle2, User, ShieldCheck, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const STAFF_ROLES: { value: UserRole; label: string }[] = [
    { value: "DOCTOR", label: "Doctors" },
    { value: "NURSE", label: "Nurses" },
    { value: "LAB_TECH", label: "Lab Technicians" },
    { value: "RADIOLOGY_TECH", label: "Radiology Technicians" },
    { value: "PHYSIOTHERAPIST", label: "Physiotherapists" },
    { value: "DENTIST", label: "Dentists" },
    { value: "DIETITIAN", label: "Dietitians" },
    { value: "EMERGENCY_STAFF", label: "Emergency Staff" },
    { value: "PHARMACY", label: "Pharmacists" },
];

const ROLE_COLORS: Record<string, string> = {
    DOCTOR: "bg-blue-50 text-blue-700 border-blue-100",
    NURSE: "bg-teal-50 text-teal-700 border-teal-100",
    LAB_TECH: "bg-amber-50 text-amber-700 border-amber-100",
    RADIOLOGY_TECH: "bg-purple-50 text-purple-700 border-purple-100",
    PHYSIOTHERAPIST: "bg-orange-50 text-orange-700 border-orange-100",
    DENTIST: "bg-pink-50 text-pink-700 border-pink-100",
    DIETITIAN: "bg-green-50 text-green-700 border-green-100",
    EMERGENCY_STAFF: "bg-red-50 text-red-700 border-red-100",
    PHARMACY: "bg-sky-50 text-sky-700 border-sky-100",
};

export default function StaffVerificationPage() {
    const [selectedRole, setSelectedRole] = useState<UserRole>("DOCTOR");
    const [staff, setStaff] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingStaff(selectedRole);
    }, [selectedRole]);

    const fetchPendingStaff = async (role: UserRole) => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "users"),
                where("role", "==", role),
                where("approved", "==", false)
            );
            const snapshot = await getDocs(q);
            setStaff(snapshot.docs.map(d => d.data() as UserProfile));
        } catch (error) {
            console.error("Error fetching staff:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (uid: string) => {
        setProcessing(uid);
        try {
            await updateDoc(doc(db, "users", uid), { approved: true });
            setStaff(prev => prev.filter(s => s.uid !== uid));
        } catch (error) {
            console.error("Error approving staff:", error);
        } finally {
            setProcessing(null);
        }
    };

    const currentLabel = STAFF_ROLES.find(r => r.value === selectedRole)?.label || "Staff";
    const roleColor = ROLE_COLORS[selectedRole] || "bg-blue-50 text-blue-700 border-blue-100";

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">Staff Verification</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Review and approve pending staff registrations</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${roleColor}`}>
                        {staff.length} pending
                    </span>
                </div>
            </div>

            {/* Role tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3">
                <div className="flex flex-wrap gap-1.5">
                    {STAFF_ROLES.map((r) => (
                        <button
                            key={r.value}
                            onClick={() => setSelectedRole(r.value)}
                            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                                selectedRole === r.value
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-600 hover:bg-gray-50"
                            }`}
                        >
                            {r.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            {loading ? (
                <div className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-3 border-blue-100 border-t-blue-600 rounded-full mb-4" />
                    <p className="text-sm text-gray-400 font-semibold">Loading {currentLabel}...</p>
                </div>
            ) : staff.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="flex flex-col items-center justify-center py-24 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <CheckCircle2 className="h-12 w-12 text-green-400 mb-3" />
                    <h3 className="text-lg font-black text-gray-900 mb-1">All Clear</h3>
                    <p className="text-sm text-gray-400">No pending {currentLabel.toLowerCase()} awaiting verification</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <AnimatePresence>
                        {staff.map((member, idx) => (
                            <motion.div
                                key={member.uid}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: idx * 0.06 }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-premium transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-100">
                                        Pending
                                    </span>
                                </div>
                                <h3 className="text-base font-black text-gray-900">{member.name}</h3>
                                <p className="text-xs text-gray-500 mt-0.5">{member.email}</p>
                                {member.address && (
                                    <p className="text-xs text-gray-400 mt-0.5">{member.address}</p>
                                )}
                                <p className="text-[10px] text-gray-300 uppercase tracking-wider mt-1">
                                    Registered {member.createdAt?.seconds ? new Date(member.createdAt.seconds * 1000).toLocaleDateString() : "recently"}
                                </p>

                                <button
                                    onClick={() => handleApprove(member.uid)}
                                    disabled={processing === member.uid}
                                    className="mt-4 w-full h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    {processing === member.uid ? (
                                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                    ) : (
                                        <><ShieldCheck className="h-4 w-4" /> Approve Access</>
                                    )}
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

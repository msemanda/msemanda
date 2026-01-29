"use client";

import React, { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { UserProfile } from "@/types";
import { CheckCircle, XCircle, User, ShieldCheck, Stethoscope } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AuthenticateDoctorsPage() {
    const [doctors, setDoctors] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingDoctors();
    }, []);

    const fetchPendingDoctors = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "users"),
                where("role", "==", "DOCTOR"),
                where("approved", "==", false)
            );
            const querySnapshot = await getDocs(q);
            const docs: UserProfile[] = [];
            querySnapshot.forEach((doc) => {
                docs.push(doc.data() as UserProfile);
            });
            setDoctors(docs);
        } catch (error) {
            console.error("Error fetching doctors:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAuthenticate = async (uid: string) => {
        setProcessing(uid);
        try {
            const docRef = doc(db, "users", uid);
            await updateDoc(docRef, {
                approved: true
            });
            setDoctors(doctors.filter(d => d.uid !== uid));
        } catch (error) {
            console.error("Error authenticating doctor:", error);
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="space-y-12 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Credentials <span className="text-gradient-cyan">Verification</span></h1>
                    <p className="text-gray-500 font-medium">Review and authorize the medical network infrastructure.</p>
                </div>
                <div className="flex items-center gap-3">
                    <div className="h-12 px-6 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-xs font-black text-gray-400 uppercase tracking-widest shadow-sm">
                        Total Pending: {doctors.length}
                    </div>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-40 bg-white/50 rounded-[48px] border-2 border-dashed border-gray-100">
                    <div className="animate-spin h-10 w-10 border-4 border-cyan-100 border-t-cyan-600 rounded-full mb-6" />
                    <p className="text-gray-400 font-black uppercase tracking-[0.3em] text-[10px]">Scanning Registry</p>
                </div>
            ) : doctors.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white/50 p-24 rounded-[48px] border-2 border-dashed border-gray-100 text-center"
                >
                    <div className="h-24 w-24 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-8 shadow-sm">
                        <CheckCircle className="h-10 w-10 text-teal-600" />
                    </div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Network Fully Verified</h2>
                    <p className="text-gray-400 font-medium max-w-sm mx-auto">All medical professionals have been successfully synchronized and authenticated.</p>
                </motion.div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    <AnimatePresence>
                        {doctors.map((doctor, idx) => (
                            <motion.div
                                key={doctor.uid}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                transition={{ delay: idx * 0.1 }}
                                className="bg-glass p-8 rounded-[40px] shadow-premium border border-white group hover:border-cyan-200 transition-all overflow-hidden relative"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                                    <Stethoscope className="h-24 w-24" />
                                </div>

                                <div className="flex items-start justify-between mb-8 relative z-10">
                                    <div className="bg-cyan-50 p-4 rounded-2xl group-hover:rotate-6 transition-transform shadow-sm">
                                        <User className="h-6 w-6 text-cyan-600" />
                                    </div>
                                    <div className="text-[9px] font-black px-3 py-1.5 bg-yellow-50 text-yellow-700 rounded-full uppercase tracking-widest border border-yellow-100/50">
                                        Identity Pending
                                    </div>
                                </div>

                                <div className="relative z-10">
                                    <h3 className="text-2xl font-black text-gray-900 mb-1">{doctor.name}</h3>
                                    <p className="text-sm text-gray-500 font-medium mb-1">{doctor.email}</p>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Joined {new Date(doctor.createdAt?.seconds * 1000).toLocaleDateString()}</p>
                                </div>

                                <div className="mt-10 pt-8 border-t border-gray-100 space-y-6 relative z-10">
                                    <div className="flex justify-between items-center text-xs">
                                        <span className="font-black text-gray-400 uppercase tracking-[0.2em]">Operational Address</span>
                                        <span className="font-bold text-gray-700 truncate ml-4 bg-gray-50 px-3 py-1 rounded-lg">{doctor.address}</span>
                                    </div>
                                    <Button
                                        className="h-16 w-full rounded-2xl shadow-xl font-black group-hover:bg-cyan-700 transition-all flex items-center justify-center gap-3"
                                        disabled={processing === doctor.uid}
                                        onClick={() => handleAuthenticate(doctor.uid)}
                                    >
                                        {processing === doctor.uid ? (
                                            <div className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full" />
                                        ) : (
                                            <>
                                                <ShieldCheck className="h-5 w-5" />
                                                Authenticate Node
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>
            )}
        </div>
    );
}

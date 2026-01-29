"use client";

import { TopNav } from "@/components/TopNav";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HeartPulse } from "lucide-react";

export default function PharmacyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || profile.role !== "PHARMACY")) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="relative">
                        <div className="absolute inset-0 bg-cyan-500/20 blur-2xl rounded-full" />
                        <motion.div
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [0, 5, 0]
                            }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="relative p-4 bg-white rounded-3xl shadow-premium border border-cyan-100"
                        >
                            <HeartPulse className="h-10 w-10 text-cyan-600" />
                        </motion.div>
                    </div>
                    <p className="mt-6 text-xs font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Initializing Pharmacy Node</p>
                </motion.div>
            </div>
        );
    }

    if (!profile || profile.role !== "PHARMACY") return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <TopNav role="PHARMACY" />
            <main className="flex-1 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={profile?.uid}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
}

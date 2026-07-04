"use client";

import { Sidebar } from "@/components/admin/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "@/components/ui/Logo";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || profile.role !== "ADMIN")) {
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
                            className="relative"
                        >
                            <Logo size={80} />
                        </motion.div>
                    </div>
                    <p className="mt-6 text-xs font-black text-gray-400 uppercase tracking-[0.3em] animate-pulse">Initializing Terminal</p>
                </motion.div>
            </div>
        );
    }

    if (!profile || profile.role !== "ADMIN") return null;

    return (
        <div className="flex h-screen bg-mesh overflow-hidden">
            <Sidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <main className="flex-1 overflow-y-auto px-4 pt-14 pb-4 md:px-6 md:py-6 lg:px-10 lg:py-10 scrollbar-hide">
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
        </div>
    );
}

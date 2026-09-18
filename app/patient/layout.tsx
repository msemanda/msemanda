"use client";

import { TopNav } from "@/components/TopNav";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PatientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || (profile.role !== "PATIENT" && profile.role !== "ADMIN"))) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Patient Portal" />;

    if (!profile || (profile.role !== "PATIENT" && profile.role !== "ADMIN")) return null;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <TopNav role="PATIENT" />
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

"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Eye, FileText, Package } from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    { label: "Overview", items: [
        { name: "Dashboard", href: "/optical/dashboard", icon: LayoutDashboard },
    ]},
    { label: "Eye Clinic", items: [
        { name: "Eye Exams", href: "/optical/exams", icon: Eye },
        { name: "Prescriptions", href: "/optical/prescriptions", icon: FileText },
        { name: "Dispensing", href: "/optical/dispensing", icon: Package },
    ]},
];

export default function OpticalLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    const allowed = (role?: string) => role === "OPTICIAN" || role === "OPTICIAN_ASSISTANT" || role === "ADMIN";

    useEffect(() => {
        if (!loading && (!profile || !allowed(profile.role))) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Optical" />;
    if (!profile || !allowed(profile.role)) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Optical" />
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.main key={profile?.uid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex-1 p-4 pt-14 md:p-6">
                        {children}
                    </motion.main>
                </AnimatePresence>
            </div>
        </div>
    );
}

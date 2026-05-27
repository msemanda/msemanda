"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ClipboardCheck, AlertTriangle, Activity, FileText } from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    { label: "Overview", items: [
        { name: "Dashboard", href: "/quality/dashboard", icon: LayoutDashboard },
    ]},
    { label: "Quality", items: [
        { name: "Audits", href: "/quality/audits", icon: ClipboardCheck },
        { name: "Infection Incidents", href: "/quality/infections", icon: AlertTriangle },
    ]},
    { label: "Reporting", items: [
        { name: "Compliance Reports", href: "/quality/reports", icon: FileText },
    ]},
];

export default function QualityLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || !["ADMIN","DOCTOR","NURSE"].includes(profile.role))) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Quality Control" />;
    if (!profile || !["ADMIN","DOCTOR","NURSE"].includes(profile.role)) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Quality & IC" />
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

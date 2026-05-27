"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, CalendarDays, ClipboardList, TrendingUp } from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    { label: "Overview", items: [{ name: "Dashboard", href: "/physiotherapy/dashboard", icon: LayoutDashboard }] },
    {
        label: "Patient Care",
        items: [
            { name: "My Patients", href: "/physiotherapy/patients", icon: Users },
            { name: "Sessions", href: "/physiotherapy/sessions", icon: CalendarDays },
            { name: "Treatment Plans", href: "/physiotherapy/plans", icon: ClipboardList },
        ],
    },
    { label: "Outcomes", items: [{ name: "Progress Tracking", href: "/physiotherapy/progress", icon: TrendingUp }] },
];

export default function PhysiotherapyLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || (profile.role !== "PHYSIOTHERAPIST" && profile.role !== "ADMIN"))) router.push("/login");
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Physiotherapy Workspace" />;
    if (!profile || (profile.role !== "PHYSIOTHERAPIST" && profile.role !== "ADMIN")) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Physiotherapy" />
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.main key={profile?.uid} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }} className="flex-1 p-6">
                        {children}
                    </motion.main>
                </AnimatePresence>
            </div>
        </div>
    );
}

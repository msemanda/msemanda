"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Sparkles, Users, CalendarDays, TrendingUp, Apple } from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    { label: "Overview", items: [{ name: "Dashboard", href: "/wellness/dashboard", icon: LayoutDashboard }] },
    {
        label: "Programs",
        items: [
            { name: "Wellness Programs", href: "/wellness/programs", icon: Sparkles },
            { name: "Enrollments", href: "/wellness/enrollments", icon: Users },
            { name: "Schedule", href: "/wellness/schedule", icon: CalendarDays },
        ],
    },
    {
        label: "Health Tracking",
        items: [
            { name: "Progress", href: "/wellness/progress", icon: TrendingUp },
            { name: "Nutrition", href: "/wellness/nutrition", icon: Apple },
        ],
    },
];

export default function WellnessLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !profile) router.push("/login");
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Wellness Hub" />;
    if (!profile) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Wellness" />
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

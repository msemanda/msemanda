"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Users, MapPin, CalendarDays, ClipboardList } from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    { label: "Overview", items: [{ name: "Dashboard", href: "/homecare/dashboard", icon: LayoutDashboard }] },
    {
        label: "Care Management",
        items: [
            { name: "My Patients", href: "/homecare/patients", icon: Users },
            { name: "Visit Schedule", href: "/homecare/visits", icon: CalendarDays },
            { name: "Visit Reports", href: "/homecare/reports", icon: ClipboardList },
            { name: "Route Map", href: "/homecare/map", icon: MapPin },
        ],
    },
];

export default function HomeCareLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || (profile.role !== "NURSE" && profile.role !== "DOCTOR" && profile.role !== "ADMIN"))) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Home Care Workspace" />;
    if (!profile) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Home Care" />
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

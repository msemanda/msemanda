"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Ambulance, Users, ClipboardList, Activity } from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    { label: "Overview", items: [{ name: "Dashboard", href: "/emergency/dashboard", icon: LayoutDashboard }] },
    {
        label: "Emergency",
        items: [
            { name: "Triage Board", href: "/emergency/triage", icon: Activity },
            { name: "ED Patients", href: "/emergency/patients", icon: Users },
            { name: "Ambulance", href: "/emergency/ambulance", icon: Ambulance },
            { name: "Incident Log", href: "/emergency/log", icon: ClipboardList },
        ],
    },
];

export default function EmergencyLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || (profile.role !== "EMERGENCY_STAFF" && profile.role !== "ADMIN"))) router.push("/login");
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Emergency Workspace" />;
    if (!profile || (profile.role !== "EMERGENCY_STAFF" && profile.role !== "ADMIN")) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Emergency" />
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

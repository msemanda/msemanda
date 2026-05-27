"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Scan, ClipboardList, FileImage, BarChart3 } from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    {
        label: "Overview",
        items: [{ name: "Dashboard", href: "/radiology/dashboard", icon: LayoutDashboard }],
    },
    {
        label: "Imaging",
        items: [
            { name: "Imaging Orders", href: "/radiology/orders", icon: ClipboardList },
            { name: "Worklist", href: "/radiology/worklist", icon: Scan },
            { name: "Reports", href: "/radiology/reports", icon: FileImage },
        ],
    },
    {
        label: "Analytics",
        items: [{ name: "Statistics", href: "/radiology/stats", icon: BarChart3 }],
    },
];

export default function RadiologyLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || profile.role !== "RADIOLOGY_TECH")) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Radiology Workspace" />;
    if (!profile || profile.role !== "RADIOLOGY_TECH") return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Radiology" />
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

"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, PackageCheck, RefreshCw, ClipboardList, BarChart2 } from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    { label: "Overview", items: [
        { name: "Dashboard", href: "/cssd/dashboard", icon: LayoutDashboard },
    ]},
    { label: "Sterilization", items: [
        { name: "Item Requests", href: "/cssd/items", icon: ClipboardList },
        { name: "Cycles", href: "/cssd/cycles", icon: RefreshCw },
        { name: "Dispatch", href: "/cssd/dispatch", icon: PackageCheck },
    ]},
    { label: "Reports", items: [
        { name: "Activity Log", href: "/cssd/reports", icon: BarChart2 },
    ]},
];

export default function CssdLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || (profile.role !== "NURSE" && profile.role !== "ADMIN"))) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading CSSD" />;
    if (!profile || (profile.role !== "NURSE" && profile.role !== "ADMIN")) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="CSSD" />
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

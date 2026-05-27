"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Wrench, Package, AlertTriangle, ClipboardList } from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    { label: "Overview", items: [
        { name: "Dashboard", href: "/maintenance/dashboard", icon: LayoutDashboard },
    ]},
    { label: "Equipment", items: [
        { name: "Equipment Register", href: "/maintenance/equipment", icon: Package },
        { name: "Maintenance Requests", href: "/maintenance/requests", icon: Wrench },
        { name: "Overdue Alerts", href: "/maintenance/alerts", icon: AlertTriangle },
    ]},
    { label: "Records", items: [
        { name: "Service History", href: "/maintenance/history", icon: ClipboardList },
    ]},
];

export default function MaintenanceLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || profile.role !== "ADMIN")) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Maintenance" />;
    if (!profile || profile.role !== "ADMIN") return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Maintenance" />
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

"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, CalendarClock, ClipboardList, AlertTriangle } from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    { label: "Overview", items: [
        { name: "Dashboard", href: "/security/dashboard", icon: LayoutDashboard },
    ]},
    { label: "Guard Duty", items: [
        { name: "Duty Roster", href: "/security/roster", icon: CalendarClock },
        { name: "Visitor Log", href: "/security/visitors", icon: ClipboardList },
    ]},
    { label: "Reporting", items: [
        { name: "Security Incidents", href: "/incidents/list", icon: AlertTriangle },
    ]},
];

export default function SecurityLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || (profile.role !== "SECURITY" && profile.role !== "ADMIN"))) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Security" />;
    if (!profile || (profile.role !== "SECURITY" && profile.role !== "ADMIN")) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Security" />
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

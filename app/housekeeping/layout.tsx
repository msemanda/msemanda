"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ClipboardList, CalendarClock, CheckSquare } from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    { label: "Overview", items: [
        { name: "Dashboard", href: "/housekeeping/dashboard", icon: LayoutDashboard },
    ]},
    { label: "Tasks", items: [
        { name: "Cleaning Tasks", href: "/housekeeping/tasks", icon: ClipboardList },
        { name: "Schedule", href: "/housekeeping/schedule", icon: CalendarClock },
        { name: "Completed", href: "/housekeeping/completed", icon: CheckSquare },
    ]},
];

export default function HousekeepingLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || profile.role !== "ADMIN")) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Housekeeping" />;
    if (!profile || profile.role !== "ADMIN") return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Housekeeping" />
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

"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    FlaskConical,
    ClipboardList,
    CheckSquare,
    Droplets,
    BarChart3,
} from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    {
        label: "Overview",
        items: [
            { name: "Dashboard", href: "/lab/dashboard", icon: LayoutDashboard },
        ],
    },
    {
        label: "Lab Management",
        items: [
            { name: "Test Orders", href: "/lab/orders", icon: ClipboardList },
            { name: "Results Entry", href: "/lab/results", icon: CheckSquare },
            { name: "Reports", href: "/lab/reports", icon: BarChart3 },
        ],
    },
    {
        label: "Blood Bank",
        items: [
            { name: "Blood Inventory", href: "/lab/blood-bank", icon: Droplets },
            { name: "Requests", href: "/lab/blood-requests", icon: FlaskConical },
        ],
    },
];

export default function LabLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || (profile.role !== "LAB_TECH" && profile.role !== "ADMIN"))) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Lab Workspace" />;
    if (!profile || (profile.role !== "LAB_TECH" && profile.role !== "ADMIN")) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Laboratory" />
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.main
                        key={profile?.uid}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex-1 p-4 pt-14 md:p-6"
                    >
                        {children}
                    </motion.main>
                </AnimatePresence>
            </div>
        </div>
    );
}

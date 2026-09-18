"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard, Package, Pill, AlertTriangle, ClipboardList,
} from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    {
        label: "Overview",
        items: [
            { name: "Dashboard", href: "/pharmacy/dashboard", icon: LayoutDashboard },
        ],
    },
    {
        label: "Stock Management",
        items: [
            { name: "Drug Inventory", href: "/pharmacy/inventory", icon: Package },
            { name: "Record Dispensing", href: "/pharmacy/dispense", icon: Pill },
            { name: "Low Stock Alerts", href: "/pharmacy/stock-alerts", icon: AlertTriangle },
        ],
    },
    {
        label: "Prescriptions",
        items: [
            { name: "Prescription Queue", href: "/pharmacy/prescriptions", icon: ClipboardList },
        ],
    },
];

export default function PharmacyLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || (profile.role !== "PHARMACY" && profile.role !== "ADMIN"))) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Pharmacy Workspace" />;
    if (!profile || (profile.role !== "PHARMACY" && profile.role !== "ADMIN")) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Pharmacy" />
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

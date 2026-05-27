"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, Package, TrendingDown, FileText } from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    { label: "Overview", items: [
        { name: "Dashboard", href: "/assets/dashboard", icon: LayoutDashboard },
    ]},
    { label: "Asset Management", items: [
        { name: "Asset Register", href: "/assets/register", icon: Package },
        { name: "Depreciation", href: "/assets/depreciation", icon: TrendingDown },
        { name: "Reports", href: "/assets/reports", icon: FileText },
    ]},
];

export default function AssetsLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || (profile.role !== "ADMIN" && profile.role !== "CASHIER"))) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Fixed Assets" />;
    if (!profile || (profile.role !== "ADMIN" && profile.role !== "CASHIER")) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Fixed Assets" />
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

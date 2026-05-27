"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, BedDouble, UserPlus, LogOut, ArrowRightLeft, ClipboardList } from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    { label: "Overview", items: [
        { name: "Dashboard", href: "/ipd/dashboard", icon: LayoutDashboard },
    ]},
    { label: "Patient Flow", items: [
        { name: "Admissions", href: "/ipd/admissions", icon: UserPlus },
        { name: "Bed Management", href: "/ipd/beds", icon: BedDouble },
        { name: "Transfer", href: "/ipd/transfer", icon: ArrowRightLeft },
        { name: "Discharge", href: "/ipd/discharge", icon: LogOut },
    ]},
    { label: "Records", items: [
        { name: "Inpatient Orders", href: "/ipd/orders", icon: ClipboardList },
    ]},
];

export default function IpdLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || !["DOCTOR","NURSE","RECEPTIONIST","ADMIN"].includes(profile.role))) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading IP Management" />;
    if (!profile || !["DOCTOR","NURSE","RECEPTIONIST","ADMIN"].includes(profile.role)) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="IP Management" />
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

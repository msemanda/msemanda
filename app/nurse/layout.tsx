"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Activity,
    CalendarClock,
    ClipboardList,
    Stethoscope,
    BedDouble,
    UserCheck,
} from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    {
        label: "Overview",
        items: [
            { name: "Dashboard", href: "/nurse/dashboard", icon: LayoutDashboard },
        ],
    },
    {
        label: "Patient Care",
        items: [
            { name: "Ward Patients", href: "/nurse/patients", icon: BedDouble },
            { name: "Vitals", href: "/nurse/vitals", icon: Activity },
            { name: "Nursing Orders", href: "/nurse/orders", icon: ClipboardList },
        ],
    },
    {
        label: "Operating Theater",
        items: [
            { name: "OT Schedule", href: "/nurse/ot", icon: Stethoscope },
        ],
    },
    {
        label: "Shift",
        items: [
            { name: "Shift Schedule", href: "/nurse/shift", icon: CalendarClock },
            { name: "Handover", href: "/nurse/handover", icon: UserCheck },
        ],
    },
];

export default function NurseLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || profile.role !== "NURSE")) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Nurse Workspace" />;
    if (!profile || profile.role !== "NURSE") return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Nursing" />
            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
                <AnimatePresence mode="wait">
                    <motion.main
                        key={profile?.uid}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.25 }}
                        className="flex-1 p-6"
                    >
                        {children}
                    </motion.main>
                </AnimatePresence>
            </div>
        </div>
    );
}

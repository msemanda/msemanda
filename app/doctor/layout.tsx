"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    Users,
    FileText,
    ClipboardList,
    Stethoscope,
    UserCheck,
    Activity,
    CalendarDays,
} from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    { label: "Overview", items: [{ name: "Dashboard", href: "/doctor/dashboard", icon: LayoutDashboard }] },
    {
        label: "Patient Care",
        items: [
            { name: "My Patients", href: "/doctor/patients", icon: UserCheck },
            { name: "Electronic Medical Records", href: "/doctor/emr", icon: FileText, permission: "emr" },
            { name: "Diagnostic History", href: "/doctor/diagnostics", icon: Activity, permission: "diagnostics" },
        ],
    },
    {
        label: "Clinical Tools",
        items: [
            { name: "CPOE — Order Entry", href: "/doctor/cpoe", icon: ClipboardList, permission: "cpoe" },
            { name: "Clinical Order Sets", href: "/doctor/order-sets", icon: Stethoscope, permission: "order_sets" },
            { name: "Appointments", href: "/doctor/appointments", icon: CalendarDays, permission: "appointments" },
        ],
    },
];

export default function DoctorLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || profile.role !== "DOCTOR")) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Initializing Physician Workspace" />;
    if (!profile || profile.role !== "DOCTOR") return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Physician" />
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

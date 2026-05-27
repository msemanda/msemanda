"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    UserPlus,
    CalendarClock,
    ClipboardList,
    Search,
    Send,
    CreditCard,
    Stethoscope,
} from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    {
        label: "Overview",
        items: [
            { name: "Dashboard", href: "/receptionist/dashboard", icon: LayoutDashboard },
        ],
    },
    {
        label: "Patient Management",
        items: [
            { name: "Admit Patient", href: "/receptionist/admit", icon: UserPlus },
            { name: "Patient Search", href: "/receptionist/patients", icon: Search },
            { name: "Invitations", href: "/receptionist/invites", icon: Send },
        ],
    },
    {
        label: "Appointments",
        items: [
            { name: "Book Appointment", href: "/receptionist/book", icon: Stethoscope },
            { name: "Today's Queue", href: "/receptionist/queue", icon: ClipboardList },
            { name: "Schedule", href: "/receptionist/schedule", icon: CalendarClock },
        ],
    },
    {
        label: "Billing",
        items: [
            { name: "Consultation Fees", href: "/receptionist/payments", icon: CreditCard },
        ],
    },
];

export default function ReceptionistLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || (profile.role !== "RECEPTIONIST" && profile.role !== "ADMIN"))) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Reception Workspace" />;
    if (!profile || (profile.role !== "RECEPTIONIST" && profile.role !== "ADMIN")) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Reception" />
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

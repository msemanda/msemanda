"use client";

import { RoleSidebar, SidebarGroup } from "@/components/ui/RoleSidebar";
import { LoadingScreen } from "@/components/ui/LoadingScreen";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard, TrendingUp, TrendingDown,
    ArrowLeftRight, BarChart3, CreditCard, ListChecks,
} from "lucide-react";

const sidebarGroups: SidebarGroup[] = [
    {
        label: "Overview",
        items: [
            { name: "Dashboard", href: "/cashier/dashboard", icon: LayoutDashboard },
        ],
    },
    {
        label: "Patient Payments",
        items: [
            { name: "Consultation Fees", href: "/cashier/fees", icon: CreditCard },
            { name: "Service Bills", href: "/cashier/bills", icon: CreditCard },
        ],
    },
    {
        label: "Transactions",
        items: [
            { name: "Record Income", href: "/cashier/income", icon: TrendingUp },
            { name: "Record Expense", href: "/cashier/expenses", icon: TrendingDown },
            { name: "All Transactions", href: "/cashier/transactions", icon: ArrowLeftRight },
        ],
    },
    {
        label: "Finance",
        items: [
            { name: "Fee Schedule", href: "/cashier/fee-schedule", icon: ListChecks },
            { name: "Reports", href: "/cashier/reports", icon: BarChart3 },
        ],
    },
];

export default function CashierLayout({ children }: { children: React.ReactNode }) {
    const { profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && (!profile || (profile.role !== "CASHIER" && profile.role !== "ADMIN"))) {
            router.push("/login");
        }
    }, [profile, loading, router]);

    if (loading) return <LoadingScreen label="Loading Finance Workspace" />;
    if (!profile || (profile.role !== "CASHIER" && profile.role !== "ADMIN")) return null;

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <RoleSidebar groups={sidebarGroups} roleLabel="Cashier" />
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

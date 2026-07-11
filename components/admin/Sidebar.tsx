"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/ui/Logo";
import { NotificationBell } from "@/components/ui/NotificationBell";
import {
    LayoutDashboard,
    UserPlus,
    UserCheck,
    Calendar,
    FileText,
    LogOut,
    CreditCard,
    Users,
    FlaskConical,
    Scan,
    Stethoscope,
    Syringe,
    Smile,
    Apple,
    Ambulance,
    Home,
    Sparkles,
    Package,
    Droplets,
    Settings,
    Wallet,
    BedDouble,
    Wrench,
    Building2,
    ShieldCheck,
    AlertOctagon,
    BarChart3,
    Menu,
    X,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const menuGroups = [
    {
        label: "Overview",
        items: [
            { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
        ],
    },
    {
        label: "User Management",
        items: [
            { name: "User Registry", href: "/admin/users", icon: Users },
            { name: "Invite Staff", href: "/admin/invite-doctors", icon: UserCheck },
            { name: "Patient Flow", href: "/admin/schedule-patients", icon: Calendar },
            { name: "Patient Validation", href: "/admin/validate-patient", icon: FileText },
        ],
    },
    {
        label: "Clinical Modules",
        items: [
            { name: "Nursing & OT", href: "/nurse/dashboard", icon: Stethoscope },
            { name: "Laboratory", href: "/lab/dashboard", icon: FlaskConical },
            { name: "Radiology", href: "/radiology/dashboard", icon: Scan },
            { name: "Physiotherapy", href: "/physiotherapy/dashboard", icon: Syringe },
            { name: "Dental", href: "/dental/dashboard", icon: Smile },
            { name: "Dietary", href: "/dietary/dashboard", icon: Apple },
            { name: "Emergency", href: "/emergency/dashboard", icon: Ambulance },
            { name: "Home Care", href: "/homecare/dashboard", icon: Home },
            { name: "Wellness", href: "/wellness/dashboard", icon: Sparkles },
        ],
    },
    {
        label: "Ancillary",
        items: [
            { name: "Pharmacy", href: "/pharmacy/dashboard", icon: Package },
            { name: "Blood Bank", href: "/lab/blood-bank", icon: Droplets },
            { name: "Inventory", href: "/admin/inventory", icon: Package },
            { name: "CSSD", href: "/cssd/dashboard", icon: Package },
        ],
    },
    {
        label: "IP Management & ADT",
        items: [
            { name: "IPD Dashboard", href: "/ipd/dashboard", icon: BedDouble },
            { name: "Admissions", href: "/ipd/admissions", icon: BedDouble },
            { name: "Bed Management", href: "/ipd/beds", icon: BedDouble },
            { name: "Transfers", href: "/ipd/transfer", icon: BedDouble },
            { name: "Discharge", href: "/ipd/discharge", icon: BedDouble },
        ],
    },
    {
        label: "Facilities",
        items: [
            { name: "Housekeeping", href: "/housekeeping/dashboard", icon: Home },
            { name: "Machine Maintenance", href: "/maintenance/dashboard", icon: Wrench },
            { name: "Fixed Assets", href: "/assets/dashboard", icon: Building2 },
        ],
    },
    {
        label: "Quality & Safety",
        items: [
            { name: "Quality & Infection", href: "/quality/dashboard", icon: ShieldCheck },
            { name: "Incident Reporting", href: "/incidents/dashboard", icon: AlertOctagon },
        ],
    },
    {
        label: "Finance & Accounts",
        items: [
            { name: "Cashier Dashboard", href: "/cashier/dashboard", icon: Wallet },
            { name: "Consultation Fees", href: "/cashier/fees", icon: CreditCard },
            { name: "Income", href: "/cashier/income", icon: CreditCard },
            { name: "Expenses", href: "/cashier/expenses", icon: CreditCard },
            { name: "All Transactions", href: "/cashier/transactions", icon: CreditCard },
            { name: "Financial Reports", href: "/cashier/reports", icon: CreditCard },
            { name: "Billing & Revenue", href: "/admin/generate-bill", icon: CreditCard },
        ],
    },
    {
        label: "Analytics",
        items: [
            { name: "MIS Dashboard", href: "/admin/analytics", icon: BarChart3 },
        ],
    },
    {
        label: "Security & Config",
        items: [
            { name: "System Config", href: "/admin/config", icon: Settings },
        ],
    },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout, profile } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => { setIsOpen(false); }, [pathname]);

    return (
        <>
            {/* Mobile backdrop */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        key="backdrop"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[45] bg-black/50 md:hidden"
                        onClick={() => setIsOpen(false)}
                    />
                )}
            </AnimatePresence>

            {/* Mobile hamburger */}
            <button
                className="fixed top-3 left-3 z-[45] md:hidden h-9 w-9 bg-white rounded-xl shadow-md border border-gray-200 flex items-center justify-center text-gray-600 hover:text-blue-600 transition-colors"
                onClick={() => setIsOpen(true)}
                aria-label="Open menu"
            >
                <Menu className="h-4 w-4" />
            </button>

            {/* Sidebar panel */}
            <div className={cn(
                "h-screen w-60 flex flex-col bg-white border-r border-gray-100 z-[50]",
                "fixed inset-y-0 left-0 transition-transform duration-300",
                "md:static md:translate-x-0 md:shrink-0",
                isOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Logo */}
                <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2.5 group">
                        <Logo size={36} className="group-hover:scale-105 transition-transform" />
                        <div>
                            <span className="text-sm font-black text-gray-900 tracking-tight">RHD</span>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Admin Console</p>
                        </div>
                    </Link>
                    <div className="flex items-center gap-1">
                        <NotificationBell />
                        <button
                            className="md:hidden h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            onClick={() => setIsOpen(false)}
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>

                {/* Nav */}
                <div className="flex-1 overflow-y-auto py-2 px-2">
                    {menuGroups.map((group) => (
                        <div key={group.label}>
                            <p className="module-header">{group.label}</p>
                            <nav className="space-y-0.5 mb-1">
                                {group.items.map((item) => {
                                    const isActive = pathname === item.href;
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            className={cn(
                                                "group relative flex items-center rounded-xl px-3 py-2 text-xs font-semibold transition-all duration-150",
                                                isActive
                                                    ? "bg-blue-50 text-blue-700"
                                                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                                            )}
                                        >
                                            {isActive && (
                                                <motion.div
                                                    layoutId="admin-sidebar-indicator"
                                                    className="absolute left-0 w-1 h-4 bg-blue-600 rounded-r-full"
                                                />
                                            )}
                                            <Icon className={cn(
                                                "mr-2.5 h-3.5 w-3.5 shrink-0 transition-colors",
                                                isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600"
                                            )} />
                                            <span className="truncate">{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>
                    ))}
                </div>

                {/* Footer */}
                <div className="p-3 border-t border-gray-50 shrink-0">
                    <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-gray-50 mb-2">
                        <div className="h-7 w-7 rounded-lg bg-blue-100 flex items-center justify-center font-black text-blue-700 text-xs shrink-0">
                            {profile?.name?.charAt(0)?.toUpperCase() || "A"}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs font-bold text-gray-900 truncate">{profile?.name || "Admin"}</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">System Admin</p>
                        </div>
                    </div>
                    <button
                        onClick={() => logout()}
                        className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                    >
                        <LogOut className="h-3.5 w-3.5" />
                        Sign Out
                    </button>
                </div>
            </div>
        </>
    );
}

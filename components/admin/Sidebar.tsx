"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
    LayoutDashboard,
    UserPlus,
    UserCheck,
    Calendar,
    FileText,
    LogOut
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const menuItems = [
    { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
    { name: "Create Admin", href: "/admin/register", icon: UserPlus },
    { name: "Invite Doctors", href: "/admin/invite-doctors", icon: UserCheck },
    { name: "Schedule Patients", href: "/admin/schedule-patients", icon: Calendar },
    { name: "Validate Patient", href: "/admin/validate-patient", icon: FileText },
    { name: "Generate Bill", href: "/admin/generate-bill", icon: FileText },
];

export function Sidebar() {
    const pathname = usePathname();
    const { logout } = useAuth();

    return (
        <div className="flex h-screen w-64 flex-col border-r bg-white">
            <div className="flex h-16 items-center border-b px-6">
                <span className="text-xl font-bold text-blue-600">E-Health Admin</span>
            </div>
            <div className="flex-1 overflow-y-auto py-4">
                <nav className="space-y-1 px-3">
                    {menuItems.map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    "group flex items-center rounded-md px-3 py-2 text-sm font-medium",
                                    pathname === item.href
                                        ? "bg-blue-50 text-blue-600"
                                        : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                                )}
                            >
                                <Icon className="mr-3 h-5 w-5" />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="border-t p-4">
                <button
                    onClick={() => logout()}
                    className="flex w-full items-center rounded-md px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                    <LogOut className="mr-3 h-5 w-5" />
                    Logout
                </button>
            </div>
        </div>
    );
}

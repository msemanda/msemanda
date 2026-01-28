"use client";

import { useAuth } from "@/context/AuthContext";
import {
    Users,
    Stethoscope,
    Calendar,
    CreditCard
} from "lucide-react";

export default function AdminDashboard() {
    const { profile } = useAuth();

    const stats = [
        { name: "Total Patients", value: "120", icon: Users, color: "bg-blue-500" },
        { name: "Doctors", value: "15", icon: Stethoscope, color: "bg-green-500" },
        { name: "Appointments", value: "45", icon: Calendar, color: "bg-purple-500" },
        { name: "Revenue", value: "$12,450", icon: CreditCard, color: "bg-orange-500" },
    ];

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold font-premium">Welcome back, {profile?.name}</h1>
                <p className="text-gray-500">Here's what's happening today at E-Health.</p>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 transition-all hover:shadow-md">
                            <div className="flex items-center space-x-4">
                                <div className={`${stat.color} p-3 rounded-lg text-white`}>
                                    <Icon className="h-6 w-6" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                                    <p className="text-2xl font-bold">{stat.value}</p>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4">Recent Patients</h2>
                    <div className="space-y-4 text-gray-400 italic text-sm">
                        Searching for patients...
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <h2 className="text-lg font-bold mb-4">Upcoming Appointments</h2>
                    <div className="space-y-4 text-gray-400 italic text-sm">
                        Loading appointments...
                    </div>
                </div>
            </div>
        </div>
    );
}

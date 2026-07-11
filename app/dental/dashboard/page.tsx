"use client";

import { useState, useEffect } from "react";
import { collection, getDocs, query, where, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { CalendarDays, Users, CheckCircle2, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { SkeletonStatCard, SkeletonRow } from "@/components/ui/Skeleton";

const APPT_STATUS_VARIANT: Record<string, BadgeVariant> = {
    IN_CHAIR: "blue",
    WAITING: "yellow",
    COMPLETED: "green",
};

interface DentalAppointment {
    id: string;
    patientName: string;
    appointmentTime: string;
    consultationType: string;
    status: string;
    notes?: string;
    problemTeeth?: number[];
}

const toothChart = [
    [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
    [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
];

export default function DentalDashboard() {
    const { profile } = useAuth();
    const [appointments, setAppointments] = useState<DentalAppointment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        getDocs(query(
            collection(db, "appointments"),
            where("consultationType", "==", "Dental Consultation"),
            orderBy("appointmentTime", "asc"),
        ))
            .then(snap => setAppointments(snap.docs.map(d => ({ id: d.id, ...d.data() } as DentalAppointment))))
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    const todayAppts = appointments.filter(a => {
        if (!a.appointmentTime) return false;
        return new Date(a.appointmentTime).toDateString() === new Date().toDateString();
    });

    const completed = todayAppts.filter(a => a.status === "COMPLETED").length;
    const waiting   = todayAppts.filter(a => a.status === "WAITING").length;

    // Aggregate problem teeth from all appointments
    const allProblemTeeth = [...new Set(appointments.flatMap(a => a.problemTeeth ?? []))];

    const stats = [
        { label: "Today's Appointments", value: String(todayAppts.length),    icon: CalendarDays, color: "text-blue-600",  bg: "bg-blue-50"  },
        { label: "Active Patients",       value: String(appointments.length),  icon: Users,        color: "text-teal-600",  bg: "bg-teal-50"  },
        { label: "Completed Today",       value: String(completed),            icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
        { label: "Waiting",               value: String(waiting),              icon: Clock,        color: "text-amber-600", bg: "bg-amber-50" },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Dental Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    Dr. <span className="font-bold text-blue-600">{profile?.name}</span> &bull; Dental Clinic
                </p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => <SkeletonStatCard key={i} />)
                    : stats.map((s, i) => {
                        const Icon = s.icon;
                        return (
                            <Card key={s.label} variant="interactive" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="p-6">
                                <div className={`inline-flex p-2.5 rounded-xl ${s.bg} mb-3`}><Icon className={`h-5 w-5 ${s.color}`} /></div>
                                <p className="text-2xl font-black text-gray-900">{s.value}</p>
                                <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
                            </Card>
                        );
                    })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Appointment list */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-50">
                        <h2 className="font-bold text-gray-900">Today&apos;s Appointments</h2>
                    </div>
                    <div className="divide-y divide-gray-50">
                        {loading && Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)}
                        {!loading && todayAppts.length === 0 && (
                            <div className="px-5 py-8 text-center text-sm text-gray-400">No dental appointments today</div>
                        )}
                        {todayAppts.map((a) => (
                            <div key={a.id} className={`px-5 py-3.5 flex items-center gap-4 hover:bg-gray-50 transition-colors ${a.status === "IN_CHAIR" ? "bg-blue-50/40" : ""}`}>
                                <div className="text-sm font-black text-blue-600 w-12 shrink-0">
                                    {a.appointmentTime ? new Date(a.appointmentTime).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—"}
                                </div>
                                <div className="h-8 w-8 rounded-lg bg-blue-50 flex items-center justify-center font-black text-blue-700 text-xs shrink-0">
                                    {a.patientName?.charAt(0) ?? "?"}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-gray-900 truncate">{a.patientName}</p>
                                    <p className="text-xs text-gray-400">{a.notes || a.consultationType}</p>
                                </div>
                                <Badge variant={APPT_STATUS_VARIANT[a.status] ?? "neutral"}>{a.status?.replace("_", " ")}</Badge>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Dental chart */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-bold text-gray-900 text-sm mb-4">Dental Chart (FDI)</h3>
                    <div className="space-y-3">
                        {toothChart.map((row, ri) => (
                            <div key={ri} className="flex flex-wrap gap-1 justify-center">
                                {row.map((tooth) => (
                                    <div key={tooth} className={`w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold cursor-pointer transition-colors
                                        ${allProblemTeeth.includes(tooth)
                                            ? "bg-red-100 text-red-700 border border-red-200"
                                            : "bg-gray-50 text-gray-600 hover:bg-blue-50 hover:text-blue-700 border border-gray-100"}`}
                                    >
                                        {tooth}
                                    </div>
                                ))}
                            </div>
                        ))}
                    </div>
                    <div className="mt-4 flex items-center gap-3 text-[10px] font-semibold text-gray-500">
                        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-red-100 border border-red-200" /> Issue noted</div>
                        <div className="flex items-center gap-1.5"><div className="h-3 w-3 rounded bg-gray-50 border border-gray-100" /> Healthy</div>
                    </div>
                    {!loading && allProblemTeeth.length === 0 && (
                        <p className="text-[10px] text-gray-400 mt-3">No teeth issues recorded yet</p>
                    )}
                </div>
            </div>
        </div>
    );
}

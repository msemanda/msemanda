"use client";

import { motion } from "framer-motion";
import { Scan, Clock, CheckCircle2, AlertCircle, FileImage } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const stats = [
    { label: "Pending Scans", value: "12", icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Completed Today", value: "29", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "Reports Pending", value: "7", icon: FileImage, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Urgent Studies", value: "4", icon: AlertCircle, color: "text-red-600", bg: "bg-red-50" },
];

const worklist = [
    { id: "RA001", patient: "John Mwesiga", modality: "CT", bodyPart: "Chest/Abdomen", priority: "URGENT", doctor: "Dr. Katongo", time: "08:00", status: "IN_PROGRESS" },
    { id: "RA002", patient: "Grace Nakato", modality: "MRI", bodyPart: "Brain", priority: "STAT", doctor: "Dr. Bwire", time: "08:30", status: "PENDING" },
    { id: "RA003", patient: "Patrick Ssemanda", modality: "X-RAY", bodyPart: "Chest PA", priority: "ROUTINE", doctor: "Dr. Namubiru", time: "09:00", status: "PENDING" },
    { id: "RA004", patient: "Sarah Namutebi", modality: "ULTRASOUND", bodyPart: "Abdomen", priority: "URGENT", doctor: "Dr. Ssekibala", time: "09:30", status: "COMPLETED" },
    { id: "RA005", patient: "James Okello", modality: "X-RAY", bodyPart: "Left Knee", priority: "ROUTINE", doctor: "Dr. Katongo", time: "10:00", status: "PENDING" },
];

const PRIORITY_CLASS: Record<string, string> = { STAT: "badge-red", URGENT: "badge-yellow", ROUTINE: "badge-blue" };
const STATUS_CLASS: Record<string, string> = { PENDING: "badge-blue", IN_PROGRESS: "badge-yellow", COMPLETED: "badge-green" };

const MODALITY_COLOR: Record<string, string> = {
    CT: "bg-blue-100 text-blue-700",
    MRI: "bg-purple-100 text-purple-700",
    "X-RAY": "bg-gray-100 text-gray-700",
    ULTRASOUND: "bg-teal-100 text-teal-700",
    PET: "bg-orange-100 text-orange-700",
};

export default function RadiologyDashboard() {
    const { profile } = useAuth();

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Radiology Dashboard</h1>
                <p className="text-sm text-gray-500 mt-0.5">Welcome, <span className="font-bold text-blue-600">{profile?.name}</span> &bull; Imaging Worklist</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map((s, i) => {
                    const Icon = s.icon;
                    return (
                        <motion.div key={s.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }} className="stat-card">
                            <div className={`inline-flex p-2.5 rounded-xl ${s.bg} mb-3`}>
                                <Icon className={`h-5 w-5 ${s.color}`} />
                            </div>
                            <p className="text-2xl font-black text-gray-900">{s.value}</p>
                            <p className="text-xs font-semibold text-gray-500 mt-0.5">{s.label}</p>
                        </motion.div>
                    );
                })}
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                        <Scan className="h-4 w-4 text-blue-600" /> Today&apos;s Worklist
                    </h2>
                    <span className="text-xs text-gray-400 font-semibold">{worklist.length} studies</span>
                </div>
                <div className="divide-y divide-gray-50">
                    {worklist.map((item, i) => (
                        <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}
                            className="px-5 py-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                            <div className={`px-2.5 py-1 rounded-lg text-xs font-black ${MODALITY_COLOR[item.modality] || "bg-gray-100 text-gray-700"}`}>
                                {item.modality}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900">{item.patient}</p>
                                <p className="text-xs text-gray-500">{item.bodyPart} &bull; {item.doctor} &bull; {item.time}</p>
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${PRIORITY_CLASS[item.priority]}`}>{item.priority}</span>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_CLASS[item.status]}`}>{item.status.replace("_", " ")}</span>
                            {item.status !== "COMPLETED" && (
                                <button className="text-xs font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                    {item.status === "IN_PROGRESS" ? "Report" : "Start"}
                                </button>
                            )}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

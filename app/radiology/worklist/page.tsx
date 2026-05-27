"use client";

import { motion } from "framer-motion";
import { Scan, Clock } from "lucide-react";

const worklist = [
    { id: "RD002", patient: "Robert Mugisha", modality: "MRI", bodyPart: "Brain", room: "MRI Suite 1", tech: "Kato Brian", startedAt: "10:30", eta: "11:15", status: "SCANNING" },
    { id: "RD001", patient: "Sarah Namutebi", modality: "CT", bodyPart: "Chest + Abdomen", room: "CT Room 2", tech: "Nakawuki Joyce", startedAt: null, eta: "11:00", status: "QUEUED" },
    { id: "RD004", patient: "Grace Nakato", modality: "ULTRASOUND", bodyPart: "Abdomen + Pelvis", room: "US Room 1", tech: "Ssemakula Peter", startedAt: null, eta: "11:30", status: "QUEUED" },
    { id: "RD003", patient: "James Okello", modality: "X-RAY", bodyPart: "Chest PA", room: "X-Ray Room 1", tech: "Kato Brian", startedAt: "09:00", eta: "09:15", status: "REPORTED" },
    { id: "RD005", patient: "Agnes Nantale", modality: "X-RAY", bodyPart: "Right Knee", room: "X-Ray Room 2", tech: "Nakawuki Joyce", startedAt: null, eta: "12:00", status: "QUEUED" },
];

const STATUS_STYLE: Record<string, string> = {
    SCANNING: "bg-blue-50 text-blue-700 border-blue-100",
    QUEUED: "bg-amber-50 text-amber-700 border-amber-100",
    REPORTED: "bg-green-50 text-green-700 border-green-100",
};
const MODALITY_COLOR: Record<string, string> = {
    "X-RAY": "bg-blue-100 text-blue-700", CT: "bg-purple-100 text-purple-700",
    MRI: "bg-indigo-100 text-indigo-700", ULTRASOUND: "bg-teal-100 text-teal-700",
};

export default function WorklistPage() {
    return (
        <div className="max-w-5xl mx-auto space-y-5">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <Scan className="h-6 w-6 text-violet-600" /> Worklist
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {worklist.filter(w => w.status === "SCANNING").length} scanning · {worklist.filter(w => w.status === "QUEUED").length} queued
                </p>
            </div>

            <div className="space-y-3">
                {worklist.map((w, i) => (
                    <motion.div key={w.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-xl flex items-center justify-center text-[10px] font-black shrink-0 ${MODALITY_COLOR[w.modality] || "bg-gray-100 text-gray-600"}`}>
                                {w.modality}
                            </div>
                            <div>
                                <p className="text-sm font-black text-gray-900">{w.patient}</p>
                                <p className="text-xs text-gray-500">{w.bodyPart} · {w.room}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">Tech: {w.tech}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 shrink-0">
                            <div className="text-right">
                                <p className="text-[10px] text-gray-400 uppercase tracking-wider">ETA</p>
                                <p className="text-sm font-bold text-gray-700 flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5 text-gray-400" />{w.eta}
                                </p>
                            </div>
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${STATUS_STYLE[w.status]}`}>{w.status}</span>
                            {w.status !== "REPORTED" && (
                                <button className="text-xs font-bold text-violet-600 hover:bg-violet-50 px-3 py-1.5 rounded-lg transition-colors">
                                    {w.status === "SCANNING" ? "Complete" : "Start"}
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

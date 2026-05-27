"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ClipboardList, Clock, CheckCircle2, Bell } from "lucide-react";

const initialQueue = [
    { ticket: "A001", patient: "John Mwesiga", doctor: "Dr. Katongo", type: "Follow-up", arrived: "08:45", waitMins: 12, status: "IN_CONSULTATION" },
    { ticket: "A002", patient: "Grace Nakato", doctor: "Dr. Ssekibala", type: "Consultation", arrived: "09:00", waitMins: 28, status: "WAITING" },
    { ticket: "A003", patient: "Mary Nakato", doctor: "Dr. Katongo", type: "Routine", arrived: "09:15", waitMins: 42, status: "WAITING" },
    { ticket: "A004", patient: "James Byaruhanga", doctor: "Dr. Bwire", type: "Consultation", arrived: "09:30", waitMins: 15, status: "WAITING" },
    { ticket: "A005", patient: "Annet Nabukenya", doctor: "Dr. Namubiru", type: "Post-op", arrived: "09:45", waitMins: 8, status: "WAITING" },
    { ticket: "A006", patient: "Fred Kalema", doctor: "Dr. Ssekibala", type: "Follow-up", arrived: "08:00", waitMins: 0, status: "COMPLETED" },
];

const STATUS_STYLE: Record<string, string> = {
    WAITING: "bg-amber-50 text-amber-700",
    IN_CONSULTATION: "bg-blue-50 text-blue-700",
    COMPLETED: "bg-green-50 text-green-700",
    CALLED: "bg-purple-50 text-purple-700",
};

export default function TodaysQueue() {
    const [queue, setQueue] = useState(initialQueue);

    const call = (ticket: string) => {
        setQueue(prev => prev.map(q => q.ticket === ticket ? { ...q, status: "CALLED" } : q));
    };

    const active = queue.filter(q => q.status !== "COMPLETED");
    const completed = queue.filter(q => q.status === "COMPLETED");

    return (
        <div className="max-w-4xl mx-auto space-y-5">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <ClipboardList className="h-6 w-6 text-indigo-600" /> Today's Queue
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {queue.filter(q => q.status === "WAITING").length} waiting · {queue.filter(q => q.status === "IN_CONSULTATION").length} in consultation
                    </p>
                </div>
                <div className="text-2xl font-black text-indigo-600 bg-white border border-indigo-100 rounded-2xl px-4 py-2 shadow-sm">
                    Next: {queue.find(q => q.status === "WAITING")?.ticket || "—"}
                </div>
            </div>

            <div className="space-y-2">
                {active.map((q, i) => (
                    <motion.div key={q.ticket} layout initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center font-black text-indigo-700 text-sm">{q.ticket}</div>
                            <div>
                                <p className="text-sm font-black text-gray-900">{q.patient}</p>
                                <p className="text-xs text-gray-400">{q.doctor} · {q.type} · Arrived {q.arrived}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 shrink-0 ml-3">
                            {q.status === "WAITING" && (
                                <p className="text-xs text-amber-600 font-bold flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" />{q.waitMins} min wait
                                </p>
                            )}
                            <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${STATUS_STYLE[q.status]}`}>{q.status.replace("_", " ")}</span>
                            {q.status === "WAITING" && (
                                <button onClick={() => call(q.ticket)}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl transition-colors">
                                    <Bell className="h-3.5 w-3.5" /> Call
                                </button>
                            )}
                        </div>
                    </motion.div>
                ))}
            </div>

            {completed.length > 0 && (
                <div>
                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">Completed</p>
                    {completed.map((q, i) => (
                        <div key={q.ticket} className="bg-gray-50 rounded-xl px-4 py-3 flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span className="text-xs text-gray-500 font-semibold">{q.ticket} — {q.patient} · {q.doctor}</span>
                            </div>
                            <span className="text-[10px] font-bold text-green-600">Done</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

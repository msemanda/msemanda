"use client";

import { useState, useEffect } from "react";
import { Clock, Monitor, Mail, CheckCircle2, XCircle } from "lucide-react";
import { motion } from "framer-motion";

interface LoginLogEntry {
    id: string;
    user_email?: string | null;
    user_uid?: string | null;
    ip?: string | null;
    user_agent?: string | null;
    status: number;
    created_at: string;
}

export default function SessionsPage() {
    const [sessions, setSessions] = useState<LoginLogEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchSessions = async () => {
            try {
                const res = await fetch("/api/admin/request-logs?path=/api/auth/login&limit=50");
                const data = await res.json();
                setSessions(data.logs || []);
            } catch (error) {
                console.error("Error fetching login logs:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchSessions();
    }, []);

    const formatTimestamp = (ts: string) => {
        if (!ts) return "N/A";
        return new Date(ts).toLocaleString();
    };

    return (
        <div className="space-y-12 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Access <span className="text-gradient-cyan">Logs</span></h1>
                    <p className="text-gray-700 font-medium">Recent login attempts across the system.</p>
                </div>
                <div className="h-12 px-6 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-xs font-black text-gray-400 uppercase tracking-widest shadow-sm">
                    Recent Activity: {sessions.length} Logins
                </div>
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-glass rounded-[40px] shadow-premium border border-white overflow-hidden"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="text-[10px] uppercase bg-gray-50/50 text-gray-400 font-black tracking-widest">
                            <tr>
                                <th className="px-10 py-6 border-b border-gray-100">Account</th>
                                <th className="px-10 py-6 border-b border-gray-100">Device</th>
                                <th className="px-10 py-6 border-b border-gray-100">Time</th>
                                <th className="px-10 py-6 border-b border-gray-100 text-right">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={4} className="px-10 py-20 text-center"><div className="animate-spin h-8 w-8 border-4 border-cyan-100 border-t-cyan-600 rounded-full mx-auto" /></td></tr>
                            ) : sessions.length === 0 ? (
                                <tr><td colSpan={4} className="px-10 py-20 text-center text-gray-400 font-medium italic">No login activity recorded yet.</td></tr>
                            ) : (
                                sessions.map((session, idx) => {
                                    const success = session.status >= 200 && session.status < 300;
                                    return (
                                        <motion.tr
                                            key={session.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: idx * 0.03 }}
                                            className="group hover:bg-gray-50/50 transition-colors"
                                        >
                                            <td className="px-10 py-7">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-xl bg-cyan-50 flex items-center justify-center">
                                                        <Mail className="h-4 w-4 text-cyan-600" />
                                                    </div>
                                                    <div>
                                                        <div className="font-black text-gray-900 truncate max-w-[200px]">{session.user_email || "Unknown"}</div>
                                                        {session.user_uid && (
                                                            <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest">UID: {session.user_uid.substring(0, 12)}...</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-7">
                                                <div className="flex items-center gap-3">
                                                    <Monitor className="h-4 w-4 text-gray-400" />
                                                    <div className="text-xs font-bold text-gray-600 truncate max-w-[250px]" title={session.user_agent || undefined}>
                                                        {session.user_agent || session.ip || "—"}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-10 py-7">
                                                <div className="flex items-center gap-3">
                                                    <Clock className="h-4 w-4 text-teal-500" />
                                                    <span className="text-xs font-black text-gray-700">{formatTimestamp(session.created_at)}</span>
                                                </div>
                                            </td>
                                            <td className="px-10 py-7 text-right">
                                                <span className={`px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-full border flex items-center gap-1.5 w-fit ml-auto ${
                                                    success
                                                        ? "bg-teal-50 text-teal-700 border-teal-100/50"
                                                        : "bg-red-50 text-red-600 border-red-100"
                                                }`}>
                                                    {success ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                                    {success ? "Success" : "Failed"}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </div>
    );
}

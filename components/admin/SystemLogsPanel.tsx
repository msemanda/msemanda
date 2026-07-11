"use client";

import { Fragment, useCallback, useEffect, useState } from "react";
import { ChevronDown, ChevronUp, RefreshCw, ScrollText, Search } from "lucide-react";
import { Badge, type BadgeVariant } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";

interface RequestLog {
    id: string;
    method: string;
    path: string;
    status: number;
    user_email: string | null;
    user_uid: string | null;
    ip: string | null;
    user_agent: string | null;
    duration_ms: number;
    query: Record<string, unknown> | null;
    request_body: unknown;
    response_body: unknown;
    created_at: string;
}

const METHODS = ["ALL", "GET", "POST", "PATCH", "PUT", "DELETE"];

function statusVariant(status: number): BadgeVariant {
    if (status >= 500) return "red";
    if (status >= 400) return "yellow";
    return "green";
}

function methodVariant(method: string): BadgeVariant {
    if (method === "GET") return "blue";
    if (method === "POST") return "green";
    if (method === "DELETE") return "red";
    return "purple";
}

export default function SystemLogsPanel() {
    const [logs, setLogs] = useState<RequestLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [method, setMethod] = useState("ALL");
    const [pathSearch, setPathSearch] = useState("");
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const params = new URLSearchParams();
            if (method !== "ALL") params.set("method", method);
            if (pathSearch.trim()) params.set("path", pathSearch.trim());
            const res = await fetch(`/api/admin/request-logs?${params}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to load logs");
            setLogs(data.logs ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load logs");
        } finally {
            setLoading(false);
        }
    }, [method, pathSearch]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    return (
        <Card className="p-6">
            <div className="flex items-center gap-2 mb-1">
                <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center">
                    <ScrollText className="h-3.5 w-3.5 text-blue-600" />
                </div>
                <h2 className="text-sm font-black text-gray-900">System Logs</h2>
            </div>
            <p className="text-xs text-gray-400 mb-4">Recent API requests handled by the server — for diagnosing issues, not a full audit trail.</p>

            <div className="flex flex-col sm:flex-row gap-3 mb-4">
                <select
                    value={method}
                    onChange={e => setMethod(e.target.value)}
                    className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-700 focus:border-blue-500 outline-none"
                >
                    {METHODS.map(m => <option key={m} value={m}>{m === "ALL" ? "All requests" : m}</option>)}
                </select>
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                    <input
                        value={pathSearch}
                        onChange={e => setPathSearch(e.target.value)}
                        placeholder="Filter by path, e.g. /api/db"
                        className="h-9 w-full pl-8 pr-3 rounded-xl border border-gray-200 bg-white text-xs font-medium focus:border-blue-500 outline-none"
                    />
                </div>
                <button
                    onClick={fetchLogs}
                    className="h-9 px-3 rounded-xl border border-gray-200 bg-white text-xs font-bold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
                >
                    <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                </button>
                <span className="text-[11px] text-gray-400 self-center sm:ml-auto">{logs.length} most recent</span>
            </div>

            {error && (
                <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2 mb-4">{error}</p>
            )}

            <div className="rounded-xl border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                        <thead className="bg-gray-50 border-b border-gray-100">
                            <tr>
                                {["Status", "Method", "Path", "User", "Duration", "Time"].map(h => (
                                    <th key={h} className="text-left px-3 py-2.5 font-black text-gray-400 uppercase tracking-wider text-[10px]">{h}</th>
                                ))}
                                <th className="px-3 py-2.5" />
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr><td colSpan={7} className="text-center py-10 text-gray-400">Loading…</td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan={7} className="text-center py-10 text-gray-400">No requests logged yet</td></tr>
                            ) : (
                                logs.map(entry => {
                                    const isOpen = expandedId === entry.id;
                                    return (
                                        <Fragment key={entry.id}>
                                            <tr
                                                onClick={() => setExpandedId(isOpen ? null : entry.id)}
                                                className="hover:bg-gray-50/70 cursor-pointer transition-colors"
                                            >
                                                <td className="px-3 py-2.5"><Badge variant={statusVariant(entry.status)} size="sm">{entry.status}</Badge></td>
                                                <td className="px-3 py-2.5"><Badge variant={methodVariant(entry.method)} size="sm">{entry.method}</Badge></td>
                                                <td className="px-3 py-2.5 font-mono text-gray-700 truncate max-w-xs">{entry.path}</td>
                                                <td className="px-3 py-2.5 text-gray-500 truncate max-w-[140px]">{entry.user_email ?? "—"}</td>
                                                <td className="px-3 py-2.5 text-gray-500">{entry.duration_ms}ms</td>
                                                <td className="px-3 py-2.5 text-gray-400 whitespace-nowrap">{new Date(entry.created_at).toLocaleString()}</td>
                                                <td className="px-3 py-2.5">{isOpen ? <ChevronUp className="h-3.5 w-3.5 text-gray-400" /> : <ChevronDown className="h-3.5 w-3.5 text-gray-400" />}</td>
                                            </tr>
                                            {isOpen && (
                                                <tr>
                                                    <td colSpan={7} className="bg-gray-50/60 px-4 py-4">
                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                            <div>
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Request</p>
                                                                <div className="space-y-1 text-[11px] text-gray-600 mb-2">
                                                                    <p><span className="font-bold">IP:</span> {entry.ip ?? "—"}</p>
                                                                    <p><span className="font-bold">User agent:</span> {entry.user_agent ?? "—"}</p>
                                                                    <p><span className="font-bold">Query:</span> {entry.query ? JSON.stringify(entry.query) : "—"}</p>
                                                                </div>
                                                                <pre className="bg-white border border-gray-100 rounded-lg p-2.5 text-[10px] font-mono text-gray-700 max-h-48 overflow-auto">
                                                                    {entry.request_body ? JSON.stringify(entry.request_body, null, 2) : "(empty body)"}
                                                                </pre>
                                                            </div>
                                                            <div>
                                                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Response</p>
                                                                <pre className="bg-white border border-gray-100 rounded-lg p-2.5 text-[10px] font-mono text-gray-700 max-h-56 overflow-auto">
                                                                    {entry.response_body ? JSON.stringify(entry.response_body, null, 2) : "(empty body)"}
                                                                </pre>
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] text-gray-300 font-mono mt-3">request_id: {entry.id}</p>
                                                    </td>
                                                </tr>
                                            )}
                                        </Fragment>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </Card>
    );
}

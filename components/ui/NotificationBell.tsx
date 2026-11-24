"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { collection, getDocs, query, where, orderBy, limit as fbLimit, doc, updateDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { toDate } from "@/lib/ts";
import { Bell, CheckCheck } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import type { AppNotification } from "@/types";

const POLL_MS = 10_000;

function timeAgo(v: unknown): string {
    const d = toDate(v);
    if (!d) return "";
    const diff = Math.floor((Date.now() - d.getTime()) / 60000);
    if (diff < 1) return "just now";
    if (diff < 60) return `${diff}m ago`;
    if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
    return `${Math.floor(diff / 1440)}d ago`;
}

export function NotificationBell() {
    const { profile } = useAuth();
    const [items, setItems] = useState<AppNotification[]>([]);
    const [open, setOpen] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);

    const load = useCallback(async () => {
        if (!profile) return;
        try {
            const [byUid, byRole] = await Promise.all([
                getDocs(query(collection(db, "notifications"), where("targetUid", "==", profile.uid), orderBy("createdAt", "desc"), fbLimit(30))),
                getDocs(query(collection(db, "notifications"), where("targetRole", "==", profile.role), orderBy("createdAt", "desc"), fbLimit(30))),
            ]);
            const merged = new Map<string, AppNotification>();
            for (const d of [...byUid.docs, ...byRole.docs]) {
                merged.set(d.id, { id: d.id, ...d.data() } as AppNotification);
            }
            const rows = Array.from(merged.values()).sort(
                (a, b) => (toDate(b.createdAt)?.getTime() ?? 0) - (toDate(a.createdAt)?.getTime() ?? 0)
            );
            setItems(rows.slice(0, 30));
        } catch (e) {
            console.error(e);
        }
    }, [profile]);

    useEffect(() => {
        load();
        const id = setInterval(load, POLL_MS);
        return () => clearInterval(id);
    }, [load]);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", onClick);
        return () => document.removeEventListener("mousedown", onClick);
    }, []);

    const unread = items.filter(n => !n.read).length;

    const markRead = async (n: AppNotification) => {
        if (n.read) return;
        setItems(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
        try { await updateDoc(doc(db, "notifications", n.id), { read: true }); } catch (e) { console.error(e); }
    };

    const markAllRead = async () => {
        const unreadItems = items.filter(n => !n.read);
        setItems(prev => prev.map(x => ({ ...x, read: true })));
        try {
            await Promise.all(unreadItems.map(n => updateDoc(doc(db, "notifications", n.id), { read: true })));
        } catch (e) { console.error(e); }
    };

    if (!profile) return null;

    return (
        <div className="relative" ref={panelRef}>
            <button
                onClick={() => setOpen(o => !o)}
                className="relative h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-50 text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Notifications"
            >
                <Bell className="h-4 w-4" />
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-0.5 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center">
                        {unread > 9 ? "9+" : unread}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: -6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -6, scale: 0.98 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-80 max-h-[28rem] overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-xl z-[60]"
                    >
                        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-50 sticky top-0 bg-white">
                            <p className="text-xs font-black text-gray-900 uppercase tracking-wider">Notifications</p>
                            {unread > 0 && (
                                <button onClick={markAllRead} className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700">
                                    <CheckCheck className="h-3 w-3" /> Mark all read
                                </button>
                            )}
                        </div>
                        {items.length === 0 ? (
                            <p className="text-center text-xs text-gray-400 py-10">No notifications yet</p>
                        ) : (
                            <div className="divide-y divide-gray-50">
                                {items.map(n => {
                                    const content = (
                                        <div
                                            onClick={() => markRead(n)}
                                            className={`px-4 py-3 flex gap-2.5 cursor-pointer hover:bg-gray-50/70 transition-colors ${!n.read ? "bg-blue-50/40" : ""}`}
                                        >
                                            <span className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${!n.read ? "bg-blue-600" : "bg-transparent"}`} />
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-900">{n.title}</p>
                                                <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{n.body}</p>
                                                <p className="text-[10px] text-gray-400 mt-1">{timeAgo(n.createdAt)}</p>
                                            </div>
                                        </div>
                                    );
                                    return n.link
                                        ? <Link key={n.id} href={n.link} onClick={() => setOpen(false)}>{content}</Link>
                                        : <div key={n.id}>{content}</div>;
                                })}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

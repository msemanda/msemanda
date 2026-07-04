"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { collection, getDocs, query, orderBy, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { notify } from "@/lib/notify";
import { toDate } from "@/lib/ts";
import { MessageCircle, Send, RefreshCw, Search } from "lucide-react";
import { motion } from "framer-motion";
import type { ChatMessage } from "@/types";

const POLL_MS = 10_000;

interface Thread {
    patientUid: string;
    patientName: string;
    lastBody: string;
    lastAt: unknown;
    unread: number;
}

export default function ReceptionistMessagesPage() {
    const { profile } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeUid, setActiveUid] = useState<string | null>(null);
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const [search, setSearch] = useState("");
    const bottomRef = useRef<HTMLDivElement>(null);

    const load = useCallback(async () => {
        try {
            const snap = await getDocs(query(collection(db, "messages"), orderBy("createdAt", "asc")));
            setMessages(snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage)));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        load();
        const id = setInterval(load, POLL_MS);
        return () => clearInterval(id);
    }, [load]);

    const threads = useMemo<Thread[]>(() => {
        const byPatient = new Map<string, ChatMessage[]>();
        for (const m of messages) {
            if (!byPatient.has(m.patientUid)) byPatient.set(m.patientUid, []);
            byPatient.get(m.patientUid)!.push(m);
        }
        return Array.from(byPatient.entries())
            .map(([patientUid, msgs]) => {
                const last = msgs[msgs.length - 1];
                return {
                    patientUid,
                    patientName: last.patientName,
                    lastBody: last.body,
                    lastAt: last.createdAt,
                    unread: msgs.filter(m => m.senderRole === "PATIENT" && !m.read).length,
                };
            })
            .filter(t => !search || t.patientName.toLowerCase().includes(search.toLowerCase()))
            .sort((a, b) => (toDate(b.lastAt)?.getTime() ?? 0) - (toDate(a.lastAt)?.getTime() ?? 0));
    }, [messages, search]);

    const activeThread = messages.filter(m => m.patientUid === activeUid);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [activeThread.length]);

    const openThread = async (uid: string) => {
        setActiveUid(uid);
        const unread = messages.filter(m => m.patientUid === uid && m.senderRole === "PATIENT" && !m.read);
        if (unread.length === 0) return;
        setMessages(prev => prev.map(m => unread.some(u => u.id === m.id) ? { ...m, read: true } : m));
        try {
            await Promise.all(unread.map(m => updateDoc(doc(db, "messages", m.id), { read: true })));
        } catch (e) { console.error(e); }
    };

    const send = async () => {
        if (!body.trim() || !activeUid || !profile) return;
        const patientName = messages.find(m => m.patientUid === activeUid)?.patientName ?? "Patient";
        setSending(true);
        try {
            await addDoc(collection(db, "messages"), {
                patientUid:  activeUid,
                patientName,
                senderUid:   profile.uid,
                senderName:  profile.name,
                senderRole:  "STAFF",
                body:        body.trim(),
                read:        false,
                createdAt:   serverTimestamp(),
            });
            setBody("");
            await notify({
                targetUid: activeUid,
                type:      "message",
                title:     `Message from ${profile.name}`,
                body:      body.trim().slice(0, 80),
                link:      "/patient/messages",
            });
            load();
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="space-y-5 pb-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                    <MessageCircle className="h-6 w-6 text-blue-600" /> Patient Messages
                </h1>
                <p className="text-sm text-gray-500 mt-0.5">Conversations with patients across the front desk</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 h-[calc(100vh-13rem)]">
                {/* Thread list */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-3 border-b border-gray-50 flex items-center gap-2 shrink-0">
                        <div className="relative flex-1">
                            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
                            <input value={search} onChange={e => setSearch(e.target.value)}
                                className="w-full h-8 pl-8 pr-2 text-xs bg-gray-50 border border-gray-100 rounded-lg outline-none focus:ring-2 focus:ring-blue-500/20"
                                placeholder="Search patients..." />
                        </div>
                        <button onClick={load} className="text-gray-400 hover:text-blue-600 transition-colors shrink-0">
                            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-10">
                                <div className="animate-spin h-5 w-5 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                            </div>
                        ) : threads.length === 0 ? (
                            <p className="text-center text-xs text-gray-400 py-10">No conversations yet</p>
                        ) : (
                            threads.map(t => (
                                <button key={t.patientUid} onClick={() => openThread(t.patientUid)}
                                    className={`w-full text-left px-4 py-3 border-b border-gray-50 hover:bg-gray-50/70 transition-colors ${activeUid === t.patientUid ? "bg-blue-50/60" : ""}`}>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-xs font-black text-gray-900 truncate">{t.patientName}</p>
                                        {t.unread > 0 && (
                                            <span className="h-4 min-w-[16px] px-1 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center shrink-0">
                                                {t.unread}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[11px] text-gray-400 truncate mt-0.5">{t.lastBody}</p>
                                </button>
                            ))
                        )}
                    </div>
                </div>

                {/* Conversation */}
                <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                    {!activeUid ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-center">
                            <MessageCircle className="h-10 w-10 text-gray-200 mb-3" />
                            <p className="text-sm font-black text-gray-900">Select a conversation</p>
                            <p className="text-xs text-gray-400 mt-1">Choose a patient thread to reply.</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                                {activeThread.map(m => {
                                    const mine = m.senderRole === "STAFF";
                                    return (
                                        <motion.div key={m.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                                            className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                                            <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${mine ? "bg-blue-600 text-white rounded-br-md" : "bg-gray-100 text-gray-800 rounded-bl-md"}`}>
                                                {!mine && <p className="text-[10px] font-bold opacity-70 mb-0.5">{m.senderName}</p>}
                                                <p className="text-sm">{m.body}</p>
                                                <p className={`text-[10px] mt-1 ${mine ? "text-blue-100" : "text-gray-400"}`}>
                                                    {toDate(m.createdAt)?.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) ?? ""}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                                <div ref={bottomRef} />
                            </div>
                            <form onSubmit={e => { e.preventDefault(); send(); }} className="flex items-center gap-2 p-3 border-t border-gray-50 shrink-0">
                                <input
                                    value={body}
                                    onChange={e => setBody(e.target.value)}
                                    placeholder="Type a reply..."
                                    className="flex-1 h-10 px-3 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                                />
                                <button type="submit" disabled={sending || !body.trim()}
                                    className="h-10 w-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center justify-center transition-colors shrink-0">
                                    {sending ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Send className="h-4 w-4" />}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

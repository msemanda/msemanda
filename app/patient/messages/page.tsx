"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { collection, getDocs, query, where, orderBy, addDoc, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { notify } from "@/lib/notify";
import { toDate } from "@/lib/ts";
import { MessageCircle, Send, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import type { ChatMessage } from "@/types";

const POLL_MS = 10_000;

export default function PatientMessagesPage() {
    const { profile } = useAuth();
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [loading, setLoading] = useState(true);
    const [body, setBody] = useState("");
    const [sending, setSending] = useState(false);
    const bottomRef = useRef<HTMLDivElement>(null);

    const load = useCallback(async () => {
        if (!profile) return;
        try {
            const snap = await getDocs(
                query(collection(db, "messages"), where("patientUid", "==", profile.uid), orderBy("createdAt", "asc"))
            );
            const rows = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage));
            setMessages(rows);

            const unreadStaff = rows.filter(m => m.senderRole === "STAFF" && !m.read);
            await Promise.all(unreadStaff.map(m => updateDoc(doc(db, "messages", m.id), { read: true })));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }, [profile]);

    useEffect(() => {
        load();
        const id = setInterval(load, POLL_MS);
        return () => clearInterval(id);
    }, [load]);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    const send = async () => {
        if (!body.trim() || !profile) return;
        setSending(true);
        try {
            await addDoc(collection(db, "messages"), {
                patientUid:  profile.uid,
                patientName: profile.name,
                senderUid:   profile.uid,
                senderName:  profile.name,
                senderRole:  "PATIENT",
                body:        body.trim(),
                read:        false,
                createdAt:   serverTimestamp(),
            });
            setBody("");
            await notify({
                targetRole: "RECEPTIONIST",
                type:       "message",
                title:      `New message from ${profile.name}`,
                body:       body.trim().slice(0, 80),
                link:       "/receptionist/messages",
            });
            load();
        } catch (e) {
            console.error(e);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-5 pb-6 flex flex-col h-[calc(100vh-8rem)]">
            <div className="flex items-center justify-between shrink-0">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-2">
                        <MessageCircle className="h-6 w-6 text-blue-600" /> Messages
                    </h1>
                    <p className="text-sm text-gray-500 mt-0.5">Chat with our front desk team</p>
                </div>
                <button onClick={load} className="text-gray-400 hover:text-blue-600 transition-colors">
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                </button>
            </div>

            <div className="flex-1 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-y-auto p-4 space-y-3">
                {loading ? (
                    <div className="flex items-center justify-center h-full">
                        <div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
                        <MessageCircle className="h-10 w-10 text-gray-200 mb-3" />
                        <p className="text-sm font-black text-gray-900">No messages yet</p>
                        <p className="text-xs text-gray-400 mt-1">Send a message to reception below.</p>
                    </div>
                ) : (
                    messages.map(m => {
                        const mine = m.senderRole === "PATIENT";
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
                    })
                )}
                <div ref={bottomRef} />
            </div>

            <form onSubmit={e => { e.preventDefault(); send(); }} className="flex items-center gap-2 shrink-0">
                <input
                    value={body}
                    onChange={e => setBody(e.target.value)}
                    placeholder="Type a message to reception..."
                    className="flex-1 h-11 px-4 rounded-xl border border-gray-200 bg-white text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                />
                <button type="submit" disabled={sending || !body.trim()}
                    className="h-11 w-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white flex items-center justify-center transition-colors shrink-0">
                    {sending ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <Send className="h-4 w-4" />}
                </button>
            </form>
        </div>
    );
}

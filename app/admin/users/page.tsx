"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, getDocs, doc, deleteDoc, updateDoc } from "firebase/firestore";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User, Shield, Trash2, Search, Filter, Mail, MapPin, UserCheck, UserPlus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { UserProfile } from "@/types";

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [roleFilter, setRoleFilter] = useState("all");

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const q = query(collection(db, "users"));
                const querySnapshot = await getDocs(q);
                const usersList = querySnapshot.docs.map(doc => ({
                    uid: doc.id,
                    ...doc.data()
                })) as UserProfile[];
                setUsers(usersList);
            } catch (error) {
                console.error("Error fetching users:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchUsers();
    }, []);

    const handleDeleteUser = async (uid: string) => {
        if (window.confirm("Are you sure you want to terminate this user node? This action is irreversible.")) {
            try {
                await deleteDoc(doc(db, "users", uid));
                setUsers(users.filter(u => u.uid !== uid));
            } catch (error) {
                console.error("Error deleting user:", error);
            }
        }
    };

    const filteredUsers = users.filter(user => {
        const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === "all" || user.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const getRoleColor = (role: string) => {
        switch (role) {
            case "admin": return "text-red-600 bg-red-50 border-red-100";
            case "doctor": return "text-cyan-600 bg-cyan-50 border-cyan-100";
            case "pharmacy": return "text-teal-600 bg-teal-50 border-teal-100";
            case "patient": return "text-indigo-600 bg-indigo-50 border-indigo-100";
            default: return "text-gray-600 bg-gray-50 border-gray-100";
        }
    };

    return (
        <div className="space-y-12 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">User <span className="text-gradient-cyan">Management</span></h1>
                    <p className="text-gray-700 font-medium">Control and oversee all active nodes in the medical network.</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="h-12 px-6 rounded-2xl bg-white border border-gray-100 flex items-center justify-center text-xs font-black text-gray-400 uppercase tracking-widest shadow-sm">
                        Total Capacity: {users.length} Nodes
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                <div className="lg:col-span-1 space-y-8">
                    <div className="bg-glass p-8 rounded-[40px] shadow-premium border border-white sticky top-12 space-y-10">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Registry Search</h3>
                            <div className="relative group">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 group-focus-within:text-cyan-500 transition-colors" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Name or Email..."
                                    className="pl-12 h-14 rounded-2xl bg-white border-gray-100 focus:border-cyan-200 transition-all font-bold text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Role Categorization</h3>
                            <div className="space-y-2">
                                {["all", "admin", "doctor", "patient", "pharmacy"].map((role) => (
                                    <button
                                        key={role}
                                        onClick={() => setRoleFilter(role)}
                                        className={cn(
                                            "w-full text-left px-6 py-4 rounded-2xl text-xs font-black uppercase tracking-widest transition-all border",
                                            roleFilter === role
                                                ? "bg-cyan-600 text-white border-cyan-500 shadow-lg shadow-cyan-600/20"
                                                : "bg-white text-gray-400 border-gray-50 hover:border-cyan-100 hover:text-cyan-600"
                                        )}
                                    >
                                        {role}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-3">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-glass rounded-[40px] shadow-premium border border-white overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-gray-50/50">
                                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">User Identity</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">Role Status</th>
                                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100 text-right">Operational Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr><td colSpan={3} className="px-10 py-20 text-center"><div className="animate-spin h-10 w-10 border-4 border-cyan-100 border-t-cyan-600 rounded-full mx-auto" /></td></tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr><td colSpan={3} className="px-10 py-24 text-center text-gray-400 font-bold uppercase tracking-widest italic text-sm">No network nodes matched the criteria.</td></tr>
                                    ) : (
                                        <AnimatePresence>
                                            {filteredUsers.map((user, idx) => (
                                                <motion.tr
                                                    key={user.uid}
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    exit={{ opacity: 0, x: -20 }}
                                                    className="group hover:bg-gray-50/50 transition-colors"
                                                >
                                                    <td className="px-10 py-8">
                                                        <div className="flex items-center gap-5">
                                                            <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-400 flex items-center justify-center text-white text-xl font-black shadow-lg">
                                                                {user.name.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <div className="text-lg font-black text-gray-900 group-hover:text-cyan-600 transition-colors">{user.name}</div>
                                                                <div className="flex items-center gap-3 text-sm font-bold text-gray-700">
                                                                    <Mail className="h-3.5 w-3.5 text-gray-400" /> {user.email}
                                                                </div>
                                                                <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Node ID: {user.uid.substring(0, 16)}...</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8">
                                                        <div className={cn(
                                                            "px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border w-fit",
                                                            getRoleColor(user.role)
                                                        )}>
                                                            {user.role} Class Node
                                                        </div>
                                                    </td>
                                                    <td className="px-10 py-8 text-right">
                                                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                className="h-10 px-4 rounded-xl border-gray-100 text-gray-400 hover:text-cyan-600 hover:border-cyan-100"
                                                            >
                                                                Initialize Sync
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteUser(user.uid)}
                                                                className="h-10 w-10 p-0 rounded-xl text-red-100 hover:text-red-600 hover:bg-red-50"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </td>
                                                </motion.tr>
                                            ))}
                                        </AnimatePresence>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

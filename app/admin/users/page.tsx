"use client";

import { useEffect, useState, useMemo } from "react";
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserProfile, UserRole } from "@/types";
import { ALL_PERMISSIONS, PERMISSION_CATEGORIES, SPECIALIZATIONS } from "@/lib/permissions";
import { motion, AnimatePresence } from "framer-motion";
import {
    Users, Search, ChevronDown, ChevronUp, Pencil,
    CheckCircle2, X, Save, Stethoscope, Settings2,
    Trash2, Shield, UserPlus, Phone, Mail, RefreshCw
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/Input";

const ROLE_TABS: { value: UserRole | "ALL"; label: string }[] = [
    { value: "ALL", label: "All Users" },
    { value: "DOCTOR", label: "Doctors" },
    { value: "RECEPTIONIST", label: "Receptionists" },
    { value: "NURSE", label: "Nurses" },
    { value: "LAB_TECH", label: "Lab Tech" },
    { value: "RADIOLOGY_TECH", label: "Radiology" },
    { value: "PHYSIOTHERAPIST", label: "Physio" },
    { value: "DENTIST", label: "Dentists" },
    { value: "DIETITIAN", label: "Dietitians" },
    { value: "EMERGENCY_STAFF", label: "Emergency" },
    { value: "PHARMACY", label: "Pharmacy" },
    { value: "PATIENT", label: "Patients" },
];

const ALL_ROLES: { value: UserRole; label: string }[] = [
    { value: "ADMIN", label: "System Administrator" },
    { value: "DOCTOR", label: "Doctor" },
    { value: "NURSE", label: "Nurse" },
    { value: "RECEPTIONIST", label: "Receptionist" },
    { value: "PHARMACY", label: "Pharmacist" },
    { value: "LAB_TECH", label: "Lab Technician" },
    { value: "RADIOLOGY_TECH", label: "Radiology Technician" },
    { value: "PHYSIOTHERAPIST", label: "Physiotherapist" },
    { value: "DENTIST", label: "Dentist" },
    { value: "DIETITIAN", label: "Dietitian" },
    { value: "EMERGENCY_STAFF", label: "Emergency Staff" },
    { value: "PATIENT", label: "Patient" },
];

const ROLE_COLORS: Record<string, string> = {
    ADMIN: "bg-purple-50 text-purple-700 border-purple-100",
    PATIENT: "bg-blue-50 text-blue-700 border-blue-100",
    DOCTOR: "bg-teal-50 text-teal-700 border-teal-100",
    RECEPTIONIST: "bg-indigo-50 text-indigo-700 border-indigo-100",
    NURSE: "bg-green-50 text-green-700 border-green-100",
    LAB_TECH: "bg-amber-50 text-amber-700 border-amber-100",
    RADIOLOGY_TECH: "bg-violet-50 text-violet-700 border-violet-100",
    PHYSIOTHERAPIST: "bg-orange-50 text-orange-700 border-orange-100",
    DENTIST: "bg-pink-50 text-pink-700 border-pink-100",
    DIETITIAN: "bg-emerald-50 text-emerald-700 border-emerald-100",
    EMERGENCY_STAFF: "bg-red-50 text-red-700 border-red-100",
    PHARMACY: "bg-sky-50 text-sky-700 border-sky-100",
};

interface EditState {
    name: string;
    phone: string;
    role: UserRole;
    title: string;
    specialization: string;
    permissions: string[];
}

interface CreateForm {
    name: string;
    email: string;
    phone: string;
    role: UserRole;
}

const EMPTY_CREATE: CreateForm = { name: "", email: "", phone: "", role: "DOCTOR" };

export default function UserManagementPage() {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [roleFilter, setRoleFilter] = useState<UserRole | "ALL">("ALL");
    const [search, setSearch] = useState("");
    const [expandedUid, setExpandedUid] = useState<string | null>(null);
    const [editState, setEditState] = useState<EditState | null>(null);
    const [saving, setSaving] = useState(false);
    const [savedUid, setSavedUid] = useState<string | null>(null);
    const [showCreate, setShowCreate] = useState(false);
    const [createForm, setCreateForm] = useState<CreateForm>(EMPTY_CREATE);
    const [creating, setCreating] = useState(false);
    const [createError, setCreateError] = useState("");

    useEffect(() => { fetchUsers(); }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const snap = await getDocs(collection(db, "users"));
            setUsers(snap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filtered = useMemo(() => users.filter(u => {
        const roleMatch = roleFilter === "ALL" || u.role === roleFilter;
        const q = search.toLowerCase();
        const searchMatch = !q ||
            u.name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            ((u as any).title || "").toLowerCase().includes(q) ||
            ((u as any).specialization || "").toLowerCase().includes(q);
        return roleMatch && searchMatch;
    }), [users, roleFilter, search]);

    const openEdit = (user: UserProfile) => {
        if (expandedUid === user.uid) {
            setExpandedUid(null);
            setEditState(null);
            return;
        }
        setExpandedUid(user.uid);
        setEditState({
            name: user.name || "",
            phone: (user as any).phone || "",
            role: user.role,
            title: (user as any).title || "",
            specialization: (user as any).specialization || "",
            permissions: user.permissions || [],
        });
    };

    const togglePermission = (key: string) => {
        setEditState(prev => {
            if (!prev) return prev;
            const has = prev.permissions.includes(key);
            return { ...prev, permissions: has ? prev.permissions.filter(p => p !== key) : [...prev.permissions, key] };
        });
    };

    const handleSave = async (user: UserProfile) => {
        if (!editState) return;
        setSaving(true);
        try {
            await updateDoc(doc(db, "users", user.uid), {
                name: editState.name,
                phone: editState.phone,
                role: editState.role,
                title: editState.title,
                specialization: editState.specialization,
                permissions: editState.permissions,
            });
            setUsers(prev => prev.map(u =>
                u.uid === user.uid ? { ...u, ...editState } as UserProfile : u
            ));
            setSavedUid(user.uid);
            setTimeout(() => setSavedUid(null), 2500);
            setExpandedUid(null);
            setEditState(null);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (user: UserProfile) => {
        if (!confirm(`Remove ${user.name} from the system? This removes their profile — their login account remains.`)) return;
        try {
            await deleteDoc(doc(db, "users", user.uid));
            setUsers(prev => prev.filter(u => u.uid !== user.uid));
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreating(true);
        setCreateError("");
        const email = createForm.email.toLowerCase().trim();
        try {
            // Create invite so user can activate at /setup
            await setDoc(doc(db, "invites", email), {
                email,
                role: createForm.role,
                name: createForm.name,
                phone: createForm.phone,
                invitedBy: "Administrator",
                invitedAt: serverTimestamp(),
                used: false,
            });
            setShowCreate(false);
            setCreateForm(EMPTY_CREATE);
            alert(`Profile created. Share /setup with ${email} to activate their account.`);
        } catch (err: any) {
            setCreateError(err.message || "Failed to create user.");
        } finally {
            setCreating(false);
        }
    };

    return (
        <div className="space-y-6 pb-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">User Management</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        Manage staff profiles, roles, and module access permissions
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={fetchUsers}
                        className="h-9 w-9 rounded-xl border border-gray-100 bg-white shadow-sm text-gray-400 hover:text-blue-600 hover:border-blue-100 flex items-center justify-center transition-colors">
                        <RefreshCw className="h-4 w-4" />
                    </button>
                    <button onClick={() => setShowCreate(true)}
                        className="h-9 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-2 transition-colors shadow-sm shadow-blue-600/20">
                        <UserPlus className="h-4 w-4" /> Add User
                    </button>
                    <div className="flex items-center gap-2 text-xs text-gray-400 bg-white border border-gray-100 rounded-xl px-3 py-2 shadow-sm">
                        <Users className="h-3.5 w-3.5" />
                        <span className="font-bold">{users.length} users</span>
                    </div>
                </div>
            </div>

            {/* Create modal */}
            <AnimatePresence>
                {showCreate && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/30 flex items-center justify-center p-4"
                        onClick={e => e.target === e.currentTarget && setShowCreate(false)}>
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-full max-w-md p-6">
                            <div className="flex items-center justify-between mb-5">
                                <div>
                                    <h2 className="text-base font-black text-gray-900">Add New User</h2>
                                    <p className="text-xs text-gray-400 mt-0.5">Creates an invite — user activates at /setup</p>
                                </div>
                                <button onClick={() => setShowCreate(false)} className="h-8 w-8 rounded-xl border border-gray-100 flex items-center justify-center text-gray-400 hover:bg-gray-50">
                                    <X className="h-4 w-4" />
                                </button>
                            </div>
                            <form onSubmit={handleCreate} className="space-y-4">
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Full Name</label>
                                    <Input placeholder="e.g. Dr. Jane Nakato" required value={createForm.name}
                                        onChange={e => setCreateForm(p => ({ ...p, name: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1"><Mail className="h-3 w-3" /> Email Address</label>
                                    <Input type="email" placeholder="staff@hospital.com" required value={createForm.email}
                                        onChange={e => setCreateForm(p => ({ ...p, email: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</label>
                                    <Input type="tel" placeholder="+256 700 000000" value={createForm.phone}
                                        onChange={e => setCreateForm(p => ({ ...p, phone: e.target.value }))} />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Role</label>
                                    <select value={createForm.role} onChange={e => setCreateForm(p => ({ ...p, role: e.target.value as UserRole }))}
                                        className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer">
                                        {ALL_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                    </select>
                                </div>
                                {createError && (
                                    <p className="text-xs font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2">{createError}</p>
                                )}
                                <div className="flex gap-2 pt-1">
                                    <button type="button" onClick={() => setShowCreate(false)}
                                        className="flex-1 h-10 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors">
                                        Cancel
                                    </button>
                                    <button type="submit" disabled={creating}
                                        className="flex-1 h-10 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors">
                                        {creating ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" /> : <><UserPlus className="h-4 w-4" /> Create</>}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Role tabs */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                    {ROLE_TABS.map(t => (
                        <button key={t.value} onClick={() => setRoleFilter(t.value)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                                roleFilter === t.value ? "bg-blue-600 text-white shadow-sm" : "text-gray-600 hover:bg-gray-50"
                            }`}>
                            {t.label}
                            {t.value !== "ALL" && (
                                <span className="ml-1.5 text-[10px] opacity-60">
                                    {users.filter(u => u.role === t.value).length}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-sm">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input placeholder="Search name, email, title or specialization..."
                    className="pl-10" value={search} onChange={e => setSearch(e.target.value)} />
            </div>

            {/* User list */}
            {loading ? (
                <div className="flex items-center justify-center py-20 bg-white rounded-2xl border border-gray-100">
                    <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border border-dashed border-gray-200 text-center">
                    <Users className="h-10 w-10 text-gray-200 mb-3" />
                    <p className="text-sm font-black text-gray-900">No users found</p>
                </div>
            ) : (
                <div className="space-y-2">
                    {filtered.map((user, idx) => {
                        const isExpanded = expandedUid === user.uid;
                        const wasSaved = savedUid === user.uid;
                        const roleColor = ROLE_COLORS[user.role] || "bg-gray-50 text-gray-700 border-gray-100";
                        const permCount = user.permissions?.length ?? null;
                        const spec = (user as any).specialization;
                        const title = (user as any).title;

                        return (
                            <motion.div key={user.uid}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: Math.min(idx * 0.02, 0.3) }}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">

                                {/* Row */}
                                <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-gray-50/50 transition-colors select-none"
                                    onClick={() => openEdit(user)}>
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center font-black text-white text-xs shrink-0">
                                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-black text-gray-900">{user.name}</p>
                                                {title && <span className="text-[10px] text-gray-400 italic">— {title}</span>}
                                            </div>
                                            <p className="text-xs text-gray-400 truncate">
                                                {user.email}
                                                {spec && <span className="ml-2 text-blue-500 font-semibold">· {spec}</span>}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 shrink-0 ml-3">
                                        <span className={`hidden sm:inline text-[10px] font-bold px-2.5 py-1 rounded-full border ${roleColor}`}>
                                            {user.role.replace(/_/g, " ")}
                                        </span>
                                        {wasSaved ? (
                                            <span className="text-[10px] font-bold text-green-600 bg-green-50 border border-green-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <CheckCircle2 className="h-3 w-3" /> Saved
                                            </span>
                                        ) : permCount !== null ? (
                                            <span className="text-[10px] font-bold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                                                {permCount} perms
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-bold text-gray-300 bg-gray-50 border border-gray-100 px-2 py-0.5 rounded-full">
                                                full access
                                            </span>
                                        )}
                                        {isExpanded ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                                    </div>
                                </div>

                                {/* Expand panel */}
                                <AnimatePresence>
                                    {isExpanded && editState && (
                                        <motion.div
                                            initial={{ height: 0, opacity: 0 }}
                                            animate={{ height: "auto", opacity: 1 }}
                                            exit={{ height: 0, opacity: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className="overflow-hidden border-t border-gray-50">
                                            <div className="p-5 space-y-6 bg-gray-50/30">

                                                {/* Core identity */}
                                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                                            <Pencil className="h-3 w-3" /> Full Name
                                                        </label>
                                                        <Input
                                                            placeholder="Full name"
                                                            value={editState.name}
                                                            onChange={e => setEditState(p => p ? { ...p, name: e.target.value } : p)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                                            <Phone className="h-3 w-3" /> Phone
                                                        </label>
                                                        <Input
                                                            type="tel"
                                                            placeholder="+256 700 000000"
                                                            value={editState.phone}
                                                            onChange={e => setEditState(p => p ? { ...p, phone: e.target.value } : p)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                                            <Shield className="h-3 w-3" /> Role
                                                        </label>
                                                        <select
                                                            value={editState.role}
                                                            onChange={e => setEditState(p => p ? { ...p, role: e.target.value as UserRole } : p)}
                                                            className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer">
                                                            {ALL_ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Title & Specialization */}
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                                            <Pencil className="h-3 w-3" /> Job Title
                                                        </label>
                                                        <Input
                                                            placeholder="e.g. Senior Consultant, Head of Pediatrics"
                                                            value={editState.title}
                                                            onChange={e => setEditState(p => p ? { ...p, title: e.target.value } : p)}
                                                        />
                                                    </div>
                                                    <div className="space-y-1.5">
                                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                                            <Stethoscope className="h-3 w-3" /> Specialization
                                                        </label>
                                                        <select
                                                            value={editState.specialization}
                                                            onChange={e => setEditState(p => p ? { ...p, specialization: e.target.value } : p)}
                                                            className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all cursor-pointer">
                                                            <option value="">— Select specialization —</option>
                                                            {SPECIALIZATIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                {/* Permissions */}
                                                <div>
                                                    <div className="flex items-center justify-between mb-3">
                                                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                                                            <Settings2 className="h-3 w-3" /> Module Access Permissions
                                                        </label>
                                                        <div className="flex gap-3">
                                                            <button type="button"
                                                                onClick={() => setEditState(p => p ? { ...p, permissions: ALL_PERMISSIONS.map(x => x.key) } : p)}
                                                                className="text-[10px] font-bold text-blue-600 hover:underline">
                                                                Grant All
                                                            </button>
                                                            <span className="text-gray-200">|</span>
                                                            <button type="button"
                                                                onClick={() => setEditState(p => p ? { ...p, permissions: [] } : p)}
                                                                className="text-[10px] font-bold text-red-400 hover:underline">
                                                                Revoke All
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <div className="space-y-5">
                                                        {PERMISSION_CATEGORIES.map(cat => {
                                                            const catPerms = ALL_PERMISSIONS.filter(p => p.category === cat);
                                                            return (
                                                                <div key={cat}>
                                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                                        <Shield className="h-3 w-3" /> {cat}
                                                                    </p>
                                                                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
                                                                        {catPerms.map(perm => {
                                                                            const checked = editState.permissions.includes(perm.key);
                                                                            return (
                                                                                <button key={perm.key} type="button"
                                                                                    onClick={() => togglePermission(perm.key)}
                                                                                    className={cn(
                                                                                        "flex items-start gap-2.5 p-3 rounded-xl border text-left transition-all",
                                                                                        checked
                                                                                            ? "bg-blue-50 border-blue-200 ring-1 ring-blue-100"
                                                                                            : "bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                                                                                    )}>
                                                                                    <div className={cn(
                                                                                        "h-4 w-4 rounded-md border-2 shrink-0 mt-0.5 flex items-center justify-center transition-all",
                                                                                        checked ? "bg-blue-600 border-blue-600" : "border-gray-300 bg-white"
                                                                                    )}>
                                                                                        {checked && <CheckCircle2 className="h-2.5 w-2.5 text-white" />}
                                                                                    </div>
                                                                                    <div className="min-w-0">
                                                                                        <p className={cn("text-xs font-bold leading-tight truncate", checked ? "text-blue-700" : "text-gray-700")}>
                                                                                            {perm.label}
                                                                                        </p>
                                                                                        <p className="text-[10px] text-gray-400 mt-0.5 leading-tight">{perm.description}</p>
                                                                                    </div>
                                                                                </button>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                                                    <button type="button" onClick={() => handleDelete(user)}
                                                        className="h-9 px-3 rounded-xl border border-red-100 text-red-400 hover:bg-red-50 text-xs font-bold flex items-center gap-1.5 transition-colors">
                                                        <Trash2 className="h-3.5 w-3.5" /> Remove Profile
                                                    </button>
                                                    <div className="flex gap-2">
                                                        <button type="button"
                                                            onClick={() => { setExpandedUid(null); setEditState(null); }}
                                                            className="h-10 px-4 rounded-xl border border-gray-200 text-gray-600 text-sm font-bold hover:bg-gray-50 transition-colors flex items-center gap-2">
                                                            <X className="h-4 w-4" /> Cancel
                                                        </button>
                                                        <button type="button" onClick={() => handleSave(user)} disabled={saving}
                                                            className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm shadow-blue-600/20">
                                                            {saving
                                                                ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                                                                : <><Save className="h-4 w-4" /> Save Changes</>}
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

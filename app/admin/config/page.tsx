"use client";

import { useState, useEffect } from "react";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { motion } from "framer-motion";
import {
    Building2, Phone, Mail, MapPin, Globe, Save, CheckCircle2,
    Settings2, ShieldCheck, Bell, ClipboardList, Database, Loader2, AlertCircle,
} from "lucide-react";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

interface SystemConfig {
    facilityName: string;
    facilityType: string;
    address: string;
    city: string;
    country: string;
    phone: string;
    email: string;
    website: string;
    registrationNumber: string;
    maxPatientsPerDoctor: number;
    allowWalkIns: boolean;
    requireInviteForStaff: boolean;
    emailNotifications: boolean;
    smsNotifications: boolean;
    maintenanceMode: boolean;
}

const DEFAULT_CONFIG: SystemConfig = {
    facilityName: "Rhona Medical Center",
    facilityType: "General Hospital",
    address: "",
    city: "",
    country: "Uganda",
    phone: "",
    email: "",
    website: "",
    registrationNumber: "",
    maxPatientsPerDoctor: 20,
    allowWalkIns: true,
    requireInviteForStaff: true,
    emailNotifications: true,
    smsNotifications: false,
    maintenanceMode: false,
};

const FACILITY_TYPES = [
    "General Hospital", "Clinic", "Specialist Center", "Teaching Hospital",
    "Community Health Center", "Referral Hospital", "Private Hospital",
];

function SectionHeader({ icon: Icon, title }: { icon: React.ElementType; title: string }) {
    return (
        <div className="flex items-center gap-2 mb-4">
            <div className="h-7 w-7 rounded-lg bg-blue-50 flex items-center justify-center">
                <Icon className="h-3.5 w-3.5 text-blue-600" />
            </div>
            <h2 className="text-sm font-black text-gray-900">{title}</h2>
        </div>
    );
}

function Toggle({ checked, onChange, label, description }: {
    checked: boolean;
    onChange: (v: boolean) => void;
    label: string;
    description?: string;
}) {
    return (
        <div className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
            <div>
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                {description && <p className="text-xs text-gray-400 mt-0.5">{description}</p>}
            </div>
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={cn(
                    "relative h-6 w-11 rounded-full transition-colors duration-200 shrink-0 ml-4",
                    checked ? "bg-blue-600" : "bg-gray-200"
                )}
            >
                <span className={cn(
                    "absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform duration-200",
                    checked ? "translate-x-5" : "translate-x-0"
                )} />
            </button>
        </div>
    );
}

type DbProvider = "neon" | "local" | "firebase";

const DB_PROVIDERS: { value: DbProvider; label: string; description: string }[] = [
    { value: "neon",     label: "Neon (cloud Postgres)", description: "Managed Postgres over the internet — use for production / shared access" },
    { value: "local",    label: "Local Postgres",        description: "Postgres on this machine — fastest for development, no network needed" },
    { value: "firebase", label: "Firebase",               description: "Google Firestore — requires a server service-account key to enable" },
];

export default function SystemConfigPage() {
    const [config, setConfig] = useState<SystemConfig>(DEFAULT_CONFIG);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const [dbProvider, setDbProviderState] = useState<DbProvider | null>(null);
    const [dbSwitching, setDbSwitching] = useState<DbProvider | null>(null);
    const [dbError, setDbError] = useState<string | null>(null);

    useEffect(() => {
        getDoc(doc(db, "system", "config")).then(snap => {
            if (snap.exists()) setConfig({ ...DEFAULT_CONFIG, ...snap.data() as SystemConfig });
        }).finally(() => setLoading(false));

        fetch("/api/admin/db-provider")
            .then(res => res.json())
            .then(data => setDbProviderState(data.provider ?? "local"))
            .catch(() => setDbProviderState("local"));
    }, []);

    const switchDbProvider = async (provider: DbProvider) => {
        if (provider === dbProvider) return;
        setDbSwitching(provider);
        setDbError(null);
        try {
            const res = await fetch("/api/admin/db-provider", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ provider }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error ?? "Failed to switch data source");
            setDbProviderState(data.provider);
        } catch (err) {
            setDbError(err instanceof Error ? err.message : "Failed to switch data source");
        } finally {
            setDbSwitching(null);
        }
    };

    const set = <K extends keyof SystemConfig>(key: K, value: SystemConfig[K]) =>
        setConfig(prev => ({ ...prev, [key]: value }));

    const handleSave = async () => {
        setSaving(true);
        try {
            await setDoc(doc(db, "system", "config"), { ...config, updatedAt: serverTimestamp() });
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-32">
                <div className="animate-spin h-8 w-8 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-12 max-w-4xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900">System Configuration</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Facility details and system-wide settings</p>
                </div>
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="h-10 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center gap-2 shadow-sm shadow-blue-600/20 transition-colors"
                >
                    {saving ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                    ) : saved ? (
                        <><CheckCircle2 className="h-4 w-4" /> Saved</>
                    ) : (
                        <><Save className="h-4 w-4" /> Save Changes</>
                    )}
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Facility Info */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                >
                    <SectionHeader icon={Building2} title="Facility Information" />
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Facility Name</label>
                            <Input value={config.facilityName} onChange={e => set("facilityName", e.target.value)} placeholder="e.g. Rhona Medical Center" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Facility Type</label>
                            <select
                                value={config.facilityType}
                                onChange={e => set("facilityType", e.target.value)}
                                className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                            >
                                {FACILITY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Registration Number</label>
                            <Input value={config.registrationNumber} onChange={e => set("registrationNumber", e.target.value)} placeholder="MOH registration / license no." />
                        </div>
                    </div>
                </motion.div>

                {/* Contact Details */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                >
                    <SectionHeader icon={Phone} title="Contact Details" />
                    <div className="space-y-4">
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><MapPin className="h-3 w-3" /> Address</label>
                            <Input value={config.address} onChange={e => set("address", e.target.value)} placeholder="Street / building address" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">City</label>
                                <Input value={config.city} onChange={e => set("city", e.target.value)} placeholder="e.g. Kampala" />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Country</label>
                                <Input value={config.country} onChange={e => set("country", e.target.value)} placeholder="e.g. Uganda" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</label>
                            <Input value={config.phone} onChange={e => set("phone", e.target.value)} placeholder="+256 700 000 000" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Mail className="h-3 w-3" /> Email</label>
                            <Input type="email" value={config.email} onChange={e => set("email", e.target.value)} placeholder="info@hospital.ug" />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1"><Globe className="h-3 w-3" /> Website</label>
                            <Input value={config.website} onChange={e => set("website", e.target.value)} placeholder="https://www.hospital.ug" />
                        </div>
                    </div>
                </motion.div>

                {/* Operational Settings */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                >
                    <SectionHeader icon={ClipboardList} title="Operational Settings" />
                    <div className="space-y-1.5 mb-4">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Max Patients per Doctor (daily)</label>
                        <input
                            type="number"
                            min={1}
                            max={200}
                            value={config.maxPatientsPerDoctor}
                            onChange={e => set("maxPatientsPerDoctor", parseInt(e.target.value) || 20)}
                            className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                        />
                    </div>
                    <Toggle
                        checked={config.allowWalkIns}
                        onChange={v => set("allowWalkIns", v)}
                        label="Allow Walk-in Patients"
                        description="Receptionists can admit patients without prior appointment"
                    />
                    <Toggle
                        checked={config.requireInviteForStaff}
                        onChange={v => set("requireInviteForStaff", v)}
                        label="Require Invitation for Staff"
                        description="Staff must be invited by admin before they can register"
                    />
                </motion.div>

                {/* Notifications & System */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
                >
                    <SectionHeader icon={Bell} title="Notifications" />
                    <Toggle
                        checked={config.emailNotifications}
                        onChange={v => set("emailNotifications", v)}
                        label="Email Notifications"
                        description="Send appointment reminders and alerts via email"
                    />
                    <Toggle
                        checked={config.smsNotifications}
                        onChange={v => set("smsNotifications", v)}
                        label="SMS Notifications"
                        description="Send reminders via SMS (requires SMS gateway config)"
                    />

                    <div className="mt-6">
                        <SectionHeader icon={ShieldCheck} title="System" />
                        <div className={cn(
                            "rounded-xl border p-4 transition-colors",
                            config.maintenanceMode ? "bg-red-50 border-red-100" : "bg-gray-50 border-gray-100"
                        )}>
                            <Toggle
                                checked={config.maintenanceMode}
                                onChange={v => set("maintenanceMode", v)}
                                label="Maintenance Mode"
                                description="Blocks all non-admin logins while enabled"
                            />
                        </div>
                    </div>
                </motion.div>

                {/* Data Source */}
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2"
                >
                    <SectionHeader icon={Database} title="Data Source" />
                    <p className="text-xs text-gray-400 -mt-2 mb-4">Switches immediately — no restart required.</p>

                    {dbError && (
                        <div className="flex items-start gap-2 mb-4 p-3 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-700">
                            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                            {dbError}
                        </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {DB_PROVIDERS.map(p => {
                            const active = dbProvider === p.value;
                            const isSwitching = dbSwitching === p.value;
                            return (
                                <button
                                    key={p.value}
                                    type="button"
                                    disabled={dbProvider === null || dbSwitching !== null}
                                    onClick={() => switchDbProvider(p.value)}
                                    className={cn(
                                        "text-left rounded-xl border p-4 transition-colors disabled:opacity-60",
                                        active ? "border-blue-500 bg-blue-50/60" : "border-gray-100 hover:border-gray-200"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-bold text-gray-800">{p.label}</span>
                                        {isSwitching ? (
                                            <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />
                                        ) : active ? (
                                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                        ) : null}
                                    </div>
                                    <p className="text-[11px] text-gray-400 leading-snug">{p.description}</p>
                                </button>
                            );
                        })}
                    </div>
                </motion.div>
            </div>

            {/* Save footer */}
            <div className="flex justify-end pt-2">
                <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="h-11 px-8 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center gap-2 shadow-sm shadow-blue-600/20 transition-colors"
                >
                    {saving ? (
                        <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                    ) : saved ? (
                        <><CheckCircle2 className="h-4 w-4" /> Saved</>
                    ) : (
                        <><Save className="h-4 w-4" /> Save Changes</>
                    )}
                </button>
            </div>
        </div>
    );
}

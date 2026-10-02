"use client";

import { useState } from "react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { AlertOctagon, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/Input";

const INCIDENT_TYPES = ["Patient Fall", "Medication Error", "Equipment Failure", "Needle Stick Injury", "Patient Complaint", "Near Miss", "Adverse Drug Reaction", "Procedure Complication", "Other"];
const LOCATIONS = ["Ward A", "Ward B", "ICU", "Theatre", "OPD", "Pharmacy", "Laboratory", "Radiology", "Physiotherapy", "Kitchen", "Corridors", "Car Park"];

export default function IncidentReportPage() {
    const { profile } = useAuth();
    const router = useRouter();
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [form, setForm] = useState({
        title: "",
        incidentType: INCIDENT_TYPES[0],
        location: LOCATIONS[0],
        severity: "medium" as "low" | "medium" | "high" | "critical",
        date: new Date().toISOString().slice(0, 10),
        time: new Date().toTimeString().slice(0, 5),
        description: "",
        immediateAction: "",
        involvedPersons: "",
        witnesses: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            await addDoc(collection(db, "incidents"), {
                ...form,
                reportedBy: profile?.name,
                reportedByRole: profile?.role,
                status: "open",
                createdAt: serverTimestamp(),
            });
            setSaved(true);
            setTimeout(() => router.push("/incidents/list"), 2000);
        } catch(e) { console.error(e); }
        finally { setSaving(false); }
    };

    if (saved) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <div className="h-16 w-16 rounded-full bg-green-50 flex items-center justify-center mb-4">
                    <CheckCircle2 className="h-8 w-8 text-green-600" />
                </div>
                <h2 className="text-xl font-black text-gray-900 mb-2">Incident Reported</h2>
                <p className="text-sm text-gray-500">Your report has been submitted. Redirecting to the incident list...</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl space-y-6 pb-10">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Report Incident</h1>
                <p className="text-sm text-gray-500 mt-0.5">Submit a safety incident, near-miss, or adverse event report</p>
            </div>

            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Incident Title</label>
                    <Input required placeholder="Brief title of the incident" value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Incident Type</label>
                        <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                            value={form.incidentType} onChange={e => setForm(p => ({ ...p, incidentType: e.target.value }))}>
                            {INCIDENT_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Location</label>
                        <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                            value={form.location} onChange={e => setForm(p => ({ ...p, location: e.target.value }))}>
                            {LOCATIONS.map(l => <option key={l}>{l}</option>)}
                        </select>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Severity</label>
                        <select className="w-full h-11 px-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 outline-none"
                            value={form.severity} onChange={e => setForm(p => ({ ...p, severity: e.target.value as typeof form.severity }))}>
                            <option value="low">Low</option>
                            <option value="medium">Medium</option>
                            <option value="high">High</option>
                            <option value="critical">Critical</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Date</label>
                        <Input type="date" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Time</label>
                        <Input type="time" required value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Description of Incident</label>
                    <textarea rows={4} required placeholder="Describe what happened in detail..." value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:bg-white focus:border-blue-500 outline-none resize-none" />
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Immediate Action Taken</label>
                    <textarea rows={2} placeholder="What was done immediately after the incident?" value={form.immediateAction} onChange={e => setForm(p => ({ ...p, immediateAction: e.target.value }))}
                        className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-700 focus:bg-white focus:border-blue-500 outline-none resize-none" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Persons Involved</label>
                        <Input placeholder="Names of persons involved" value={form.involvedPersons} onChange={e => setForm(p => ({ ...p, involvedPersons: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Witnesses</label>
                        <Input placeholder="Names of witnesses (if any)" value={form.witnesses} onChange={e => setForm(p => ({ ...p, witnesses: e.target.value }))} />
                    </div>
                </div>

                <div className="p-3.5 bg-amber-50 rounded-xl border border-amber-100 text-xs font-semibold text-amber-700 flex gap-2">
                    <AlertOctagon className="h-4 w-4 shrink-0 mt-0.5" />
                    All incident reports are confidential and used for quality improvement purposes only.
                </div>

                <button type="submit" disabled={saving}
                    className="w-full h-11 rounded-xl bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2">
                    {saving ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full"/> : "Submit Incident Report"}
                </button>
            </form>
        </div>
    );
}

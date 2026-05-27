"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import {
    Stethoscope, User, CalendarDays, Clock,
    CheckCircle2, ShieldCheck, ArrowRight, Search
} from "lucide-react";
import { Input } from "@/components/ui/Input";

const TIME_SLOTS = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "14:00", "14:30", "15:00",
    "15:30", "16:00", "16:30",
];

type DoctorOption = {
    uid: string;
    name: string;
    specialization: string;
    todayCount: number;
};

export default function BookAppointmentPage() {
    const { profile } = useAuth();
    const [doctors, setDoctors] = useState<DoctorOption[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorOption | null>(null);

    const [form, setForm] = useState({
        patientName: "",
        patientEmail: "",
        date: "",
        time: TIME_SLOTS[0],
        notes: "",
    });

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const today = new Date().toISOString().split("T")[0];

                const [doctorSnap, apptSnap] = await Promise.all([
                    getDocs(query(collection(db, "users"), where("role", "==", "DOCTOR"))),
                    getDocs(query(collection(db, "appointments"), where("date", "==", today))),
                ]);

                const countMap: Record<string, number> = {};
                apptSnap.docs.forEach(d => {
                    const did = d.data().doctorId;
                    if (did) countMap[did] = (countMap[did] || 0) + 1;
                });

                setDoctors(
                    doctorSnap.docs.map(d => {
                        const data = d.data();
                        return {
                            uid: d.id,
                            name: data.name || "Unknown",
                            specialization: data.specialization || "General",
                            todayCount: countMap[d.id] || 0,
                        };
                    })
                );
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingDoctors(false);
            }
        };
        fetchDoctors();
    }, []);

    const filtered = doctors.filter(d =>
        !search ||
        d.name.toLowerCase().includes(search.toLowerCase()) ||
        d.specialization.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoctor) { setError("Please select a doctor."); return; }
        setSubmitting(true);
        setError("");
        try {
            const apptId = `appt_${Date.now()}`;
            await setDoc(doc(db, "appointments", apptId), {
                patientName: form.patientName.trim(),
                patientEmail: form.patientEmail.toLowerCase().trim(),
                doctorId: selectedDoctor.uid,
                doctorName: selectedDoctor.name,
                specialization: selectedDoctor.specialization,
                date: form.date,
                time: form.time,
                notes: form.notes.trim(),
                status: "SCHEDULED",
                bookedBy: profile?.uid,
                bookedByName: profile?.name,
                bookedAt: serverTimestamp(),
            });
            setSuccess(true);
        } catch (err: any) {
            setError(err.message || "Failed to book appointment.");
        } finally {
            setSubmitting(false);
        }
    };

    const reset = () => {
        setSuccess(false);
        setSelectedDoctor(null);
        setForm({ patientName: "", patientEmail: "", date: "", time: TIME_SLOTS[0], notes: "" });
    };

    if (success) {
        return (
            <div className="max-w-lg mx-auto py-10">
                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-3xl border border-gray-100 shadow-sm p-10 text-center">
                    <div className="h-16 w-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                        <CheckCircle2 className="h-8 w-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-black text-gray-900 mb-2">Appointment Booked</h2>
                    <p className="text-sm text-gray-500">
                        <span className="font-bold">{form.patientName}</span> booked with{" "}
                        <span className="font-bold">{selectedDoctor?.name}</span> on {form.date} at {form.time}.
                    </p>
                    <button onClick={reset}
                        className="mt-6 w-full h-11 rounded-xl border border-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-50 transition-colors">
                        Book Another
                    </button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto pb-10 space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Book Appointment</h1>
                <p className="text-sm text-gray-500 mt-0.5">Schedule a doctor consultation for a patient</p>
            </div>

            {/* Doctor selection */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-blue-600" /> Select Doctor
                </h2>

                <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search by name or specialization..."
                        className="pl-9" value={search}
                        onChange={e => setSearch(e.target.value)} />
                </div>

                {loadingDoctors ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                    </div>
                ) : filtered.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-8">
                        {doctors.length === 0 ? "No doctors registered in the system yet." : "No doctors match your search."}
                    </p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-1">
                        {filtered.map(doctor => {
                            const isSelected = selectedDoctor?.uid === doctor.uid;
                            const isBusy = doctor.todayCount >= 8;
                            return (
                                <button key={doctor.uid} type="button"
                                    onClick={() => setSelectedDoctor(doctor)}
                                    className={`text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                                        isSelected
                                            ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                                            : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                                    }`}>
                                    <div className={`h-9 w-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 ${
                                        isSelected ? "bg-blue-600 text-white" : "bg-blue-50 text-blue-600"
                                    }`}>
                                        {doctor.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-black text-gray-900 truncate">{doctor.name}</p>
                                        <p className="text-[11px] text-gray-400 truncate">{doctor.specialization}</p>
                                    </div>
                                    <div className="shrink-0 flex flex-col items-end gap-1">
                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                            isBusy
                                                ? "bg-red-50 text-red-600 border border-red-100"
                                                : "bg-green-50 text-green-600 border border-green-100"
                                        }`}>
                                            {isBusy ? "Busy" : "Available"}
                                        </span>
                                        <span className="text-[10px] text-gray-400">
                                            {doctor.todayCount} today
                                        </span>
                                    </div>
                                    {isSelected && <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 -ml-1" />}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Patient & time details */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" /> Patient & Schedule
                </h2>

                {selectedDoctor && (
                    <div className="flex items-center gap-2.5 p-3 bg-blue-50 rounded-xl border border-blue-100">
                        <div className="h-7 w-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                            {selectedDoctor.name.charAt(0)}
                        </div>
                        <div>
                            <p className="text-xs font-black text-gray-900">{selectedDoctor.name}</p>
                            <p className="text-[10px] text-gray-500">{selectedDoctor.specialization}</p>
                        </div>
                        <button type="button" onClick={() => setSelectedDoctor(null)}
                            className="ml-auto text-[10px] text-blue-600 font-bold hover:underline">
                            Change
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient Name</label>
                        <Input required placeholder="Full name" value={form.patientName}
                            onChange={e => setForm(p => ({ ...p, patientName: e.target.value }))} />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Patient Email</label>
                        <Input type="email" required placeholder="patient@email.com" value={form.patientEmail}
                            onChange={e => setForm(p => ({ ...p, patientEmail: e.target.value }))} />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Date</label>
                        <div className="relative">
                            <CalendarDays className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input type="date" required className="pl-10" value={form.date}
                                min={new Date().toISOString().split("T")[0]}
                                onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Time Slot</label>
                        <div className="relative">
                            <Clock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <select required
                                className="w-full h-11 pl-10 pr-4 rounded-xl border border-gray-200 bg-gray-50 text-sm font-semibold text-gray-700 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all"
                                value={form.time}
                                onChange={e => setForm(p => ({ ...p, time: e.target.value }))}>
                                {TIME_SLOTS.map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider ml-1">Notes (optional)</label>
                    <textarea rows={2} placeholder="Any notes for the doctor..."
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm font-medium text-gray-700 placeholder:text-gray-400 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all resize-none"
                        value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} />
                </div>

                <AnimatePresence>
                    {error && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                            className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-semibold flex gap-2">
                            <ShieldCheck className="h-4 w-4 shrink-0 mt-0.5" /><span>{error}</span>
                        </motion.div>
                    )}
                </AnimatePresence>

                <button type="submit" disabled={submitting || !selectedDoctor}
                    className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-blue-600/20">
                    {submitting
                        ? <div className="animate-spin h-4 w-4 border-2 border-white/30 border-t-white rounded-full" />
                        : <><ArrowRight className="h-4 w-4" /> Confirm Appointment</>}
                </button>
            </form>
        </div>
    );
}

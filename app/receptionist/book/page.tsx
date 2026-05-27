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
import { DoctorProfile } from "@/types";

const TIME_SLOTS = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30",
    "11:00", "11:30", "12:00", "14:00", "14:30", "15:00",
    "15:30", "16:00", "16:30",
];

export default function BookAppointmentPage() {
    const { profile } = useAuth();
    const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
    const [loadingDoctors, setLoadingDoctors] = useState(true);
    const [doctorSearch, setDoctorSearch] = useState("");
    const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);

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
                const q = query(
                    collection(db, "users"),
                    where("role", "==", "DOCTOR"),
                    where("approved", "==", true)
                );
                const snap = await getDocs(q);
                setDoctors(snap.docs.map(d => d.data() as DoctorProfile));
            } catch (err) {
                console.error(err);
            } finally {
                setLoadingDoctors(false);
            }
        };
        fetchDoctors();
    }, []);

    const filteredDoctors = doctors.filter(d =>
        !doctorSearch ||
        d.name.toLowerCase().includes(doctorSearch.toLowerCase()) ||
        (d.specialization || "").toLowerCase().includes(doctorSearch.toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedDoctor) {
            setError("Please select a doctor.");
            return;
        }
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
                        <span className="font-bold">{form.patientName}</span> has been booked with{" "}
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
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-black text-gray-900 mb-4 flex items-center gap-2">
                    <Stethoscope className="h-4.5 w-4.5 text-blue-600" /> Select Doctor
                </h2>
                <div className="relative mb-4">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input placeholder="Search by name or specialization..."
                        className="pl-10" value={doctorSearch}
                        onChange={e => setDoctorSearch(e.target.value)} />
                </div>
                {loadingDoctors ? (
                    <div className="flex items-center justify-center py-8">
                        <div className="animate-spin h-6 w-6 border-[3px] border-blue-100 border-t-blue-600 rounded-full" />
                    </div>
                ) : filteredDoctors.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-6">No approved doctors found.</p>
                ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                        {filteredDoctors.map(doctor => (
                            <button key={doctor.uid}
                                type="button"
                                onClick={() => setSelectedDoctor(doctor)}
                                className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3 ${
                                    selectedDoctor?.uid === doctor.uid
                                        ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500/20"
                                        : "border-gray-100 hover:border-gray-200 hover:bg-gray-50"
                                }`}>
                                <div className="h-9 w-9 rounded-xl bg-blue-50 flex items-center justify-center font-black text-blue-600 text-xs shrink-0">
                                    {doctor.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="text-sm font-black text-gray-900">{doctor.name}</p>
                                    <p className="text-xs text-gray-400">{doctor.specialization || "General"}</p>
                                </div>
                                {selectedDoctor?.uid === doctor.uid && (
                                    <CheckCircle2 className="h-4 w-4 text-blue-600 ml-auto" />
                                )}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Patient & time details */}
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h2 className="text-base font-black text-gray-900 flex items-center gap-2">
                    <User className="h-4.5 w-4.5 text-blue-600" /> Patient & Schedule
                </h2>

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

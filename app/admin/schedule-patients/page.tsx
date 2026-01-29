"use client";

import React, { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    serverTimestamp
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { UserProfile, DoctorProfile } from "@/types";
import { Calendar, User, Stethoscope, ArrowRight } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export default function SchedulePatientsPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPatient, setSelectedPatient] = useState<string | null>(null);
    const [scheduleData, setScheduleData] = useState({
        date: "",
        doctorId: "",
    });
    const [processing, setProcessing] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch patients not yet scheduled (legacy status 'false')
            const patientsQ = query(
                collection(db, "users"),
                where("role", "==", "PATIENT"),
                where("status", "==", "false")
            );
            const patientsSnapshot = await getDocs(patientsQ);
            setPatients(patientsSnapshot.docs.map(doc => ({ ...doc.data(), uid: doc.id })));

            // Fetch approved doctors
            const doctorsQ = query(
                collection(db, "users"),
                where("role", "==", "DOCTOR"),
                where("approved", "==", true)
            );
            const doctorsSnapshot = await getDocs(doctorsQ);
            setDoctors(doctorsSnapshot.docs.map(doc => ({ ...doc.data() as DoctorProfile, uid: doc.id })));
        } catch (error) {
            console.error("Error fetching data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSchedule = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPatient || !scheduleData.doctorId || !scheduleData.date) return;

        setProcessing(true);
        try {
            const patientRef = doc(db, "users", selectedPatient);
            await updateDoc(patientRef, {
                status: "true",
                visitDate: scheduleData.date,
                assignedDoctorId: scheduleData.doctorId,
                scheduledAt: serverTimestamp(),
            });

            // Update local state
            setPatients(patients.filter(p => p.uid !== selectedPatient));
            setSelectedPatient(null);
            setScheduleData({ date: "", doctorId: "" });
            alert("Patient scheduled successfully!");
        } catch (error) {
            console.error("Error scheduling patient:", error);
        } finally {
            setProcessing(false);
        }
    };

    return (
        <div className="space-y-12 pb-24">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
                <div className="space-y-1">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Visit <span className="text-gradient-cyan">Synchronization</span></h1>
                    <p className="text-gray-500 font-medium">Coordinate patient trajectories with medical specialist nodes.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                <div className="lg:col-span-2">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-glass rounded-[40px] shadow-premium border border-white overflow-hidden"
                    >
                        <div className="px-10 py-8 bg-gray-900/5 border-b border-gray-100 flex items-center justify-between">
                            <h2 className="font-black text-gray-900 uppercase tracking-widest text-xs">Waiting for Allocation</h2>
                            <div className="px-3 py-1 bg-cyan-100 text-cyan-700 rounded-full text-[9px] font-black uppercase tracking-widest">
                                {patients.length} Nodes Pending
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-[10px] uppercase bg-gray-50/50 text-gray-400 font-black tracking-widest">
                                    <tr>
                                        <th className="px-10 py-5">Patient Node</th>
                                        <th className="px-10 py-5">Symptom Summary</th>
                                        <th className="px-10 py-5 text-right">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {loading ? (
                                        <tr><td colSpan={3} className="px-10 py-20 text-center"><div className="animate-spin h-8 w-8 border-4 border-cyan-100 border-t-cyan-600 rounded-full mx-auto" /></td></tr>
                                    ) : patients.length === 0 ? (
                                        <tr><td colSpan={3} className="px-10 py-20 text-center text-gray-400 font-medium italic">Allocation registry is currently empty.</td></tr>
                                    ) : (
                                        patients.map((patient, idx) => (
                                            <motion.tr
                                                key={patient.uid}
                                                initial={{ opacity: 0 }}
                                                animate={{ opacity: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                className={cn("group transition-colors", selectedPatient === patient.uid ? "bg-cyan-50/50" : "hover:bg-gray-50/50")}
                                            >
                                                <td className="px-10 py-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-100 to-teal-100 flex items-center justify-center text-cyan-700 font-black shadow-sm">
                                                            {patient.name.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <div className="font-black text-gray-900">{patient.name}</div>
                                                            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tighter">{patient.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-6 text-sm text-gray-500 font-medium italic truncate max-w-[200px]">"{patient.problem}"</td>
                                                <td className="px-10 py-6 text-right">
                                                    <Button
                                                        className={cn("h-10 px-6 rounded-xl text-xs font-black uppercase tracking-widest shadow-sm transition-all", selectedPatient === patient.uid ? "bg-cyan-600" : "bg-white text-gray-400 border-gray-100 hover:text-cyan-600 hover:border-cyan-100")}
                                                        onClick={() => setSelectedPatient(patient.uid)}
                                                    >
                                                        {selectedPatient === patient.uid ? "Selected" : "Synthesize"}
                                                    </Button>
                                                </td>
                                            </motion.tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                </div>

                <div className="lg:col-span-1">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-glass p-8 rounded-[40px] shadow-premium border border-white sticky top-12"
                    >
                        <h2 className="text-xl font-black text-gray-900 mb-8 flex items-center gap-4">
                            <div className="h-10 w-10 bg-cyan-50 rounded-2xl flex items-center justify-center">
                                <Calendar className="h-5 w-5 text-cyan-600" />
                            </div>
                            Trajectory Matrix
                        </h2>

                        {!selectedPatient ? (
                            <div className="text-center py-20 bg-gray-50/30 rounded-[32px] border-2 border-dashed border-gray-100 text-gray-400 flex flex-col items-center">
                                <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-sm">
                                    <User className="h-8 w-8 text-gray-200" />
                                </div>
                                <p className="text-sm font-bold uppercase tracking-widest px-8">Select a patient node to initialize scheduling</p>
                            </div>
                        ) : (
                            <form onSubmit={handleSchedule} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Temporal Point</label>
                                    <Input
                                        className="h-16 rounded-2xl border-gray-100 bg-white px-6 font-black"
                                        type="date"
                                        required
                                        value={scheduleData.date}
                                        onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2">Medical Specialist</label>
                                    <select
                                        className="w-full h-16 rounded-2xl border border-gray-100 bg-white px-6 text-sm font-black transition-all focus:border-cyan-200 focus:ring-8 focus:ring-cyan-500/5 outline-none shadow-sm"
                                        required
                                        value={scheduleData.doctorId}
                                        onChange={(e) => setScheduleData({ ...scheduleData, doctorId: e.target.value })}
                                    >
                                        <option value="">Select Domain Expert</option>
                                        {doctors.map(doc => (
                                            <option key={doc.uid} value={doc.uid}>
                                                {doc.name} • {doc.specialization}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-6 border-t border-gray-100">
                                    <div className="flex items-center gap-4 mb-8 bg-cyan-50/50 p-4 rounded-2xl border border-cyan-100/50">
                                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shrink-0 shadow-sm">
                                            <Stethoscope className="h-5 w-5 text-cyan-600" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[9px] font-black text-cyan-400 uppercase tracking-[0.1em] mb-0.5">Target Allocation</p>
                                            <p className="text-sm font-black text-cyan-800 truncate">{patients.find(p => p.uid === selectedPatient)?.name}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 gap-4">
                                        <Button type="submit" className="h-16 rounded-2xl shadow-heavy font-black text-lg" disabled={processing}>
                                            {processing ? "Syncing..." : "Commit Trajectory"}
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            className="h-14 font-black uppercase tracking-widest text-[10px] text-gray-400 hover:text-red-500 hover:bg-red-50"
                                            onClick={() => setSelectedPatient(null)}
                                            disabled={processing}
                                        >
                                            Abort Synthesis
                                        </Button>
                                    </div>
                                </div>
                            </form>
                        )}
                    </motion.div>
                </div>
            </div>
        </div>
    );
}

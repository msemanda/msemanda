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
import { UserProfile } from "@/types";
import { Calendar, User, Stethoscope } from "lucide-react";

export default function SchedulePatientsPage() {
    const [patients, setPatients] = useState<any[]>([]);
    const [doctors, setDoctors] = useState<UserProfile[]>([]);
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
            setDoctors(doctorsSnapshot.docs.map(doc => ({ ...doc.data() as UserProfile, uid: doc.id })));
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
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold font-premium">Schedule Patient Visits</h1>
                <p className="text-gray-500">Assign patients to available doctors and set visit dates.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="px-6 py-4 bg-gray-50 border-b">
                            <h2 className="font-semibold text-gray-700">Awaiting Schedule</h2>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="text-xs uppercase bg-gray-50 text-gray-500 font-semibold">
                                    <tr>
                                        <th className="px-6 py-3">Patient</th>
                                        <th className="px-6 py-3">Problem</th>
                                        <th className="px-6 py-3">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y">
                                    {loading ? (
                                        <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-400">Loading patients...</td></tr>
                                    ) : patients.length === 0 ? (
                                        <tr><td colSpan={3} className="px-6 py-10 text-center text-gray-400">No patients pending schedule.</td></tr>
                                    ) : (
                                        patients.map((patient) => (
                                            <tr key={patient.uid} className={selectedPatient === patient.uid ? "bg-blue-50" : ""}>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center">
                                                        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                                                            <User className="h-4 w-4 text-blue-600" />
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{patient.name}</div>
                                                            <div className="text-xs text-gray-500">{patient.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">{patient.problem}</td>
                                                <td className="px-6 py-4">
                                                    <Button
                                                        variant={selectedPatient === patient.uid ? "primary" : "outline"}
                                                        size="sm"
                                                        onClick={() => setSelectedPatient(patient.uid)}
                                                    >
                                                        Select
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-1">
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 sticky top-8">
                        <h2 className="text-lg font-bold mb-6 flex items-center">
                            <Calendar className="mr-2 h-5 w-5 text-blue-600" />
                            Schedule Details
                        </h2>

                        {!selectedPatient ? (
                            <div className="text-center py-10 border-2 border-dashed rounded-lg text-gray-400">
                                Please select a patient from the list.
                            </div>
                        ) : (
                            <form onSubmit={handleSchedule} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Visit Date</label>
                                    <Input
                                        type="date"
                                        required
                                        value={scheduleData.date}
                                        onChange={(e) => setScheduleData({ ...scheduleData, date: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-700">Assign Doctor</label>
                                    <select
                                        className="w-full rounded-md border border-gray-300 p-2 text-sm focus:ring-2 focus:ring-blue-500"
                                        required
                                        value={scheduleData.doctorId}
                                        onChange={(e) => setScheduleData({ ...scheduleData, doctorId: e.target.value })}
                                    >
                                        <option value="">Select a Doctor</option>
                                        {doctors.map(doc => (
                                            <option key={doc.uid} value={doc.uid}>
                                                {doc.name} - {doc.specialization}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="pt-4 border-t">
                                    <div className="flex items-center space-x-2 mb-4">
                                        <div className="h-6 w-6 rounded-full bg-blue-100 flex items-center justify-center">
                                            <Stethoscope className="h-3 w-3 text-blue-600" />
                                        </div>
                                        <span className="text-sm text-gray-600">Scheduling for: <span className="font-bold">{patients.find(p => p.uid === selectedPatient)?.name}</span></span>
                                    </div>
                                    <Button type="submit" className="w-full" disabled={processing}>
                                        {processing ? "Scheduling..." : "Confirm Schedule"}
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        className="w-full mt-2"
                                        onClick={() => setSelectedPatient(null)}
                                        disabled={processing}
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

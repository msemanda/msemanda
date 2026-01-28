"use client";

import { useAuth } from "@/context/AuthContext";
import {
    Calendar,
    Clock,
    User,
    FileText,
    HeartPulse,
    Activity
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export default function PatientDashboard() {
    const { profile } = useAuth();

    // In a real app, we'd fetch these from Firestore
    // Mocking the data based on legacy plog.jsp logic
    const appointment = profile?.visitDate ? {
        doctor: "Dr. Smith", // We'd fetch the actual doctor name using assignedDoctorId
        date: profile.visitDate,
        time: "12:00 AM"
    } : null;

    return (
        <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-12">
                <div>
                    <h1 className="text-4xl font-bold font-premium text-gray-900 tracking-tight">
                        Welcome, {profile?.name}
                    </h1>
                    <p className="mt-2 text-lg text-gray-600">Your health overview and upcoming appointments.</p>
                </div>
                <div className="mt-6 md:mt-0 flex space-x-4">
                    <Link href="/patient/records">
                        <Button variant="outline" className="flex items-center">
                            <FileText className="mr-2 h-4 w-4" /> Medical History
                        </Button>
                    </Link>
                    <Button className="flex items-center">
                        <Activity className="mr-2 h-4 w-4" /> New Request
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    {appointment ? (
                        <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden transition-all hover:shadow-2xl">
                            <div className="bg-blue-600 p-6 text-white flex items-center justify-between">
                                <div className="flex items-center">
                                    <Calendar className="h-8 w-8 mr-4 opacity-75" />
                                    <div>
                                        <h2 className="text-xl font-bold">Upcoming Consultation</h2>
                                        <p className="text-blue-100 text-sm">Confirmed Appointment</p>
                                    </div>
                                </div>
                                <div className="bg-blue-500/30 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest border border-white/20">
                                    Scheduled
                                </div>
                            </div>
                            <div className="p-8">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="flex items-start">
                                        <div className="bg-gray-100 p-3 rounded-xl mr-4">
                                            <User className="h-6 w-6 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Assigned Specialist</p>
                                            <p className="text-xl font-bold text-gray-900">Dr. Sarah Jenkins</p>
                                            <p className="text-sm text-blue-600 font-medium mt-1">Senior Cardiologist</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start">
                                        <div className="bg-gray-100 p-3 rounded-xl mr-4">
                                            <Clock className="h-6 w-6 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">Appointment Time</p>
                                            <p className="text-xl font-bold text-gray-900">{appointment.date}</p>
                                            <p className="text-sm text-gray-600 mt-1">{appointment.time}</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t flex justify-end">
                                    <Button variant="ghost" className="text-gray-500 mr-4">Reschedule</Button>
                                    <Button>Add to Calendar</Button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200 p-20 text-center">
                            <Calendar className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-900">No Appointments Scheduled</h3>
                            <p className="text-gray-500 max-w-sm mx-auto mt-2">You don't have any upcoming visits. Consult with our administrators to get scheduled.</p>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-md border p-8">
                        <h3 className="text-lg font-bold mb-6 flex items-center mb-8 font-premium">
                            <HeartPulse className="h-6 w-6 text-red-500 mr-3" /> Recent Diagnostic Reports
                        </h3>
                        <div className="space-y-4">
                            <Link href="/patient/diagnostics" className="block p-4 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all flex items-center justify-between">
                                <div className="flex items-center">
                                    <div className="h-10 w-10 bg-blue-100 rounded-lg flex items-center justify-center mr-4">
                                        <FileText className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-gray-900">General Health Screening</p>
                                        <p className="text-xs text-gray-500">Oct 24, 2025 • Dr. Sarah Jenkins</p>
                                    </div>
                                </div>
                                <Button variant="ghost" size="sm">View PDF</Button>
                            </Link>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl p-8 text-white shadow-lg">
                        <h3 className="text-xl font-bold mb-4">Patient Profile</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-white/20 pb-2">
                                <span className="opacity-75">Patient ID</span>
                                <span className="font-mono">{profile?.uid.substring(0, 12)}</span>
                            </div>
                            <div className="flex justify-between border-b border-white/20 pb-2">
                                <span className="opacity-75">Condition</span>
                                <span className="font-bold">Persistent Cough</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="opacity-75">Blood Group</span>
                                <span className="font-bold">A+ Positive</span>
                            </div>
                        </div>
                        <Button variant="outline" className="w-full mt-8 border-white/30 text-white hover:bg-white/10">
                            Update Health Profile
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

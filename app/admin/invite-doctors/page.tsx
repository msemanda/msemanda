"use client";

import React, { useEffect, useState } from "react";
import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";
import { UserProfile } from "@/types";
import { CheckCircle, XCircle, User } from "lucide-react";

export default function AuthenticateDoctorsPage() {
    const [doctors, setDoctors] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState<string | null>(null);

    useEffect(() => {
        fetchPendingDoctors();
    }, []);

    const fetchPendingDoctors = async () => {
        setLoading(true);
        try {
            const q = query(
                collection(db, "users"),
                where("role", "==", "DOCTOR"),
                where("approved", "==", false)
            );
            const querySnapshot = await getDocs(q);
            const docs: UserProfile[] = [];
            querySnapshot.forEach((doc) => {
                docs.push(doc.data() as UserProfile);
            });
            setDoctors(docs);
        } catch (error) {
            console.error("Error fetching doctors:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAuthenticate = async (uid: string) => {
        setProcessing(uid);
        try {
            const docRef = doc(db, "users", uid);
            await updateDoc(docRef, {
                approved: true
            });
            setDoctors(doctors.filter(d => d.uid !== uid));
        } catch (error) {
            console.error("Error authenticating doctor:", error);
        } finally {
            setProcessing(null);
        }
    };

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold font-premium">Doctor Authentication</h1>
                <p className="text-gray-500">Review and approve newly registered medical professionals.</p>
            </div>

            {loading ? (
                <div className="text-center py-20 italic text-gray-500">Scanning for pending registrations...</div>
            ) : doctors.length === 0 ? (
                <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold">All caught up!</h2>
                    <p className="text-gray-500">No doctors are currently awaiting authentication.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {doctors.map((doctor) => (
                        <div key={doctor.uid} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
                            <div className="flex items-start justify-between mb-4">
                                <div className="bg-blue-50 p-3 rounded-full">
                                    <User className="h-6 w-6 text-blue-600" />
                                </div>
                                <div className="text-xs font-semibold px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full">
                                    Pending
                                </div>
                            </div>
                            <h3 className="text-lg font-bold">{doctor.name}</h3>
                            <p className="text-sm text-gray-600 mb-1">{doctor.email}</p>
                            <p className="text-xs text-gray-400 mb-4">Registered on: {new Date(doctor.createdAt?.seconds * 1000).toLocaleDateString()}</p>

                            <div className="space-y-4 border-t pt-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-gray-500">Address:</span>
                                    <span className="font-medium text-right truncate ml-2">{doctor.address}</span>
                                </div>
                                <Button
                                    className="w-full"
                                    disabled={processing === doctor.uid}
                                    onClick={() => handleAuthenticate(doctor.uid)}
                                >
                                    {processing === doctor.uid ? "Processing..." : "Authenticate Doctor"}
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

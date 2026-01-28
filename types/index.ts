export type UserRole = "ADMIN" | "PATIENT" | "DOCTOR" | "PHARMACY";

export interface UserProfile {
    uid: string;
    email: string;
    role: UserRole;
    name: string;
    address?: string;
    dob?: string; // Format: DD-MM-YYYY as in legacy
    gender?: string;
    createdAt: any;
}

export interface DoctorProfile extends UserProfile {
    specialization: string;
    qualification: string;
    age: number;
}

export interface PatientProfile extends UserProfile {
    // Add patient specific fields if any
}

export interface PharmacyProfile extends UserProfile {
    // Add pharmacy specific fields if any
}

export interface Appointment {
    id: string;
    patientId: string;
    doctorId: string;
    date: string;
    time: string;
    status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
}

export interface Diagnosis {
    id: string;
    patientId: string;
    doctorId: string;
    description: string;
    prescription: string;
    date: any;
}

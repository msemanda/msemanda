export type UserRole =
    | "ADMIN"
    | "PATIENT"
    | "DOCTOR"
    | "PHARMACY"
    | "NURSE"
    | "LAB_TECH"
    | "RADIOLOGY_TECH"
    | "PHYSIOTHERAPIST"
    | "DENTIST"
    | "DIETITIAN"
    | "EMERGENCY_STAFF"
    | "RECEPTIONIST";

export interface UserProfile {
    uid: string;
    email: string;
    role: UserRole;
    name: string;
    title?: string;
    address?: string;
    dob?: string;
    gender?: string;
    phone?: string;
    createdAt: any;
    permissions?: string[];
}

export interface DoctorProfile extends UserProfile {
    specialization: string;
    qualification: string;
    age: number;
    approved?: boolean;
    licenseNumber?: string;
    department?: string;
}

export interface PatientProfile extends UserProfile {
    visitDate?: string;
    assignedDoctorId?: string;
    problem?: string;
    status?: string;
    fatherName?: string;
    age?: number;
    bloodGroup?: string;
    allergies?: string;
    emergencyContact?: string;
    insuranceId?: string;
}

export interface PharmacyProfile extends UserProfile {
    pharmacistName?: string;
    licenseNumber?: string;
}

export interface NurseProfile extends UserProfile {
    ward?: string;
    shift?: "MORNING" | "EVENING" | "NIGHT";
    qualification?: string;
    licenseNumber?: string;
}

export interface LabTechProfile extends UserProfile {
    labSection?: string;
    qualification?: string;
    licenseNumber?: string;
}

export interface RadiologyTechProfile extends UserProfile {
    modality?: string;
    qualification?: string;
    licenseNumber?: string;
}

export interface PhysiotherapistProfile extends UserProfile {
    specialization?: string;
    qualification?: string;
    licenseNumber?: string;
}

export interface DentistProfile extends UserProfile {
    specialization?: string;
    qualification?: string;
    licenseNumber?: string;
}

export interface DietitianProfile extends UserProfile {
    specialization?: string;
    qualification?: string;
    licenseNumber?: string;
}

export interface EmergencyStaffProfile extends UserProfile {
    designation?: string;
    qualification?: string;
    zone?: string;
}

export interface ReceptionistProfile extends UserProfile {
    department?: string;
    shift?: "MORNING" | "EVENING" | "NIGHT";
}

export interface PatientAdmission {
    id: string;
    patientEmail: string;
    patientName: string;
    phone?: string;
    problem: string;
    assignedDoctorId?: string;
    admittedBy: string;
    admittedAt: any;
    inviteSent: boolean;
    status: "ADMITTED" | "REGISTERED" | "DISCHARGED";
}

// --- Clinical Module Data Models ---

export interface Appointment {
    id: string;
    patientId: string;
    doctorId: string;
    date: string;
    time: string;
    status: "SCHEDULED" | "COMPLETED" | "CANCELLED";
    type?: string;
    notes?: string;
}

export interface Diagnosis {
    id: string;
    patientId: string;
    doctorId: string;
    description: string;
    prescription: string;
    date: any;
    icdCode?: string;
    followUpDate?: string;
    vitals?: Vitals;
}

export interface Vitals {
    bloodPressure?: string;
    heartRate?: number;
    temperature?: number;
    oxygenSaturation?: number;
    weight?: number;
    height?: number;
    recordedAt?: any;
    recordedBy?: string;
}

export interface LabOrder {
    id: string;
    patientId: string;
    patientName?: string;
    doctorId: string;
    tests: string[];
    priority: "ROUTINE" | "URGENT" | "STAT";
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    orderedAt: any;
    completedAt?: any;
    results?: LabResult[];
    notes?: string;
}

export interface LabResult {
    testName: string;
    value: string;
    unit: string;
    referenceRange: string;
    flag?: "NORMAL" | "HIGH" | "LOW" | "CRITICAL";
}

export interface RadiologyOrder {
    id: string;
    patientId: string;
    patientName?: string;
    doctorId: string;
    modality: "X-RAY" | "CT" | "MRI" | "ULTRASOUND" | "PET" | "MAMMOGRAPHY";
    bodyPart: string;
    priority: "ROUTINE" | "URGENT" | "STAT";
    status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    orderedAt: any;
    reportedAt?: any;
    findings?: string;
    impression?: string;
    radiologistId?: string;
}

export interface PhysiotherapySession {
    id: string;
    patientId: string;
    patientName?: string;
    therapistId: string;
    treatmentPlan: string;
    sessionDate: any;
    duration: number;
    exercises: string[];
    progress: "IMPROVING" | "STABLE" | "DECLINING";
    notes?: string;
    nextSession?: any;
}

export interface DentalRecord {
    id: string;
    patientId: string;
    patientName?: string;
    dentistId: string;
    procedure: string;
    toothNumber?: string;
    findings: string;
    treatment: string;
    date: any;
    followUpDate?: any;
    xrayRequired?: boolean;
    notes?: string;
}

export interface DietPlan {
    id: string;
    patientId: string;
    patientName?: string;
    dietitianId: string;
    diagnosis?: string;
    calorieTarget: number;
    restrictions: string[];
    mealPlan: MealPlan;
    startDate: any;
    endDate?: any;
    notes?: string;
}

export interface MealPlan {
    breakfast: string[];
    lunch: string[];
    dinner: string[];
    snacks?: string[];
}

export interface EmergencyCase {
    id: string;
    patientId?: string;
    patientName: string;
    age?: number;
    gender?: string;
    chiefComplaint: string;
    triageLevel: "IMMEDIATE" | "URGENT" | "LESS_URGENT" | "NON_URGENT";
    status: "WAITING" | "IN_TREATMENT" | "ADMITTED" | "DISCHARGED" | "TRANSFERRED";
    arrivalTime: any;
    assignedDoctorId?: string;
    assignedNurseId?: string;
    vitals?: Vitals;
    notes?: string;
    disposition?: string;
}

export interface HomeCareVisit {
    id: string;
    patientId: string;
    patientName?: string;
    caregiverId: string;
    visitDate: any;
    duration: number;
    services: string[];
    vitals?: Vitals;
    status: "SCHEDULED" | "COMPLETED" | "CANCELLED" | "MISSED";
    notes?: string;
    nextVisit?: any;
}

export interface WellnessProgram {
    id: string;
    name: string;
    description: string;
    category: "FITNESS" | "NUTRITION" | "MENTAL_HEALTH" | "CHRONIC_DISEASE" | "PREVENTIVE";
    enrolledCount: number;
    startDate: any;
    endDate?: any;
    facilitatorId?: string;
    status: "ACTIVE" | "COMPLETED" | "CANCELLED";
}

export interface OTSchedule {
    id: string;
    patientId: string;
    patientName?: string;
    surgeonId: string;
    procedure: string;
    scheduledAt: any;
    duration: number;
    otNumber: string;
    status: "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "POSTPONED";
    anesthesiaType?: string;
    notes?: string;
}

export interface CPOEOrder {
    id: string;
    patientId: string;
    doctorId: string;
    orderType: "MEDICATION" | "LAB" | "RADIOLOGY" | "NURSING" | "DIET" | "PHYSIOTHERAPY";
    details: string;
    priority: "ROUTINE" | "URGENT" | "STAT";
    status: "PENDING" | "ACKNOWLEDGED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
    orderedAt: any;
    notes?: string;
}

export interface BloodBankRecord {
    id: string;
    bloodGroup: "A+" | "A-" | "B+" | "B-" | "AB+" | "AB-" | "O+" | "O-";
    units: number;
    donorId?: string;
    expiryDate: any;
    status: "AVAILABLE" | "RESERVED" | "USED" | "EXPIRED";
    notes?: string;
}

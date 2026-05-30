// ── Database switch ────────────────────────────────────────────────────────────
// true  → Firebase Firestore (remote cloud DB)
// false → PostgreSQL (local DB via API routes)
export const ISDBREMOTE = false;

// ── Roles ─────────────────────────────────────────────────────────────────────
export const ROLES = [
    "ADMIN",
    "DOCTOR",
    "NURSE",
    "RECEPTIONIST",
    "PHARMACY",
    "LAB_TECH",
    "RADIOLOGY_TECH",
    "PHYSIOTHERAPIST",
    "DENTIST",
    "DIETITIAN",
    "EMERGENCY_STAFF",
    "CASHIER",
    "PATIENT",
] as const;

export type Role = typeof ROLES[number];

// ── Payment methods ────────────────────────────────────────────────────────────
export const PAYMENT_METHODS = [
    { value: "CASH",          label: "Cash" },
    { value: "MOBILE_MONEY",  label: "Mobile Money" },
    { value: "BANK_TRANSFER", label: "Bank Transfer" },
    { value: "INSURANCE",     label: "Insurance" },
] as const;

export type PaymentMethod = typeof PAYMENT_METHODS[number]["value"];

// ── Transaction categories ─────────────────────────────────────────────────────
export const INCOME_CATEGORIES = [
    "Consultation Fees",
    "Service Bills",
    "Laboratory",
    "Radiology",
    "Pharmacy",
    "Physiotherapy",
    "Dental",
    "Dietary",
    "Emergency",
    "IPD / Admission",
    "Other Income",
] as const;

export const EXPENSE_CATEGORIES = [
    "Staff Salaries",
    "Medical Supplies",
    "Drugs & Pharmaceuticals",
    "Utilities",
    "Equipment & Maintenance",
    "Rent & Facilities",
    "Transport & Logistics",
    "Administrative",
    "Other Expense",
] as const;

// ── Wards & beds ───────────────────────────────────────────────────────────────
export const WARDS = [
    "General",
    "Surgical",
    "Medical",
    "Maternity",
    "Pediatrics",
    "ICU",
    "Emergency",
    "Orthopedics",
    "Oncology",
    "Cardiology",
] as const;

export type Ward = typeof WARDS[number];

export const BED_COUNTS: Record<Ward, number> = {
    General:     20,
    Surgical:    16,
    Medical:     18,
    Maternity:   12,
    Pediatrics:  14,
    ICU:          8,
    Emergency:   10,
    Orthopedics: 12,
    Oncology:    10,
    Cardiology:  10,
};

// ── CPOE order types ───────────────────────────────────────────────────────────
export const ORDER_TYPES = [
    "MEDICATION",
    "LAB",
    "RADIOLOGY",
    "NURSING",
    "DIET",
    "PROCEDURE",
] as const;

export type OrderType = typeof ORDER_TYPES[number];

export const ORDER_TYPE_LABELS: Record<OrderType, string> = {
    MEDICATION: "Medication",
    LAB:        "Laboratory",
    RADIOLOGY:  "Radiology",
    NURSING:    "Nursing",
    DIET:       "Dietary",
    PROCEDURE:  "Procedure",
};

// ── Pharmacy ───────────────────────────────────────────────────────────────────
export const DRUG_CATEGORIES = [
    "Analgesics",
    "Antibiotics",
    "Antifungals",
    "Antivirals",
    "Antiparasitics",
    "Cardiovascular",
    "Diabetes & Endocrine",
    "Gastrointestinal",
    "Respiratory",
    "Vitamins & Supplements",
    "IV Fluids",
    "Surgical Supplies",
    "Other",
] as const;

export const DRUG_UNITS = [
    "tablets",
    "capsules",
    "ml",
    "mg",
    "vials",
    "ampoules",
    "sachets",
    "bottles",
    "units",
] as const;

// ── Consultation types ─────────────────────────────────────────────────────────
export const CONSULTATION_TYPES = [
    "General Consultation",
    "Follow-up",
    "Specialist Consultation",
    "Emergency Consultation",
    "Dental Consultation",
    "Physiotherapy Session",
    "Dietary Consultation",
    "Radiology Review",
    "Laboratory Review",
] as const;

// ── Incident types ─────────────────────────────────────────────────────────────
export const INCIDENT_TYPES = [
    "Patient Fall",
    "Medication Error",
    "Equipment Failure",
    "Infection / Contamination",
    "Staff Injury",
    "Security Breach",
    "Fire / Safety",
    "Patient Complaint",
    "Other",
] as const;

export const SEVERITY_LEVELS = [
    { value: "LOW",      label: "Low",      cls: "bg-green-50 text-green-700 border-green-100" },
    { value: "MEDIUM",   label: "Medium",   cls: "bg-amber-50 text-amber-700 border-amber-100" },
    { value: "HIGH",     label: "High",     cls: "bg-orange-50 text-orange-700 border-orange-100" },
    { value: "CRITICAL", label: "Critical", cls: "bg-red-50 text-red-700 border-red-100" },
] as const;

// ── Asset categories ───────────────────────────────────────────────────────────
export const ASSET_CATEGORIES = [
    "Medical Equipment",
    "Furniture",
    "IT & Electronics",
    "Vehicles",
    "Laboratory Equipment",
    "Surgical Equipment",
    "Building & Infrastructure",
    "Other",
] as const;

// ── Currency ───────────────────────────────────────────────────────────────────
export const CURRENCY = "UGX";

export function fmt(amount: number): string {
    return `${CURRENCY} ${amount.toLocaleString("en-UG")}`;
}

// ── Receipt prefix ─────────────────────────────────────────────────────────────
export function generateReceiptNo(): string {
    return `RMC-${Date.now().toString().slice(-8)}`;
}

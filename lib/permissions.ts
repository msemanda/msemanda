export interface PermissionDef {
    key: string;
    label: string;
    description: string;
    category: string;
}

export const ALL_PERMISSIONS: PermissionDef[] = [
    // Clinical — Doctor
    { key: "emr",            label: "Electronic Medical Records", description: "View and write patient EMR",          category: "Clinical" },
    { key: "cpoe",           label: "CPOE / Clinical Orders",     description: "Order medications, labs, radiology",  category: "Clinical" },
    { key: "order_sets",     label: "Order Sets",                  description: "Apply evidence-based order bundles",  category: "Clinical" },
    { key: "diagnostics",    label: "Diagnostics",                 description: "View diagnostic history and results", category: "Clinical" },
    { key: "prescriptions",  label: "Prescriptions",               description: "Write and sign prescriptions",        category: "Clinical" },
    { key: "home_care",      label: "Home Care",                   description: "Manage home care visit orders",       category: "Clinical" },
    { key: "wellness",       label: "Wellness Programs",           description: "Manage patient wellness programs",    category: "Clinical" },

    // Appointments & Scheduling
    { key: "appointments",   label: "Appointments",                description: "View and manage appointments",        category: "Scheduling" },
    { key: "ot",             label: "Operating Theater",           description: "View and manage OT schedules",        category: "Scheduling" },

    // Nursing
    { key: "vitals",         label: "Vitals Recording",            description: "Record and view patient vitals",      category: "Nursing" },
    { key: "nursing_orders", label: "Nursing Orders",              description: "Execute and acknowledge nursing orders", category: "Nursing" },
    { key: "ward_patients",  label: "Ward Patients",               description: "View and manage ward patient list",   category: "Nursing" },

    // Lab & Radiology
    { key: "lab_orders",     label: "Lab Orders",                  description: "View and process lab orders",         category: "Ancillary" },
    { key: "radiology_orders", label: "Radiology Orders",          description: "View and report radiology orders",    category: "Ancillary" },
    { key: "blood_bank",     label: "Blood Bank",                  description: "Manage blood bank inventory",         category: "Ancillary" },

    // Therapy & Specialty
    { key: "physiotherapy",  label: "Physiotherapy",               description: "Manage physiotherapy sessions",       category: "Specialty" },
    { key: "dental",         label: "Dental",                      description: "Manage dental records and procedures", category: "Specialty" },
    { key: "dietary",        label: "Dietary / Nutrition",         description: "Manage diet plans and meal plans",    category: "Specialty" },
    { key: "emergency",      label: "Emergency Triage",            description: "Access emergency triage board",       category: "Specialty" },

    // Pharmacy
    { key: "pharmacy",       label: "Pharmacy",                    description: "Dispense medications and manage stock", category: "Ancillary" },

    // Reception / Admin
    { key: "patient_admit",  label: "Patient Admission",           description: "Admit walk-in patients",              category: "Reception" },
    { key: "patient_invite", label: "Patient Invitations",         description: "Send patient registration invites",   category: "Reception" },
    { key: "book_appt",      label: "Book Appointments",           description: "Book doctor appointments for patients", category: "Reception" },
    { key: "billing",        label: "Consultation Fees",           description: "Collect and confirm consultation fees", category: "Reception" },

    // Finance / Cashier
    { key: "cashier_billing",      label: "Patient Billing",     description: "Generate and manage patient bills",       category: "Finance" },
    { key: "cashier_transactions", label: "Transactions",        description: "View and record financial transactions",  category: "Finance" },
    { key: "cashier_income",       label: "Income Recording",    description: "Record income entries",                   category: "Finance" },
    { key: "cashier_expenses",     label: "Expense Recording",   description: "Record expense entries",                  category: "Finance" },
    { key: "fee_schedule",         label: "Fee Schedule",        description: "Manage consultation fee schedule pricing", category: "Finance" },
    { key: "cashier_reports",      label: "Financial Reports",   description: "View financial reports and analytics",    category: "Finance" },

    // Security
    { key: "security_shifts", label: "Duty Roster",       description: "Manage guard shift schedule and post assignments", category: "Security" },
    { key: "visitor_log",     label: "Visitor Log",       description: "Check visitors in and out of the premises",        category: "Security" },

    // Optical
    { key: "optical_exams",         label: "Eye Exams",             description: "Record vision tests and diagnoses",         category: "Optical" },
    { key: "optical_prescriptions", label: "Optical Prescriptions", description: "Write glasses / contact lens prescriptions", category: "Optical" },
    { key: "optical_dispensing",    label: "Dispensing / Orders",   description: "Track frame & lens orders and pickups",      category: "Optical" },
];

export const PERMISSION_CATEGORIES = [
    "Clinical", "Scheduling", "Nursing", "Ancillary", "Specialty", "Reception", "Finance", "Security", "Optical",
];

// Default module access granted per role on account creation. ADMIN gets
// everything; CLEANER has no permission-gated features of its own — the
// Housekeeping module is gated by role check, not a permission key.
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
    ADMIN:               ALL_PERMISSIONS.map(p => p.key),
    DOCTOR:              ["emr", "cpoe", "order_sets", "diagnostics", "prescriptions", "appointments", "ot", "home_care", "wellness"],
    NURSE:               ["emr", "vitals", "nursing_orders", "ward_patients", "home_care"],
    PHARMACY:            ["pharmacy"],
    LAB_TECH:            ["lab_orders", "blood_bank"],
    RADIOLOGY_TECH:      ["radiology_orders"],
    PHYSIOTHERAPIST:     ["physiotherapy", "appointments"],
    DENTIST:             ["dental", "prescriptions", "appointments"],
    DIETITIAN:           ["dietary"],
    EMERGENCY_STAFF:     ["emergency", "vitals", "ward_patients"],
    RECEPTIONIST:        ["patient_admit", "patient_invite", "book_appt", "billing", "appointments"],
    CASHIER:             ["cashier_billing", "cashier_transactions", "cashier_income", "cashier_expenses", "fee_schedule", "cashier_reports"],
    CLEANER:             [],
    SECURITY:            ["security_shifts", "visitor_log"],
    OPTICIAN:            ["optical_exams", "optical_prescriptions", "optical_dispensing"],
    OPTICIAN_ASSISTANT:  ["optical_dispensing"],
    PATIENT:             [],
};

export const SPECIALIZATIONS = [
    "General Practice",
    "Internal Medicine",
    "Pediatrics",
    "Obstetrics & Gynecology",
    "General Surgery",
    "Orthopedics",
    "Cardiology",
    "Neurology",
    "Dermatology",
    "Ophthalmology",
    "ENT (Ear, Nose & Throat)",
    "Psychiatry / Mental Health",
    "Oncology",
    "Urology",
    "Nephrology",
    "Endocrinology",
    "Pulmonology",
    "Gastroenterology",
    "Anesthesiology",
    "Emergency Medicine",
    "Radiology",
    "Pathology",
    "Dentistry",
    "Physiotherapy",
    "Dietetics / Nutrition",
    "Pharmacy",
    "Nursing",
    "Other / Specialist",
];

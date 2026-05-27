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
];

export const PERMISSION_CATEGORIES = [
    "Clinical", "Scheduling", "Nursing", "Ancillary", "Specialty", "Reception",
];

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

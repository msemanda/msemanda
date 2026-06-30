#!/usr/bin/env node
/**
 * Rhona Medical Center – User Manual Generator
 *
 * Usage:
 *   node generate-manual.mjs                        # content only (no screenshots)
 *   node generate-manual.mjs --password <firebase>  # full screenshots + PDF
 *
 * Output: Rhona_Medical_Center_User_Manual.pdf
 */

import puppeteer from "puppeteer";
import { spawn } from "child_process";
import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import http from "http";
import readline from "readline";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ADMIN_EMAIL = "semandamoses91@gmail.com";
const BASE_URL = "http://localhost:3000";
const OUTPUT_FILE = path.join(__dirname, "Rhona_Medical_Center_User_Manual.pdf");

// ─── Module Definitions ───────────────────────────────────────────────────────

const MODULES = [
  {
    chapter: 1,
    id: "admin",
    title: "Administration Console",
    subtitle: "System-wide management and oversight",
    color: "#4f46e5",
    lightColor: "#eef2ff",
    roles: ["ADMIN"],
    path: "/admin",
    description:
      "The Administration Console is the central command center of the Rhona Medical Center Hospital Management System. It gives system administrators complete visibility and control over every department, user account, clinical module, and financial record in the hospital. From a single dashboard, administrators can monitor live KPIs, manage staff accounts, configure system settings, and generate executive-level analytics reports.",
    features: [
      "Real-time KPI dashboard showing total patients, verified doctors, appointments, and revenue",
      "User account management — create, edit, and assign roles to all 13 user types",
      "Staff invitation system with secure onboarding links for new employees",
      "Patient flow scheduling and manual validation workflow",
      "Central inventory management across all departments",
      "Full MIS analytics dashboard with hospital-wide performance trends",
      "Audit trail with detailed access logs and session tracking",
      "System configuration panel for hospital-level settings",
      "Billing and revenue management with statement generation",
    ],
    pages: [
      { route: "/admin/dashboard",        title: "Dashboard",            description: "Live KPI cards, recent activity feed, and system health metrics" },
      { route: "/admin/users",             title: "User Registry",        description: "Full list of all staff accounts with role management" },
      { route: "/admin/invite-doctors",    title: "Invite Staff",         description: "Generate and send secure registration invitations to new employees" },
      { route: "/admin/schedule-patients", title: "Patient Flow",         description: "View and manage patient scheduling across the facility" },
      { route: "/admin/validate-patient",  title: "Patient Validation",   description: "Review and approve patient registrations" },
      { route: "/admin/inventory",         title: "Central Inventory",    description: "Hospital-wide inventory view across all departments" },
      { route: "/admin/analytics",         title: "MIS Analytics",        description: "Multi-dimensional reports, charts, and business intelligence" },
      { route: "/admin/sessions",          title: "Access Logs",          description: "Audit trail of all user logins, actions, and session history" },
      { route: "/admin/config",            title: "System Configuration", description: "Hospital settings, module toggles, and system parameters" },
      { route: "/admin/generate-bill",     title: "Billing & Revenue",    description: "Generate bills, view statements, and manage revenue" },
      { route: "/admin/register",          title: "User Registration",    description: "Manual staff account creation form" },
    ],
    screenshots: ["/admin/dashboard", "/admin/users", "/admin/analytics"],
  },
  {
    chapter: 2,
    id: "doctor",
    title: "Physician Workspace",
    subtitle: "Clinical documentation and patient care",
    color: "#2563eb",
    lightColor: "#eff6ff",
    roles: ["DOCTOR", "ADMIN"],
    path: "/doctor",
    description:
      "The Physician Workspace is a comprehensive clinical platform built for doctors and consultants. It centralizes patient management, electronic medical records, diagnostic history, and order entry into a single, intuitive interface. Physicians can review patient history, write clinical orders (medications, labs, radiology, nursing, dietary, procedures), document diagnoses, and manage their appointment schedules — all in real time.",
    features: [
      "Patient list with quick access to records and appointment history",
      "Full Electronic Medical Record (EMR) viewer and editor",
      "Diagnostic history viewer — lab results, radiology reports, and prior diagnoses",
      "CPOE (Computerized Physician Order Entry) for medications, labs, imaging, nursing, diet, and procedures",
      "Evidence-based clinical order sets for common diagnoses",
      "Appointment scheduler with calendar and patient lookup",
      "Dynamic diagnosis entry with ICD-compatible coding",
      "Vitals review with trend graphs",
    ],
    pages: [
      { route: "/doctor/dashboard",    title: "Dashboard",       description: "Today's patient list, appointment summary, and pending orders" },
      { route: "/doctor/patients",     title: "My Patients",     description: "Full patient roster with search and quick-access to records" },
      { route: "/doctor/emr",          title: "EMR",             description: "Electronic Medical Records — view and document clinical notes" },
      { route: "/doctor/diagnose/:id", title: "Diagnosis Entry", description: "Per-patient diagnosis form with problem list and follow-up dates" },
      { route: "/doctor/order-sets",   title: "Order Sets",      description: "Pre-configured clinical order bundles for common conditions" },
      { route: "/doctor/appointments", title: "Appointments",    description: "Appointment calendar — view, book, and manage slots" },
    ],
    screenshots: ["/doctor/dashboard", "/doctor/emr", "/doctor/appointments"],
  },
  {
    chapter: 3,
    id: "nurse",
    title: "Nursing Workspace",
    subtitle: "Ward operations and patient monitoring",
    color: "#0d9488",
    lightColor: "#f0fdfa",
    roles: ["NURSE", "ADMIN"],
    path: "/nurse",
    description:
      "The Nursing Workspace supports ward nurses with tools for tracking patients, recording vitals, executing clinical orders, managing the operating theater schedule, and documenting shift handovers. It is designed for fast, on-the-go data entry during busy ward rounds, with clear priority indicators and a clean interface that works on both desktop and tablet.",
    features: [
      "Shift overview dashboard showing patient count, pending orders, and handover status",
      "Ward patient list with bed assignments and admission details",
      "Vital signs recording — BP, HR, temperature, O₂ saturation, weight, height",
      "Nursing orders queue — view, execute, and acknowledge doctor orders",
      "Operating theater schedule with procedure times and patient details",
      "Shift schedule management for nursing staff",
      "Structured shift handover documentation with patient summaries",
    ],
    pages: [
      { route: "/nurse/dashboard", title: "Dashboard",    description: "Shift summary, pending tasks, and ward overview" },
      { route: "/nurse/patients",  title: "Ward Patients", description: "Patient list with bed assignments and care status" },
      { route: "/nurse/vitals",    title: "Vitals",        description: "Record and view patient vital signs" },
      { route: "/nurse/orders",    title: "Nursing Orders", description: "Execute and acknowledge clinical orders from doctors" },
      { route: "/nurse/ot",        title: "OT Schedule",   description: "Operating theater schedule and procedure tracking" },
      { route: "/nurse/shift",     title: "Shift Schedule", description: "Staff shift roster and scheduling" },
      { route: "/nurse/handover",  title: "Handover",      description: "Structured shift handover documentation" },
    ],
    screenshots: ["/nurse/dashboard", "/nurse/vitals", "/nurse/orders"],
  },
  {
    chapter: 4,
    id: "receptionist",
    title: "Reception & Front Desk",
    subtitle: "Patient registration, scheduling, and billing",
    color: "#0284c7",
    lightColor: "#f0f9ff",
    roles: ["RECEPTIONIST", "ADMIN"],
    path: "/receptionist",
    description:
      "The Reception module is the first point of contact for patients at Rhona Medical Center. Receptionists use it to admit patients, search records, book doctor appointments, manage the daily queue, and collect consultation fees. It integrates with the doctor's appointment calendar so that bookings are visible in real time across both modules.",
    features: [
      "Walk-in patient admission with complete registration form",
      "Patient search by name, ID, or contact details",
      "Send secure registration invitations to new patients by email or SMS",
      "Book appointments from the live doctor availability calendar",
      "Today's queue management — check-in, re-order, and close visits",
      "Appointment schedule calendar view",
      "Consultation fee collection and payment recording",
    ],
    pages: [
      { route: "/receptionist/dashboard", title: "Dashboard",          description: "Daily overview — appointments, check-ins, and queue status" },
      { route: "/receptionist/admit",     title: "Admit Patient",      description: "Walk-in patient registration and admission form" },
      { route: "/receptionist/patients",  title: "Patient Search",     description: "Search and access existing patient records" },
      { route: "/receptionist/book",      title: "Book Appointment",   description: "Doctor availability picker and appointment booking form" },
      { route: "/receptionist/queue",     title: "Today's Queue",      description: "Live queue with check-in status and wait times" },
      { route: "/receptionist/schedule",  title: "Schedule",           description: "Weekly/monthly appointment calendar" },
      { route: "/receptionist/payments",  title: "Consultation Fees",  description: "Collect and record consultation payment" },
    ],
    screenshots: ["/receptionist/dashboard", "/receptionist/book", "/receptionist/queue"],
  },
  {
    chapter: 5,
    id: "pharmacy",
    title: "Pharmacy",
    subtitle: "Drug inventory, dispensing, and prescription management",
    color: "#16a34a",
    lightColor: "#f0fdf4",
    roles: ["PHARMACY", "ADMIN"],
    path: "/pharmacy",
    description:
      "The Pharmacy module provides end-to-end management of the hospital's drug supply chain — from inventory tracking to prescription fulfilment and dispensing records. Pharmacists can monitor stock levels across 13 drug categories, receive automated low-stock alerts, review prescription queues from doctors, and record every dispensing transaction for traceability.",
    features: [
      "Drug inventory management across 13 categories (Analgesics, Antibiotics, Antivirals, etc.)",
      "Stock level monitoring with automated low-stock alerts",
      "Prescription queue — receive, verify, and dispense doctor prescriptions",
      "Dispensing record with patient and medication details",
      "Drug units: tablets, capsules, ml, mg, vials, ampoules, sachets, bottles",
      "Dashboard with stock value, fast-moving drugs, and expiry alerts",
      "Diagnostic-specific prescription viewer linked to lab/radiology results",
    ],
    pages: [
      { route: "/pharmacy/dashboard",     title: "Dashboard",           description: "Inventory overview, KPIs, and dispensing summary" },
      { route: "/pharmacy/inventory",     title: "Drug Inventory",      description: "Full drug register with stock levels, categories, and reorder levels" },
      { route: "/pharmacy/prescriptions", title: "Prescription Queue",  description: "Pending prescriptions from doctors awaiting dispensing" },
      { route: "/pharmacy/dispense",      title: "Record Dispensing",   description: "Log a completed medication dispensing transaction" },
      { route: "/pharmacy/stock-alerts",  title: "Low Stock Alerts",    description: "Drugs below reorder level — take action to restock" },
    ],
    screenshots: ["/pharmacy/dashboard", "/pharmacy/inventory", "/pharmacy/prescriptions"],
  },
  {
    chapter: 6,
    id: "lab",
    title: "Laboratory",
    subtitle: "Test orders, results, and blood bank",
    color: "#059669",
    lightColor: "#ecfdf5",
    roles: ["LAB_TECH", "ADMIN"],
    path: "/lab",
    description:
      "The Laboratory module manages the full lifecycle of diagnostic test orders — from receiving a doctor's request, processing the sample, entering results, to generating a final report. It also includes a dedicated Blood Bank section for managing blood inventory, donations, and patient blood requests across all blood groups.",
    features: [
      "Test order queue with priority levels: Routine, Urgent, and STAT",
      "Result data entry with reference ranges and automated flagging (H/L/Critical)",
      "Report generation with patient and doctor details",
      "Blood bank inventory tracking for all blood groups (A+, A−, B+, B−, AB+, AB−, O+, O−)",
      "Blood status management: Available, Reserved, Used, Expired",
      "Blood request workflow linked to patient admission records",
      "Analytics and lab performance reporting",
    ],
    pages: [
      { route: "/lab/dashboard",       title: "Dashboard",      description: "Lab workload, pending orders, and result turnaround overview" },
      { route: "/lab/orders",          title: "Test Orders",     description: "Incoming test requests with priority, status, and patient details" },
      { route: "/lab/results",         title: "Results Entry",   description: "Enter and validate test results with reference ranges" },
      { route: "/lab/reports",         title: "Reports",         description: "Finalized lab reports and analytics" },
      { route: "/lab/blood-bank",      title: "Blood Inventory", description: "Blood unit stock management by group and status" },
      { route: "/lab/blood-requests",  title: "Blood Requests",  description: "Patient blood request tracking and fulfilment" },
    ],
    screenshots: ["/lab/dashboard", "/lab/orders", "/lab/blood-bank"],
  },
  {
    chapter: 7,
    id: "radiology",
    title: "Radiology & Imaging",
    subtitle: "Imaging orders, worklist, and reports",
    color: "#7c3aed",
    lightColor: "#f5f3ff",
    roles: ["RADIOLOGY_TECH", "ADMIN"],
    path: "/radiology",
    description:
      "The Radiology module handles all medical imaging workflows at Rhona Medical Center. It supports six imaging modalities — X-Ray, CT, MRI, Ultrasound, PET, and Mammography — and provides radiographers with a structured worklist, order management system, reporting tools, and statistical analysis of imaging volumes by modality and department.",
    features: [
      "Imaging order queue with modality, urgency, and referring doctor details",
      "Daily worklist with scheduling and patient arrival tracking",
      "Radiology report editor with findings, impressions, and recommendations",
      "Six modalities supported: X-RAY, CT, MRI, ULTRASOUND, PET, MAMMOGRAPHY",
      "Report status tracking: Pending, In Progress, Reported, Verified",
      "Modality utilization statistics and volume analytics",
      "Integration with doctor orders via the CPOE module",
    ],
    pages: [
      { route: "/radiology/dashboard", title: "Dashboard",       description: "Imaging volume overview, pending studies, and equipment status" },
      { route: "/radiology/orders",    title: "Imaging Orders",  description: "Incoming imaging requests by modality and priority" },
      { route: "/radiology/worklist",  title: "Worklist",        description: "Today's scheduled imaging procedures and patient arrivals" },
      { route: "/radiology/reports",   title: "Reports",         description: "Radiology report writing and finalized report viewer" },
      { route: "/radiology/stats",     title: "Statistics",      description: "Modality utilization charts and departmental analytics" },
    ],
    screenshots: ["/radiology/dashboard", "/radiology/orders", "/radiology/reports"],
  },
  {
    chapter: 8,
    id: "physiotherapy",
    title: "Physiotherapy",
    subtitle: "Therapy sessions, treatment plans, and progress tracking",
    color: "#ea580c",
    lightColor: "#fff7ed",
    roles: ["PHYSIOTHERAPIST", "ADMIN"],
    path: "/physiotherapy",
    description:
      "The Physiotherapy module supports the full rehabilitation journey — from initial patient assessment, through treatment plan creation and session scheduling, to outcome measurement. Physiotherapists can manage their patient caseload, document sessions, create individualized treatment plans, and track patient progress over time using objective outcome measures.",
    features: [
      "Patient caseload overview with current treatment status",
      "Session scheduling with duration, type, and therapist assignment",
      "Treatment plan creation with goals, interventions, and review dates",
      "Progress tracking with IMPROVING / STABLE / DECLINING status indicators",
      "Session documentation with exercises, observations, and patient response",
      "Outcome measurement and functional assessment recording",
    ],
    pages: [
      { route: "/physiotherapy/dashboard", title: "Dashboard",        description: "Caseload summary, today's sessions, and outcome overview" },
      { route: "/physiotherapy/patients",  title: "My Patients",      description: "Patient list with referral source and treatment stage" },
      { route: "/physiotherapy/sessions",  title: "Sessions",         description: "Session schedule and documentation" },
      { route: "/physiotherapy/plans",     title: "Treatment Plans",  description: "Create and manage individualized rehabilitation plans" },
      { route: "/physiotherapy/progress",  title: "Progress Tracking", description: "Patient outcome trends and functional improvement charts" },
    ],
    screenshots: ["/physiotherapy/dashboard", "/physiotherapy/plans", "/physiotherapy/progress"],
  },
  {
    chapter: 9,
    id: "dental",
    title: "Dental Clinic",
    subtitle: "Dental records, charting, and appointments",
    color: "#e11d48",
    lightColor: "#fff1f2",
    roles: ["DENTIST", "ADMIN"],
    path: "/dental",
    description:
      "The Dental module provides dentists with a complete suite of tools for managing their patients, scheduling dental appointments, maintaining digital dental charts, and managing X-ray images. The graphical dental chart uses standard tooth numbering (FDI system) and allows dentists to document procedures, conditions, and treatment history tooth-by-tooth.",
    features: [
      "Patient list with dental history and last visit information",
      "Appointment scheduler with procedure type and duration",
      "Graphical dental chart with FDI tooth numbering",
      "Per-tooth procedure and condition documentation",
      "X-ray image management and viewer",
      "Treatment history and clinical notes",
    ],
    pages: [
      { route: "/dental/dashboard",    title: "Dashboard",     description: "Daily appointment summary and patient statistics" },
      { route: "/dental/patients",     title: "Patients",      description: "Dental patient registry and records" },
      { route: "/dental/appointments", title: "Appointments",  description: "Dental appointment booking and calendar" },
      { route: "/dental/chart",        title: "Dental Chart",  description: "Interactive graphical dental charting tool" },
      { route: "/dental/xrays",        title: "X-Rays",        description: "Dental X-ray uploads and viewer" },
    ],
    screenshots: ["/dental/dashboard", "/dental/chart", "/dental/appointments"],
  },
  {
    chapter: 10,
    id: "dietary",
    title: "Dietary & Nutrition",
    subtitle: "Diet plans, meal menus, and nutritional assessments",
    color: "#65a30d",
    lightColor: "#f7fee7",
    roles: ["DIETITIAN", "ADMIN"],
    path: "/dietary",
    description:
      "The Dietary module empowers dietitians to manage patient nutritional care from assessment through meal planning. It supports the creation of individualized diet plans with calorie targets and dietary restrictions, food menu management, and structured nutritional assessments. It integrates with the patient record system to ensure diet orders align with clinical findings and physician orders.",
    features: [
      "Individualized diet plan creation with calorie targets and restrictions",
      "Food menu management for hospital catering",
      "Nutritional assessment documentation and scoring",
      "Patient list with dietary diagnoses and plan status",
      "Diet order integration with CPOE",
      "Restriction tracking: diabetic, low-sodium, vegetarian, allergy-specific, etc.",
    ],
    pages: [
      { route: "/dietary/dashboard",    title: "Dashboard",    description: "Nutritional care overview and daily diet order summary" },
      { route: "/dietary/patients",     title: "Patients",     description: "Patient list with current diet plans and assessments" },
      { route: "/dietary/plans",        title: "Diet Plans",   description: "Create and manage individualized nutrition plans" },
      { route: "/dietary/menu",         title: "Food Menu",    description: "Hospital meal menu builder and scheduling" },
      { route: "/dietary/assessments",  title: "Assessments",  description: "Nutritional screening and assessment records" },
    ],
    screenshots: ["/dietary/dashboard", "/dietary/plans", "/dietary/assessments"],
  },
  {
    chapter: 11,
    id: "emergency",
    title: "Emergency Department",
    subtitle: "Triage, patient tracking, and ambulance management",
    color: "#dc2626",
    lightColor: "#fef2f2",
    roles: ["EMERGENCY_STAFF", "ADMIN"],
    path: "/emergency",
    description:
      "The Emergency Department module gives emergency staff real-time visibility into the ED's patient flow. It supports structured triage using the four-level Manchester Triage System, patient tracking through the ED journey, ambulance dispatch management, and a critical incident log. The triage board provides instant colour-coded prioritisation so staff can respond to the most critical cases first.",
    features: [
      "Triage board with colour-coded acuity levels: IMMEDIATE (red), URGENT (orange), LESS URGENT (yellow), NON-URGENT (green)",
      "Live ED patient tracker — arrival, triage, assessment, treatment, discharge",
      "Ambulance dispatch and return-to-base management",
      "Critical incident log for documentation and handover",
      "ED patient census with waiting times",
      "Integration with IPD for admission of stabilised ED patients",
    ],
    pages: [
      { route: "/emergency/dashboard",  title: "Dashboard",      description: "ED census, acuity breakdown, and wait time metrics" },
      { route: "/emergency/triage",     title: "Triage Board",   description: "Colour-coded live patient triage and priority board" },
      { route: "/emergency/patients",   title: "ED Patients",    description: "Full ED patient tracker with status and location" },
      { route: "/emergency/ambulance",  title: "Ambulance",      description: "Ambulance dispatch management and GPS tracking" },
      { route: "/emergency/log",        title: "Incident Log",   description: "ED incident documentation and handover notes" },
    ],
    screenshots: ["/emergency/dashboard", "/emergency/triage", "/emergency/patients"],
  },
  {
    chapter: 12,
    id: "ipd",
    title: "Inpatient Department (IPD)",
    subtitle: "Admissions, bed management, transfers, and discharge",
    color: "#1d4ed8",
    lightColor: "#eff6ff",
    roles: ["DOCTOR", "NURSE", "RECEPTIONIST", "ADMIN"],
    path: "/ipd",
    description:
      "The Inpatient Department module manages the complete inpatient journey from admission through discharge. It provides real-time bed availability across 10 wards (130 total beds), structured admission workflows, patient transfer tracking, discharge documentation, and inpatient order management. Multiple roles — doctors, nurses, and receptionists — use this module collaboratively.",
    features: [
      "Patient admission workflow with ward and bed assignment",
      "Real-time bed availability dashboard across 10 wards (General, Surgical, Medical, Maternity, Pediatrics, ICU, Emergency, Orthopedics, Oncology, Cardiology)",
      "130 total beds with live occupancy status (Available, Occupied, Maintenance)",
      "Inter-ward patient transfer documentation",
      "Structured discharge process with discharge summary",
      "Inpatient clinical order management",
      "Admission census and occupancy analytics",
    ],
    pages: [
      { route: "/ipd/dashboard",   title: "Dashboard",         description: "Bed occupancy, admission census, and ward overview" },
      { route: "/ipd/admissions",  title: "Admissions",        description: "Active admissions list and new admission workflow" },
      { route: "/ipd/beds",        title: "Bed Management",    description: "Real-time bed availability map across all wards" },
      { route: "/ipd/transfer",    title: "Patient Transfer",  description: "Inter-ward transfer request and documentation" },
      { route: "/ipd/discharge",   title: "Discharge",         description: "Discharge process with summary and follow-up instructions" },
      { route: "/ipd/orders",      title: "Inpatient Orders",  description: "Clinical orders for admitted patients" },
    ],
    screenshots: ["/ipd/dashboard", "/ipd/beds", "/ipd/admissions"],
  },
  {
    chapter: 13,
    id: "cashier",
    title: "Cashier & Finance",
    subtitle: "Billing, payments, income, expenses, and financial reports",
    color: "#4338ca",
    lightColor: "#eef2ff",
    roles: ["CASHIER", "ADMIN"],
    path: "/cashier",
    description:
      "The Cashier module is the hospital's financial management hub. It handles consultation fee collection, service billing, income and expense recording, and comprehensive financial reporting. It supports multiple payment methods (Cash, Mobile Money, Bank Transfer, Insurance) and maintains a full transaction ledger in Uganda Shillings (UGX) for accounting purposes.",
    features: [
      "Consultation fee collection with automatic fee schedule lookup",
      "Service bill generation and tracking",
      "Income recording across 11 revenue categories",
      "Expense recording across 9 expense categories",
      "Full transaction ledger with search and filtering",
      "Payment methods: Cash, Mobile Money, Bank Transfer, Insurance",
      "Fee schedule configuration and management",
      "Financial reports — daily, weekly, monthly statements",
      "Currency: Uganda Shillings (UGX)",
    ],
    pages: [
      { route: "/cashier/dashboard",    title: "Dashboard",          description: "Financial KPIs — daily revenue, collections, and expense summary" },
      { route: "/cashier/fees",         title: "Consultation Fees",  description: "Collect and record patient consultation payments" },
      { route: "/cashier/bills",        title: "Service Bills",      description: "View and manage service billing for patients" },
      { route: "/cashier/income",       title: "Record Income",      description: "Log income transactions across revenue categories" },
      { route: "/cashier/expenses",     title: "Record Expense",     description: "Log expense transactions by category" },
      { route: "/cashier/transactions", title: "Transactions",       description: "Complete transaction ledger with reconciliation tools" },
      { route: "/cashier/fee-schedule", title: "Fee Schedule",       description: "Configure service fees and consultation charges" },
      { route: "/cashier/reports",      title: "Financial Reports",  description: "Period-based financial statements and analysis" },
    ],
    screenshots: ["/cashier/dashboard", "/cashier/transactions", "/cashier/reports"],
  },
  {
    chapter: 14,
    id: "homecare",
    title: "Home Care",
    subtitle: "Domiciliary care visits, scheduling, and route management",
    color: "#0f766e",
    lightColor: "#f0fdfa",
    roles: ["NURSE", "DOCTOR", "ADMIN"],
    path: "/homecare",
    description:
      "The Home Care module supports community health workers and nurses who provide domiciliary care to patients at their homes. It enables patient assignment, visit scheduling, route optimisation on a live map, structured visit documentation with vitals recording, and visit report generation. It bridges the gap between hospital-based care and community health services.",
    features: [
      "Patient list with home addresses and care assignment",
      "Visit scheduling with date, time, and assigned nurse",
      "Route map with GPS coordinates for visit planning and optimisation",
      "Structured visit reports with vitals, observations, and interventions",
      "Visit status tracking: Scheduled, In Progress, Completed, Missed",
      "Integration with EMR for continuity of care documentation",
    ],
    pages: [
      { route: "/homecare/dashboard", title: "Dashboard",       description: "Visit count, completion rate, and carer overview" },
      { route: "/homecare/patients",  title: "Patients",        description: "Home care patient roster with address and care plan" },
      { route: "/homecare/visits",    title: "Visit Schedule",  description: "Planned visits calendar and scheduling form" },
      { route: "/homecare/reports",   title: "Visit Reports",   description: "Completed visit documentation and notes" },
      { route: "/homecare/map",       title: "Route Map",       description: "Geographic map of visit locations for route planning" },
    ],
    screenshots: ["/homecare/dashboard", "/homecare/visits", "/homecare/map"],
  },
  {
    chapter: 15,
    id: "wellness",
    title: "Wellness & Health Programs",
    subtitle: "Wellness programs, enrollments, and health tracking",
    color: "#059669",
    lightColor: "#ecfdf5",
    roles: ["ALL AUTHENTICATED USERS"],
    path: "/wellness",
    description:
      "The Wellness module provides preventive health and wellness program management for both staff and patients. It supports the creation and scheduling of wellness programs across five categories — Fitness, Nutrition, Mental Health, Chronic Disease Management, and Preventive Care — along with enrollment management, progress tracking, and nutrition logging.",
    features: [
      "Wellness program catalogue across 5 categories: Fitness, Nutrition, Mental Health, Chronic Disease, Preventive Care",
      "Enrollment management — register participants and track attendance",
      "Program schedule and session management",
      "Individual health progress tracking with trend charts",
      "Nutrition and dietary intake logging",
      "Accessible to all authenticated users in the hospital system",
    ],
    pages: [
      { route: "/wellness/dashboard",    title: "Dashboard",    description: "Active programs, enrollment counts, and wellness metrics" },
      { route: "/wellness/programs",     title: "Programs",     description: "Browse and manage wellness program catalogue" },
      { route: "/wellness/enrollments",  title: "Enrollments",  description: "Program enrollment tracking and participant list" },
      { route: "/wellness/schedule",     title: "Schedule",     description: "Upcoming sessions and program calendar" },
      { route: "/wellness/progress",     title: "Progress",     description: "Personal health progress charts and metrics" },
      { route: "/wellness/nutrition",    title: "Nutrition",    description: "Dietary intake logging and nutritional targets" },
    ],
    screenshots: ["/wellness/dashboard", "/wellness/programs"],
  },
  {
    chapter: 16,
    id: "quality",
    title: "Quality & Infection Control",
    subtitle: "Audits, infection incidents, and compliance reporting",
    color: "#be123c",
    lightColor: "#fff1f2",
    roles: ["ADMIN", "DOCTOR", "NURSE"],
    path: "/quality",
    description:
      "The Quality & Infection Control module supports the hospital's clinical governance framework. It enables quality auditors to schedule and document clinical audits, track infection incidents and outbreaks, and generate compliance reports against national and international healthcare standards. It provides leadership with the data needed to drive continuous improvement.",
    features: [
      "Quality audit scheduling, documentation, and scoring",
      "Infection incident reporting with type, location, and affected patients",
      "Compliance dashboard with pass/fail indicators by standard",
      "Corrective action tracking with responsible parties and deadlines",
      "Trend analysis for infection rates and audit scores",
      "Report export for accreditation and regulatory submission",
    ],
    pages: [
      { route: "/quality/dashboard",  title: "Dashboard",        description: "Quality scores, infection rates, and compliance overview" },
      { route: "/quality/audits",     title: "Audits",           description: "Clinical audit records and scheduling" },
      { route: "/quality/infections", title: "Infection Incidents", description: "Infection incident reports and outbreak tracking" },
      { route: "/quality/reports",    title: "Compliance Reports", description: "Regulatory compliance reports and audit summaries" },
    ],
    screenshots: ["/quality/dashboard", "/quality/audits"],
  },
  {
    chapter: 17,
    id: "incidents",
    title: "Incident Reporting",
    subtitle: "Hospital incident reporting, classification, and analysis",
    color: "#c2410c",
    lightColor: "#fff7ed",
    roles: ["ALL AUTHENTICATED USERS"],
    path: "/incidents",
    description:
      "The Incident Reporting module provides a structured, hospital-wide system for reporting, tracking, and analysing adverse events and near-misses. All authenticated users can report incidents. Incidents are classified by type (Patient Fall, Medication Error, Equipment Failure, etc.) and severity (Low, Medium, High, Critical), and trend analysis helps leadership identify systemic risks.",
    features: [
      "Any authenticated user can file an incident report",
      "9 incident types: Patient Fall, Medication Error, Equipment Failure, Infection/Contamination, Staff Injury, Security Breach, Fire/Safety, Patient Complaint, Other",
      "4 severity levels: Low, Medium, High, Critical",
      "Incident list with filtering, search, and status tracking",
      "Trend analysis dashboard with charts by type, severity, and time period",
      "Investigation documentation and resolution tracking",
    ],
    pages: [
      { route: "/incidents/dashboard", title: "Dashboard",       description: "Incident counts, severity breakdown, and trend overview" },
      { route: "/incidents/report",    title: "Report Incident", description: "Incident reporting form with type, severity, and description" },
      { route: "/incidents/list",      title: "All Incidents",   description: "Complete incident registry with search and status filters" },
      { route: "/incidents/analysis",  title: "Trend Analysis",  description: "Incident frequency trends and pattern analysis" },
    ],
    screenshots: ["/incidents/dashboard", "/incidents/report"],
  },
  {
    chapter: 18,
    id: "housekeeping",
    title: "Housekeeping",
    subtitle: "Cleaning task management and scheduling",
    color: "#78716c",
    lightColor: "#fafaf9",
    roles: ["ADMIN"],
    path: "/housekeeping",
    description:
      "The Housekeeping module enables administrators to manage all cleaning and sanitation tasks across the hospital facility. Tasks can be assigned to housekeeping staff with specific locations, schedules, and priority levels. A completed task history provides a full audit trail of facility maintenance activities.",
    features: [
      "Task creation with location, type, priority, and assignee",
      "Daily and weekly cleaning schedule management",
      "Task status tracking: Pending, In Progress, Completed",
      "Completed task history and audit trail",
      "Staff workload visibility across shifts",
    ],
    pages: [
      { route: "/housekeeping/tasks",    title: "Cleaning Tasks", description: "Active task list with assignment and status" },
      { route: "/housekeeping/schedule", title: "Schedule",       description: "Housekeeping schedule and shift planner" },
    ],
    screenshots: ["/housekeeping/tasks"],
  },
  {
    chapter: 19,
    id: "maintenance",
    title: "Equipment Maintenance",
    subtitle: "Maintenance requests, equipment register, and service history",
    color: "#d97706",
    lightColor: "#fffbeb",
    roles: ["ADMIN"],
    path: "/maintenance",
    description:
      "The Equipment Maintenance module keeps the hospital's medical and operational equipment in safe working order. It maintains a full equipment register, tracks maintenance requests from any department, sends alerts for overdue service, and records complete service history for compliance and warranty purposes.",
    features: [
      "Equipment register with make, model, serial number, and department",
      "Maintenance request workflow with issue description and priority",
      "Overdue maintenance alerts for equipment past its service date",
      "Service history log with technician details and work performed",
      "Equipment status: Operational, Under Maintenance, Out of Service",
    ],
    pages: [
      { route: "/maintenance/dashboard", title: "Dashboard",   description: "Equipment status overview and maintenance KPIs" },
      { route: "/maintenance/equipment", title: "Equipment",   description: "Full equipment register and asset details" },
      { route: "/maintenance/requests",  title: "Requests",    description: "Maintenance requests with status and assignment" },
    ],
    screenshots: ["/maintenance/dashboard", "/maintenance/equipment"],
  },
  {
    chapter: 20,
    id: "assets",
    title: "Fixed Asset Management",
    subtitle: "Asset register, depreciation, and reports",
    color: "#0891b2",
    lightColor: "#ecfeff",
    roles: ["ADMIN", "CASHIER"],
    path: "/assets",
    description:
      "The Fixed Asset module provides a complete register of the hospital's capital assets — medical equipment, furniture, IT infrastructure, vehicles, and buildings. It tracks asset acquisition, current value, and calculates depreciation in accordance with accounting standards. Assets are categorised across 8 classes for clear financial reporting.",
    features: [
      "Asset register with acquisition date, cost, and current value",
      "8 asset categories: Medical Equipment, Furniture, IT & Electronics, Vehicles, Laboratory Equipment, Surgical Equipment, Building & Infrastructure, Other",
      "Straight-line and reducing-balance depreciation tracking",
      "Asset disposal and write-off recording",
      "Asset reports for financial statements and audits",
    ],
    pages: [
      { route: "/assets/dashboard",     title: "Dashboard",      description: "Total asset value, depreciation, and category breakdown" },
      { route: "/assets/register",      title: "Asset Register", description: "Complete list of all capital assets" },
      { route: "/assets/depreciation",  title: "Depreciation",   description: "Depreciation schedules and accumulated values" },
      { route: "/assets/reports",       title: "Reports",        description: "Asset management reports for finance" },
    ],
    screenshots: ["/assets/dashboard", "/assets/register"],
  },
  {
    chapter: 21,
    id: "cssd",
    title: "CSSD (Central Sterilisation)",
    subtitle: "Instrument sterilisation, cycle management, and dispatch",
    color: "#475569",
    lightColor: "#f8fafc",
    roles: ["NURSE", "ADMIN"],
    path: "/cssd",
    description:
      "The Central Sterile Supply Department (CSSD) module manages the complete sterilisation workflow for surgical instruments and reusable medical devices. It tracks item requests from wards and theatres, manages sterilisation cycles with load records and biological indicators, and documents instrument dispatch and return.",
    features: [
      "Instrument and item request tracking from wards and operating theatre",
      "Sterilisation cycle management with load ID, method, temperature, and duration",
      "Biological indicator and chemical indicator results recording",
      "Instrument dispatch with receiving confirmation",
      "Activity log and sterilisation audit trail",
      "Sterilisation methods: Autoclave (steam), EO gas, Dry heat, Plasma",
    ],
    pages: [
      { route: "/cssd/items",   title: "Item Requests", description: "Incoming instrument requests from clinical areas" },
      { route: "/cssd/cycles",  title: "Cycles",        description: "Sterilisation cycle records and load management" },
      { route: "/cssd/reports", title: "Reports",       description: "Activity log and sterilisation compliance reports" },
    ],
    screenshots: ["/cssd/items", "/cssd/cycles"],
  },
  {
    chapter: 22,
    id: "patient",
    title: "Patient Portal",
    subtitle: "Personal health records and diagnostic results",
    color: "#0369a1",
    lightColor: "#f0f9ff",
    roles: ["PATIENT", "ADMIN"],
    path: "/patient",
    description:
      "The Patient Portal gives registered patients secure, 24/7 access to their personal health information. Patients can view their medical records, diagnostic test results, and appointment history from any device. The portal uses a simplified top-navigation layout optimised for general users who may not have clinical backgrounds.",
    features: [
      "Personal dashboard with visit summary and upcoming appointments",
      "Medical records viewer — diagnoses, prescriptions, and clinical notes",
      "Diagnostic results viewer — lab results and radiology reports",
      "Accessible from any internet-connected device",
      "Simplified, patient-friendly navigation",
    ],
    pages: [
      { route: "/patient/dashboard",    title: "Dashboard",         description: "Health summary, upcoming appointments, and recent activity" },
      { route: "/patient/records",      title: "Medical Records",   description: "Personal medical record history and clinical documents" },
    ],
    screenshots: ["/patient/dashboard", "/patient/records"],
  },
];

// ─── CSS Styles ───────────────────────────────────────────────────────────────

const CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; color: #1e293b; background: #fff; font-size: 13px; line-height: 1.6; }

  /* ── Page breaks ── */
  .page-break { page-break-before: always; break-before: page; }
  @media print { * { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }

  /* ── Cover ── */
  .cover { min-height: 100vh; background: linear-gradient(145deg, #1e3a5f 0%, #1e40af 50%, #2563eb 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; padding: 60px 40px; text-align: center; position: relative; }
  .cover::after { content: ''; position: absolute; inset: 0; background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"); pointer-events: none; }
  .cover-badge { background: rgba(255,255,255,0.15); border: 1px solid rgba(255,255,255,0.3); color: #fff; font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; padding: 6px 18px; border-radius: 100px; margin-bottom: 40px; position: relative; z-index: 1; }
  .cover-logo { width: 80px; height: 80px; background: rgba(255,255,255,0.2); border-radius: 24px; display: flex; align-items: center; justify-content: center; margin: 0 auto 32px; font-size: 36px; position: relative; z-index: 1; }
  .cover-hospital { font-size: 42px; font-weight: 900; color: #fff; letter-spacing: -1px; position: relative; z-index: 1; margin-bottom: 8px; }
  .cover-system { font-size: 18px; color: rgba(255,255,255,0.8); font-weight: 500; position: relative; z-index: 1; margin-bottom: 40px; }
  .cover-divider { width: 60px; height: 3px; background: rgba(255,255,255,0.4); border-radius: 2px; margin: 0 auto 40px; position: relative; z-index: 1; }
  .cover-manual-label { font-size: 13px; font-weight: 700; letter-spacing: 4px; text-transform: uppercase; color: rgba(255,255,255,0.6); position: relative; z-index: 1; margin-bottom: 12px; }
  .cover-version { font-size: 28px; font-weight: 800; color: #fff; position: relative; z-index: 1; margin-bottom: 60px; }
  .cover-meta { display: flex; gap: 32px; justify-content: center; position: relative; z-index: 1; }
  .cover-meta-item { text-align: center; }
  .cover-meta-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: rgba(255,255,255,0.5); margin-bottom: 4px; }
  .cover-meta-value { font-size: 14px; font-weight: 600; color: #fff; }
  .cover-footer { position: absolute; bottom: 40px; left: 0; right: 0; text-align: center; font-size: 11px; color: rgba(255,255,255,0.4); font-weight: 500; z-index: 1; }

  /* ── TOC ── */
  .toc { padding: 60px 60px 60px; }
  .toc-header { margin-bottom: 40px; }
  .toc-header h1 { font-size: 28px; font-weight: 900; color: #0f172a; margin-bottom: 8px; }
  .toc-header p { color: #64748b; font-size: 14px; }
  .toc-section { margin-bottom: 32px; }
  .toc-section-title { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #94a3b8; margin-bottom: 12px; padding-bottom: 8px; border-bottom: 1px solid #e2e8f0; }
  .toc-item { display: flex; align-items: center; gap: 12px; padding: 8px 0; border-bottom: 1px dotted #e2e8f0; }
  .toc-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
  .toc-chapter { font-size: 11px; font-weight: 700; color: #94a3b8; width: 80px; flex-shrink: 0; }
  .toc-title { font-size: 13px; font-weight: 600; color: #0f172a; flex: 1; }
  .toc-role { font-size: 10px; color: #64748b; background: #f1f5f9; padding: 2px 8px; border-radius: 100px; white-space: nowrap; }

  /* ── Intro ── */
  .intro { padding: 60px; }
  .intro h1 { font-size: 28px; font-weight: 900; color: #0f172a; margin-bottom: 16px; }
  .intro-lead { font-size: 15px; line-height: 1.8; color: #334155; margin-bottom: 32px; }
  .intro h2 { font-size: 16px; font-weight: 700; color: #0f172a; margin-bottom: 16px; }
  .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 32px; }
  .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; text-align: center; }
  .stat-value { font-size: 28px; font-weight: 900; color: #2563eb; }
  .stat-label { font-size: 11px; font-weight: 600; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
  .roles-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 32px; }
  .role-item { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
  .role-name { font-size: 12px; font-weight: 700; color: #1e293b; }
  .role-desc { font-size: 11px; color: #64748b; margin-top: 2px; }

  /* ── Chapter ── */
  .chapter { padding: 0; }
  .chapter-header { padding: 40px 60px; position: relative; overflow: hidden; }
  .chapter-header::before { content: ''; position: absolute; right: -40px; top: -40px; width: 200px; height: 200px; border-radius: 50%; background: rgba(255,255,255,0.08); }
  .chapter-header::after { content: ''; position: absolute; right: 40px; bottom: -60px; width: 140px; height: 140px; border-radius: 50%; background: rgba(255,255,255,0.05); }
  .chapter-number { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: rgba(255,255,255,0.6); margin-bottom: 8px; }
  .chapter-title { font-size: 30px; font-weight: 900; color: #fff; margin-bottom: 8px; letter-spacing: -0.5px; position: relative; z-index: 1; }
  .chapter-subtitle { font-size: 14px; color: rgba(255,255,255,0.75); font-weight: 500; position: relative; z-index: 1; }
  .chapter-roles { display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; position: relative; z-index: 1; }
  .chapter-role-badge { background: rgba(255,255,255,0.2); border: 1px solid rgba(255,255,255,0.3); color: #fff; font-size: 10px; font-weight: 700; padding: 4px 12px; border-radius: 100px; letter-spacing: 0.5px; }

  .chapter-body { padding: 40px 60px; }
  .section-label { font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #94a3b8; margin-bottom: 12px; }
  .overview-text { font-size: 13.5px; line-height: 1.8; color: #334155; margin-bottom: 32px; }

  .features-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 32px; }
  .feature-item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
  .feature-check { width: 18px; height: 18px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 10px; flex-shrink: 0; margin-top: 1px; color: #fff; font-weight: 900; }
  .feature-text { font-size: 12px; color: #334155; font-weight: 500; }

  .pages-table { width: 100%; border-collapse: collapse; margin-bottom: 32px; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0; }
  .pages-table th { text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 10px 14px; background: #f1f5f9; color: #64748b; }
  .pages-table td { padding: 10px 14px; border-top: 1px solid #e2e8f0; font-size: 12px; color: #334155; vertical-align: top; }
  .pages-table td.route { font-family: 'Courier New', monospace; font-size: 11px; color: #6366f1; background: #f8f7ff; }
  .pages-table tr:last-child td { border-bottom: none; }

  /* ── Screenshots ── */
  .screenshots-section { margin-top: 8px; }
  .screenshots-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
  .screenshots-grid.single { grid-template-columns: 1fr; }
  .screenshot-card { border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; background: #f8fafc; }
  .screenshot-card img { width: 100%; height: 260px; object-fit: cover; object-position: top; display: block; }
  .screenshot-placeholder { width: 100%; height: 260px; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%); color: #94a3b8; gap: 8px; }
  .screenshot-placeholder-icon { font-size: 32px; opacity: 0.5; }
  .screenshot-placeholder-text { font-size: 11px; font-weight: 600; text-align: center; padding: 0 20px; }
  .screenshot-caption { padding: 10px 14px; font-size: 11px; color: #64748b; border-top: 1px solid #e2e8f0; line-height: 1.5; }
  .screenshot-caption strong { color: #334155; }

  /* ── Appendix ── */
  .appendix { padding: 60px; }
  .appendix h1 { font-size: 24px; font-weight: 900; color: #0f172a; margin-bottom: 8px; }
  .appendix-subtitle { font-size: 14px; color: #64748b; margin-bottom: 32px; }
  .roles-table { width: 100%; border-collapse: collapse; border: 1px solid #e2e8f0; border-radius: 10px; overflow: hidden; margin-bottom: 32px; }
  .roles-table th { text-align: left; font-size: 10px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; padding: 10px 14px; background: #f1f5f9; color: #64748b; }
  .roles-table td { padding: 10px 14px; border-top: 1px solid #e2e8f0; font-size: 12px; }
  .roles-table td:first-child { font-weight: 700; color: #1e293b; }
  .roles-table td:nth-child(2) { font-family: 'Courier New', monospace; font-size: 11px; color: #6366f1; }
  .role-color-dot { display: inline-block; width: 8px; height: 8px; border-radius: 50%; margin-right: 6px; }
`;

// ─── HTML Generator ───────────────────────────────────────────────────────────

function buildHTML(screenshots = {}) {
  const date = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" });

  const toc = MODULES.map(m => `
    <div class="toc-item">
      <div class="toc-dot" style="background:${m.color}"></div>
      <div class="toc-chapter">Chapter ${m.chapter}</div>
      <div class="toc-title">${m.title}</div>
      <div class="toc-role">${m.roles.join(", ")}</div>
    </div>
  `).join("");

  const chapters = MODULES.map(m => {
    const features = m.features.map(f => `
      <div class="feature-item">
        <div class="feature-check" style="background:${m.color}">✓</div>
        <div class="feature-text">${f}</div>
      </div>
    `).join("");

    const pageRows = m.pages.map(p => `
      <tr>
        <td class="route">${p.route}</td>
        <td><strong>${p.title}</strong></td>
        <td>${p.description}</td>
      </tr>
    `).join("");

    const cols = m.screenshots.length === 1 ? "single" : "";
    const shots = m.screenshots.map((route, i) => {
      const b64 = screenshots[route];
      const figNum = `Figure ${m.chapter}.${i + 1}`;
      const pageData = m.pages.find(p => p.route === route || route.startsWith(p.route));
      const caption = pageData ? `${pageData.title} — ${pageData.description}` : route;
      const imgTag = b64
        ? `<img src="data:image/png;base64,${b64}" alt="${caption}" />`
        : `<div class="screenshot-placeholder"><div class="screenshot-placeholder-icon">🖥</div><div class="screenshot-placeholder-text">${caption}</div></div>`;
      return `
        <div class="screenshot-card">
          ${imgTag}
          <div class="screenshot-caption"><strong>${figNum}:</strong> ${caption}</div>
        </div>
      `;
    }).join("");

    return `
      <div class="chapter page-break">
        <div class="chapter-header" style="background: linear-gradient(135deg, ${m.color} 0%, ${m.color}cc 100%);">
          <div class="chapter-number">Chapter ${m.chapter} of ${MODULES.length}</div>
          <div class="chapter-title">${m.title}</div>
          <div class="chapter-subtitle">${m.subtitle}</div>
          <div class="chapter-roles">
            ${m.roles.map(r => `<div class="chapter-role-badge">${r}</div>`).join("")}
          </div>
        </div>
        <div class="chapter-body">
          <div class="section-label">Module Overview</div>
          <p class="overview-text">${m.description}</p>

          <div class="section-label">Key Features</div>
          <div class="features-grid">${features}</div>

          <div class="section-label">Available Pages &amp; Functions</div>
          <table class="pages-table">
            <thead><tr><th>URL / Route</th><th>Page Name</th><th>Description</th></tr></thead>
            <tbody>${pageRows}</tbody>
          </table>

          <div class="section-label">Module Screenshots</div>
          <div class="screenshots-section">
            <div class="screenshots-grid ${cols}">${shots}</div>
          </div>
        </div>
      </div>
    `;
  }).join("");

  const roleRows = [
    { role: "ADMIN", code: "ADMIN", access: "Full system access — all modules", badge: "#4f46e5" },
    { role: "Doctor / Physician", code: "DOCTOR", access: "EMR, CPOE, appointments, diagnostics, order sets", badge: "#2563eb" },
    { role: "Nurse", code: "NURSE", access: "Vitals, nursing orders, ward patients, OT, handover", badge: "#0d9488" },
    { role: "Receptionist", code: "RECEPTIONIST", access: "Patient admission, appointments, queue, consultation fees", badge: "#0284c7" },
    { role: "Pharmacy Staff", code: "PHARMACY", access: "Drug inventory, prescriptions, dispensing, stock alerts", badge: "#16a34a" },
    { role: "Lab Technician", code: "LAB_TECH", access: "Test orders, results entry, blood bank", badge: "#059669" },
    { role: "Radiology Technologist", code: "RADIOLOGY_TECH", access: "Imaging orders, worklist, reports, modality stats", badge: "#7c3aed" },
    { role: "Physiotherapist", code: "PHYSIOTHERAPIST", access: "Sessions, treatment plans, progress tracking", badge: "#ea580c" },
    { role: "Dentist", code: "DENTIST", access: "Dental patients, appointments, charting, X-rays", badge: "#e11d48" },
    { role: "Dietitian", code: "DIETITIAN", access: "Diet plans, food menu, nutritional assessments", badge: "#65a30d" },
    { role: "Emergency Staff", code: "EMERGENCY_STAFF", access: "Triage board, ED patients, ambulance, incident log", badge: "#dc2626" },
    { role: "Cashier", code: "CASHIER", access: "Bills, transactions, income, expenses, financial reports", badge: "#4338ca" },
    { role: "Patient", code: "PATIENT", access: "Personal records, diagnostic results (Patient Portal only)", badge: "#0369a1" },
  ].map(r => `
    <tr>
      <td><span class="role-color-dot" style="background:${r.badge}"></span>${r.role}</td>
      <td>${r.code}</td>
      <td>${r.access}</td>
    </tr>
  `).join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rhona Medical Center — User Manual</title>
  <style>${CSS}</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-badge">Official Documentation</div>
  <div class="cover-logo">🏥</div>
  <div class="cover-hospital">Rhona Medical Center</div>
  <div class="cover-system">Comprehensive Hospital Management System</div>
  <div class="cover-divider"></div>
  <div class="cover-manual-label">User Manual</div>
  <div class="cover-version">Version 1.0</div>
  <div class="cover-meta">
    <div class="cover-meta-item">
      <div class="cover-meta-label">Date</div>
      <div class="cover-meta-value">${date}</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">Modules</div>
      <div class="cover-meta-value">22 Modules</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">User Roles</div>
      <div class="cover-meta-value">13 Roles</div>
    </div>
    <div class="cover-meta-item">
      <div class="cover-meta-label">Total Pages</div>
      <div class="cover-meta-value">154+ Screens</div>
    </div>
  </div>
  <div class="cover-footer">Rhona Medical Center &nbsp;·&nbsp; Confidential — For Authorised Use Only</div>
</div>

<!-- TABLE OF CONTENTS -->
<div class="toc page-break">
  <div class="toc-header">
    <h1>Table of Contents</h1>
    <p>This manual covers all 22 functional modules of the Rhona Medical Center Hospital Management System.</p>
  </div>
  <div class="toc-section">
    <div class="toc-section-title">Clinical Modules</div>
    ${MODULES.filter(m => m.chapter <= 11).map(m => `
      <div class="toc-item">
        <div class="toc-dot" style="background:${m.color}"></div>
        <div class="toc-chapter">Chapter ${m.chapter}</div>
        <div class="toc-title">${m.title}</div>
        <div class="toc-role">${m.roles.slice(0,2).join(", ")}${m.roles.length > 2 ? '…' : ''}</div>
      </div>
    `).join("")}
  </div>
  <div class="toc-section">
    <div class="toc-section-title">Operations & Support Modules</div>
    ${MODULES.filter(m => m.chapter >= 12).map(m => `
      <div class="toc-item">
        <div class="toc-dot" style="background:${m.color}"></div>
        <div class="toc-chapter">Chapter ${m.chapter}</div>
        <div class="toc-title">${m.title}</div>
        <div class="toc-role">${m.roles.slice(0,2).join(", ")}${m.roles.length > 2 ? '…' : ''}</div>
      </div>
    `).join("")}
  </div>
  <div class="toc-section">
    <div class="toc-section-title">Appendices</div>
    <div class="toc-item">
      <div class="toc-dot" style="background:#64748b"></div>
      <div class="toc-chapter">Appendix A</div>
      <div class="toc-title">User Roles & Access Rights</div>
      <div class="toc-role">Reference</div>
    </div>
  </div>
</div>

<!-- INTRODUCTION -->
<div class="intro page-break">
  <h1>System Introduction</h1>
  <p class="intro-lead">
    The Rhona Medical Center Hospital Management System (HMS) is a fully integrated, web-based clinical and administrative platform built on modern cloud infrastructure. It unifies all hospital departments — from the emergency department and operating theatre through to the pharmacy, laboratory, and finance office — into a single, role-based system accessible from any device with an internet connection.
  </p>
  <p class="intro-lead">
    The system uses role-based access control (RBAC) to ensure that each staff member sees only the modules and data relevant to their position. All clinical data is stored securely in an encrypted cloud database and accessible in real time. The platform is HIPAA-aligned and supports audit logging of all user actions.
  </p>

  <h2>System at a Glance</h2>
  <div class="stats-grid">
    <div class="stat-card"><div class="stat-value">22</div><div class="stat-label">Functional Modules</div></div>
    <div class="stat-card"><div class="stat-value">13</div><div class="stat-label">User Roles</div></div>
    <div class="stat-card"><div class="stat-value">154+</div><div class="stat-label">System Screens</div></div>
    <div class="stat-card"><div class="stat-value">46</div><div class="stat-label">Permission Types</div></div>
  </div>

  <h2>User Roles</h2>
  <div class="roles-grid">
    ${[
      { name: "Administrator", desc: "Full system access and configuration" },
      { name: "Doctor / Physician", desc: "Clinical documentation and orders" },
      { name: "Nurse", desc: "Ward operations and patient monitoring" },
      { name: "Receptionist", desc: "Registration, scheduling, front desk" },
      { name: "Pharmacist", desc: "Drug inventory and dispensing" },
      { name: "Lab Technician", desc: "Test orders, results, blood bank" },
      { name: "Radiologist / Technologist", desc: "Imaging orders, reports, worklist" },
      { name: "Physiotherapist", desc: "Therapy sessions and treatment plans" },
      { name: "Dentist", desc: "Dental records and clinical charting" },
      { name: "Dietitian", desc: "Nutrition plans and dietary assessments" },
      { name: "Emergency Staff", desc: "ED triage and emergency operations" },
      { name: "Cashier", desc: "Billing, payments, and financial reports" },
      { name: "Patient", desc: "Personal health records and results" },
    ].map(r => `<div class="role-item"><div class="role-name">${r.name}</div><div class="role-desc">${r.desc}</div></div>`).join("")}
  </div>

  <h2>Getting Started</h2>
  <p class="overview-text">
    To access the system, navigate to the hospital's web address and sign in with your assigned email address and password. Upon successful authentication, the system will automatically route you to the dashboard for your role. If you have not yet received your login credentials, please contact the System Administrator or use the <em>Set up your account</em> link on the login page with your invitation code.
  </p>
</div>

<!-- CHAPTERS -->
${chapters}

<!-- APPENDIX A: USER ROLES -->
<div class="appendix page-break">
  <h1>Appendix A — User Roles &amp; Access Rights</h1>
  <p class="appendix-subtitle">A summary of all system roles and their default module access.</p>
  <table class="roles-table">
    <thead><tr><th>Role Name</th><th>System Code</th><th>Default Module Access</th></tr></thead>
    <tbody>${roleRows}</tbody>
  </table>
  <p class="overview-text">
    <strong>Note:</strong> The System Administrator (ADMIN role) can further restrict or expand individual user permissions using the <em>User Registry</em> within the Administration Console. All permission changes are logged in the Access Audit trail.
  </p>
</div>

</body>
</html>`;
}

// ─── Server Utilities ─────────────────────────────────────────────────────────

function waitForServer(url, maxWaitMs = 90000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      http.get(url, (res) => { if (res.statusCode < 500) resolve(); else setTimeout(check, 1500); })
          .on("error", () => { if (Date.now() - start > maxWaitMs) reject(new Error("Dev server timed out")); else setTimeout(check, 1500); });
    };
    check();
  });
}

function startDevServer() {
  console.log("  Starting Next.js dev server…");
  const proc = spawn("npm", ["run", "dev"], {
    cwd: __dirname,
    stdio: ["ignore", "pipe", "pipe"],
    shell: true,
    detached: false,
  });
  proc.stdout.on("data", d => process.stdout.write("  [server] " + d.toString()));
  return proc;
}

// ─── Screenshot Capture ───────────────────────────────────────────────────────

async function captureScreenshots(browser, password) {
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 800 });

  console.log("  Logging in as admin…");
  await page.goto(`${BASE_URL}/login`, { waitUntil: "networkidle0", timeout: 30000 });
  await page.type('input[type="email"]', ADMIN_EMAIL, { delay: 30 });
  await page.type('input[type="password"]', password, { delay: 30 });
  await Promise.all([
    page.waitForNavigation({ waitUntil: "networkidle0", timeout: 30000 }),
    page.click('button[type="submit"]'),
  ]);
  console.log("  Logged in. Capturing screenshots…");

  const screenshots = {};
  const routes = MODULES.flatMap(m => m.screenshots);

  for (const route of routes) {
    try {
      await page.goto(`${BASE_URL}${route}`, { waitUntil: "networkidle2", timeout: 20000 });
      await new Promise(r => setTimeout(r, 1200));
      const buf = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1280, height: 800 } });
      screenshots[route] = buf.toString("base64");
      console.log(`  ✓ ${route}`);
    } catch (err) {
      console.warn(`  ✗ ${route} — ${err.message}`);
    }
  }

  await page.close();
  return screenshots;
}

// ─── Prompt Utility ───────────────────────────────────────────────────────────

function promptPassword() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => {
    rl.question("  Enter your Firebase admin password: ", answer => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const args = process.argv.slice(2);
  const pwIdx = args.indexOf("--password");
  const noScreenshots = args.includes("--no-screenshots");

  console.log("\n  ╔══════════════════════════════════════════════════════╗");
  console.log("  ║   Rhona Medical Center — User Manual Generator      ║");
  console.log("  ╚══════════════════════════════════════════════════════╝\n");

  let screenshots = {};
  let serverProc = null;

  if (!noScreenshots) {
    let password = pwIdx !== -1 ? args[pwIdx + 1] : null;
    if (!password) {
      console.log("  No --password flag provided.");
      console.log("  Press Ctrl+C to skip screenshots, or enter your admin password:\n");
      try {
        password = await Promise.race([
          promptPassword(),
          new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), 15000)),
        ]);
      } catch {
        console.log("\n  Skipping screenshots — will use placeholder boxes.\n");
        password = null;
      }
    }

    if (password) {
      // Check if server is already running
      let serverRunning = false;
      try {
        await waitForServer(`${BASE_URL}/login`, 2000);
        serverRunning = true;
        console.log("  Dev server already running on :3000");
      } catch {
        serverProc = startDevServer();
        console.log("  Waiting for dev server…");
        await waitForServer(`${BASE_URL}/login`, 90000);
        console.log("  Dev server ready.");
      }

      const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
      try {
        screenshots = await captureScreenshots(browser, password);
      } finally {
        await browser.close();
      }
    }
  } else {
    console.log("  --no-screenshots flag set. Generating content-only PDF.\n");
  }

  console.log("\n  Building HTML manual…");
  const html = buildHTML(screenshots);

  console.log("  Launching Puppeteer for PDF export…");
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox"] });
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: "networkidle0" });

  console.log("  Printing to PDF…");
  await page.pdf({
    path: OUTPUT_FILE,
    format: "A4",
    printBackground: true,
    margin: { top: "15mm", bottom: "15mm", left: "0mm", right: "0mm" },
    displayHeaderFooter: true,
    headerTemplate: "<div></div>",
    footerTemplate: `<div style="font-size:9px;color:#94a3b8;padding:0 20mm;width:100%;display:flex;justify-content:space-between;align-items:center;"><span>Rhona Medical Center — User Manual v1.0</span><span style="color:#94a3b8">Confidential</span><span class="pageNumber"></span></div>`,
  });

  await browser.close();
  if (serverProc) serverProc.kill();

  const stat = await fs.stat(OUTPUT_FILE);
  const sizeMB = (stat.size / 1024 / 1024).toFixed(1);

  const captured = Object.keys(screenshots).length;
  console.log(`\n  ✅ PDF generated successfully!`);
  console.log(`  📄 File: ${OUTPUT_FILE}`);
  console.log(`  📦 Size: ${sizeMB} MB`);
  console.log(`  📷 Screenshots: ${captured} captured`);
  if (captured === 0) {
    console.log(`\n  To add real screenshots, run:`);
    console.log(`  node generate-manual.mjs --password <your-firebase-password>\n`);
  }
}

main().catch(err => { console.error("\n  ERROR:", err.message); process.exit(1); });

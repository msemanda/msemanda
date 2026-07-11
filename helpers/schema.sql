-- ============================================================
-- RHONA e-Health PostgreSQL Schema
-- One table per collection, each storing document data in a JSONB
-- `data` column — this app has no Firebase/Firestore dependency;
-- collection names are just historical naming from before the
-- migration to Postgres. Active provider (neon/local) is chosen
-- via DB_PROVIDER in .env.local — see lib/db-provider.ts.
--
-- Connection: jdbc:postgresql://localhost:5432/ehealth
-- User: postgres  Password: sema
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- for gen_random_uuid()

-- ── Helper: generate a short UUID-based id (same length style as Firestore) ───
CREATE OR REPLACE FUNCTION short_id() RETURNS TEXT AS $$
    SELECT substr(replace(gen_random_uuid()::text, '-', ''), 1, 20);
$$ LANGUAGE SQL;

-- ── Macro to create every collection table identically ───────────────────────
-- Pattern: id TEXT PK, data JSONB, created_at, updated_at
-- The JSONB `data` column holds the full document fields so no
-- schema migration is needed when document shapes evolve.

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_users_role        ON users ((data->>'role'));
CREATE INDEX IF NOT EXISTS idx_users_email       ON users ((data->>'email'));
CREATE INDEX IF NOT EXISTS idx_users_approved    ON users ((data->>'approved'));

-- ── Invites ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS invites (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_invites_email ON invites ((data->>'email'));
CREATE INDEX IF NOT EXISTS idx_invites_used  ON invites ((data->>'used'));

-- ── Admissions (walk-in) ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admissions (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── System config ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS system (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Sessions (telemetry) ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS sessions (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_sessions_uid ON sessions ((data->>'uid'));

-- ── Bills / Finance ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS bills (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_bills_patient_email ON bills ((data->>'patientEmail'));
CREATE INDEX IF NOT EXISTS idx_bills_status        ON bills ((data->>'status'));

-- ── Consultation fees ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS consultation_fees (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_cfees_status        ON consultation_fees ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_cfees_patient_email ON consultation_fees ((data->>'patientEmail'));

-- ── Diagnostics ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diagnostics (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_diagnostics_patient_id   ON diagnostics ((data->>'patientId'));
CREATE INDEX IF NOT EXISTS idx_diagnostics_pharmacy_id  ON diagnostics ((data->>'pharmacyId'));

-- ── Appointments ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS appointments (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_appt_status      ON appointments ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_appt_doctor_id   ON appointments ((data->>'doctorId'));

-- ── Lab orders ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lab_orders (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Radiology orders ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS radiology_orders (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Clinical orders (CPOE / nursing) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── OT schedules ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ot_schedules (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Blood bank ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS blood_bank (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Financial transactions ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_txn_type     ON transactions ((data->>'type'));
CREATE INDEX IF NOT EXISTS idx_txn_category ON transactions ((data->>'category'));

-- ── CPOE orders ───────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cpoe_orders (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_cpoe_status ON cpoe_orders ((data->>'status'));

-- ── Patient bills (from doctor orders) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS patient_bills (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pbills_status        ON patient_bills ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_pbills_patient_email ON patient_bills ((data->>'patientEmail'));

-- ── IPD admissions ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ipd_admissions (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_ipd_status ON ipd_admissions ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_ipd_ward   ON ipd_admissions ((data->>'ward'));

-- ── IPD transfers ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ipd_transfers (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── IPD orders ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ipd_orders (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── CSSD items ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cssd_items (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── CSSD sterilisation cycles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cssd_cycles (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── CSSD dispatch ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cssd_dispatch (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Housekeeping tasks ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hk_tasks (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_hktask_status ON hk_tasks ((data->>'status'));

-- ── Housekeeping schedules ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS hk_schedules (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Maintenance equipment ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maint_equipment (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Maintenance requests ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maint_requests (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_mreq_status ON maint_requests ((data->>'status'));

-- ── Maintenance alerts ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS maint_alerts (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Fixed assets ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS fixed_assets (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_assets_category ON fixed_assets ((data->>'category'));

-- ── Quality audits ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS quality_audits (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Infection incidents ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS infection_incidents (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Incident reporting ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS incidents (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents ((data->>'severity'));
CREATE INDEX IF NOT EXISTS idx_incidents_type     ON incidents ((data->>'type'));

-- ── Home care visits ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS home_care_visits (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Emergency cases ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_cases (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_emergency_status   ON emergency_cases ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_emergency_severity ON emergency_cases ((data->>'severity'));

-- ── Pharmacy stock ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS pharmacy_stock (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_pstock_drug_name ON pharmacy_stock ((data->>'drugName'));
CREATE INDEX IF NOT EXISTS idx_pstock_category  ON pharmacy_stock ((data->>'category'));

-- ── Dispensing records ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dispensing_records (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_dispense_drug_id      ON dispensing_records ((data->>'drugId'));
CREATE INDEX IF NOT EXISTS idx_dispense_patient_name ON dispensing_records ((data->>'patientName'));

-- ── Fee schedule (cashier-managed price list for all services) ───────────────
CREATE TABLE IF NOT EXISTS fee_schedule (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_fee_category ON fee_schedule ((data->>'category'));
CREATE INDEX IF NOT EXISTS idx_fee_active   ON fee_schedule ((data->>'active'));

-- ── Dental records ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dental_records (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_dental_patient_id ON dental_records ((data->>'patientId'));
CREATE INDEX IF NOT EXISTS idx_dental_status     ON dental_records ((data->>'status'));

-- ── Physiotherapy patients (treatment tracking) ───────────────────────────────
CREATE TABLE IF NOT EXISTS physiotherapy_patients (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_physio_patient_id ON physiotherapy_patients ((data->>'patientId'));
CREATE INDEX IF NOT EXISTS idx_physio_progress   ON physiotherapy_patients ((data->>'progress'));

-- ── Wellness enrollments (individual patient program tracking) ────────────────
CREATE TABLE IF NOT EXISTS wellness_enrollments (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_wellness_patient_id ON wellness_enrollments ((data->>'patientId'));
CREATE INDEX IF NOT EXISTS idx_wellness_program    ON wellness_enrollments ((data->>'program'));

-- ── Home care patients (patient-level profile for home visits) ───────────────
CREATE TABLE IF NOT EXISTS home_care_patients (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_hcp_status     ON home_care_patients ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_hcp_patient_id ON home_care_patients ((data->>'patientId'));

-- ── Blood inventory (per blood-group stock levels) ────────────────────────────
CREATE TABLE IF NOT EXISTS blood_inventory (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_blood_inv_group ON blood_inventory ((data->>'bloodGroup'));

-- ── Blood requests (transfusion requests from wards) ─────────────────────────
CREATE TABLE IF NOT EXISTS blood_requests (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_blood_req_status  ON blood_requests ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_blood_req_urgency ON blood_requests ((data->>'urgency'));

-- ── Wellness programs (program catalog) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS wellness_programs (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_wellness_prog_status   ON wellness_programs ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_wellness_prog_category ON wellness_programs ((data->>'category'));

-- ── Nurse shifts ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nurse_shifts (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_nurse_shifts_shift ON nurse_shifts ((data->>'shift'));
CREATE INDEX IF NOT EXISTS idx_nurse_shifts_ward  ON nurse_shifts ((data->>'ward'));

-- ── Nurse handovers ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nurse_handovers (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_nurse_handovers_priority ON nurse_handovers ((data->>'priority'));

-- ── Physiotherapy sessions (daily session log) ────────────────────────────────
CREATE TABLE IF NOT EXISTS physiotherapy_sessions (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_physio_sessions_status ON physiotherapy_sessions ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_physio_sessions_date   ON physiotherapy_sessions ((data->>'sessionDate'));

-- ── Physiotherapy plans (treatment plan per patient) ─────────────────────────
CREATE TABLE IF NOT EXISTS physiotherapy_plans (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_physio_plans_status ON physiotherapy_plans ((data->>'status'));

-- ── Dental appointments ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dental_appointments (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_dental_appt_status ON dental_appointments ((data->>'status'));
CREATE INDEX IF NOT EXISTS idx_dental_appt_date   ON dental_appointments ((data->>'appointmentDate'));

-- ── Dental x-rays ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dental_xrays (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_dental_xrays_patient ON dental_xrays ((data->>'patientId'));

-- ── Diet plans ────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS diet_plans (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_diet_plans_patient ON diet_plans ((data->>'patientId'));

-- ── Dietary menu items ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dietary_menu_items (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_menu_items_meal ON dietary_menu_items ((data->>'meal'));

-- ── Dietary assessments ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dietary_assessments (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_dietary_assess_risk ON dietary_assessments ((data->>'malnutritionRisk'));

-- ── Ambulance units ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ambulance_units (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_amb_units_status ON ambulance_units ((data->>'status'));

-- ── Ambulance calls ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS ambulance_calls (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_amb_calls_status ON ambulance_calls ((data->>'status'));

-- ── Emergency logs ────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS emergency_logs (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_emergency_logs_date ON emergency_logs ((data->>'date'));
CREATE INDEX IF NOT EXISTS idx_emergency_logs_type ON emergency_logs ((data->>'type'));

-- ── Wellness sessions (recurring session schedule) ────────────────────────────
CREATE TABLE IF NOT EXISTS wellness_sessions (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_wellness_sess_program ON wellness_sessions ((data->>'program'));

-- ── Home care routes (daily visit route for nurses) ───────────────────────────
CREATE TABLE IF NOT EXISTS home_care_routes (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_hcr_status ON home_care_routes ((data->>'status'));

-- ── Messages (patient <-> staff chat, threaded by patientUid) ─────────────────
CREATE TABLE IF NOT EXISTS messages (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_messages_patient ON messages ((data->>'patientUid'));
CREATE INDEX IF NOT EXISTS idx_messages_read ON messages ((data->>'read'));

-- ── Notifications (system-generated, targeted at a user or a role) ───────────
CREATE TABLE IF NOT EXISTS notifications (
    id          TEXT        PRIMARY KEY DEFAULT short_id(),
    data        JSONB       NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_notifications_target_uid ON notifications ((data->>'targetUid'));
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON notifications ((data->>'targetRole'));

-- ============================================================
-- Done. Run this file against the ehealth database:
--   psql -U postgres -d ehealth -f schema.sql
-- ============================================================

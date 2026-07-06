-- E-Health Next — Neon.tech PostgreSQL Migration
-- Run once against your Neon database to create all tables.
-- All tables use a JSONB document pattern matching the Firestore/API collection names.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Helper: generate UUIDs ────────────────────────────────────────────────────

-- ── Core tables ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS invites (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sessions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS system (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Patient & clinical ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS admissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS appointments (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS diagnostics (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS consultation_fees (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS orders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cpoe_orders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Laboratory & Radiology ────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS lab_orders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS radiology_orders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS blood_bank (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Billing & Finance ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS bills (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS patient_bills (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS transactions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS fee_schedule (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── OT ───────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ot_schedules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── IPD (In-Patient Department) ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS ipd_admissions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ipd_transfers (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS ipd_orders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── CSSD (Central Sterile Supply Department) ──────────────────────────────────

CREATE TABLE IF NOT EXISTS cssd_items (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cssd_cycles (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cssd_dispatch (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Housekeeping ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hk_tasks (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hk_schedules (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Maintenance ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS maint_equipment (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS maint_requests (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS maint_alerts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Assets & Quality ──────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS fixed_assets (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS quality_audits (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS infection_incidents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS incidents (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Home Care & Emergency ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS home_care_visits (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS emergency_cases (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Pharmacy ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS pharmacy_stock (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS dispensing_records (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS categories (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Security ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS security_shifts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS visitor_logs (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── Optical ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS optical_exams (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS optical_prescriptions (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS optical_orders (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    data        JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

-- ── GIN indexes for JSONB querying ────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_users_data              ON users              USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_invites_data            ON invites            USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_sessions_data           ON sessions           USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_admissions_data         ON admissions         USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_appointments_data       ON appointments       USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_diagnostics_data        ON diagnostics        USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_consultation_fees_data  ON consultation_fees  USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_orders_data             ON orders             USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_cpoe_orders_data        ON cpoe_orders        USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_lab_orders_data         ON lab_orders         USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_radiology_orders_data   ON radiology_orders   USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_blood_bank_data         ON blood_bank         USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_bills_data              ON bills              USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_patient_bills_data      ON patient_bills      USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_transactions_data       ON transactions       USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_fee_schedule_data       ON fee_schedule       USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_ot_schedules_data       ON ot_schedules       USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_ipd_admissions_data     ON ipd_admissions     USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_ipd_transfers_data      ON ipd_transfers      USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_ipd_orders_data         ON ipd_orders         USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_cssd_items_data         ON cssd_items         USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_cssd_cycles_data        ON cssd_cycles        USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_cssd_dispatch_data      ON cssd_dispatch      USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_hk_tasks_data           ON hk_tasks           USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_hk_schedules_data       ON hk_schedules       USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_maint_equipment_data    ON maint_equipment    USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_maint_requests_data     ON maint_requests     USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_maint_alerts_data       ON maint_alerts       USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_fixed_assets_data       ON fixed_assets       USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_quality_audits_data     ON quality_audits     USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_infection_incidents_data ON infection_incidents USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_incidents_data          ON incidents          USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_home_care_visits_data   ON home_care_visits   USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_emergency_cases_data    ON emergency_cases    USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_pharmacy_stock_data     ON pharmacy_stock     USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_dispensing_records_data ON dispensing_records USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_categories_data         ON categories         USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_security_shifts_data    ON security_shifts    USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_data       ON visitor_logs       USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_optical_exams_data      ON optical_exams      USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_optical_prescriptions_data ON optical_prescriptions USING GIN (data);
CREATE INDEX IF NOT EXISTS idx_optical_orders_data     ON optical_orders     USING GIN (data);

-- ==============================================================================
-- HealLock Sovereign Health Identity & Zero-Trust Clinical System
-- Complete Supabase PostgreSQL Schema & Storage Bucket Definitions
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Clean up any existing tables from prior runs to ensure exact column alignment
DROP TABLE IF EXISTS public.anomaly_alerts CASCADE;
DROP TABLE IF EXISTS public.blockchain_ledger CASCADE;
DROP TABLE IF EXISTS public.consents CASCADE;
DROP TABLE IF EXISTS public.medical_records CASCADE;
DROP TABLE IF EXISTS public.patients CASCADE;

-- 3. PATIENTS TABLE
CREATE TABLE public.patients (
    id TEXT PRIMARY KEY,
    health_id TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    dob TEXT,
    gender TEXT,
    avatar_url TEXT,
    emergency_profile JSONB DEFAULT '{}'::jsonb,
    registered_biometrics JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MEDICAL RECORDS TABLE
CREATE TABLE public.medical_records (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    category TEXT NOT NULL,
    date TEXT NOT NULL,
    doctor_name TEXT NOT NULL,
    hospital_name TEXT NOT NULL,
    file_type TEXT DEFAULT 'application/pdf',
    file_url TEXT,
    storage_path TEXT,
    file_size TEXT,
    sha256_hash TEXT,
    is_encrypted BOOLEAN DEFAULT true,
    content_encrypted TEXT DEFAULT '',
    ai_extracted_fields JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CONSENT GRANTS TABLE
CREATE TABLE public.consents (
    id TEXT PRIMARY KEY,
    patient_id TEXT REFERENCES public.patients(id) ON DELETE CASCADE,
    hospital_id TEXT NOT NULL,
    hospital_name TEXT NOT NULL,
    scope TEXT[] NOT NULL,
    granted_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    status TEXT NOT NULL, -- 'active', 'revoked', 'expired'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BLOCKCHAIN AUDIT LEDGER TABLE
CREATE TABLE public.blockchain_ledger (
    block_number INTEGER PRIMARY KEY,
    previous_hash TEXT NOT NULL,
    hash TEXT UNIQUE NOT NULL,
    merkle_root TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    transactions JSONB DEFAULT '[]'::jsonb,
    nonce INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. SECURITY ANOMALIES & ML RADAR TABLE
CREATE TABLE public.anomaly_alerts (
    id TEXT PRIMARY KEY,
    hospital_id TEXT NOT NULL,
    hospital_name TEXT NOT NULL,
    patient_id TEXT,
    date TEXT NOT NULL,
    access_count INTEGER NOT NULL,
    rolling_average NUMERIC NOT NULL,
    severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    abuse_pattern TEXT NOT NULL,
    reason TEXT NOT NULL,
    admin_reviewed BOOLEAN DEFAULT false,
    timestamp TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PERFORMANCE INDEXES
CREATE INDEX idx_patients_health_id ON public.patients(health_id);
CREATE INDEX idx_medical_records_patient_id ON public.medical_records(patient_id);
CREATE INDEX idx_consents_patient_id ON public.consents(patient_id);
CREATE INDEX idx_blockchain_number ON public.blockchain_ledger(block_number);

-- 9. ROW LEVEL SECURITY (RLS) POLICIES
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blockchain_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.anomaly_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public Read Patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Records" ON public.medical_records FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Consents" ON public.consents FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Ledger" ON public.blockchain_ledger FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public Read Anomalies" ON public.anomaly_alerts FOR ALL USING (true) WITH CHECK (true);

-- 10. SUPABASE STORAGE BUCKET (Medical Document Storage)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medical-records', 'medical-records', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Bucket Access Policy
DROP POLICY IF EXISTS "Public Document Storage Access" ON storage.objects;
CREATE POLICY "Public Document Storage Access" 
ON storage.objects FOR ALL 
USING (bucket_id = 'medical-records')
WITH CHECK (bucket_id = 'medical-records');

-- ============================================================================
-- PRIME STEM NIGERIA — ONLINE EXAMINATION & AI PROCTORING SYSTEM
-- Ready-to-Run PostgreSQL / Supabase Migration Script
-- Compatible with PostgreSQL 15+ and Supabase Postgres
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ----------------------------------------------------------------------------
-- 1. LEGACY / PUBLIC WEBSITE TABLES (PRESERVED)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_messages (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  category TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'New',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.registrations (
  id SERIAL PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  category TEXT NOT NULL,
  program TEXT NOT NULL,
  message TEXT,
  status VARCHAR(32) NOT NULL DEFAULT 'Pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.site_content_store (
  key VARCHAR(64) PRIMARY KEY,
  payload JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. EXAMINATION MANAGEMENT TABLES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.examinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(128) NOT NULL UNIQUE,
  title TEXT NOT NULL,
  competition_label TEXT NOT NULL,
  program_slug VARCHAR(128) NOT NULL,
  category VARCHAR(64) NOT NULL,
  description TEXT NOT NULL,
  instructions TEXT NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 45 CHECK (duration_minutes > 0 AND duration_minutes <= 360),
  pass_mark_percent INTEGER NOT NULL DEFAULT 50 CHECK (pass_mark_percent >= 0 AND pass_mark_percent <= 100),
  status VARCHAR(24) NOT NULL DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
  results_published BOOLEAN NOT NULL DEFAULT FALSE,
  proctoring_required BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Single-correct-answer MCQs: options A/B/C/D are NEVER shuffled;
-- candidate question order is shuffled independently per attempt by permanent question UUID.
CREATE TABLE IF NOT EXISTS public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  prompt TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option VARCHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  points INTEGER NOT NULL DEFAULT 1 CHECK (points > 0),
  explanation TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_questions_exam_id ON public.exam_questions(exam_id);

-- Admin-configured examination schedules / time slots
CREATE TABLE IF NOT EXISTS public.exam_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  timezone VARCHAR(64) NOT NULL DEFAULT 'Africa/Lagos',
  capacity INTEGER NOT NULL DEFAULT 250 CHECK (capacity > 0),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT chk_schedule_window CHECK (ends_at > starts_at)
);

CREATE INDEX IF NOT EXISTS idx_exam_schedules_exam_id ON public.exam_schedules(exam_id);

-- ----------------------------------------------------------------------------
-- 3. CANDIDATE ENROLLMENT, APPROVAL & ACCESS CODES
-- ----------------------------------------------------------------------------
-- Access codes are inactive at registration (pending_approval).
-- Admin verifies registration/payment -> generates or sets custom code -> activates & emails candidate.
CREATE TABLE IF NOT EXISTS public.exam_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_id INTEGER,
  exam_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES public.exam_schedules(id) ON DELETE RESTRICT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  school_name TEXT NOT NULL,
  category TEXT NOT NULL,
  class_level TEXT,
  guardian_name TEXT,
  guardian_phone TEXT,
  parent_consent_given BOOLEAN NOT NULL DEFAULT FALSE,
  parent_consent_at TIMESTAMPTZ,
  approval_status VARCHAR(32) NOT NULL DEFAULT 'pending_approval'
    CHECK (approval_status IN ('pending_approval', 'approved', 'revoked')),
  access_code_hash TEXT,
  access_code_hint VARCHAR(32),
  access_code_active BOOLEAN NOT NULL DEFAULT FALSE,
  code_issued_at TIMESTAMPTZ,
  code_sent_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_exam_candidates_exam_id ON public.exam_candidates(exam_id);
CREATE INDEX IF NOT EXISTS idx_exam_candidates_schedule_id ON public.exam_candidates(schedule_id);
CREATE INDEX IF NOT EXISTS idx_exam_candidates_email ON public.exam_candidates(LOWER(email));
CREATE UNIQUE INDEX IF NOT EXISTS uq_exam_candidates_active_code_hash
  ON public.exam_candidates(access_code_hash)
  WHERE access_code_hash IS NOT NULL;

-- ----------------------------------------------------------------------------
-- 4. EXAM ATTEMPTS, SHUFFLED QUESTION ORDER, MARKING & PROCTORING FLAGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE,
  exam_id UUID NOT NULL REFERENCES public.examinations(id) ON DELETE CASCADE,
  schedule_id UUID NOT NULL REFERENCES public.exam_schedules(id) ON DELETE RESTRICT,
  status VARCHAR(36) NOT NULL DEFAULT 'setup'
    CHECK (status IN ('setup', 'in_progress', 'submitted', 'auto_submitted_violation', 'auto_submitted_timeout')),
  shuffled_question_ids JSONB NOT NULL DEFAULT '[]'::jsonb,
  compatibility_mode BOOLEAN NOT NULL DEFAULT FALSE,
  incomplete_proctoring BOOLEAN NOT NULL DEFAULT FALSE,
  screen_status VARCHAR(24) NOT NULL DEFAULT 'pending',
  webcam_status VARCHAR(24) NOT NULL DEFAULT 'pending',
  audio_status VARCHAR(24) NOT NULL DEFAULT 'pending',
  device_info JSONB,
  tab_switch_count INTEGER NOT NULL DEFAULT 0,
  ai_suspicion_count INTEGER NOT NULL DEFAULT 0,
  network_drop_count INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ,
  timer_ends_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  submission_reason TEXT,
  score INTEGER,
  max_score INTEGER,
  percentage INTEGER,
  result_released BOOLEAN NOT NULL DEFAULT FALSE,
  admin_review_notes TEXT,
  last_heartbeat_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_one_attempt_per_candidate UNIQUE (candidate_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_attempts_exam_id ON public.exam_attempts(exam_id);

-- Idempotent candidate answer autosave & offline-reconnection sync
CREATE TABLE IF NOT EXISTS public.exam_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.exam_questions(id) ON DELETE CASCADE,
  selected_option VARCHAR(1) CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  client_updated_at TIMESTAMPTZ NOT NULL,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT uq_attempt_question_answer UNIQUE (attempt_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_exam_answers_attempt_id ON public.exam_answers(attempt_id);

-- ----------------------------------------------------------------------------
-- 5. PROCTORING RECORDINGS & TIMESTAMPED AI / MALPRACTICE EVENTS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.proctoring_recordings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE,
  stream_type VARCHAR(24) NOT NULL CHECK (stream_type IN ('screen', 'webcam', 'audio', 'snapshot')),
  segment_index INTEGER NOT NULL DEFAULT 0,
  mime_type VARCHAR(64) NOT NULL,
  size_bytes INTEGER NOT NULL DEFAULT 0,
  duration_ms INTEGER NOT NULL DEFAULT 0,
  storage_provider VARCHAR(32) NOT NULL CHECK (storage_provider IN ('google_drive', 'local_vault')),
  storage_object_key TEXT NOT NULL,
  drive_file_id TEXT,
  checksum_sha256 VARCHAR(64),
  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ NOT NULL,
  wiped_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proctoring_recordings_attempt_id ON public.proctoring_recordings(attempt_id);

CREATE TABLE IF NOT EXISTS public.proctoring_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  candidate_id UUID NOT NULL REFERENCES public.exam_candidates(id) ON DELETE CASCADE,
  event_type VARCHAR(48) NOT NULL,
  classification VARCHAR(32) NOT NULL CHECK (classification IN ('ai_suspicion', 'verified_violation', 'system_notice')),
  severity VARCHAR(16) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  details TEXT NOT NULL,
  metadata JSONB,
  occurred_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_proctoring_events_attempt_id ON public.proctoring_events(attempt_id);

-- ----------------------------------------------------------------------------
-- 6. RESEND EMAIL OUTBOX, NEWSLETTER SUBSCRIBERS & SYSTEM INTEGRATIONS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_email TEXT NOT NULL,
  recipient_name TEXT,
  category VARCHAR(48) NOT NULL,
  subject TEXT NOT NULL,
  status VARCHAR(24) NOT NULL,
  resend_message_id TEXT,
  error_message TEXT,
  html_preview TEXT,
  related_entity_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_logs_created_at ON public.email_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  source VARCHAR(48) NOT NULL DEFAULT 'footer',
  status VARCHAR(24) NOT NULL DEFAULT 'active',
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.system_integration_settings (
  key VARCHAR(64) PRIMARY KEY,
  config JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) HARDENING FOR SUPABASE
--    Backend connects via direct PostgreSQL connection string (DATABASE_URL).
--    Enabling RLS with zero anon policies blocks all unauthenticated PostgREST
--    access to answer keys, candidate records, and proctoring recordings.
-- ----------------------------------------------------------------------------
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content_store ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.examinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctoring_recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proctoring_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_integration_settings ENABLE ROW LEVEL SECURITY;

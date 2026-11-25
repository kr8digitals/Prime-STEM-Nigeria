# Prime STEM Nigeria — Database, Email & Proctoring Vault Handoff Plan

This document provides the complete technical handoff specification for the Database / DevOps Engineer provisioning the dedicated production PostgreSQL database, Resend email sender, and dedicated Google Drive proctoring vault for **Prime STEM Nigeria** (`https://primestemnigeria.afristemglobal.org/`).

> **Deployment caution:** Free-tier availability, limits, and pricing can change. Confirm current quotas and retention requirements before deployment. This implementation has not been validated against a live PostgreSQL, Resend, or Google Drive account.

---

## 1. Architecture Overview & Dual-Mode Persistence

The application (`src/lib/exam-store.ts` & `src/db/schema.ts`) is already fully wired for PostgreSQL via `pg` + Drizzle ORM:

- **When `DATABASE_URL` is NOT set:** The server automatically runs on its atomic mutex-locked local transactional store (`data/exam-system.json`) seeded with all 4 Prime STEM competitions, 30 MCQs, and 5 schedules.
- **When `DATABASE_URL` is set:** `src/lib/exam-store.ts` stores the examination state as a JSON document under the `exam_system_v2` key in `public.site_content_store`. The normalized exam tables in the migration are not populated by this store. Database reporting, indexing, retention, and any future migration to normalized tables require additional engineering and validation.
- Local files and the local recording vault are for development only: they are not durable or shared across serverless instances. Configure durable storage before production.

---

## 2. Step-by-Step Database Provisioning Instructions

1. **Create a Dedicated Free PostgreSQL Instance** (separate from `KR8 Academy` so `KR8 Academy` storage is untouched):
   - Recommended: **Supabase Free Project** (500 MB Postgres, AWS `eu-west-1` or `eu-central-1` for low latency to Nigeria) or **Neon Serverless Postgres Free Tier**.
2. **Execute the Ready-to-Run Migration SQL:**
   - Open the SQL Editor (or run `psql "$DATABASE_URL" -f supabase/migrations/0001_prime_stem_examination_system.sql`).
   - Run the entire file: `supabase/migrations/0001_prime_stem_examination_system.sql`.
3. **Copy the Pooled Connection String (`DATABASE_URL`):**
   - In Supabase: *Project Settings → Database → Connection String → Transaction Pooler (port `6543`)* or *Session Pooler (port `5432`)*.
   - Set `DATABASE_URL="postgresql://..."` in the hosting environment (Vercel Environment Variables).

---

## 3. Migration Schema (`14 Tables`)

The following normalized tables are provisioned by the migration but are not the authoritative exam store in the current implementation; exam data lives in `site_content_store` as noted above.

| Table | Primary Key | Purpose & Security Rules |
| :--- | :--- | :--- |
| `contact_messages` | `id SERIAL` | Public `/contact` inquiries + status workflow (`New`, `Reviewed`, `Replied`). |
| `registrations` | `id SERIAL` | Public `/register` competition & general STEM programme registrations (preserves existing records). |
| `site_content_store` | `key VARCHAR(64)` | Persistent JSONB store for CMS edits made in `/admin` (announcements, winners, calendar, gallery). |
| `examinations` | `id UUID` | Exam definitions linked to competitions (`slug`, `program_slug`, `duration_minutes`, `pass_mark_percent`, `results_published`). |
| `exam_questions` | `id UUID` | Single-correct-answer MCQs (`prompt`, `option_a`..`option_d`, `correct_option`). **`correct_option` never leaves the server.** |
| `exam_schedules` | `id UUID` | Admin-created date/time windows (`starts_at`, `ends_at`, `timezone`, `capacity`, `is_active`). |
| `exam_candidates` | `id UUID` | Candidate enrollments (`approval_status`: `pending_approval` → `approved` → `revoked`), NDPA parental/school consent timestamps, and HMAC-SHA256 `access_code_hash` (`access_code_active` is `FALSE` until Admin approves). |
| `exam_attempts` | `id UUID` | One authoritative attempt per candidate: `shuffled_question_ids` (UUID array), `screen_status`/`webcam_status`/`audio_status`, `compatibility_mode`, `incomplete_proctoring`, `tab_switch_count`, `ai_suspicion_count`, `timer_ends_at`, `score`, `percentage`, `result_released`. |
| `exam_answers` | `id UUID` | Unique `(attempt_id, question_id)` candidate responses (`A`/`B`/`C`/`D`) with monotonic `client_updated_at` timestamp for offline-recovery idempotency. |
| `proctoring_recordings` | `id UUID` | Metadata & SHA-256 checksums for 10-second `screen`, `webcam`, `audio` WebM/MP4 segments and AI `snapshot` JPEGs stored in `google_drive` or `local_vault`, plus `wiped_at` audit timestamp. |
| `proctoring_events` | `id UUID` | Timestamped audit trail separating `ai_suspicion` (`no_face`, `multiple_faces`, `gaze_away`, `prohibited_object_phone`, `voice_detected`) from `verified_violation` (`tab_switch` Strike 1 & Strike 2 auto-submission) and `system_notice` (offline/stream gaps). |
| `email_logs` | `id UUID` | Full Resend delivery outbox (`sent`, `queued_no_api_key`, `failed`), Resend message ID, and HTML preview for one-click admin retry. |
| `newsletter_subscribers` | `id UUID` | Subscribed community emails for Prime STEM competition broadcasts. |
| `system_integration_settings` | `key VARCHAR(64)` | Schema reserved for integration settings; current exam store keeps settings in its JSON document. Treat this document and backups as sensitive; credentials are not encrypted by the application. |

### Row-Level Security (RLS)
`0001_prime_stem_examination_system.sql` enables PostgreSQL Row-Level Security (`ENABLE ROW LEVEL SECURITY`) across **all 14 tables** with zero public `anon` policies. Even if someone discovers a Supabase project URL, PostgREST returns zero rows for `exam_questions`, `exam_candidates`, and `proctoring_recordings`. Only the Next.js server connecting over `DATABASE_URL` can access examination data.

---

## 4. Resend Email Setup (`$0/month` Free Tier)

1. Create/log into your Resend account (`https://resend.com`) and verify the sending domain (`primestemnigeria.afristemglobal.org` or `afristemglobal.org` via DNS TXT/DKIM records).
2. Generate an API Key (`re_...`).
3. Configure either in `.env` / Vercel Environment Variables **or** directly inside `/admin → Examinations & Proctoring → Integrations & Vault`:
   - `RESEND_API_KEY="re_..."`
   - `RESEND_FROM_EMAIL="Prime STEM Nigeria <exams@primestemnigeria.afristemglobal.org>"`
   - `RESEND_REPLY_TO="primestemnigeria@gmail.com"`
   - `ADMIN_NOTIFICATION_EMAIL="primestemnigeria@gmail.com"`
4. Any emails generated before the API key was entered are stored in `email_logs` (`queued_no_api_key`) and can be dispatched in one click via **Admin → Examinations → Email Outbox → Retry All Queued Emails**.

---

## 5. Dedicated Google Drive Proctoring Vault Setup (`$0/month` — 15 GB Free)

1. Create a brand-new Google Account dedicated to Prime STEM Examination Evidence (e.g., `primestem.proctoring@gmail.com`) and create a private folder in Google Drive. Copy the Folder ID from the URL (`https://drive.google.com/drive/folders/<FOLDER_ID>`).
2. **Never share the folder publicly** (`Anyone with link` MUST remain **Restricted**). All Admin video playback streams through the authenticated backend proxy `/api/admin/exams/recordings/[id]/stream` with HTTP `Range` support.
3. Supply credentials via `.env` **or** inside `/admin → Examinations & Proctoring → Integrations & Vault`:
   - **Option A (Recommended for personal Gmail Drive):** Create an OAuth2 Client in Google Cloud Console (enable *Google Drive API*), obtain a `refresh_token` for `https://www.googleapis.com/auth/drive.file`, and set `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_DRIVE_CLIENT_ID`, `GOOGLE_DRIVE_CLIENT_SECRET`, and `GOOGLE_DRIVE_REFRESH_TOKEN`.
   - **Option B (Google Workspace Shared Drive / Service Account):** Share the Drive folder with a Google Cloud Service Account email and set `GOOGLE_DRIVE_FOLDER_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, and `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY`.
4. Use **Sync Local Vault → Google Drive** in `/admin` to push any local recordings to Drive, and use **NDPA Retention Wipe** after competition appeals close to free storage cleanly.

# Prime STEM Nigeria — production database and proctoring blueprint

**Status: engineering handoff, not a production certification.** The current implementation is a prototype and is not verified or approved for 250 simultaneous candidates. The migration `supabase/migrations/0001_prime_stem_examination_system.sql` creates normalized tables, but the application currently stores the examination system as **one JSON document** (`site_content_store.key = exam_system_v2`). Do not assume that applying the migration activates the normalized design below. This version serializes PostgreSQL JSON writes with a row lock; this avoids lost updates between application instances, but is a major throughput bottleneck and has not been load-tested on PostgreSQL. CMS/submissions have separate storage paths and must also be migrated; the local filesystem and serverless temporary directories are neither shared nor durable.

## What is implemented now

* Questions can be imported using UTF-8 CSV; the administrator previews all rows before an atomic import. Blank answer keys are permitted. Questions have permanent UUIDs, and only the list of question IDs is shuffled; options A–D retain their order. An answer-key CSV uses question UUIDs, never shuffled positions.
* An attempt can be submitted without a key; its score remains null. Before publishing results, every relevant key must be present. Submission answers are re-marked by question ID at release. Already-released results must be withdrawn before answer changes. Question text, options and marks cannot be changed after attempts start.
* Session, event and recording metadata, answer keys and settings are stored in the JSON document. PostgreSQL writes use `SELECT ... FOR UPDATE` across instances; when `DATABASE_URL` is set, database errors do not silently fall back to local exam data. The JSON payload is still rewritten on every mutation and cannot be assumed to meet the workload target.
* The browser attempts to record screen, webcam and microphone as 10-second chunks, with client-side IndexedDB retry. Admins can inspect events and stream uploaded chunks; the dashboard refresh is **not** a real-time live-video proctoring service. AI/tab events are signals and not proof of misconduct.
* Development recordings use `data/proctoring-vault/` (ignored by Git). The server has Google Drive upload code requiring a folder ID **and** configured OAuth/service-account credentials. On Vercel, missing/failed Drive configuration now returns an error instead of silently saving into ephemeral storage. The browser's recovery queue is not a substitute for durable cloud storage. Drive upload, quota handling, media playback, browser permission behavior, and end-to-end integrity have not been verified against a real account.

## Target architecture and data ownership

Provision a **dedicated** managed PostgreSQL database for Prime STEM; do not reuse unrelated KR8 Academy data without explicit approval. Choose a region after measuring Nigerian candidate latency, with TLS certificate verification, automated backups, restore testing, a connection pooler and monitoring. Provision private object storage separately for evidence; prefer a storage service with resumable or multipart browser-to-storage uploads, bounded signed URLs, encryption at rest and documented lifecycle policies. A database stores metadata, not video binaries. A folder link alone does not grant the application authorized Drive access; do not send passwords or private keys in chat.

The target normalized tables, with proposed minimum constraints and indexes:

| Table | Main fields and constraints | Important indexes |
|---|---|---|
| `examinations` | UUID PK; slug unique; programme, title, status, duration, release state, version; timestamps | status/programme |
| `exam_questions` | UUID PK; FK exam; prompt, four options, nullable correct option A–D; positive points; content/version | `(exam_id, id)` |
| `exam_schedules` | UUID PK; FK exam; starts/ends in UTC; IANA display timezone; capacity and state | `(exam_id, starts_at)` |
| `exam_candidates` | UUID PK; FK exam/schedule; normalized email; guardian consent record; approval; HMAC code hash (unique) | `(exam_id, approval_status)`, `(schedule_id)`, normalized email |
| `exam_attempts` | UUID PK; unique candidate/exam policy; status, server deadline, immutable question/version snapshot, device state, score nullable until marked, release status | `(exam_id, status)`, `(candidate_id)` |
| `exam_answers` | UUID PK; FK attempt/question; selected option nullable; client version and authoritative server receipt time; unique `(attempt_id, question_id)` | `(attempt_id)` |
| `proctoring_events` | UUID PK; FK attempt; source, event type, classification, timestamp, metadata; append-only audit policy | `(attempt_id, occurred_at)` |
| `proctoring_recordings` | UUID PK; FK attempt; stream, segment, upload state, checksum, object key, size, timestamp, deletion audit; unique idempotency key `(attempt_id, stream_type, segment_index, recording_session)` | `(attempt_id, stream_type, segment_index)` |
| `email_logs` / `outbox` | ID, destination, type, delivery state, retries, provider ID; unique idempotency token | `(status, next_retry_at)` |
| `registrations`, `contact_messages`, `newsletter_subscribers` | validated submissions, consent and timestamps | status/date, normalized email as appropriate |
| `site_content_store` | versioned CMS sections; optimistic concurrency/version | primary key |
| `audit_logs` | actor, action, target, before/after metadata, timestamp; no credentials | actor/time, target/time |

The existing SQL is a starting point only; compare each field and constraint against the code and write new migrations for nullable answer keys, question/attempt snapshots, upload idempotency, auditing and versioning. Do not run destructive resets against live data. Build and test a migration/backfill from `exam_system_v2` in a staging clone: inventory rows, verify UUID/FK and counts, reconcile every answer and recording, test a rollback, then switch reads/writes in a controlled cutover. Keep the old JSON snapshot encrypted and access-restricted during the agreed rollback window.

## Transaction and marking requirements

1. Use row-level transactions for candidate approval/code assignment and schedule capacity; enforce unique code and attempt constraints in PostgreSQL. Retry serialization/deadlock errors with limits. Never fall back to local state on a failed configured database.
2. At start, snapshot the selected question IDs, question text/options/marks and a question-bank version, then use a CSPRNG Fisher–Yates shuffle. Keep option labels stable. Tie all answer saves to permanent question IDs, never displayed sequence numbers.
3. Use idempotency keys and monotonic versions for answer sync and uploads; validate timestamps server-side and prevent lost updates/replays. The deadline is server authoritative. Test reconnect and timeout boundaries.
4. Allow missing keys while candidates answer, but do not show or publish scores until a validated full key exists. Mark all submitted attempts transactionally against their immutable snapshot and verified key version; record who approved and released it. If a key changes after publication, require explicit withdrawal, audit and re-mark/re-release.
5. Use restricted DB roles, RLS where appropriate, explicit server-only access to answer keys, secure cookies, CSRF/origin protections, login throttling, security logs, secrets manager, least-privilege service accounts and tested backups. Current repo-backed admin authentication is a shared password and needs a proper identity/MFA system.

## Storage and live proctoring design

* Issue short-lived, attempt-scoped direct upload URLs. Encrypt media; enforce MIME/size and checksums; finalize only after durable storage confirms the object. Use idempotency keys, retry/backoff, reconciliation and orphan cleanup. Persist no credentials in CMS or JSON. Require consent and an approved privacy/retention policy; audit all evidence access and deletion. Keep retention, backup, legal hold, appeal and deletion rules consistent with Nigerian law and organisational policy.
* True live monitoring needs a separately engineered authorized live transport (e.g. WebRTC/SFU) and a scalable operator dashboard with role access, alerting and audit. Chunk uploads + manual refresh are not equivalent to live viewing. Validate whether one operator can monitor the required number of candidates.
* The current browser's target settings are roughly 320 kb/s per video stream plus 48 kb/s audio: approximately **688 kb/s/candidate**, or **172 Mb/s aggregate** and **77 GB/hour for 250 candidates** before overhead, retries, AI snapshots or variable bitrates. Three streams cut every 10 seconds imply about **75 upload requests/second** at 250 concurrent candidates. Treat as sizing estimates, not measurements; actual browser output, uplink speeds, codec, failures and quotas vary. Google Drive API usage and quotas must be checked for the specific account: https://developers.google.com/workspace/drive/api/guides/quotas . A consumer Drive folder and free quota should not be assumed sufficient.

## Provisioning, cutover and acceptance gates

1. Identify hosting project and owner; provision dedicated database, object storage and email accounts. Set `DATABASE_URL`, `EXAM_SESSION_SECRET`, `EXAM_CODE_PEPPER` and other secrets through the host's secret manager, not Git. Restrict network access and verify TLS. Do not rotate the code pepper without a migration strategy because existing access-code hashes depend on it.
2. Complete normalized persistence and migrate CMS, registrations, exam data and media metadata. Set up encrypted backup/PITR, alerts, runbooks, disaster recovery, restores and controlled rollback. Confirm all data persists across independent instances and deployments, not `/tmp`.
3. Add durable media upload and real-time operator monitoring; configure permissions, bandwidth, lifecycle policies, quota alerts and NDPA child/guardian consent and retention review.
4. Test on real desktop and mobile browsers with real cameras/microphones/screen sharing; include denial, unsupported, tab switching, reload, offline recovery, network loss, segment retries, Drive/object-store outages, replay, range streaming and deletion. Browser proctoring cannot detect every form of cheating, and AI allegations require human review.
5. Run isolated production-like 250-candidate load tests with real three-stream media, AI inference and admin monitoring, plus burst/retry/failure tests. Measure p50/p95/p99 latency, successful answer writes, lost/duplicated chunks, backlog, CPU/memory, DB lock wait/pool utilization, storage usage, bandwidth and costs. Agree written SLOs and recovery objectives, then prove them under load and during failures. Do not infer capacity from a successful build or a single HTTP test.
6. Conduct a small supervised pilot before the 250-person exam. Obtain explicit sign-off from the exam owner, database engineer, security/privacy lead and operations team. Until then, this system must not be represented as verified for production or as guaranteed to prevent malpractice.


## Local admin and later database setup

Local admin changes and submissions are saved in ignored `data/runtime/`, separate from checked-in seed files. They stay on this machine and are not automatically moved to a database. Back them up securely; submissions may contain personal data.

To use centralized admin storage later, provision a dedicated PostgreSQL database, apply `supabase/migrations/0001_prime_stem_examination_system.sql` with an appropriately privileged account, and set `DATABASE_URL` on every application instance. Content, submissions, and examination state use separate locked JSON rows in `site_content_store`; existing local changes are not automatically imported. Plan and verify a controlled migration before switching. These JSON rows are a transitional design, not the normalized, load-tested production architecture described above. Serverless content/submission writes fail if no database is configured. PostgreSQL operation has not been tested in this environment.

Private Drive folder: https://drive.google.com/drive/folders/1w4Olc_LfV-P5NHSic2o4sMt8pBcYaAFF. The connected Drive is not a credential available to the deployed application. Configure the folder ID and either OAuth refresh-token credentials or a service account with appropriate access, as described in `.env.example`; check storage quota and test real uploads and deletion before use. No application credential or upload has been configured or verified.

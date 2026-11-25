import {
  boolean,
  index,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

// =============================================================
// EXISTING PUBLIC TABLES (100% PRESERVED)
// =============================================================
export const contactMessages = pgTable("contact_messages", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone"),
  category: text("category").notNull(),
  subject: text("subject").notNull(),
  message: text("message").notNull(),
  status: varchar("status", { length: 32 }).default("New").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  category: text("category").notNull(),
  program: text("program").notNull(),
  message: text("message"),
  status: varchar("status", { length: 32 }).default("Pending").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const siteContentStore = pgTable("site_content_store", {
  key: varchar("key", { length: 64 }).primaryKey(),
  payload: jsonb("payload").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// =============================================================
// EXAMINATIONS, MCQs & SCHEDULES
// =============================================================
export const examinations = pgTable("examinations", {
  id: uuid("id").defaultRandom().primaryKey(),
  slug: varchar("slug", { length: 128 }).notNull().unique(),
  title: text("title").notNull(),
  competitionLabel: text("competition_label").notNull(),
  programSlug: varchar("program_slug", { length: 128 }).notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  description: text("description").notNull(),
  instructions: text("instructions").notNull(),
  durationMinutes: integer("duration_minutes").notNull().default(40),
  passMarkPercent: integer("pass_mark_percent").notNull().default(50),
  status: varchar("status", { length: 24 }).notNull().default("published"),
  resultsPublished: boolean("results_published").notNull().default(false),
  proctoringRequired: boolean("proctoring_required").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const examQuestions = pgTable(
  "exam_questions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    examId: uuid("exam_id")
      .notNull()
      .references(() => examinations.id, { onDelete: "cascade" }),
    prompt: text("prompt").notNull(),
    optionA: text("option_a").notNull(),
    optionB: text("option_b").notNull(),
    optionC: text("option_c").notNull(),
    optionD: text("option_d").notNull(),
    correctOption: varchar("correct_option", { length: 1 }).notNull(),
    points: integer("points").notNull().default(1),
    explanation: text("explanation"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("idx_exam_questions_exam_id").on(t.examId)]
);

export const examSchedules = pgTable(
  "exam_schedules",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    examId: uuid("exam_id")
      .notNull()
      .references(() => examinations.id, { onDelete: "cascade" }),
    label: text("label").notNull(),
    startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
    endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
    timezone: varchar("timezone", { length: 64 }).notNull().default("Africa/Lagos"),
    capacity: integer("capacity").notNull().default(250),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("idx_exam_schedules_exam_id").on(t.examId)]
);

// =============================================================
// CANDIDATES, ATTEMPTS, ANSWERS & PROCTORING VAULT
// =============================================================
export const examCandidates = pgTable(
  "exam_candidates",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    registrationId: integer("registration_id"),
    examId: uuid("exam_id")
      .notNull()
      .references(() => examinations.id, { onDelete: "cascade" }),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => examSchedules.id, { onDelete: "restrict" }),
    fullName: text("full_name").notNull(),
    email: text("email").notNull(),
    phone: text("phone").notNull(),
    schoolName: text("school_name").notNull(),
    category: text("category").notNull(),
    classLevel: text("class_level"),
    guardianName: text("guardian_name"),
    guardianPhone: text("guardian_phone"),
    parentConsentGiven: boolean("parent_consent_given").notNull().default(false),
    parentConsentAt: timestamp("parent_consent_at", { withTimezone: true }),
    approvalStatus: varchar("approval_status", { length: 32 })
      .notNull()
      .default("pending_approval"),
    accessCodeHash: text("access_code_hash"),
    accessCodeHint: varchar("access_code_hint", { length: 32 }),
    accessCodeActive: boolean("access_code_active").notNull().default(false),
    codeIssuedAt: timestamp("code_issued_at", { withTimezone: true }),
    codeSentAt: timestamp("code_sent_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("idx_exam_candidates_exam_id").on(t.examId),
    index("idx_exam_candidates_schedule_id").on(t.scheduleId),
  ]
);

export const examAttempts = pgTable(
  "exam_attempts",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => examCandidates.id, { onDelete: "cascade" })
      .unique(),
    examId: uuid("exam_id")
      .notNull()
      .references(() => examinations.id, { onDelete: "cascade" }),
    scheduleId: uuid("schedule_id")
      .notNull()
      .references(() => examSchedules.id, { onDelete: "restrict" }),
    status: varchar("status", { length: 36 }).notNull().default("setup"),
    shuffledQuestionIds: jsonb("shuffled_question_ids").$type<string[]>().notNull(),
    compatibilityMode: boolean("compatibility_mode").notNull().default(false),
    incompleteProctoring: boolean("incomplete_proctoring").notNull().default(false),
    screenStatus: varchar("screen_status", { length: 24 }).notNull().default("pending"),
    webcamStatus: varchar("webcam_status", { length: 24 }).notNull().default("pending"),
    audioStatus: varchar("audio_status", { length: 24 }).notNull().default("pending"),
    deviceInfo: jsonb("device_info"),
    tabSwitchCount: integer("tab_switch_count").notNull().default(0),
    aiSuspicionCount: integer("ai_suspicion_count").notNull().default(0),
    networkDropCount: integer("network_drop_count").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }),
    timerEndsAt: timestamp("timer_ends_at", { withTimezone: true }),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    submissionReason: text("submission_reason"),
    score: integer("score"),
    maxScore: integer("max_score"),
    percentage: integer("percentage"),
    resultReleased: boolean("result_released").notNull().default(false),
    adminReviewNotes: text("admin_review_notes"),
    lastHeartbeatAt: timestamp("last_heartbeat_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("idx_exam_attempts_exam_id").on(t.examId)]
);

export const examAnswers = pgTable(
  "exam_answers",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => examAttempts.id, { onDelete: "cascade" }),
    questionId: uuid("question_id")
      .notNull()
      .references(() => examQuestions.id, { onDelete: "cascade" }),
    selectedOption: varchar("selected_option", { length: 1 }),
    clientUpdatedAt: timestamp("client_updated_at", { withTimezone: true }).notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("uq_attempt_question_answer").on(t.attemptId, t.questionId),
    index("idx_exam_answers_attempt_id").on(t.attemptId),
  ]
);

export const proctoringRecordings = pgTable(
  "proctoring_recordings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => examAttempts.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => examCandidates.id, { onDelete: "cascade" }),
    streamType: varchar("stream_type", { length: 24 }).notNull(),
    segmentIndex: integer("segment_index").notNull().default(0),
    mimeType: varchar("mime_type", { length: 64 }).notNull(),
    sizeBytes: integer("size_bytes").notNull().default(0),
    durationMs: integer("duration_ms").notNull().default(0),
    storageProvider: varchar("storage_provider", { length: 32 }).notNull(),
    storageObjectKey: text("storage_object_key").notNull(),
    driveFileId: text("drive_file_id"),
    checksumSha256: varchar("checksum_sha256", { length: 64 }),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    endedAt: timestamp("ended_at", { withTimezone: true }).notNull(),
    wipedAt: timestamp("wiped_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("idx_proctoring_recordings_attempt_id").on(t.attemptId)]
);

export const proctoringEvents = pgTable(
  "proctoring_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    attemptId: uuid("attempt_id")
      .notNull()
      .references(() => examAttempts.id, { onDelete: "cascade" }),
    candidateId: uuid("candidate_id")
      .notNull()
      .references(() => examCandidates.id, { onDelete: "cascade" }),
    eventType: varchar("event_type", { length: 48 }).notNull(),
    classification: varchar("classification", { length: 32 }).notNull(),
    severity: varchar("severity", { length: 16 }).notNull(),
    details: text("details").notNull(),
    metadata: jsonb("metadata"),
    occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("idx_proctoring_events_attempt_id").on(t.attemptId)]
);

export const emailLogs = pgTable("email_logs", {
  id: uuid("id").defaultRandom().primaryKey(),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  category: varchar("category", { length: 48 }).notNull(),
  subject: text("subject").notNull(),
  status: varchar("status", { length: 24 }).notNull(),
  resendMessageId: text("resend_message_id"),
  errorMessage: text("error_message"),
  htmlPreview: text("html_preview"),
  relatedEntityId: text("related_entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const newsletterSubscribers = pgTable("newsletter_subscribers", {
  id: uuid("id").defaultRandom().primaryKey(),
  email: text("email").notNull().unique(),
  fullName: text("full_name"),
  source: varchar("source", { length: 48 }).notNull().default("footer"),
  status: varchar("status", { length: 24 }).notNull().default("active"),
  subscribedAt: timestamp("subscribed_at", { withTimezone: true }).defaultNow().notNull(),
});

export const systemIntegrationSettings = pgTable("system_integration_settings", {
  key: varchar("key", { length: 64 }).primaryKey(),
  config: jsonb("config").notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

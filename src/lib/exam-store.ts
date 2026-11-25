import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import { Pool } from "pg";
import {
  generateCandidateAccessCode,
  hashExamCode,
  normalizeExamCode,
  shuffleQuestionIds,
} from "@/lib/exam-security";

export type AnswerChoice = "A" | "B" | "C" | "D";

export interface ExaminationRecord {
  id: string;
  slug: string;
  title: string;
  competitionLabel: string;
  programSlug: string;
  category: string;
  description: string;
  instructions: string;
  durationMinutes: number;
  passMarkPercent: number;
  status: "draft" | "published" | "archived";
  resultsPublished: boolean;
  proctoringRequired: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ExamQuestionRecord {
  id: string; // Permanent UUID — never altered across candidate shuffles
  examId: string;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: AnswerChoice; // Server-protected! Never returned to candidates
  points: number;
  explanation: string;
  createdAt: string;
  updatedAt: string;
}

export interface SafeCandidateQuestion {
  id: string;
  orderIndex: number;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  points: number;
}

export interface ExamScheduleRecord {
  id: string;
  examId: string;
  label: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  capacity: number;
  isActive: boolean;
  createdAt: string;
}

export interface ExamCandidateRecord {
  id: string;
  registrationId: number | null;
  examId: string;
  scheduleId: string;
  fullName: string;
  email: string;
  phone: string;
  schoolName: string;
  category: string;
  classLevel: string;
  guardianName: string;
  guardianPhone: string;
  parentConsentGiven: boolean;
  parentConsentAt: string | null;
  approvalStatus: "pending_approval" | "approved" | "revoked";
  accessCodeHash: string | null;
  accessCodeHint: string;
  accessCodeActive: boolean;
  codeIssuedAt: string | null;
  codeSentAt: string | null;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type StreamPermissionState =
  | "pending"
  | "granted"
  | "denied"
  | "unsupported";

export interface ExamAttemptRecord {
  id: string;
  candidateId: string;
  examId: string;
  scheduleId: string;
  status:
    | "setup"
    | "in_progress"
    | "submitted"
    | "auto_submitted_violation"
    | "auto_submitted_timeout";
  shuffledQuestionIds: string[];
  compatibilityMode: boolean;
  incompleteProctoring: boolean;
  screenStatus: StreamPermissionState;
  webcamStatus: StreamPermissionState;
  audioStatus: StreamPermissionState;
  deviceInfo: Record<string, any>;
  tabSwitchCount: number;
  aiSuspicionCount: number;
  networkDropCount: number;
  startedAt: string | null;
  timerEndsAt: string | null;
  submittedAt: string | null;
  submissionReason: string | null;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  resultReleased: boolean;
  adminReviewNotes: string;
  lastHeartbeatAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ExamAnswerRecord {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOption: AnswerChoice | null;
  clientUpdatedAt: string;
  syncedAt: string;
}

export interface ProctoringRecordingRecord {
  id: string;
  attemptId: string;
  candidateId: string;
  streamType: "screen" | "webcam" | "audio" | "snapshot";
  segmentIndex: number;
  mimeType: string;
  sizeBytes: number;
  durationMs: number;
  storageProvider: "google_drive" | "local_vault";
  storageObjectKey: string;
  driveFileId: string | null;
  checksumSha256: string;
  startedAt: string;
  endedAt: string;
  wipedAt: string | null;
  createdAt: string;
}

export interface ProctoringEventRecord {
  id: string;
  attemptId: string;
  candidateId: string;
  eventType: string;
  classification: "ai_suspicion" | "verified_violation" | "system_notice";
  severity: "info" | "warning" | "critical";
  details: string;
  metadata?: Record<string, any>;
  occurredAt: string;
  createdAt: string;
}

export interface EmailLogRecord {
  id: string;
  recipientEmail: string;
  recipientName: string;
  category: string;
  subject: string;
  status: "sent" | "queued_no_api_key" | "failed";
  resendMessageId: string | null;
  errorMessage: string | null;
  htmlPreview: string;
  relatedEntityId: string | null;
  createdAt: string;
}

export interface NewsletterSubscriberRecord {
  id: string;
  email: string;
  fullName: string;
  source: string;
  status: "active" | "unsubscribed";
  subscribedAt: string;
}

export interface RawIntegrationSettings {
  resendApiKey: string;
  resendFromEmail: string;
  resendReplyTo: string;
  adminNotificationEmail: string;
  storagePreferredProvider: "google_drive" | "local_vault";
  googleDriveFolderId: string;
  googleDriveClientId: string;
  googleDriveClientSecret: string;
  googleDriveRefreshToken: string;
  googleServiceAccountEmail: string;
  googleServiceAccountPrivateKey: string;
  recordingRetentionDays: number;
  updatedAt: string;
}

interface ExamSystemState {
  examinations: ExaminationRecord[];
  questions: ExamQuestionRecord[];
  schedules: ExamScheduleRecord[];
  candidates: ExamCandidateRecord[];
  attempts: ExamAttemptRecord[];
  answers: ExamAnswerRecord[];
  recordings: ProctoringRecordingRecord[];
  events: ProctoringEventRecord[];
  emailLogs: EmailLogRecord[];
  subscribers: NewsletterSubscriberRecord[];
  integrationSettings: RawIntegrationSettings;
}

// =============================================================
// OFFICIAL SEED DATA (4 PRIME STEM COMPETITIONS, 30 MCQs, 5 SLOTS)
// =============================================================
function createInitialSeedState(): ExamSystemState {
  const now = "2026-11-14T08:00:00.000Z";

  const skcUpperId = "11111111-1111-4111-8111-111111111101";
  const skcLowerId = "11111111-1111-4111-8111-111111111102";
  const aoctExamId = "11111111-1111-4111-8111-111111111103";
  const anscExamId = "11111111-1111-4111-8111-111111111104";

  const examinations: ExaminationRecord[] = [
    {
      id: skcUpperId,
      slug: "skc-5th-edition-upper-jss",
      title:
        "5th Edition STEM Kids Championship — Upper Primary & Junior Secondary (Basic 5–6 & JSS 1–3)",
      competitionLabel: "5th Edition STEM Kids Championship (SKC)",
      programSlug: "stem-kids-championship",
      category: "Basic 5–6 & JSS 1–3",
      description:
        "Official online championship examination assessing Mathematics, Basic Science, Logic, and Computing Literacy for Upper Primary and Junior Secondary candidates.",
      instructions:
        "Remain clearly visible in front of your webcam throughout the examination. Keep Screen, Webcam, and Microphone active until final submission. Switching tabs once issues a formal warning; switching tabs a second time immediately auto-submits your examination.",
      durationMinutes: 40,
      passMarkPercent: 50,
      status: "published",
      resultsPublished: false,
      proctoringRequired: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: skcLowerId,
      slug: "skc-5th-edition-lower-primary",
      title: "5th Edition STEM Kids Championship — Lower Primary (Basic 3–4)",
      competitionLabel: "5th Edition STEM Kids Championship (SKC)",
      programSlug: "stem-kids-championship",
      category: "Basic 3–4",
      description:
        "Foundational STEM championship assessment in Quantitative Reasoning, Elementary Science, and Digital Discovery for Basic 3 and Basic 4 pupils.",
      instructions:
        "Ensure a parent, guardian, or school ICT coordinator helps complete the camera, microphone, and screen setup before clicking Start Examination. Once started, the candidate must answer independently without switching browser tabs.",
      durationMinutes: 35,
      passMarkPercent: 50,
      status: "published",
      resultsPublished: false,
      proctoringRequired: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: aoctExamId,
      slug: "aoct-qualifying-examination-2026",
      title:
        "African Organic Chemistry Tournament (AOCT) — National Qualifying Examination",
      competitionLabel: "African Organic Chemistry Tournament (AOCT)",
      programSlug: "african-organic-chemistry-tournament",
      category: "Senior Secondary (SSS 1–3)",
      description:
        "Rigorous Senior Secondary qualifying examination covering IUPAC nomenclature, functional group transformations, stereochemistry, and reaction mechanisms.",
      instructions:
        "Only plain rough-work paper and a non-programmable pen/pencil may be used; mobile phones and textbooks are strictly prohibited and monitored by AI vision. Leaving the examination tab twice triggers automatic submission.",
      durationMinutes: 45,
      passMarkPercent: 60,
      status: "published",
      resultsPublished: false,
      proctoringRequired: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: anscExamId,
      slug: "ansc-national-qualifying-exam",
      title:
        "Annual National Science Championship (ANSC) — Online Qualifying Assessment",
      competitionLabel: "Annual National Science Championship (ANSC)",
      programSlug: "annual-national-science-championship",
      category: "All Secondary Levels (JSS 1 – SSS 3)",
      description:
        "Multidisciplinary national STEM examination across Physics, Chemistry, Biology, Further Mathematics, and Applied Technology.",
      instructions:
        "Complete all pre-examination camera, microphone, and screen recording checks before starting. Read every question carefully; each has four options (A, B, C, D) with exactly one correct answer.",
      durationMinutes: 45,
      passMarkPercent: 55,
      status: "published",
      resultsPublished: false,
      proctoringRequired: true,
      createdAt: now,
      updatedAt: now,
    },
  ];

  const questions: ExamQuestionRecord[] = [
    // --- SKC Upper Primary & JSS 1–3 (10 Questions) ---
    {
      id: "22222222-2222-4222-8222-222222220101",
      examId: skcUpperId,
      prompt:
        "A solar-powered water pump fills 360 litres in 12 minutes at a constant rate. How many litres will it pump in 25 minutes?",
      optionA: "650 litres",
      optionB: "720 litres",
      optionC: "750 litres",
      optionD: "800 litres",
      correctOption: "C",
      points: 2,
      explanation: "Rate = 360 / 12 = 30 L/min; 30 × 25 = 750 litres.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220102",
      examId: skcUpperId,
      prompt:
        "Which organelle in a green plant cell is directly responsible for converting light energy into chemical energy during photosynthesis?",
      optionA: "Mitochondrion",
      optionB: "Chloroplast",
      optionC: "Ribosome",
      optionD: "Golgi apparatus",
      correctOption: "B",
      points: 2,
      explanation: "Chloroplasts contain chlorophyll for photosynthesis.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220103",
      examId: skcUpperId,
      prompt:
        "In computer science, what is the decimal (base-10) equivalent of the binary number 101101₂?",
      optionA: "43",
      optionB: "45",
      optionC: "47",
      optionD: "53",
      correctOption: "B",
      points: 2,
      explanation: "32 + 0 + 8 + 4 + 0 + 1 = 45.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220104",
      examId: skcUpperId,
      prompt: "If 3x − 7 = 2x + 11, what is the value of x² − 100?",
      optionA: "224",
      optionB: "196",
      optionC: "256",
      optionD: "144",
      correctOption: "A",
      points: 2,
      explanation: "x = 18, so x² − 100 = 324 − 100 = 224.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220105",
      examId: skcUpperId,
      prompt:
        "Which gas makes up approximately 78% of Earth's dry atmosphere by volume?",
      optionA: "Oxygen",
      optionB: "Carbon dioxide",
      optionC: "Argon",
      optionD: "Nitrogen",
      correctOption: "D",
      points: 2,
      explanation: "Nitrogen (N₂) constitutes ~78% of Earth's atmosphere.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220106",
      examId: skcUpperId,
      prompt:
        "An electrical circuit has a voltage source of 12 V connected across a 4 Ω resistor. What current flows through the resistor?",
      optionA: "0.33 A",
      optionB: "3 A",
      optionC: "8 A",
      optionD: "48 A",
      correctOption: "B",
      points: 2,
      explanation: "Ohm's Law: I = V / R = 12 / 4 = 3 A.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220107",
      examId: skcUpperId,
      prompt:
        "Which protocol is specifically responsible for encrypting data transmitted between a web browser and a secure website?",
      optionA: "FTP",
      optionB: "HTTP",
      optionC: "HTTPS (TLS)",
      optionD: "SMTP",
      correctOption: "C",
      points: 2,
      explanation: "HTTPS over TLS encrypts browser-to-server traffic.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220108",
      examId: skcUpperId,
      prompt:
        "The interior angles of a triangle are in the ratio 2 : 3 : 4. What is the measure of the largest angle?",
      optionA: "60°",
      optionB: "80°",
      optionC: "90°",
      optionD: "100°",
      correctOption: "B",
      points: 2,
      explanation: "(4 / 9) × 180° = 80°.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220109",
      examId: skcUpperId,
      prompt:
        "Which change of state occurs directly from solid to gas without passing through the liquid state?",
      optionA: "Condensation",
      optionB: "Evaporation",
      optionC: "Sublimation",
      optionD: "Melting",
      correctOption: "C",
      points: 2,
      explanation: "Sublimation transitions directly from solid to vapour.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220110",
      examId: skcUpperId,
      prompt:
        "In robotics, which component acts as the sensor that measures obstacle distance using high-frequency sound waves?",
      optionA: "Servo motor",
      optionB: "Ultrasonic sensor",
      optionC: "Light-emitting diode",
      optionD: "Breadboard",
      correctOption: "B",
      points: 2,
      explanation: "Ultrasonic sensors emit acoustic pulses to measure distance.",
      createdAt: now,
      updatedAt: now,
    },

    // --- SKC Lower Primary Basic 3–4 (6 Questions) ---
    {
      id: "22222222-2222-4222-8222-222222220201",
      examId: skcLowerId,
      prompt:
        "A school science club planted 8 rows of mango seedlings with 9 seedlings in each row. How many seedlings were planted altogether?",
      optionA: "64",
      optionB: "72",
      optionC: "81",
      optionD: "68",
      correctOption: "B",
      points: 2,
      explanation: "8 × 9 = 72 seedlings.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220202",
      examId: skcLowerId,
      prompt:
        "Which part of a plant absorbs water and mineral salts from the soil?",
      optionA: "Flower",
      optionB: "Leaf",
      optionC: "Root",
      optionD: "Fruit",
      correctOption: "C",
      points: 2,
      explanation: "Plant roots absorb water and dissolved minerals.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220203",
      examId: skcLowerId,
      prompt:
        "Which computer device is mainly used to move the pointer and click items on the monitor screen?",
      optionA: "Speaker",
      optionB: "Printer",
      optionC: "Mouse",
      optionD: "Projector",
      correctOption: "C",
      points: 2,
      explanation: "A mouse is a pointing input device.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220204",
      examId: skcLowerId,
      prompt: "What is the next number in the pattern: 5, 11, 17, 23, ___?",
      optionA: "27",
      optionB: "28",
      optionC: "29",
      optionD: "30",
      correctOption: "C",
      points: 2,
      explanation: "Add 6 each step: 23 + 6 = 29.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220205",
      examId: skcLowerId,
      prompt:
        "At standard sea-level pressure, pure water boils at what temperature on the Celsius scale?",
      optionA: "0°C",
      optionB: "37°C",
      optionC: "50°C",
      optionD: "100°C",
      correctOption: "D",
      points: 2,
      explanation: "Pure water boils at 100°C at 1 atm.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220206",
      examId: skcLowerId,
      prompt: "How many faces does a solid cube have?",
      optionA: "4",
      optionB: "6",
      optionC: "8",
      optionD: "12",
      correctOption: "B",
      points: 2,
      explanation: "A cube has 6 square faces.",
      createdAt: now,
      updatedAt: now,
    },

    // --- African Organic Chemistry Tournament (AOCT) — SSS 1–3 (8 Questions) ---
    {
      id: "22222222-2222-4222-8222-222222220301",
      examId: aoctExamId,
      prompt:
        "What is the correct IUPAC name of the branched alkane (CH₃)₂CHCH₂CH(CH₂CH₃)CH₃?",
      optionA: "2,4-dimethylhexane",
      optionB: "3,5-dimethylhexane",
      optionC: "2-methyl-4-ethylpentane",
      optionD: "4-ethyl-2-methylpentane",
      correctOption: "A",
      points: 3,
      explanation: "Longest chain has 6 carbons; lowest locants give 2,4-dimethylhexane.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220302",
      examId: aoctExamId,
      prompt:
        "According to Markovnikov's rule, what is the major organic product when propene (CH₃CH=CH₂) reacts with dry HBr in the absence of peroxides?",
      optionA: "1-bromopropane",
      optionB: "2-bromopropane",
      optionC: "1,2-dibromopropane",
      optionD: "propan-2-ol",
      correctOption: "B",
      points: 3,
      explanation: "Electrophilic addition forms the more stable secondary carbocation yielding 2-bromopropane.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220303",
      examId: aoctExamId,
      prompt:
        "Which hybridisation state describes each carbon atom in a benzene (C₆H₆) ring?",
      optionA: "sp",
      optionB: "sp²",
      optionC: "sp³",
      optionD: "dsp²",
      correctOption: "B",
      points: 3,
      explanation: "All six ring carbons in benzene are trigonal planar sp² hybridised.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220304",
      examId: aoctExamId,
      prompt:
        "Which reagent cleanly distinguishes an aldehyde (such as ethanal) from a ketone (such as propanone) by producing a silver mirror?",
      optionA: "Lucas reagent (ZnCl₂ / conc. HCl)",
      optionB: "Bromine water",
      optionC: "Tollens' ammoniacal silver nitrate reagent",
      optionD: "Aqueous sodium hydrogen trioxocarbonate(IV)",
      correctOption: "C",
      points: 3,
      explanation: "Tollens' reagent oxidises aldehydes while reducing Ag⁺ to metallic silver.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220305",
      examId: aoctExamId,
      prompt:
        "In a bimolecular nucleophilic substitution (Sₙ2) reaction at a chiral carbon centre, what stereochemical outcome is observed?",
      optionA: "Complete racemisation",
      optionB: "Retention of configuration only",
      optionC: "Walden inversion of configuration",
      optionD: "Carbocation rearrangement",
      correctOption: "C",
      points: 3,
      explanation: "Backside nucleophilic attack in Sₙ2 produces Walden inversion.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220306",
      examId: aoctExamId,
      prompt:
        "Complete oxidation of a primary alkanol (RCH₂OH) using excess acidified potassium heptaoxodichromate(VI) under reflux yields:",
      optionA: "A ketone",
      optionB: "An alkene",
      optionC: "An alkanoic (carboxylic) acid",
      optionD: "An alkoxyalkane (ether)",
      correctOption: "C",
      points: 3,
      explanation: "Primary alcohols oxidise under reflux to carboxylic acids.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220307",
      examId: aoctExamId,
      prompt:
        "How many constitutional isomers exist for the molecular formula C₄H₁₀O that contain an —OH (alkanol) functional group?",
      optionA: "2",
      optionB: "3",
      optionC: "4",
      optionD: "5",
      correctOption: "C",
      points: 3,
      explanation: "Butan-1-ol, butan-2-ol, 2-methylpropan-1-ol, and 2-methylpropan-2-ol (4 isomers).",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220308",
      examId: aoctExamId,
      prompt:
        "Acid-catalysed reaction between ethanoic acid and ethanol under reflux produces a sweet-smelling compound named:",
      optionA: "Diethyl ether",
      optionB: "Ethyl ethanoate",
      optionC: "Methyl propanoate",
      optionD: "Butan-2-one",
      correctOption: "B",
      points: 3,
      explanation: "Fischer esterification of ethanoic acid + ethanol yields ethyl ethanoate.",
      createdAt: now,
      updatedAt: now,
    },

    // --- ANSC (6 Questions) ---
    {
      id: "22222222-2222-4222-8222-222222220401",
      examId: anscExamId,
      prompt:
        "A projectile is launched vertically upward at 30 m/s (take g = 10 m/s²). What maximum height does it reach?",
      optionA: "30 m",
      optionB: "45 m",
      optionC: "60 m",
      optionD: "90 m",
      correctOption: "B",
      points: 2,
      explanation: "h = u² / (2g) = 900 / 20 = 45 m.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220402",
      examId: anscExamId,
      prompt:
        "What is the pH of a 0.001 mol/dm³ aqueous solution of HCl assuming complete dissociation at 25°C?",
      optionA: "1",
      optionB: "2",
      optionC: "3",
      optionD: "4",
      correctOption: "C",
      points: 2,
      explanation: "pH = −log₁₀(10⁻³) = 3.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220403",
      examId: anscExamId,
      prompt:
        "During human cellular genetics, if a Messenger RNA codon reads AUG, what is the corresponding anticodon on Transfer RNA?",
      optionA: "TAC",
      optionB: "UAC",
      optionC: "ATG",
      optionD: "GUA",
      correctOption: "B",
      points: 2,
      explanation: "RNA pairs A↔U and G↔C, giving UAC.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220404",
      examId: anscExamId,
      prompt: "If log₁₀(x) + log₁₀(5) = 2, what is the value of x?",
      optionA: "10",
      optionB: "20",
      optionC: "25",
      optionD: "40",
      correctOption: "B",
      points: 2,
      explanation: "log₁₀(5x) = 2 ⇒ 5x = 100 ⇒ x = 20.",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220405",
      examId: anscExamId,
      prompt:
        "Which algorithmic time complexity represents binary search on a sorted array of n elements?",
      optionA: "O(n²)",
      optionB: "O(n)",
      optionC: "O(log n)",
      optionD: "O(n log n)",
      correctOption: "C",
      points: 2,
      explanation: "Binary search halves the search interval each iteration: O(log n).",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "22222222-2222-4222-8222-222222220406",
      examId: anscExamId,
      prompt:
        "Two resistors of 6 Ω and 3 Ω are connected in parallel. What is their combined equivalent resistance?",
      optionA: "2 Ω",
      optionB: "4.5 Ω",
      optionC: "9 Ω",
      optionD: "18 Ω",
      correctOption: "A",
      points: 2,
      explanation: "R = (6 × 3) / (6 + 3) = 18 / 9 = 2 Ω.",
      createdAt: now,
      updatedAt: now,
    },
  ];

  // Official Online Examination Schedules (including active Nov 14–28/30, 2026 windows!)
  const schedules: ExamScheduleRecord[] = [
    {
      id: "33333333-3333-4333-8333-333333330101",
      examId: skcUpperId,
      label: "SKC Online Window — Batch A (Nov 14–28, 2026 Daily Portal)",
      startsAt: "2026-11-14T07:00:00.000Z",
      endsAt: "2026-11-28T22:59:59.000Z",
      timezone: "Africa/Lagos",
      capacity: 1000,
      isActive: true,
      createdAt: now,
    },
    {
      id: "33333333-3333-4333-8333-333333330102",
      examId: skcUpperId,
      label: "SKC Online Finale — Saturday Morning Slot (Nov 28, 2026)",
      startsAt: "2026-11-28T08:00:00.000Z",
      endsAt: "2026-11-28T15:00:00.000Z",
      timezone: "Africa/Lagos",
      capacity: 500,
      isActive: true,
      createdAt: now,
    },
    {
      id: "33333333-3333-4333-8333-333333330201",
      examId: skcLowerId,
      label: "SKC Lower Primary Online Window (Nov 14–28, 2026)",
      startsAt: "2026-11-14T07:00:00.000Z",
      endsAt: "2026-11-28T22:59:59.000Z",
      timezone: "Africa/Lagos",
      capacity: 800,
      isActive: true,
      createdAt: now,
    },
    {
      id: "33333333-3333-4333-8333-333333330301",
      examId: aoctExamId,
      label: "AOCT Online Qualifying Window — November 2026 Session",
      startsAt: "2026-11-14T07:00:00.000Z",
      endsAt: "2026-11-30T22:59:59.000Z",
      timezone: "Africa/Lagos",
      capacity: 500,
      isActive: true,
      createdAt: now,
    },
    {
      id: "33333333-3333-4333-8333-333333330401",
      examId: anscExamId,
      label: "ANSC National Qualifying — March 20, 2027 Morning Session",
      startsAt: "2027-03-20T09:00:00.000Z",
      endsAt: "2027-03-20T15:00:00.000Z",
      timezone: "Africa/Lagos",
      capacity: 1500,
      isActive: true,
      createdAt: now,
    },
  ];

  return {
    examinations,
    questions,
    schedules,
    candidates: [],
    attempts: [],
    answers: [],
    recordings: [],
    events: [],
    emailLogs: [],
    subscribers: [],
    integrationSettings: {
      resendApiKey: "",
      resendFromEmail:
        process.env.RESEND_FROM_EMAIL ||
        "Prime STEM Nigeria <exams@primestemnigeria.afristemglobal.org>",
      resendReplyTo:
        process.env.RESEND_REPLY_TO || "primestemnigeria@gmail.com",
      adminNotificationEmail:
        process.env.ADMIN_NOTIFICATION_EMAIL || "primestemnigeria@gmail.com",
      storagePreferredProvider: "google_drive",
      googleDriveFolderId: "",
      googleDriveClientId: "",
      googleDriveClientSecret: "",
      googleDriveRefreshToken: "",
      googleServiceAccountEmail: "",
      googleServiceAccountPrivateKey: "",
      recordingRetentionDays: 60,
      updatedAt: now,
    },
  };
}

// =============================================================
// DUAL-MODE PERSISTENCE (POSTGRESQL + LOCAL TRANSACTIONAL JSON)
// =============================================================
const SEED_DIR = path.join(process.cwd(), "data");
const IS_SERVERLESS = Boolean(process.env.VERCEL);
const RUNTIME_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), "prime-stem-data")
  : SEED_DIR;
const EXAM_DB_FILENAME = "exam-system.json";

const globalStore = globalThis as typeof globalThis & {
  __psnExamMutex?: Promise<void>;
  __psnPgPool?: Pool | null;
  __psnPgInit?: boolean;
};

function getPgPool(): Pool | null {
  const url = process.env.DATABASE_URL;
  if (!url || !url.trim()) return null;
  if (globalStore.__psnPgPool !== undefined) return globalStore.__psnPgPool;
  try {
    globalStore.__psnPgPool = new Pool({
      connectionString: url,
      max: 10,
      ssl:
        url.includes("supabase.co") || url.includes("sslmode=require")
          ? { rejectUnauthorized: false }
          : undefined,
    });
    return globalStore.__psnPgPool;
  } catch (err) {
    console.warn("[exam-store] PG Pool init failed:", err);
    globalStore.__psnPgPool = null;
    return null;
  }
}

async function ensurePgKvTable(pool: Pool): Promise<void> {
  if (globalStore.__psnPgInit) return;
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public.site_content_store (
      key VARCHAR(64) PRIMARY KEY,
      payload JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
  globalStore.__psnPgInit = true;
}

function readLocalState(): ExamSystemState {
  const dirs = RUNTIME_DIR === SEED_DIR ? [SEED_DIR] : [RUNTIME_DIR, SEED_DIR];
  for (const dir of dirs) {
    const file = path.join(dir, EXAM_DB_FILENAME);
    if (fs.existsSync(file)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(file, "utf-8"));
        const seed = createInitialSeedState();
        return {
          ...seed,
          ...parsed,
          integrationSettings: {
            ...seed.integrationSettings,
            ...(parsed.integrationSettings || {}),
          },
        };
      } catch (err) {
        console.warn("[exam-store] Local state parse fallback:", err);
      }
    }
  }
  const initial = createInitialSeedState();
  writeLocalState(initial);
  return initial;
}

function writeLocalState(state: ExamSystemState): void {
  const dirs = RUNTIME_DIR === SEED_DIR ? [SEED_DIR] : [RUNTIME_DIR, SEED_DIR];
  for (const dir of dirs) {
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const target = path.join(dir, EXAM_DB_FILENAME);
      const tmp = `${target}.${process.pid}.${Date.now()}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(state, null, 2), "utf-8");
      fs.renameSync(tmp, target);
      return;
    } catch (err) {
      console.warn(`[exam-store] Local write skipped in ${dir}:`, err);
    }
  }
}

async function loadExamState(): Promise<ExamSystemState> {
  const pool = getPgPool();
  if (pool) {
    try {
      await ensurePgKvTable(pool);
      const res = await pool.query(
        "SELECT payload FROM public.site_content_store WHERE key = $1 LIMIT 1",
        ["exam_system_v2"]
      );
      if (res.rows.length > 0 && res.rows[0].payload) {
        const seed = createInitialSeedState();
        const remote = res.rows[0].payload as Partial<ExamSystemState>;
        return {
          ...seed,
          ...remote,
          integrationSettings: {
            ...seed.integrationSettings,
            ...(remote.integrationSettings || {}),
          },
        };
      }
      const initial = readLocalState();
      await pool.query(
        `INSERT INTO public.site_content_store (key, payload, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (key) DO NOTHING`,
        ["exam_system_v2", JSON.stringify(initial)]
      );
      return initial;
    } catch (err) {
      console.warn("[exam-store] PG read fallback to local:", err);
    }
  }
  return readLocalState();
}

async function saveExamState(state: ExamSystemState): Promise<void> {
  const pool = getPgPool();
  if (pool) {
    try {
      await ensurePgKvTable(pool);
      await pool.query(
        `INSERT INTO public.site_content_store (key, payload, updated_at)
         VALUES ($1, $2::jsonb, NOW())
         ON CONFLICT (key) DO UPDATE SET payload = EXCLUDED.payload, updated_at = NOW()`,
        ["exam_system_v2", JSON.stringify(state)]
      );
      return;
    } catch (err) {
      console.warn("[exam-store] PG write fallback to local:", err);
    }
  }
  writeLocalState(state);
}

async function withExamTransaction<T>(
  fn: (state: ExamSystemState) => Promise<T> | T
): Promise<T> {
  const prev = globalStore.__psnExamMutex || Promise.resolve();
  let release!: () => void;
  globalStore.__psnExamMutex = new Promise<void>((resolve) => {
    release = resolve;
  });
  await prev;
  try {
    const state = await loadExamState();
    const out = await fn(state);
    await saveExamState(state);
    return out;
  } finally {
    release();
  }
}

function buildCodeHint(plainCode: string): string {
  if (plainCode.length <= 6) return plainCode;
  return `${plainCode.slice(0, 4)}••••${plainCode.slice(-3)}`;
}

// =============================================================
// PUBLIC QUERIES & REGISTRATION
// =============================================================
export async function listPublicExamsAndSchedules() {
  const state = await loadExamState();
  const activeExams = state.examinations.filter(
    (e) => e.status === "published"
  );

  return {
    examinations: activeExams.map((exam) => {
      const examSchedules = state.schedules
        .filter((s) => s.examId === exam.id && s.isActive)
        .map((s) => {
          const enrolled = state.candidates.filter(
            (c) => c.scheduleId === s.id && c.approvalStatus !== "revoked"
          ).length;
          return {
            id: s.id,
            examId: s.examId,
            label: s.label,
            startsAt: s.startsAt,
            endsAt: s.endsAt,
            timezone: s.timezone,
            capacity: s.capacity,
            remainingSeats: Math.max(0, s.capacity - enrolled),
          };
        })
        .filter((s) => s.remainingSeats > 0);

      return {
        id: exam.id,
        slug: exam.slug,
        title: exam.title,
        competitionLabel: exam.competitionLabel,
        programSlug: exam.programSlug,
        category: exam.category,
        description: exam.description,
        durationMinutes: exam.durationMinutes,
        proctoringRequired: exam.proctoringRequired,
        schedules: examSchedules,
      };
    }),
  };
}

export async function registerExamCandidate(input: {
  registrationId?: number | null;
  examId: string;
  scheduleId: string;
  fullName: string;
  email: string;
  phone: string;
  schoolName: string;
  category: string;
  classLevel?: string;
  guardianName?: string;
  guardianPhone?: string;
  parentConsentGiven: boolean;
  notes?: string;
}): Promise<{
  candidate: ExamCandidateRecord;
  exam: ExaminationRecord;
  schedule: ExamScheduleRecord;
}> {
  if (!input.parentConsentGiven) {
    throw new Error(
      "Parent, Legal Guardian, or Authorised School consent is mandatory."
    );
  }

  return withExamTransaction((state) => {
    const exam = state.examinations.find(
      (e) => e.id === input.examId && e.status === "published"
    );
    if (!exam) {
      throw new Error("Selected examination is not open for registration.");
    }

    const schedule = state.schedules.find(
      (s) => s.id === input.scheduleId && s.examId === exam.id && s.isActive
    );
    if (!schedule) {
      throw new Error(
        "Please select a valid Administrator-published examination date & time slot."
      );
    }

    const enrolledCount = state.candidates.filter(
      (c) => c.scheduleId === schedule.id && c.approvalStatus !== "revoked"
    ).length;
    if (enrolledCount >= schedule.capacity) {
      throw new Error("Selected examination schedule slot is full.");
    }

    const now = new Date().toISOString();
    // Decision 4: Code is NOT active until Administrator approves & generates/customises code
    const candidate: ExamCandidateRecord = {
      id: crypto.randomUUID(),
      registrationId: input.registrationId ?? null,
      examId: exam.id,
      scheduleId: schedule.id,
      fullName: input.fullName.trim(),
      email: input.email.trim().toLowerCase(),
      phone: input.phone.trim(),
      schoolName: input.schoolName.trim(),
      category: input.category.trim(),
      classLevel: (input.classLevel || input.category).trim(),
      guardianName: (input.guardianName || "").trim(),
      guardianPhone: (input.guardianPhone || input.phone).trim(),
      parentConsentGiven: true,
      parentConsentAt: now,
      approvalStatus: "pending_approval",
      accessCodeHash: null,
      accessCodeHint: "",
      accessCodeActive: false,
      codeIssuedAt: null,
      codeSentAt: null,
      notes: (input.notes || "").trim(),
      createdAt: now,
      updatedAt: now,
    };

    state.candidates.unshift(candidate);
    return { candidate: { ...candidate }, exam: { ...exam }, schedule: { ...schedule } };
  });
}

// =============================================================
// ADMIN APPROVAL, AUTO-GENERATED OR CUSTOM ACCESS CODE ISSUANCE
// =============================================================
export async function approveCandidateAndIssueCode(input: {
  candidateId: string;
  customCode?: string;
  scheduleId?: string;
  notes?: string;
}): Promise<{
  candidate: ExamCandidateRecord;
  exam: ExaminationRecord;
  schedule: ExamScheduleRecord;
  plainAccessCode: string;
}> {
  return withExamTransaction((state) => {
    const candidate = state.candidates.find((c) => c.id === input.candidateId);
    if (!candidate) throw new Error("Candidate not found.");

    const exam = state.examinations.find((e) => e.id === candidate.examId);
    if (!exam) throw new Error("Associated examination not found.");

    if (input.scheduleId && input.scheduleId !== candidate.scheduleId) {
      const nextSlot = state.schedules.find(
        (s) => s.id === input.scheduleId && s.examId === exam.id
      );
      if (!nextSlot) throw new Error("Schedule slot does not match examination.");
      candidate.scheduleId = nextSlot.id;
    }

    const schedule = state.schedules.find((s) => s.id === candidate.scheduleId);
    if (!schedule) throw new Error("Candidate schedule not found.");

    let plainCode: string;
    let codeHash: string;

    if (input.customCode && input.customCode.trim().length > 0) {
      const cleaned = normalizeExamCode(input.customCode);
      if (cleaned.length < 4 || cleaned.length > 40) {
        throw new Error(
          "Custom examination code must be between 4 and 40 characters."
        );
      }
      if (!/^[A-Z0-9_-]+$/.test(cleaned)) {
        throw new Error(
          "Custom code may only contain uppercase letters, numbers, hyphens (-), and underscores (_)."
        );
      }
      codeHash = hashExamCode(cleaned);
      const duplicate = state.candidates.find(
        (c) => c.id !== candidate.id && c.accessCodeHash === codeHash
      );
      if (duplicate) {
        throw new Error(
          `Access code "${cleaned}" is already assigned to another candidate (${duplicate.fullName}).`
        );
      }
      plainCode = cleaned;
    } else {
      const prefix =
        exam.programSlug === "stem-kids-championship"
          ? "PSN-SKC"
          : exam.programSlug === "african-organic-chemistry-tournament"
          ? "PSN-AOCT"
          : exam.programSlug === "annual-national-science-championship"
          ? "PSN-ANSC"
          : "PSN";
      let tries = 0;
      do {
        plainCode = generateCandidateAccessCode(prefix);
        codeHash = hashExamCode(plainCode);
        tries += 1;
        if (tries > 50) throw new Error("Could not generate unique code.");
      } while (
        state.candidates.some(
          (c) => c.id !== candidate.id && c.accessCodeHash === codeHash
        )
      );
    }

    const now = new Date().toISOString();
    candidate.approvalStatus = "approved";
    candidate.accessCodeHash = codeHash;
    candidate.accessCodeHint = buildCodeHint(plainCode);
    candidate.accessCodeActive = true;
    candidate.codeIssuedAt = now;
    candidate.codeSentAt = now;
    if (input.notes !== undefined) candidate.notes = input.notes;
    candidate.updatedAt = now;

    return {
      candidate: { ...candidate },
      exam: { ...exam },
      schedule: { ...schedule },
      plainAccessCode: plainCode,
    };
  });
}

export async function revokeCandidateAccess(
  candidateId: string,
  reason?: string
): Promise<ExamCandidateRecord> {
  return withExamTransaction((state) => {
    const candidate = state.candidates.find((c) => c.id === candidateId);
    if (!candidate) throw new Error("Candidate not found.");
    candidate.approvalStatus = "revoked";
    candidate.accessCodeActive = false;
    if (reason) candidate.notes = reason;
    candidate.updatedAt = new Date().toISOString();
    return { ...candidate };
  });
}

export async function deleteCandidate(candidateId: string): Promise<boolean> {
  return withExamTransaction((state) => {
    const before = state.candidates.length;
    state.candidates = state.candidates.filter((c) => c.id !== candidateId);
    const attemptIds = new Set(
      state.attempts
        .filter((a) => a.candidateId === candidateId)
        .map((a) => a.id)
    );
    state.attempts = state.attempts.filter((a) => a.candidateId !== candidateId);
    state.answers = state.answers.filter((ans) => !attemptIds.has(ans.attemptId));
    state.events = state.events.filter((ev) => !attemptIds.has(ev.attemptId));
    return state.candidates.length < before;
  });
}

// =============================================================
// CANDIDATE ACCESS VALIDATION, SHUFFLING, PROCTORING & MARKING
// =============================================================
function projectSafeQuestionsForAttempt(
  state: ExamSystemState,
  attempt: ExamAttemptRecord
): SafeCandidateQuestion[] {
  const qById = new Map<string, ExamQuestionRecord>();
  for (const q of state.questions) {
    if (q.examId === attempt.examId) {
      qById.set(q.id, q);
    }
  }
  const out: SafeCandidateQuestion[] = [];
  const seen = new Set<string>();
  for (const qId of attempt.shuffledQuestionIds) {
    if (seen.has(qId)) continue;
    const q = qById.get(qId);
    if (!q) continue;
    seen.add(qId);
    // CRITICAL: Options A, B, C, D remain in exact original order; correctOption is NEVER exposed!
    out.push({
      id: q.id,
      orderIndex: out.length + 1,
      prompt: q.prompt,
      optionA: q.optionA,
      optionB: q.optionB,
      optionC: q.optionC,
      optionD: q.optionD,
      points: q.points,
    });
  }
  return out;
}

function finalizeAttemptMarkingInternal(
  state: ExamSystemState,
  attempt: ExamAttemptRecord,
  exam: ExaminationRecord,
  finalStatus:
    | "submitted"
    | "auto_submitted_violation"
    | "auto_submitted_timeout",
  reason: string
): void {
  if (
    attempt.status === "submitted" ||
    attempt.status === "auto_submitted_violation" ||
    attempt.status === "auto_submitted_timeout"
  ) {
    return;
  }

  // Mark strictly by permanent Question UUID against original server-only correctOption
  const questionMap = new Map<string, ExamQuestionRecord>();
  for (const q of state.questions) {
    if (q.examId === exam.id) questionMap.set(q.id, q);
  }

  const answerMap = new Map<string, ExamAnswerRecord>();
  for (const ans of state.answers) {
    if (ans.attemptId === attempt.id) answerMap.set(ans.questionId, ans);
  }

  let score = 0;
  let maxScore = 0;
  const seen = new Set<string>();

  for (const permanentQuestionId of attempt.shuffledQuestionIds) {
    if (seen.has(permanentQuestionId)) continue;
    const q = questionMap.get(permanentQuestionId);
    if (!q) continue;
    seen.add(permanentQuestionId);

    const pts = Math.max(1, Number(q.points) || 1);
    maxScore += pts;

    const given = answerMap.get(permanentQuestionId);
    if (given && given.selectedOption === q.correctOption) {
      score += pts;
    }
  }

  const percentage = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
  const nowIso = new Date().toISOString();

  attempt.status = finalStatus;
  attempt.submittedAt = nowIso;
  attempt.submissionReason = reason;
  attempt.score = score;
  attempt.maxScore = maxScore;
  attempt.percentage = percentage;
  attempt.updatedAt = nowIso;
}

function sanitizeAttemptForStudent(
  attempt: ExamAttemptRecord,
  exam: ExaminationRecord
): ExamAttemptRecord {
  const showScore = exam.resultsPublished || attempt.resultReleased;
  return {
    ...attempt,
    score: showScore ? attempt.score : null,
    maxScore: showScore ? attempt.maxScore : null,
    percentage: showScore ? attempt.percentage : null,
  };
}

export async function validateCandidateAccessAndCreateAttempt(input: {
  email: string;
  accessCode: string;
  userAgent: string;
  ipAddress: string;
}): Promise<
  | {
      ok: true;
      candidate: ExamCandidateRecord;
      exam: ExaminationRecord;
      schedule: ExamScheduleRecord;
      attempt: ExamAttemptRecord;
    }
  | { ok: false; error: string; code: string }
> {
  const cleanEmail = input.email.trim().toLowerCase();
  const cleanCode = normalizeExamCode(input.accessCode);
  const codeHash = hashExamCode(cleanCode);

  return withExamTransaction((state) => {
    // Check if candidate exists by email but is still pending approval
    const emailCandidates = state.candidates.filter(
      (c) => c.email.toLowerCase() === cleanEmail
    );
    const matchedByHash = state.candidates.find(
      (c) => c.accessCodeHash === codeHash
    );

    if (!matchedByHash) {
      if (
        emailCandidates.some((c) => c.approvalStatus === "pending_approval")
      ) {
        return {
          ok: false,
          code: "PENDING_APPROVAL",
          error:
            "Your registration has been received and is awaiting Administrator payment/approval verification. Your active Examination Access Code will be emailed automatically once approved.",
        };
      }
      return {
        ok: false,
        code: "INVALID_CODE",
        error:
          "Invalid Examination Access Code. Please check the active code sent to your email and try again.",
      };
    }

    if (matchedByHash.email.toLowerCase() !== cleanEmail) {
      return {
        ok: false,
        code: "EMAIL_MISMATCH",
        error:
          "Access Denied: This Examination Access Code does not belong to the email address entered.",
      };
    }

    if (
      matchedByHash.approvalStatus !== "approved" ||
      !matchedByHash.accessCodeActive
    ) {
      return {
        ok: false,
        code:
          matchedByHash.approvalStatus === "pending_approval"
            ? "PENDING_APPROVAL"
            : "REVOKED",
        error:
          matchedByHash.approvalStatus === "pending_approval"
            ? "Your Examination Access Code is not active yet — awaiting Administrator confirmation."
            : "This Examination Access Code has been deactivated by the Administrator.",
      };
    }

    const exam = state.examinations.find(
      (e) => e.id === matchedByHash.examId && e.status === "published"
    );
    if (!exam) {
      return {
        ok: false,
        code: "EXAM_UNAVAILABLE",
        error: "The associated examination is not currently active.",
      };
    }

    const examQuestions = state.questions.filter((q) => q.examId === exam.id);
    if (examQuestions.length === 0) {
      return {
        ok: false,
        code: "NO_QUESTIONS",
        error: "Questions have not yet been published for this examination.",
      };
    }

    const schedule = state.schedules.find(
      (s) => s.id === matchedByHash.scheduleId && s.examId === exam.id
    );
    if (!schedule || !schedule.isActive) {
      return {
        ok: false,
        code: "SCHEDULE_INACTIVE",
        error: "Your assigned examination schedule is currently inactive.",
      };
    }

    let attempt = state.attempts.find(
      (a) => a.candidateId === matchedByHash.id
    );

    const nowMs = Date.now();
    const startMs = new Date(schedule.startsAt).getTime();
    const endMs = new Date(schedule.endsAt).getTime();

    const alreadyCompleted =
      attempt &&
      ["submitted", "auto_submitted_violation", "auto_submitted_timeout"].includes(
        attempt.status
      );

    const resumingInProgress =
      attempt &&
      attempt.status === "in_progress" &&
      attempt.timerEndsAt &&
      nowMs <= new Date(attempt.timerEndsAt).getTime() + 5 * 60_000;

    if (!alreadyCompleted && !resumingInProgress) {
      if (nowMs < startMs) {
        return {
          ok: false,
          code: "TOO_EARLY",
          error: `Your scheduled examination slot (${schedule.label}) opens at ${new Date(
            schedule.startsAt
          ).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} WAT.`,
        };
      }
      if (nowMs > endMs) {
        return {
          ok: false,
          code: "WINDOW_CLOSED",
          error: `Your scheduled examination window (${schedule.label}) closed at ${new Date(
            schedule.endsAt
          ).toLocaleString("en-NG", { timeZone: "Africa/Lagos" })} WAT.`,
        };
      }
    }

    if (!attempt) {
      const nowIso = new Date().toISOString();
      // Independent random question order per candidate (options A-D untouched!)
      const shuffledIds = shuffleQuestionIds(examQuestions.map((q) => q.id));
      attempt = {
        id: crypto.randomUUID(),
        candidateId: matchedByHash.id,
        examId: exam.id,
        scheduleId: schedule.id,
        status: "setup",
        shuffledQuestionIds: shuffledIds,
        compatibilityMode: false,
        incompleteProctoring: false,
        screenStatus: "pending",
        webcamStatus: "pending",
        audioStatus: "pending",
        deviceInfo: {
          userAgent: input.userAgent,
          ipAddress: input.ipAddress,
        },
        tabSwitchCount: 0,
        aiSuspicionCount: 0,
        networkDropCount: 0,
        startedAt: null,
        timerEndsAt: null,
        submittedAt: null,
        submissionReason: null,
        score: null,
        maxScore: null,
        percentage: null,
        resultReleased: false,
        adminReviewNotes: "",
        lastHeartbeatAt: nowIso,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      state.attempts.unshift(attempt);
    }

    return {
      ok: true,
      candidate: { ...matchedByHash },
      exam: { ...exam },
      schedule: { ...schedule },
      attempt: sanitizeAttemptForStudent(attempt, exam),
    };
  });
}

export async function getSessionPayloadForAttempt(attemptId: string): Promise<{
  candidate: ExamCandidateRecord;
  exam: ExaminationRecord;
  schedule: ExamScheduleRecord;
  attempt: ExamAttemptRecord;
  questions: SafeCandidateQuestion[];
  answers: Record<string, AnswerChoice | null>;
} | null> {
  return withExamTransaction((state) => {
    const attempt = state.attempts.find((a) => a.id === attemptId);
    if (!attempt) return null;

    const candidate = state.candidates.find((c) => c.id === attempt.candidateId);
    const exam = state.examinations.find((e) => e.id === attempt.examId);
    const schedule = state.schedules.find((s) => s.id === attempt.scheduleId);
    if (!candidate || !exam || !schedule) return null;

    // Auto-expire if timer + 5-min reconnection grace has completely elapsed
    if (
      attempt.status === "in_progress" &&
      attempt.timerEndsAt &&
      Date.now() > new Date(attempt.timerEndsAt).getTime() + 5 * 60_000
    ) {
      finalizeAttemptMarkingInternal(
        state,
        attempt,
        exam,
        "auto_submitted_timeout",
        "Examination timer expired (including offline reconnection grace window)."
      );
    }

    // Questions are ONLY projected once setup is passed and attempt is in_progress
    const questions =
      attempt.status === "in_progress"
        ? projectSafeQuestionsForAttempt(state, attempt)
        : [];

    const answersMap: Record<string, AnswerChoice | null> = {};
    for (const ans of state.answers) {
      if (ans.attemptId === attempt.id) {
        answersMap[ans.questionId] = ans.selectedOption;
      }
    }

    return {
      candidate: { ...candidate },
      exam: { ...exam },
      schedule: { ...schedule },
      attempt: sanitizeAttemptForStudent(attempt, exam),
      questions,
      answers: answersMap,
    };
  });
}

export async function startExamAttemptAfterSetup(input: {
  attemptId: string;
  candidateId: string;
  screenStatus: "granted" | "denied" | "unsupported";
  webcamStatus: "granted" | "denied" | "unsupported";
  audioStatus: "granted" | "denied" | "unsupported";
  consentConfirmed: boolean;
  userAgent: string;
}): Promise<
  | {
      ok: true;
      attempt: ExamAttemptRecord;
      questions: SafeCandidateQuestion[];
    }
  | { ok: false; error: string }
> {
  if (!input.consentConfirmed) {
    return {
      ok: false,
      error:
        "Parent, Legal Guardian, or Authorised School consent must be confirmed before starting.",
    };
  }

  // Phase 4.2: Block immediately if any supported capability was denied
  if (
    input.screenStatus === "denied" ||
    input.webcamStatus === "denied" ||
    input.audioStatus === "denied"
  ) {
    return {
      ok: false,
      error:
        "Examination start blocked: Your device supports all required proctoring streams, so permission denial is not permitted. Please grant Screen, Webcam, and Microphone permissions.",
    };
  }

  return withExamTransaction((state) => {
    const attempt = state.attempts.find(
      (a) => a.id === input.attemptId && a.candidateId === input.candidateId
    );
    if (!attempt) return { ok: false, error: "Attempt record not found." };

    const exam = state.examinations.find((e) => e.id === attempt.examId);
    if (!exam) return { ok: false, error: "Examination not found." };

    if (
      ["submitted", "auto_submitted_violation", "auto_submitted_timeout"].includes(
        attempt.status
      )
    ) {
      return { ok: false, error: "This examination has already been submitted." };
    }

    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();

    const isCompat =
      input.screenStatus === "unsupported" ||
      input.webcamStatus === "unsupported" ||
      input.audioStatus === "unsupported";

    attempt.screenStatus = input.screenStatus;
    attempt.webcamStatus = input.webcamStatus;
    attempt.audioStatus = input.audioStatus;
    attempt.compatibilityMode = isCompat;
    attempt.incompleteProctoring = isCompat;
    attempt.deviceInfo = {
      ...(attempt.deviceInfo || {}),
      userAgent: input.userAgent,
      setupCompletedAt: nowIso,
    };

    if (attempt.status === "setup" || !attempt.startedAt || !attempt.timerEndsAt) {
      attempt.status = "in_progress";
      attempt.startedAt = nowIso;
      attempt.timerEndsAt = new Date(
        nowMs + exam.durationMinutes * 60_000
      ).toISOString();
    }
    attempt.lastHeartbeatAt = nowIso;
    attempt.updatedAt = nowIso;

    if (isCompat) {
      const unavailableList = [
        input.screenStatus === "unsupported" ? "Screen Recording" : null,
        input.webcamStatus === "unsupported" ? "Webcam" : null,
        input.audioStatus === "unsupported" ? "Microphone" : null,
      ]
        .filter(Boolean)
        .join(", ");

      const hasCompatEvent = state.events.some(
        (ev) =>
          ev.attemptId === attempt.id && ev.eventType === "compatibility_mode"
      );
      if (!hasCompatEvent) {
        state.events.push({
          id: crypto.randomUUID(),
          attemptId: attempt.id,
          candidateId: attempt.candidateId,
          eventType: "compatibility_mode",
          classification: "system_notice",
          severity: "warning",
          details: `Alternative Device Compatibility Mode activated — unsupported on candidate hardware/browser: ${unavailableList}.`,
          occurredAt: nowIso,
          createdAt: nowIso,
        });
      }
    }

    const questions = projectSafeQuestionsForAttempt(state, attempt);
    return {
      ok: true,
      attempt: sanitizeAttemptForStudent(attempt, exam),
      questions,
    };
  });
}

function upsertAnswersBatchInternal(
  state: ExamSystemState,
  attempt: ExamAttemptRecord,
  answers: Array<{
    questionId: string;
    selectedOption: AnswerChoice | null;
    clientUpdatedAt: string;
  }>
): number {
  const validQuestionIds = new Set(attempt.shuffledQuestionIds);
  const nowIso = new Date().toISOString();
  let savedCount = 0;

  for (const item of answers) {
    if (!validQuestionIds.has(item.questionId)) continue;
    const existing = state.answers.find(
      (a) => a.attemptId === attempt.id && a.questionId === item.questionId
    );
    const incomingMs = new Date(item.clientUpdatedAt).getTime() || Date.now();

    if (existing) {
      const existingMs = new Date(existing.clientUpdatedAt).getTime() || 0;
      if (incomingMs >= existingMs) {
        existing.selectedOption = item.selectedOption;
        existing.clientUpdatedAt = new Date(incomingMs).toISOString();
        existing.syncedAt = nowIso;
        savedCount += 1;
      }
    } else {
      state.answers.push({
        id: crypto.randomUUID(),
        attemptId: attempt.id,
        questionId: item.questionId,
        selectedOption: item.selectedOption,
        clientUpdatedAt: new Date(incomingMs).toISOString(),
        syncedAt: nowIso,
      });
      savedCount += 1;
    }
  }
  return savedCount;
}

export async function saveCandidateAnswers(input: {
  attemptId: string;
  candidateId: string;
  answers: Array<{
    questionId: string;
    selectedOption: AnswerChoice | null;
    clientUpdatedAt: string;
  }>;
  reconnectedSync?: boolean;
}): Promise<
  | { ok: true; savedCount: number; attempt: ExamAttemptRecord }
  | { ok: false; error: string; alreadySubmitted?: boolean }
> {
  return withExamTransaction((state) => {
    const attempt = state.attempts.find(
      (a) => a.id === input.attemptId && a.candidateId === input.candidateId
    );
    if (!attempt) return { ok: false, error: "Attempt not found." };

    const exam = state.examinations.find((e) => e.id === attempt.examId);
    if (!exam) return { ok: false, error: "Examination not found." };

    if (attempt.status !== "in_progress") {
      return {
        ok: false,
        error: "Examination is no longer accepting answers.",
        alreadySubmitted: attempt.status !== "setup",
      };
    }

    const nowMs = Date.now();
    const endMs = attempt.timerEndsAt
      ? new Date(attempt.timerEndsAt).getTime()
      : nowMs;
    const graceMs = input.reconnectedSync ? 5 * 60_000 : 30_000;

    if (nowMs > endMs + graceMs) {
      finalizeAttemptMarkingInternal(
        state,
        attempt,
        exam,
        "auto_submitted_timeout",
        "Timer expired beyond offline reconnection grace window."
      );
      return {
        ok: false,
        error: "Examination time has expired.",
        alreadySubmitted: true,
      };
    }

    const savedCount = upsertAnswersBatchInternal(state, attempt, input.answers);
    attempt.lastHeartbeatAt = new Date(nowMs).toISOString();
    attempt.updatedAt = attempt.lastHeartbeatAt;

    if (nowMs > endMs) {
      finalizeAttemptMarkingInternal(
        state,
        attempt,
        exam,
        "auto_submitted_timeout",
        "Offline-recovered answers synced within grace window upon timer expiry."
      );
    }

    return {
      ok: true,
      savedCount,
      attempt: sanitizeAttemptForStudent(attempt, exam),
    };
  });
}

export async function recordProctoringOrTabEvent(input: {
  attemptId: string;
  candidateId: string;
  eventType: string;
  classification: "ai_suspicion" | "verified_violation" | "system_notice";
  severity: "info" | "warning" | "critical";
  details: string;
  occurredAt?: string;
  pendingAnswers?: Array<{
    questionId: string;
    selectedOption: AnswerChoice | null;
    clientUpdatedAt: string;
  }>;
}): Promise<
  | {
      ok: true;
      attempt: ExamAttemptRecord;
      strikeAction: "none" | "warning_1" | "auto_submitted";
      autoSubmitted: boolean;
    }
  | { ok: false; error: string }
> {
  return withExamTransaction((state) => {
    const attempt = state.attempts.find(
      (a) => a.id === input.attemptId && a.candidateId === input.candidateId
    );
    if (!attempt) return { ok: false, error: "Attempt not found." };

    const exam = state.examinations.find((e) => e.id === attempt.examId);
    if (!exam) return { ok: false, error: "Examination not found." };

    if (attempt.status === "in_progress" && input.pendingAnswers?.length) {
      upsertAnswersBatchInternal(state, attempt, input.pendingAnswers);
    }

    const nowIso = new Date().toISOString();
    const occurredAt = input.occurredAt || nowIso;

    // PHASE 5: TWO-STRIKE TAB-SWITCHING ENFORCEMENT
    if (input.eventType === "tab_switch" && attempt.status === "in_progress") {
      attempt.tabSwitchCount += 1;

      if (attempt.tabSwitchCount === 1) {
        state.events.push({
          id: crypto.randomUUID(),
          attemptId: attempt.id,
          candidateId: attempt.candidateId,
          eventType: "tab_switch_warning_1",
          classification: "verified_violation",
          severity: "warning",
          details: `Strike 1 of 2: ${input.details}`,
          occurredAt,
          createdAt: nowIso,
        });
        attempt.updatedAt = nowIso;
        return {
          ok: true,
          attempt: sanitizeAttemptForStudent(attempt, exam),
          strikeAction: "warning_1",
          autoSubmitted: false,
        };
      }

      // Strike 2 -> Immediate Server-Enforced Auto-Submission & Marking!
      state.events.push({
        id: crypto.randomUUID(),
        attemptId: attempt.id,
        candidateId: attempt.candidateId,
        eventType: "tab_switch_auto_submit_2",
        classification: "verified_violation",
        severity: "critical",
        details: `Strike 2 of 2 (Auto-Submitted): ${input.details}`,
        occurredAt,
        createdAt: nowIso,
      });

      finalizeAttemptMarkingInternal(
        state,
        attempt,
        exam,
        "auto_submitted_violation",
        "Automatically submitted by anti-malpractice engine upon 2nd tab/window departure."
      );

      return {
        ok: true,
        attempt: sanitizeAttemptForStudent(attempt, exam),
        strikeAction: "auto_submitted",
        autoSubmitted: true,
      };
    }

    if (input.classification === "ai_suspicion") {
      attempt.aiSuspicionCount += 1;
    }
    if (input.eventType === "network_reconnected") {
      attempt.networkDropCount += 1;
    }
    if (input.eventType.startsWith("stream_stopped_")) {
      attempt.incompleteProctoring = true;
    }

    state.events.push({
      id: crypto.randomUUID(),
      attemptId: attempt.id,
      candidateId: attempt.candidateId,
      eventType: input.eventType,
      classification: input.classification,
      severity: input.severity,
      details: input.details,
      occurredAt,
      createdAt: nowIso,
    });
    attempt.updatedAt = nowIso;

    return {
      ok: true,
      attempt: sanitizeAttemptForStudent(attempt, exam),
      strikeAction: "none",
      autoSubmitted: false,
    };
  });
}

export async function submitExamAttempt(input: {
  attemptId: string;
  candidateId: string;
  mode: "submitted" | "auto_submitted_timeout";
  reason: string;
  finalAnswers?: Array<{
    questionId: string;
    selectedOption: AnswerChoice | null;
    clientUpdatedAt: string;
  }>;
}): Promise<
  | {
      ok: true;
      attempt: ExamAttemptRecord;
      exam: ExaminationRecord;
      alreadySubmitted: boolean;
    }
  | { ok: false; error: string }
> {
  return withExamTransaction((state) => {
    const attempt = state.attempts.find(
      (a) => a.id === input.attemptId && a.candidateId === input.candidateId
    );
    if (!attempt) return { ok: false, error: "Attempt not found." };

    const exam = state.examinations.find((e) => e.id === attempt.examId);
    if (!exam) return { ok: false, error: "Examination not found." };

    const wasDone = [
      "submitted",
      "auto_submitted_violation",
      "auto_submitted_timeout",
    ].includes(attempt.status);

    if (!wasDone) {
      if (input.finalAnswers?.length) {
        upsertAnswersBatchInternal(state, attempt, input.finalAnswers);
      }
      finalizeAttemptMarkingInternal(
        state,
        attempt,
        exam,
        input.mode,
        input.reason
      );
    }

    return {
      ok: true,
      attempt: sanitizeAttemptForStudent(attempt, exam),
      exam: { ...exam },
      alreadySubmitted: wasDone,
    };
  });
}

export async function lookupCandidateResultByCode(input: {
  email: string;
  accessCode: string;
}): Promise<
  | {
      ok: true;
      candidate: {
        fullName: string;
        email: string;
        schoolName: string;
        classLevel: string;
      };
      exam: {
        title: string;
        competitionLabel: string;
        passMarkPercent: number;
      };
      attempt: {
        status: string;
        submittedAt: string | null;
        score: number | null;
        maxScore: number | null;
        percentage: number | null;
      } | null;
      resultVisible: boolean;
    }
  | { ok: false; error: string }
> {
  const state = await loadExamState();
  const codeHash = hashExamCode(input.accessCode);
  const cleanEmail = input.email.trim().toLowerCase();

  const candidate = state.candidates.find((c) => c.accessCodeHash === codeHash);
  if (!candidate || candidate.email.toLowerCase() !== cleanEmail) {
    return {
      ok: false,
      error:
        "No matching candidate record found for that Email and Examination Access Code.",
    };
  }

  const exam = state.examinations.find((e) => e.id === candidate.examId);
  if (!exam) return { ok: false, error: "Examination record not found." };

  const attempt =
    state.attempts.find(
      (a) =>
        a.candidateId === candidate.id &&
        ["submitted", "auto_submitted_violation", "auto_submitted_timeout"].includes(
          a.status
        )
    ) || null;

  const resultVisible = Boolean(
    attempt && (exam.resultsPublished || attempt.resultReleased)
  );

  return {
    ok: true,
    candidate: {
      fullName: candidate.fullName,
      email: candidate.email,
      schoolName: candidate.schoolName,
      classLevel: candidate.classLevel,
    },
    exam: {
      title: exam.title,
      competitionLabel: exam.competitionLabel,
      passMarkPercent: exam.passMarkPercent,
    },
    attempt: attempt
      ? {
          status: attempt.status,
          submittedAt: attempt.submittedAt,
          score: resultVisible ? attempt.score : null,
          maxScore: resultVisible ? attempt.maxScore : null,
          percentage: resultVisible ? attempt.percentage : null,
        }
      : null,
    resultVisible,
  };
}

// =============================================================
// PROCTORING RECORDING METADATA & ADMIN OVERSIGHT
// =============================================================
export async function recordUploadedRecordingChunk(
  input: Omit<ProctoringRecordingRecord, "id" | "wipedAt" | "createdAt">
): Promise<ProctoringRecordingRecord> {
  return withExamTransaction((state) => {
    const rec: ProctoringRecordingRecord = {
      ...input,
      id: crypto.randomUUID(),
      wipedAt: null,
      createdAt: new Date().toISOString(),
    };
    state.recordings.push(rec);
    return rec;
  });
}

export async function getRecordingById(
  id: string
): Promise<ProctoringRecordingRecord | null> {
  const state = await loadExamState();
  return state.recordings.find((r) => r.id === id) || null;
}

export async function markRecordingSyncedToDrive(
  id: string,
  driveFileId: string
): Promise<void> {
  return withExamTransaction((state) => {
    const rec = state.recordings.find((r) => r.id === id);
    if (rec) {
      rec.storageProvider = "google_drive";
      rec.driveFileId = driveFileId;
    }
  });
}

export async function markRecordingWiped(id: string): Promise<void> {
  return withExamTransaction((state) => {
    const rec = state.recordings.find((r) => r.id === id);
    if (rec) {
      rec.wipedAt = new Date().toISOString();
    }
  });
}

// =============================================================
// ADMIN DASHBOARD SNAPSHOT & CRUD OPERATIONS
// =============================================================
export async function getRawIntegrationSettings(): Promise<RawIntegrationSettings> {
  const state = await loadExamState();
  return state.integrationSettings;
}

export async function getIntegrationSettingsSafe() {
  const raw = await getRawIntegrationSettings();
  return {
    resendFromEmail: raw.resendFromEmail,
    resendReplyTo: raw.resendReplyTo,
    adminNotificationEmail: raw.adminNotificationEmail,
    hasResendKey: Boolean(process.env.RESEND_API_KEY || raw.resendApiKey),
    storagePreferredProvider: raw.storagePreferredProvider,
    googleDriveFolderId:
      process.env.GOOGLE_DRIVE_FOLDER_ID || raw.googleDriveFolderId,
    googleDriveClientId:
      process.env.GOOGLE_DRIVE_CLIENT_ID || raw.googleDriveClientId,
    googleServiceAccountEmail:
      process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL || raw.googleServiceAccountEmail,
    hasGoogleDriveCredentials: Boolean(
      (process.env.GOOGLE_DRIVE_FOLDER_ID || raw.googleDriveFolderId) &&
        ((process.env.GOOGLE_DRIVE_REFRESH_TOKEN ||
          raw.googleDriveRefreshToken) ||
          (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
            raw.googleServiceAccountPrivateKey))
    ),
    recordingRetentionDays: raw.recordingRetentionDays,
    updatedAt: raw.updatedAt,
  };
}

export async function updateIntegrationSettings(
  patch: Partial<RawIntegrationSettings>
) {
  await withExamTransaction((state) => {
    state.integrationSettings = {
      ...state.integrationSettings,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
  });
  return getIntegrationSettingsSafe();
}

export async function getAdminExamDashboardSnapshot() {
  const state = await loadExamState();
  const safeInt = await getIntegrationSettingsSafe();
  return {
    examinations: state.examinations,
    questions: state.questions,
    schedules: state.schedules,
    candidates: state.candidates,
    attempts: state.attempts,
    recordings: state.recordings,
    events: state.events,
    emailLogs: state.emailLogs.slice(0, 300),
    subscribers: state.subscribers,
    integrationSettings: safeInt,
  };
}

export async function getAdminAttemptDetail(attemptId: string) {
  const state = await loadExamState();
  const attempt = state.attempts.find((a) => a.id === attemptId);
  if (!attempt) return null;

  const candidate = state.candidates.find((c) => c.id === attempt.candidateId);
  const exam = state.examinations.find((e) => e.id === attempt.examId);
  const schedule = state.schedules.find((s) => s.id === attempt.scheduleId);
  if (!candidate || !exam) return null;

  const qMap = new Map(state.questions.map((q) => [q.id, q]));
  const aMap = new Map(
    state.answers
      .filter((ans) => ans.attemptId === attempt.id)
      .map((ans) => [ans.questionId, ans])
  );

  const questionBreakdown = attempt.shuffledQuestionIds
    .map((qId) => {
      const q = qMap.get(qId);
      if (!q) return null;
      const ans = aMap.get(qId);
      const selected = ans?.selectedOption || null;
      const isCorrect = selected === q.correctOption;
      return {
        questionId: q.id,
        prompt: q.prompt,
        selectedOption: selected,
        correctOption: q.correctOption,
        points: q.points,
        earnedPoints: isCorrect ? q.points : 0,
        isCorrect,
      };
    })
    .filter(Boolean);

  return {
    attempt,
    candidate,
    exam,
    schedule,
    recordings: state.recordings.filter((r) => r.attemptId === attempt.id),
    events: state.events
      .filter((ev) => ev.attemptId === attempt.id)
      .sort(
        (a, b) =>
          new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime()
      ),
    questionBreakdown,
  };
}

export async function upsertExamination(input: {
  id?: string;
  slug?: string;
  title: string;
  competitionLabel: string;
  programSlug: string;
  category: string;
  description: string;
  instructions: string;
  durationMinutes: number;
  passMarkPercent: number;
  status: "draft" | "published" | "archived";
  resultsPublished: boolean;
  proctoringRequired: boolean;
}): Promise<ExaminationRecord> {
  if (!input.title) throw new Error("Examination title is required.");
  return withExamTransaction((state) => {
    const now = new Date().toISOString();
    if (input.id) {
      const idx = state.examinations.findIndex((e) => e.id === input.id);
      if (idx === -1) throw new Error("Examination not found.");
      const updated: ExaminationRecord = {
        ...state.examinations[idx],
        ...input,
        id: state.examinations[idx].id,
        slug: state.examinations[idx].slug,
        updatedAt: now,
      };
      state.examinations[idx] = updated;
      return updated;
    }

    const baseSlug =
      (input.slug || input.title)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "") || `exam-${Date.now()}`;
    const slug = state.examinations.some((e) => e.slug === baseSlug)
      ? `${baseSlug}-${crypto.randomBytes(2).toString("hex")}`
      : baseSlug;

    const created: ExaminationRecord = {
      id: crypto.randomUUID(),
      slug,
      title: input.title,
      competitionLabel: input.competitionLabel,
      programSlug: input.programSlug,
      category: input.category,
      description: input.description,
      instructions: input.instructions,
      durationMinutes: Math.max(5, Number(input.durationMinutes) || 35),
      passMarkPercent: Math.min(
        100,
        Math.max(1, Number(input.passMarkPercent) || 50)
      ),
      status: input.status || "published",
      resultsPublished: Boolean(input.resultsPublished),
      proctoringRequired: input.proctoringRequired !== false,
      createdAt: now,
      updatedAt: now,
    };
    state.examinations.unshift(created);
    return created;
  });
}

export async function setExamResultsPublished(input: {
  examId: string;
  published: boolean;
}): Promise<ExaminationRecord> {
  return withExamTransaction((state) => {
    const exam = state.examinations.find((e) => e.id === input.examId);
    if (!exam) throw new Error("Examination not found.");
    exam.resultsPublished = input.published;
    exam.updatedAt = new Date().toISOString();
    return { ...exam };
  });
}

export async function setAttemptResultRelease(input: {
  attemptId: string;
  released: boolean;
  adminReviewNotes?: string;
}): Promise<ExamAttemptRecord> {
  return withExamTransaction((state) => {
    const attempt = state.attempts.find((a) => a.id === input.attemptId);
    if (!attempt) throw new Error("Attempt not found.");
    attempt.resultReleased = input.released;
    if (input.adminReviewNotes !== undefined) {
      attempt.adminReviewNotes = input.adminReviewNotes;
    }
    attempt.updatedAt = new Date().toISOString();
    return { ...attempt };
  });
}

export async function deleteExamination(id: string): Promise<boolean> {
  return withExamTransaction((state) => {
    const before = state.examinations.length;
    state.examinations = state.examinations.filter((e) => e.id !== id);
    state.questions = state.questions.filter((q) => q.examId !== id);
    state.schedules = state.schedules.filter((s) => s.examId !== id);
    state.candidates = state.candidates.filter((c) => c.examId !== id);
    state.attempts = state.attempts.filter((a) => a.examId !== id);
    return state.examinations.length < before;
  });
}

export async function upsertQuestion(input: {
  id?: string;
  examId: string;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: AnswerChoice;
  points: number;
  explanation: string;
}): Promise<ExamQuestionRecord> {
  return withExamTransaction((state) => {
    const now = new Date().toISOString();
    if (input.id) {
      const idx = state.questions.findIndex((q) => q.id === input.id);
      if (idx === -1) throw new Error("Question not found.");
      const updated: ExamQuestionRecord = {
        ...state.questions[idx],
        ...input,
        id: state.questions[idx].id, // Permanent UUID preserved!
        updatedAt: now,
      };
      state.questions[idx] = updated;
      return updated;
    }

    const created: ExamQuestionRecord = {
      id: crypto.randomUUID(),
      examId: input.examId,
      prompt: input.prompt,
      optionA: input.optionA,
      optionB: input.optionB,
      optionC: input.optionC,
      optionD: input.optionD,
      correctOption: input.correctOption,
      points: Math.max(1, Number(input.points) || 1),
      explanation: input.explanation || "",
      createdAt: now,
      updatedAt: now,
    };
    state.questions.push(created);
    return created;
  });
}

export async function deleteQuestion(id: string): Promise<boolean> {
  return withExamTransaction((state) => {
    const before = state.questions.length;
    state.questions = state.questions.filter((q) => q.id !== id);
    return state.questions.length < before;
  });
}

export async function upsertSchedule(input: {
  id?: string;
  examId: string;
  label: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  capacity: number;
  isActive: boolean;
}): Promise<ExamScheduleRecord> {
  return withExamTransaction((state) => {
    if (input.id) {
      const idx = state.schedules.findIndex((s) => s.id === input.id);
      if (idx === -1) throw new Error("Schedule slot not found.");
      const updated: ExamScheduleRecord = {
        ...state.schedules[idx],
        ...input,
        id: state.schedules[idx].id,
      };
      state.schedules[idx] = updated;
      return updated;
    }

    const created: ExamScheduleRecord = {
      id: crypto.randomUUID(),
      examId: input.examId,
      label: input.label,
      startsAt: input.startsAt,
      endsAt: input.endsAt,
      timezone: input.timezone || "Africa/Lagos",
      capacity: Math.max(1, Number(input.capacity) || 250),
      isActive: input.isActive !== false,
      createdAt: new Date().toISOString(),
    };
    state.schedules.push(created);
    return created;
  });
}

export async function deleteSchedule(id: string): Promise<boolean> {
  return withExamTransaction((state) => {
    const before = state.schedules.length;
    state.schedules = state.schedules.filter((s) => s.id !== id);
    return state.schedules.length < before;
  });
}

// =============================================================
// RESEND EMAIL LOGS & NEWSLETTER SUBSCRIBERS
// =============================================================
export async function recordEmailLog(
  entry: Omit<EmailLogRecord, "id" | "createdAt">
): Promise<EmailLogRecord> {
  return withExamTransaction((state) => {
    const created: EmailLogRecord = {
      ...entry,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    state.emailLogs.unshift(created);
    return created;
  });
}

export async function listEmailLogs(limit = 300): Promise<EmailLogRecord[]> {
  const state = await loadExamState();
  return state.emailLogs.slice(0, limit);
}

export async function updateEmailLogStatus(input: {
  id: string;
  status: "sent" | "queued_no_api_key" | "failed";
  resendMessageId?: string | null;
  errorMessage?: string | null;
}): Promise<void> {
  return withExamTransaction((state) => {
    const item = state.emailLogs.find((l) => l.id === input.id);
    if (item) {
      item.status = input.status;
      if (input.resendMessageId !== undefined) {
        item.resendMessageId = input.resendMessageId;
      }
      if (input.errorMessage !== undefined) {
        item.errorMessage = input.errorMessage;
      }
    }
  });
}

export async function subscribeNewsletter(input: {
  email: string;
  fullName?: string;
  source?: string;
}): Promise<{
  subscriber: NewsletterSubscriberRecord;
  alreadySubscribed: boolean;
}> {
  return withExamTransaction((state) => {
    const cleanEmail = input.email.trim().toLowerCase();
    const existing = state.subscribers.find(
      (s) => s.email.toLowerCase() === cleanEmail
    );
    if (existing) {
      const wasActive = existing.status === "active";
      existing.status = "active";
      if (input.fullName) existing.fullName = input.fullName.trim();
      return { subscriber: { ...existing }, alreadySubscribed: wasActive };
    }

    const created: NewsletterSubscriberRecord = {
      id: crypto.randomUUID(),
      email: cleanEmail,
      fullName: (input.fullName || "").trim(),
      source: input.source || "footer",
      status: "active",
      subscribedAt: new Date().toISOString(),
    };
    state.subscribers.unshift(created);
    return { subscriber: created, alreadySubscribed: false };
  });
}

export async function listNewsletterSubscribers(): Promise<
  NewsletterSubscriberRecord[]
> {
  const state = await loadExamState();
  return state.subscribers;
}

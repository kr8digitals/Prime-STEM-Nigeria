import {
  ExamAttemptRecord,
  ExamCandidateRecord,
  ExaminationRecord,
  ExamScheduleRecord,
  getRawIntegrationSettings,
  listEmailLogs,
  recordEmailLog,
  updateEmailLogStatus,
} from "@/lib/exam-store";

export interface SendEmailInput {
  recipientEmail: string;
  recipientName?: string;
  category:
    | "registration_pending"
    | "exam_access_code"
    | "exam_submission"
    | "exam_result_released"
    | "contact_acknowledgement"
    | "admin_notification"
    | "newsletter_welcome"
    | "newsletter_broadcast"
    | "admin_custom";
  subject: string;
  htmlBody: string;
  relatedEntityId?: string | null;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function wrapPrimeStemEmailTemplate(params: {
  badge: string;
  heading: string;
  bodyHtml: string;
  ctaLabel?: string;
  ctaUrl?: string;
}): string {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://primestemnigeria.afristemglobal.org";
  const ctaBlock =
    params.ctaLabel && params.ctaUrl
      ? `<div style="margin:28px 0;text-align:center;">
          <a href="${escapeHtml(params.ctaUrl)}" style="display:inline-block;background:#2563EB;color:#FFFFFF;font-weight:700;font-size:15px;padding:14px 28px;border-radius:10px;text-decoration:none;">
            ${escapeHtml(params.ctaLabel)}
          </a>
        </div>`
      : "";

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(params.heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:#F1F5F9;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#0F172A;">
  <div style="max-width:640px;margin:24px auto;background:#FFFFFF;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;box-shadow:0 8px 24px rgba(15,23,42,0.06);">
    <div style="background:linear-gradient(135deg,#0B132B 0%,#172554 60%,#1D4ED8 100%);padding:28px 32px;color:#FFFFFF;">
      <div style="display:inline-block;background:rgba(56,189,248,0.18);border:1px solid rgba(56,189,248,0.4);color:#7DD3FC;font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;padding:5px 12px;border-radius:999px;margin-bottom:12px;">
        ${escapeHtml(params.badge)}
      </div>
      <h1 style="margin:0;font-size:22px;line-height:1.35;font-weight:800;color:#FFFFFF;">
        ${escapeHtml(params.heading)}
      </h1>
      <p style="margin:6px 0 0;font-size:13px;color:#CBD5E1;">
        Prime STEM Project Services Nigeria &bull; AfriSTEM Global Initiative
      </p>
    </div>
    <div style="padding:30px 32px;font-size:15px;line-height:1.65;color:#334155;">
      ${params.bodyHtml}
      ${ctaBlock}
    </div>
    <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:20px 32px;font-size:12px;color:#64748B;line-height:1.6;">
      <strong>Prime STEM Nigeria</strong> &bull; No 56, Beside C.A.Coke Guest House, New Road, Sabon Gari, Zaria, Kaduna State<br/>
      Enquiries: +234 813 551 7419 &bull; <a href="${escapeHtml(siteUrl)}" style="color:#2563EB;text-decoration:none;">${escapeHtml(siteUrl)}</a>
    </div>
  </div>
</body>
</html>`;
}

export async function dispatchPrimeStemEmail(input: SendEmailInput): Promise<{
  logId: string;
  delivered: boolean;
  status: "sent" | "queued_no_api_key" | "failed";
  resendMessageId: string | null;
  errorMessage: string | null;
}> {
  const settings = await getRawIntegrationSettings();
  const apiKey = (
    process.env.RESEND_API_KEY ||
    settings.resendApiKey ||
    ""
  ).trim();
  const fromEmail = (
    process.env.RESEND_FROM_EMAIL ||
    settings.resendFromEmail ||
    "Prime STEM Nigeria <exams@primestemnigeria.afristemglobal.org>"
  ).trim();
  const replyTo = (
    process.env.RESEND_REPLY_TO ||
    settings.resendReplyTo ||
    "primestemnigeria@gmail.com"
  ).trim();

  if (!apiKey) {
    const log = await recordEmailLog({
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName || "",
      category: input.category,
      subject: input.subject,
      status: "queued_no_api_key",
      resendMessageId: null,
      errorMessage:
        "Queued safely in Outbox — add RESEND_API_KEY in .env or Admin > Integrations to dispatch via Resend.",
      htmlPreview: input.htmlBody,
      relatedEntityId: input.relatedEntityId || null,
    });
    return {
      logId: log.id,
      delivered: false,
      status: "queued_no_api_key",
      resendMessageId: null,
      errorMessage: log.errorMessage,
    };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [input.recipientEmail],
        reply_to: replyTo || undefined,
        subject: input.subject,
        html: input.htmlBody,
      }),
    });

    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const errMsg =
        data?.message || data?.error || `Resend HTTP ${res.status}`;
      const log = await recordEmailLog({
        recipientEmail: input.recipientEmail,
        recipientName: input.recipientName || "",
        category: input.category,
        subject: input.subject,
        status: "failed",
        resendMessageId: null,
        errorMessage: String(errMsg),
        htmlPreview: input.htmlBody,
        relatedEntityId: input.relatedEntityId || null,
      });
      return {
        logId: log.id,
        delivered: false,
        status: "failed",
        resendMessageId: null,
        errorMessage: String(errMsg),
      };
    }

    const messageId = data?.id ? String(data.id) : null;
    const log = await recordEmailLog({
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName || "",
      category: input.category,
      subject: input.subject,
      status: "sent",
      resendMessageId: messageId,
      errorMessage: null,
      htmlPreview: input.htmlBody,
      relatedEntityId: input.relatedEntityId || null,
    });
    return {
      logId: log.id,
      delivered: true,
      status: "sent",
      resendMessageId: messageId,
      errorMessage: null,
    };
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : "Network error contacting Resend API";
    const log = await recordEmailLog({
      recipientEmail: input.recipientEmail,
      recipientName: input.recipientName || "",
      category: input.category,
      subject: input.subject,
      status: "failed",
      resendMessageId: null,
      errorMessage: errMsg,
      htmlPreview: input.htmlBody,
      relatedEntityId: input.relatedEntityId || null,
    });
    return {
      logId: log.id,
      delivered: false,
      status: "failed",
      resendMessageId: null,
      errorMessage: errMsg,
    };
  }
}

export async function retryEmailLogById(logId: string) {
  const logs = await listEmailLogs(500);
  const target = logs.find((l) => l.id === logId);
  if (!target) {
    throw new Error("Email log entry not found.");
  }

  const settings = await getRawIntegrationSettings();
  const apiKey = (
    process.env.RESEND_API_KEY ||
    settings.resendApiKey ||
    ""
  ).trim();
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured yet.");
  }
  const fromEmail = (
    process.env.RESEND_FROM_EMAIL ||
    settings.resendFromEmail ||
    "Prime STEM Nigeria <exams@primestemnigeria.afristemglobal.org>"
  ).trim();
  const replyTo = (
    process.env.RESEND_REPLY_TO ||
    settings.resendReplyTo ||
    "primestemnigeria@gmail.com"
  ).trim();

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [target.recipientEmail],
      reply_to: replyTo || undefined,
      subject: target.subject,
      html: target.htmlPreview,
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const errMsg = data?.message || data?.error || `Resend HTTP ${res.status}`;
    await updateEmailLogStatus({
      id: logId,
      status: "failed",
      errorMessage: String(errMsg),
    });
    throw new Error(String(errMsg));
  }
  await updateEmailLogStatus({
    id: logId,
    status: "sent",
    resendMessageId: data?.id ? String(data.id) : null,
    errorMessage: null,
  });
  return { id: logId, resendMessageId: data?.id || null };
}

function formatDateTimeWAT(iso: string): string {
  try {
    return new Date(iso).toLocaleString("en-NG", {
      timeZone: "Africa/Lagos",
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    }) + " WAT";
  } catch {
    return iso;
  }
}

// =============================================================
// DOMAIN EMAIL WORKFLOWS
// =============================================================

export async function sendCandidateRegistrationReceivedEmail(params: {
  candidate: ExamCandidateRecord;
  exam: ExaminationRecord;
  schedule: ExamScheduleRecord;
}) {
  const { candidate, exam, schedule } = params;
  const htmlBody = wrapPrimeStemEmailTemplate({
    badge: "Registration Received",
    heading: `${exam.title} — Application Logged`,
    bodyHtml: `
      <p>Dear <strong>${escapeHtml(candidate.fullName)}</strong>,</p>
      <p>Thank you for registering for the <strong>${escapeHtml(exam.title)}</strong> (${escapeHtml(exam.competitionLabel)}).</p>
      <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:12px;padding:18px 20px;margin:20px 0;">
        <p style="margin:0 0 8px;"><strong>Candidate:</strong> ${escapeHtml(candidate.fullName)} (${escapeHtml(candidate.classLevel || exam.category)})</p>
        <p style="margin:0 0 8px;"><strong>School / Institution:</strong> ${escapeHtml(candidate.schoolName)}</p>
        <p style="margin:0 0 8px;"><strong>Selected Schedule Slot:</strong> ${escapeHtml(schedule.label)}</p>
        <p style="margin:0 0 8px;"><strong>Exam Window:</strong> ${escapeHtml(formatDateTimeWAT(schedule.startsAt))} &ndash; ${escapeHtml(formatDateTimeWAT(schedule.endsAt))}</p>
        <p style="margin:0;"><strong>Approval Status:</strong> <span style="color:#D97706;font-weight:700;">Pending Admin &amp; Payment Verification</span></p>
      </div>
      <div style="background:#EFF6FF;border-left:4px solid #2563EB;padding:14px 16px;border-radius:8px;margin:18px 0;font-size:14px;">
        <strong>Important — Examination Access Code Activation:</strong><br/>
        Your personal Examination Access Code is issued and activated once the Prime STEM Examination Office confirms your registration/payment (<strong>UBA &bull; 1025357212 &bull; PRIME STEM NIGERIA</strong>, if applicable). As soon as approved, you will receive an automated confirmation email containing your active Access Code and direct portal instructions.
      </div>
    `,
  });

  return dispatchPrimeStemEmail({
    recipientEmail: candidate.email,
    recipientName: candidate.fullName,
    category: "registration_pending",
    subject: `Registration Received: ${exam.title} — Prime STEM Nigeria`,
    htmlBody,
    relatedEntityId: candidate.id,
  });
}

export async function sendExamCodeConfirmationEmail(params: {
  candidate: ExamCandidateRecord;
  exam: ExaminationRecord;
  schedule: ExamScheduleRecord;
  accessCode: string;
}) {
  const { candidate, exam, schedule, accessCode } = params;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://primestemnigeria.afristemglobal.org";
  const examUrl = `${siteUrl.replace(/\/$/, "")}/exam`;

  const htmlBody = wrapPrimeStemEmailTemplate({
    badge: "Approved — Active Exam Access Code",
    heading: `Your Official Exam Code for ${exam.title}`,
    ctaLabel: "Open Prime STEM Examination Portal",
    ctaUrl: examUrl,
    bodyHtml: `
      <p>Dear <strong>${escapeHtml(candidate.fullName)}</strong>,</p>
      <p>Your registration for <strong>${escapeHtml(exam.title)}</strong> has been verified and approved! Please keep your unique Examination Access Code below confidential.</p>
      <div style="background:#0B132B;color:#FFFFFF;border-radius:14px;padding:24px;text-align:center;margin:22px 0;">
        <div style="font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#7DD3FC;margin-bottom:8px;">Unique Examination Access Code</div>
        <div style="font-family:'Courier New',monospace;font-size:28px;font-weight:800;letter-spacing:3px;color:#FBBF24;background:rgba(255,255,255,0.08);display:inline-block;padding:10px 22px;border-radius:10px;border:1px dashed rgba(251,191,36,0.5);">
          ${escapeHtml(accessCode)}
        </div>
        <div style="margin-top:10px;font-size:12px;color:#CBD5E1;">Registered Email: ${escapeHtml(candidate.email)}</div>
      </div>

      <h3 style="font-size:16px;margin:22px 0 10px;color:#0F172A;">Confirmed Examination Details</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;background:#F8FAFC;border-radius:10px;overflow:hidden;">
        <tr><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;">Competition</td><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;font-weight:700;">${escapeHtml(exam.competitionLabel)}</td></tr>
        <tr><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;">Examination</td><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;font-weight:700;">${escapeHtml(exam.title)} (${escapeHtml(exam.category)})</td></tr>
        <tr><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;">Scheduled Slot</td><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;font-weight:700;">${escapeHtml(schedule.label)}</td></tr>
        <tr><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;">Authorised Start</td><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;font-weight:700;">${escapeHtml(formatDateTimeWAT(schedule.startsAt))}</td></tr>
        <tr><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;color:#64748B;">Window Closes</td><td style="padding:10px 14px;border-bottom:1px solid #E2E8F0;font-weight:700;">${escapeHtml(formatDateTimeWAT(schedule.endsAt))}</td></tr>
        <tr><td style="padding:10px 14px;color:#64748B;">Exam Duration</td><td style="padding:10px 14px;font-weight:700;">${exam.durationMinutes} Minutes</td></tr>
      </table>

      <div style="background:#FEF2F2;border-left:4px solid #DC2626;padding:14px 16px;border-radius:8px;margin:22px 0;font-size:13.5px;color:#7F1D1D;">
        <strong>Mandatory AI Proctoring &amp; Examination Rules:</strong>
        <ul style="margin:8px 0 0;padding-left:18px;">
          <li>Log in 10 minutes early with a reliable laptop/desktop or compatible mobile device in a quiet, well-lit room.</li>
          <li>You MUST grant <strong>Screen Recording, Webcam, and Microphone</strong> permissions before the countdown begins.</li>
          <li><strong>Zero Tab-Switching Policy:</strong> Leaving the exam tab once triggers an immediate formal warning. Leaving a <strong>second time automatically submits</strong> your examination immediately.</li>
          <li>No phones, textbooks, calculators (unless stated), or second persons in camera view.</li>
        </ul>
      </div>
    `,
  });

  return dispatchPrimeStemEmail({
    recipientEmail: candidate.email,
    recipientName: candidate.fullName,
    category: "exam_access_code",
    subject: `[CONFIRMED] Exam Access Code & Schedule — ${exam.title}`,
    htmlBody,
    relatedEntityId: candidate.id,
  });
}

export async function sendExamSubmissionReceiptEmail(params: {
  candidate: ExamCandidateRecord;
  exam: ExaminationRecord;
  attempt: ExamAttemptRecord;
}) {
  const { candidate, exam, attempt } = params;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://primestemnigeria.afristemglobal.org";
  const isReleased = exam.resultsPublished || attempt.resultReleased;

  const scoreSection = isReleased
    ? `<div style="background:#ECFDF5;border:1px solid #6EE7B7;border-radius:12px;padding:18px;margin:18px 0;text-align:center;">
        <div style="font-size:12px;text-transform:uppercase;color:#047857;font-weight:700;">Official Score</div>
        <div style="font-size:30px;font-weight:800;color:#065F46;margin:4px 0;">${attempt.score ?? 0} / ${attempt.maxScore ?? 0} (${attempt.percentage ?? 0}%)</div>
      </div>`
    : `<p style="background:#F8FAFC;border:1px solid #E2E8F0;padding:14px 16px;border-radius:10px;font-size:14px;">
        Your responses have been marked and securely stored. Official scores will become visible once released by the Prime STEM Examination Board after proctoring verification.
      </p>`;

  const htmlBody = wrapPrimeStemEmailTemplate({
    badge: "Submission Confirmed",
    heading: `Examination Submitted — ${exam.title}`,
    ctaLabel: "Check Submission Status",
    ctaUrl: `${siteUrl.replace(/\/$/, "")}/exam`,
    bodyHtml: `
      <p>Dear <strong>${escapeHtml(candidate.fullName)}</strong>,</p>
      <p>Your attempt for <strong>${escapeHtml(exam.title)}</strong> has been recorded.</p>
      <ul style="font-size:14px;">
        <li><strong>Submitted At:</strong> ${escapeHtml(formatDateTimeWAT(attempt.submittedAt || new Date().toISOString()))}</li>
        <li><strong>Submission Mode:</strong> ${
          attempt.status === "auto_submitted_violation"
            ? "Automatic Submission (Second Tab-Switch Violation)"
            : attempt.status === "auto_submitted_timeout"
            ? "Automatic Submission (Timer Completed)"
            : "Candidate Manual Submission"
        }</li>
        <li><strong>Submission Reason:</strong> ${escapeHtml(attempt.submissionReason || "Completed")}</li>
      </ul>
      ${scoreSection}
    `,
  });

  return dispatchPrimeStemEmail({
    recipientEmail: candidate.email,
    recipientName: candidate.fullName,
    category: "exam_submission",
    subject: `Examination Submission Receipt — ${exam.title}`,
    htmlBody,
    relatedEntityId: attempt.id,
  });
}

export async function sendResultPublishedEmail(params: {
  candidate: ExamCandidateRecord;
  exam: ExaminationRecord;
  attempt: ExamAttemptRecord;
}) {
  const { candidate, exam, attempt } = params;
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://primestemnigeria.afristemglobal.org";
  const passed = (attempt.percentage ?? 0) >= exam.passMarkPercent;

  const htmlBody = wrapPrimeStemEmailTemplate({
    badge: "Official Results Released",
    heading: `Your Official Result — ${exam.title}`,
    ctaLabel: "View Result Slip Online",
    ctaUrl: `${siteUrl.replace(/\/$/, "")}/exam`,
    bodyHtml: `
      <p>Dear <strong>${escapeHtml(candidate.fullName)}</strong>,</p>
      <p>The Prime STEM Examination Board has released your official result for <strong>${escapeHtml(exam.title)}</strong> (${escapeHtml(exam.competitionLabel)}).</p>
      <div style="background:${passed ? "#ECFDF5" : "#F8FAFC"};border:1px solid ${passed ? "#6EE7B7" : "#CBD5E1"};border-radius:14px;padding:24px;text-align:center;margin:20px 0;">
        <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#475569;font-weight:700;">Verified Score</div>
        <div style="font-size:36px;font-weight:800;color:#0F172A;margin:6px 0;">${attempt.score ?? 0} / ${attempt.maxScore ?? 0}</div>
        <div style="font-size:18px;font-weight:700;color:${passed ? "#059669" : "#D97706"};">${attempt.percentage ?? 0}% &bull; ${passed ? "QUALIFIED / PASSED" : "COMPLETED"}</div>
      </div>
      <p style="font-size:14px;">You can view and print your result summary anytime on the Examination Portal using your registered email and Access Code (<strong>${escapeHtml(candidate.accessCodeHint)}</strong>).</p>
    `,
  });

  return dispatchPrimeStemEmail({
    recipientEmail: candidate.email,
    recipientName: candidate.fullName,
    category: "exam_result_released",
    subject: `Official Result Released: ${exam.title} — Prime STEM Nigeria`,
    htmlBody,
    relatedEntityId: attempt.id,
  });
}

export async function sendContactAcknowledgementEmail(params: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const htmlBody = wrapPrimeStemEmailTemplate({
    badge: "Enquiry Received",
    heading: "Thank You for Contacting Prime STEM Nigeria",
    bodyHtml: `
      <p>Dear <strong>${escapeHtml(params.name)}</strong>,</p>
      <p>We have received your message regarding <strong>${escapeHtml(params.subject)}</strong> and a member of our programmes or examination team will respond shortly.</p>
      <div style="background:#F8FAFC;border-left:4px solid #2563EB;padding:14px 16px;border-radius:8px;margin:18px 0;font-size:14px;color:#475569;">
        ${escapeHtml(params.message)}
      </div>
    `,
  });

  return dispatchPrimeStemEmail({
    recipientEmail: params.email,
    recipientName: params.name,
    category: "contact_acknowledgement",
    subject: `We received your enquiry: ${params.subject}`,
    htmlBody,
  });
}

export async function sendAdminAlertEmail(params: {
  subject: string;
  heading: string;
  detailsHtml: string;
  relatedEntityId?: string;
}) {
  const settings = await getRawIntegrationSettings();
  const adminEmail = (
    process.env.ADMIN_NOTIFICATION_EMAIL ||
    settings.adminNotificationEmail ||
    "primestemnigeria@gmail.com"
  ).trim();

  const htmlBody = wrapPrimeStemEmailTemplate({
    badge: "Admin Alert",
    heading: params.heading,
    bodyHtml: params.detailsHtml,
  });

  return dispatchPrimeStemEmail({
    recipientEmail: adminEmail,
    recipientName: "Prime STEM Administrator",
    category: "admin_notification",
    subject: `[Prime STEM Admin] ${params.subject}`,
    htmlBody,
    relatedEntityId: params.relatedEntityId || null,
  });
}

export async function sendNewsletterWelcomeEmail(params: {
  email: string;
  fullName?: string;
}) {
  const htmlBody = wrapPrimeStemEmailTemplate({
    badge: "STEM Community Updates",
    heading: "Welcome to Prime STEM Nigeria Updates!",
    bodyHtml: `
      <p>Hello${params.fullName ? ` <strong>${escapeHtml(params.fullName)}</strong>` : ""},</p>
      <p>You are now subscribed to official Prime STEM Nigeria announcements covering the STEM Kids Championship (SKC), African Olympiad on Chemistry &amp; Technology (AOCT), school laboratory training, and qualifying examination schedules.</p>
    `,
  });

  return dispatchPrimeStemEmail({
    recipientEmail: params.email,
    recipientName: params.fullName || "",
    category: "newsletter_welcome",
    subject: "Welcome to Prime STEM Nigeria Announcements",
    htmlBody,
  });
}

export async function sendCustomOrBroadcastEmail(params: {
  recipientEmail: string;
  recipientName?: string;
  subject: string;
  heading: string;
  messageBody: string;
  category: "newsletter_broadcast" | "admin_custom";
}) {
  const paragraphs = params.messageBody
    .split(/\n{2,}/)
    .map((p) => `<p>${escapeHtml(p.trim()).replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const htmlBody = wrapPrimeStemEmailTemplate({
    badge:
      params.category === "newsletter_broadcast"
        ? "Official Broadcast"
        : "Prime STEM Office",
    heading: params.heading,
    bodyHtml: paragraphs,
  });

  return dispatchPrimeStemEmail({
    recipientEmail: params.recipientEmail,
    recipientName: params.recipientName || "",
    category: params.category,
    subject: params.subject,
    htmlBody,
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import {
  sendAdminAlertEmail,
  sendExamSubmissionReceiptEmail,
} from "@/lib/email";
import { getExamSessionFromRequest } from "@/lib/exam-security";
import {
  getSessionPayloadForAttempt,
  recordProctoringOrTabEvent,
} from "@/lib/exam-store";

const answerItemSchema = z.object({
  questionId: z.string().min(1),
  selectedOption: z.enum(["A", "B", "C", "D"]).nullable(),
  clientUpdatedAt: z.string().min(1),
});

const schema = z.object({
  eventType: z.string().min(1),
  classification: z.enum(["ai_suspicion", "verified_violation", "system_notice"]),
  severity: z.enum(["info", "warning", "critical"]),
  details: z.string().min(1).max(1000),
  occurredAt: z.string().optional(),
  pendingAnswers: z.array(answerItemSchema).optional(),
});

export async function POST(request: Request) {
  const session = getExamSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized exam session." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid event payload." },
        { status: 400 }
      );
    }

    const result = await recordProctoringOrTabEvent({
      attemptId: session.attemptId,
      candidateId: session.candidateId,
      eventType: parsed.data.eventType,
      classification: parsed.data.classification,
      severity: parsed.data.severity,
      details: parsed.data.details,
      occurredAt: parsed.data.occurredAt,
      pendingAnswers: parsed.data.pendingAnswers,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (result.autoSubmitted) {
      const fullPayload = await getSessionPayloadForAttempt(session.attemptId);
      if (fullPayload) {
        await Promise.allSettled([
          sendExamSubmissionReceiptEmail({
            candidate: fullPayload.candidate,
            exam: fullPayload.exam,
            attempt: fullPayload.attempt,
          }),
          sendAdminAlertEmail({
            subject: `AUTO-SUBMITTED (2nd Tab Switch): ${fullPayload.candidate.fullName}`,
            heading: "Critical Malpractice Violation — Auto-Submitted Exam",
            detailsHtml: `
              <p><strong>Candidate:</strong> ${fullPayload.candidate.fullName} (${fullPayload.candidate.email})</p>
              <p><strong>School:</strong> ${fullPayload.candidate.schoolName}</p>
              <p><strong>Examination:</strong> ${fullPayload.exam.title}</p>
              <p>Results remain held pending answer-key verification and administrator release.</p>
              <p><strong>Reason:</strong> ${fullPayload.attempt.submissionReason}</p>
            `,
            relatedEntityId: fullPayload.attempt.id,
          }),
        ]);
      }
    }

    return NextResponse.json({
      success: true,
      serverNow: new Date().toISOString(),
      attempt: result.attempt,
      strikeAction: result.strikeAction,
      autoSubmitted: result.autoSubmitted,
    });
  } catch (err: any) {
    console.error("[exam/attempt/event] error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed logging proctoring event." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { sendExamSubmissionReceiptEmail } from "@/lib/email";
import { getExamSessionFromRequest } from "@/lib/exam-security";
import {
  getSessionPayloadForAttempt,
  submitExamAttempt,
} from "@/lib/exam-store";

const answerItemSchema = z.object({
  questionId: z.string().min(1),
  selectedOption: z.enum(["A", "B", "C", "D"]).nullable(),
  clientUpdatedAt: z.string().min(1),
});

const schema = z.object({
  mode: z.enum(["submitted", "auto_submitted_timeout"]).default("submitted"),
  reason: z.string().max(500).default("Submitted manually by candidate."),
  finalAnswers: z.array(answerItemSchema).optional(),
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
        { error: "Invalid submission payload." },
        { status: 400 }
      );
    }

    const result = await submitExamAttempt({
      attemptId: session.attemptId,
      candidateId: session.candidateId,
      mode: parsed.data.mode,
      reason: parsed.data.reason,
      finalAnswers: parsed.data.finalAnswers,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    if (!result.alreadySubmitted) {
      const fullPayload = await getSessionPayloadForAttempt(session.attemptId);
      if (fullPayload) {
        await sendExamSubmissionReceiptEmail({
          candidate: fullPayload.candidate,
          exam: fullPayload.exam,
          attempt: fullPayload.attempt,
        });
      }
    }

    return NextResponse.json({
      success: true,
      attempt: result.attempt,
      exam: {
        id: result.exam.id,
        title: result.exam.title,
        competitionLabel: result.exam.competitionLabel,
        resultsPublished: result.exam.resultsPublished,
        passMarkPercent: result.exam.passMarkPercent,
      },
      resultVisible: result.exam.resultsPublished || result.attempt.resultReleased,
    });
  } catch (err: any) {
    console.error("[exam/attempt/submit] error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed submitting examination." },
      { status: 500 }
    );
  }
}

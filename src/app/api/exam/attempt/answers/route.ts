import { NextResponse } from "next/server";
import { z } from "zod";
import { getExamSessionFromRequest } from "@/lib/exam-security";
import { saveCandidateAnswers } from "@/lib/exam-store";

const answerItemSchema = z.object({
  questionId: z.string().min(1),
  selectedOption: z.enum(["A", "B", "C", "D"]).nullable(),
  clientUpdatedAt: z.string().min(1),
});

const schema = z.object({
  answers: z.array(answerItemSchema).min(1).max(200),
  reconnectedSync: z.boolean().optional(),
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
        { error: "Invalid answer payload." },
        { status: 400 }
      );
    }

    const result = await saveCandidateAnswers({
      attemptId: session.attemptId,
      candidateId: session.candidateId,
      answers: parsed.data.answers,
      reconnectedSync: parsed.data.reconnectedSync,
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error: result.error,
          alreadySubmitted: result.alreadySubmitted || false,
        },
        { status: result.alreadySubmitted ? 409 : 400 }
      );
    }

    return NextResponse.json({
      success: true,
      serverNow: new Date().toISOString(),
      savedCount: result.savedCount,
      attempt: result.attempt,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed saving answers." },
      { status: 500 }
    );
  }
}

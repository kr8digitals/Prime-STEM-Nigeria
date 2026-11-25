import { NextResponse } from "next/server";
import { z } from "zod";
import { getExamSessionFromRequest } from "@/lib/exam-security";
import { startExamAttemptAfterSetup } from "@/lib/exam-store";

const streamStatusEnum = z.enum(["granted", "denied", "unsupported"]);

const schema = z.object({
  screenStatus: streamStatusEnum,
  webcamStatus: streamStatusEnum,
  audioStatus: streamStatusEnum,
  consentConfirmed: z.boolean(),
});

export async function POST(request: Request) {
  const session = getExamSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { error: "Your examination session expired. Please re-enter your Access Code." },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid device setup status payload." },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || "unknown";
    const result = await startExamAttemptAfterSetup({
      attemptId: session.attemptId,
      candidateId: session.candidateId,
      screenStatus: parsed.data.screenStatus,
      webcamStatus: parsed.data.webcamStatus,
      audioStatus: parsed.data.audioStatus,
      consentConfirmed: parsed.data.consentConfirmed,
      userAgent,
    });

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      serverNow: new Date().toISOString(),
      attempt: result.attempt,
      questions: result.questions,
    });
  } catch (err: any) {
    console.error("[exam/attempt/start] error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed starting examination attempt." },
      { status: 500 }
    );
  }
}

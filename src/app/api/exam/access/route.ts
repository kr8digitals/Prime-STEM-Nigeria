import { NextResponse } from "next/server";
import { z } from "zod";
import {
  createExamSessionToken,
  EXAM_SESSION_COOKIE,
} from "@/lib/exam-security";
import {
  getSessionPayloadForAttempt,
  validateCandidateAccessAndCreateAttempt,
} from "@/lib/exam-store";

const schema = z.object({
  email: z.string().email("Please enter your registered email address."),
  accessCode: z.string().min(4, "Please enter your Examination Access Code."),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid credentials." },
        { status: 400 }
      );
    }

    const userAgent = request.headers.get("user-agent") || "unknown";
    const forwardedFor = request.headers.get("x-forwarded-for") || "";
    const ipAddress = forwardedFor.split(",")[0]?.trim() || "local";

    const verified = await validateCandidateAccessAndCreateAttempt({
      email: parsed.data.email,
      accessCode: parsed.data.accessCode,
      userAgent,
      ipAddress,
    });

    if (!verified.ok) {
      return NextResponse.json(
        { error: verified.error, code: verified.code },
        { status: verified.code === "PENDING_APPROVAL" ? 403 : 401 }
      );
    }

    const token = createExamSessionToken({
      attemptId: verified.attempt.id,
      candidateId: verified.candidate.id,
      examId: verified.exam.id,
    });

    const payload = await getSessionPayloadForAttempt(verified.attempt.id);

    const response = NextResponse.json({
      success: true,
      serverNow: new Date().toISOString(),
      ...payload,
    });

    response.cookies.set(EXAM_SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 12, // 12 hours
    });

    return response;
  } catch (err: any) {
    console.error("[exam/access] error:", err);
    return NextResponse.json(
      { error: err?.message || "Examination portal verification failed." },
      { status: 500 }
    );
  }
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set(EXAM_SESSION_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

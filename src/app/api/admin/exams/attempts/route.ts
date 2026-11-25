import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { sendResultPublishedEmail } from "@/lib/email";
import {
  getAdminAttemptDetail,
  getAdminExamDashboardSnapshot,
  setAttemptResultRelease,
} from "@/lib/exam-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  const { searchParams } = new URL(request.url);
  const attemptId = searchParams.get("attemptId");
  if (!attemptId) {
    return NextResponse.json({ error: "Missing attemptId" }, { status: 400 });
  }

  const detail = await getAdminAttemptDetail(attemptId);
  if (!detail) {
    return NextResponse.json({ error: "Attempt not found" }, { status: 404 });
  }

  return NextResponse.json(detail, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function PATCH(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const attempt = await setAttemptResultRelease({
      attemptId: String(body.attemptId),
      released: Boolean(body.released),
      adminReviewNotes:
        body.adminReviewNotes !== undefined
          ? String(body.adminReviewNotes)
          : undefined,
    });

    if (body.released && body.notifyCandidate) {
      const snapshot = await getAdminExamDashboardSnapshot();
      const candidate = snapshot.candidates.find(
        (c) => c.id === attempt.candidateId
      );
      const exam = snapshot.examinations.find((e) => e.id === attempt.examId);
      if (candidate && exam) {
        await sendResultPublishedEmail({ candidate, exam, attempt });
      }
    }

    return NextResponse.json({ success: true, attempt });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed updating attempt." },
      { status: 400 }
    );
  }
}

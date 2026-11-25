import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { sendResultPublishedEmail } from "@/lib/email";
import {
  deleteExamination,
  getAdminExamDashboardSnapshot,
  setExamResultsPublished,
  upsertExamination,
} from "@/lib/exam-store";
import { getLocalVaultDiskStats } from "@/lib/recording-storage";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  try {
    const snapshot = await getAdminExamDashboardSnapshot();
    const localVaultStats = getLocalVaultDiskStats();
    return NextResponse.json(
      {
        ...snapshot,
        localVaultStats,
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (err: any) {
    console.error("[admin/exams GET] error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed loading examination dashboard." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();

    if (body.action === "toggle_results_published") {
      const published = Boolean(body.published);
      const exam = await setExamResultsPublished({
        examId: String(body.examId),
        published,
      });

      let emailedCount = 0;
      if (published && body.notifyCandidates) {
        const snapshot = await getAdminExamDashboardSnapshot();
        const examAttempts = snapshot.attempts.filter(
          (a) =>
            a.examId === exam.id &&
            ["submitted", "auto_submitted_violation", "auto_submitted_timeout"].includes(
              a.status
            )
        );
        for (const attempt of examAttempts) {
          const candidate = snapshot.candidates.find(
            (c) => c.id === attempt.candidateId
          );
          if (candidate) {
            await sendResultPublishedEmail({ candidate, exam, attempt });
            emailedCount += 1;
          }
        }
      }

      return NextResponse.json({
        success: true,
        exam,
        emailedCount,
      });
    }

    const exam = await upsertExamination({
      id: body.id || undefined,
      slug: body.slug || undefined,
      title: String(body.title || "").trim(),
      competitionLabel: String(body.competitionLabel || "Prime STEM Competition").trim(),
      programSlug: String(body.programSlug || "stem-kids-championship").trim(),
      category: String(body.category || "General").trim(),
      description: String(body.description || "").trim(),
      instructions: String(body.instructions || "").trim(),
      durationMinutes: Number(body.durationMinutes || 30),
      passMarkPercent: Number(body.passMarkPercent || 50),
      status: body.status || "published",
      resultsPublished: Boolean(body.resultsPublished),
      proctoringRequired: body.proctoringRequired !== false,
    });

    return NextResponse.json({ success: true, exam });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed saving examination." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing exam id" }, { status: 400 });
    }
    const ok = await deleteExamination(id);
    return NextResponse.json({ success: ok });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed deleting examination." },
      { status: 500 }
    );
  }
}

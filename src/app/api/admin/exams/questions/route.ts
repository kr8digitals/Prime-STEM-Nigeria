import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { deleteQuestion, upsertQuestion } from "@/lib/exam-store";

export async function POST(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const correctOption = String(body.correctOption || "A").toUpperCase();
    if (!["A", "B", "C", "D"].includes(correctOption)) {
      return NextResponse.json(
        { error: "correctOption must be A, B, C, or D." },
        { status: 400 }
      );
    }

    if (
      !body.examId ||
      !String(body.prompt || "").trim() ||
      !String(body.optionA || "").trim() ||
      !String(body.optionB || "").trim() ||
      !String(body.optionC || "").trim() ||
      !String(body.optionD || "").trim()
    ) {
      return NextResponse.json(
        {
          error:
            "Exam ID, Question Prompt, and all four options (A, B, C, D) are required.",
        },
        { status: 400 }
      );
    }

    const question = await upsertQuestion({
      id: body.id || undefined,
      examId: String(body.examId),
      prompt: String(body.prompt).trim(),
      optionA: String(body.optionA).trim(),
      optionB: String(body.optionB).trim(),
      optionC: String(body.optionC).trim(),
      optionD: String(body.optionD).trim(),
      correctOption: correctOption as "A" | "B" | "C" | "D",
      points: Number(body.points || 1),
      explanation: String(body.explanation || "").trim(),
    });

    return NextResponse.json({ success: true, question });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed saving question." },
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
      return NextResponse.json({ error: "Missing question id" }, { status: 400 });
    }
    const ok = await deleteQuestion(id);
    return NextResponse.json({ success: ok });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed deleting question." },
      { status: 500 }
    );
  }
}

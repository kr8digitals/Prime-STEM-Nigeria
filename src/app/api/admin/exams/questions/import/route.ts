import crypto from "crypto";
import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { parseQuestionCsv } from "@/lib/question-import";
import { importQuestions } from "@/lib/exam-store";

export async function POST(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;
  try {
    const length = Number(request.headers.get("content-length") || 0);
    if (length > 1500000) return NextResponse.json({ error: "File too large." }, { status: 413 });
    const body = await request.json();
    if (typeof body.csv !== "string" || typeof body.examId !== "string" || !body.examId) throw new Error("Select an examination and CSV file.");
    const questions = parseQuestionCsv(body.csv);
    if (!body.commit) return NextResponse.json({ questions });
    const digest = crypto.createHash("sha256").update(body.csv).digest("hex");
    const count = await importQuestions(body.examId, questions, digest);
    return NextResponse.json({ success: true, count });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : "Import failed." }, { status: 400 });
  }
}

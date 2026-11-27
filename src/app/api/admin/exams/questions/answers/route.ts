import { NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getAdminExamDashboardSnapshot, updateQuestionAnswers } from "@/lib/exam-store";

export async function POST(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;
  try {
    const body = await request.json();
    if (typeof body.examId !== "string" || typeof body.csv !== "string" || Buffer.byteLength(body.csv) > 1048576) throw new Error("Choose an exam and a CSV file under 1 MB.");
    let rows: string[][];
    try { rows = parse(body.csv, { bom: true, trim: true, skip_empty_lines: true, relax_column_count: false }); }
    catch { throw new Error("Invalid CSV file. Use the downloaded answer-key template."); }
    if (rows.length < 2 || rows.length > 501 || rows[0].join(",").toLowerCase() !== "question_id,question,answer") throw new Error("Use the answer-key template, with 1–500 rows.");
    const items = rows.slice(1).map((row, i) => {
      const answer = row[2].toUpperCase();
      if (!row[0] || !["A", "B", "C", "D"].includes(answer)) throw new Error(`Row ${i + 2}: every question ID needs an A–D answer.`);
      return { id: row[0], answer: answer as "A" | "B" | "C" | "D" };
    });
    if (new Set(items.map(x => x.id)).size !== items.length) throw new Error("Duplicate question IDs are not allowed.");
    if (!body.commit) {
      const snapshot = await getAdminExamDashboardSnapshot();
      const ids = new Set(snapshot.questions.filter(q => q.examId === body.examId).map(q => q.id));
      if (!snapshot.examinations.some(e => e.id === body.examId) || items.some(item => !ids.has(item.id))) throw new Error("A question ID does not belong to this examination. Nothing was changed.");
      return NextResponse.json({ count: items.length, answers: items });
    }
    const count = await updateQuestionAnswers(body.examId, items);
    return NextResponse.json({ success: true, count });
  } catch (err) { return NextResponse.json({ error: err instanceof Error ? err.message : "Answer import failed." }, { status: 400 }); }
}

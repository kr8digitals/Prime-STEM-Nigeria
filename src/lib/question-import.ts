import { parse } from "csv-parse/sync";
import type { AnswerChoice } from "@/lib/exam-store";

export type ImportedQuestion = { prompt: string; optionA: string; optionB: string; optionC: string; optionD: string; correctOption: AnswerChoice | null; points: number };

/** CSV UTF-8, one row per question. Reject the whole file on any error. */
export function parseQuestionCsv(csv: string): ImportedQuestion[] {
  if (Buffer.byteLength(csv, "utf8") > 1024 * 1024) throw new Error("CSV file must be 1 MB or smaller.");
  let rows: string[][];
  try { rows = parse(csv, { bom: true, skip_empty_lines: true, relax_column_count: false, trim: true, max_record_size: 30000 }); }
  catch { throw new Error("Invalid CSV syntax or inconsistent column count. Save as UTF-8 CSV and use the template."); }
  if (rows.length < 2 || rows.length > 501) throw new Error("Provide between 1 and 500 question rows.");
  const expected = ["question", "option_a", "option_b", "option_c", "option_d", "answer", "points"];
  if (rows[0].length !== expected.length || rows[0].some((h, i) => h.toLowerCase() !== expected[i])) throw new Error("CSV header must match the downloaded template exactly.");
  return rows.slice(1).map((row, i) => {
    const [prompt, optionA, optionB, optionC, optionD, rawAnswer, rawPoints] = row;
    if ([prompt, optionA, optionB, optionC, optionD].some(x => !x || x.length > 5000)) throw new Error(`Row ${i + 2}: question and all four options are required (maximum 5,000 characters each).`);
    const answer = rawAnswer.toUpperCase();
    if (answer && !["A", "B", "C", "D"].includes(answer)) throw new Error(`Row ${i + 2}: answer must be A, B, C, D, or blank.`);
    const points = rawPoints === "" ? 1 : Number(rawPoints);
    if (!Number.isInteger(points) || points < 1 || points > 100) throw new Error(`Row ${i + 2}: points must be an integer from 1 to 100.`);
    return { prompt, optionA, optionB, optionC, optionD, correctOption: (answer || null) as AnswerChoice | null, points };
  });
}

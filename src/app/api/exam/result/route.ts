import { NextResponse } from "next/server";
import { z } from "zod";
import { lookupCandidateResultByCode } from "@/lib/exam-store";

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
        { error: parsed.error.issues[0]?.message ?? "Invalid input." },
        { status: 400 }
      );
    }

    const result = await lookupCandidateResultByCode(parsed.data);
    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Result lookup failed." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getExamSessionFromRequest } from "@/lib/exam-security";
import { getSessionPayloadForAttempt } from "@/lib/exam-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const session = getExamSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ active: false }, { status: 200 });
  }

  const payload = await getSessionPayloadForAttempt(session.attemptId);
  if (!payload) {
    return NextResponse.json({ active: false }, { status: 200 });
  }

  return NextResponse.json(
    {
      active: true,
      serverNow: new Date().toISOString(),
      ...payload,
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}

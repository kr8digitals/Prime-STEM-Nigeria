import { NextResponse } from "next/server";
import { listPublicExamsAndSchedules } from "@/lib/exam-store";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const data = await listPublicExamsAndSchedules();
    return NextResponse.json(data, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed loading public examination schedules." },
      { status: 500 }
    );
  }
}

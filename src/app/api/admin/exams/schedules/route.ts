import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { deleteSchedule, upsertSchedule } from "@/lib/exam-store";

export async function POST(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    if (!body.examId || !body.label || !body.startsAt || !body.endsAt) {
      return NextResponse.json(
        {
          error:
            "Exam ID, Schedule Label, Start Date/Time, and End Date/Time are required.",
        },
        { status: 400 }
      );
    }

    const startMs = new Date(body.startsAt).getTime();
    const endMs = new Date(body.endsAt).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) {
      return NextResponse.json(
        { error: "Schedule End Date/Time must be after Start Date/Time." },
        { status: 400 }
      );
    }

    const schedule = await upsertSchedule({
      id: body.id || undefined,
      examId: String(body.examId),
      label: String(body.label).trim(),
      startsAt: new Date(startMs).toISOString(),
      endsAt: new Date(endMs).toISOString(),
      timezone: String(body.timezone || "Africa/Lagos"),
      capacity: Number(body.capacity || 250),
      isActive: body.isActive !== false,
    });

    return NextResponse.json({ success: true, schedule });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed saving schedule slot." },
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
      return NextResponse.json({ error: "Missing schedule id" }, { status: 400 });
    }
    const ok = await deleteSchedule(id);
    return NextResponse.json({ success: ok });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed deleting schedule slot." },
      { status: 500 }
    );
  }
}

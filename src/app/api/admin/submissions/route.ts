import { NextResponse } from "next/server";
import {
  getSubmissions,
  deleteSubmission,
  updateSubmissionStatus,
  saveSubmissions,
} from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const data = getSubmissions();
  return NextResponse.json(data, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") as "registrations" | "contactMessages";
    const id = Number(searchParams.get("id"));

    if (!type || !id) {
      return NextResponse.json({ error: "Missing type or id" }, { status: 400 });
    }

    const success = deleteSubmission(type, id);
    return NextResponse.json({ success });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { type, id, status } = body;

    if (!type || !id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updated = updateSubmissionStatus(type, Number(id), status);
    return NextResponse.json({ success: true, item: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

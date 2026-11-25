import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getRecordingById } from "@/lib/exam-store";
import { readProctoringBinary } from "@/lib/recording-storage";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  // Strictly Admin-authenticated only — recordings are NEVER publicly accessible
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  const { id } = await context.params;
  const recording = await getRecordingById(id);
  if (!recording) {
    return NextResponse.json({ error: "Recording not found" }, { status: 404 });
  }

  try {
    const rangeHeader = request.headers.get("range");
    const media = await readProctoringBinary(recording, rangeHeader);

    const headers: Record<string, string> = {
      "Content-Type": recording.mimeType || "video/webm",
      "Cache-Control": "private, no-store, max-age=0",
      "Accept-Ranges": "bytes",
      "X-Content-Type-Options": "nosniff",
    };

    if (media.isPartial) {
      headers["Content-Range"] = `bytes ${media.start}-${media.end}/${media.totalSize}`;
      headers["Content-Length"] = String(media.buffer.length);
      return new NextResponse(new Uint8Array(media.buffer), {
        status: 206,
        headers,
      });
    }

    headers["Content-Length"] = String(media.buffer.length);
    return new NextResponse(new Uint8Array(media.buffer), {
      status: 200,
      headers,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Unable to stream proctoring recording." },
      { status: 404 }
    );
  }
}

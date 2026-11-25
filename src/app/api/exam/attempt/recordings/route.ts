import { NextResponse } from "next/server";
import { getExamSessionFromRequest } from "@/lib/exam-security";
import {
  getSessionPayloadForAttempt,
  recordUploadedRecordingChunk,
} from "@/lib/exam-store";
import { storeProctoringBinary } from "@/lib/recording-storage";

export async function POST(request: Request) {
  const session = getExamSessionFromRequest(request);
  if (!session) {
    return NextResponse.json(
      { error: "Unauthorized exam session." },
      { status: 401 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("chunk") as File | null;
    const streamTypeRaw = String(formData.get("streamType") || "");
    const segmentIndex = Number(formData.get("segmentIndex") || 0);
    const durationMs = Number(formData.get("durationMs") || 0);
    const startedAt = String(
      formData.get("startedAt") || new Date().toISOString()
    );
    const endedAt = String(formData.get("endedAt") || new Date().toISOString());

    if (
      !file ||
      !["screen", "webcam", "audio", "snapshot"].includes(streamTypeRaw)
    ) {
      return NextResponse.json(
        { error: "Missing recording chunk or invalid streamType." },
        { status: 400 }
      );
    }

    // Verify attempt belongs to candidate
    const sessionState = await getSessionPayloadForAttempt(session.attemptId);
    if (
      !sessionState ||
      sessionState.attempt.candidateId !== session.candidateId
    ) {
      return NextResponse.json(
        { error: "Invalid attempt session." },
        { status: 403 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    if (buffer.length === 0) {
      return NextResponse.json(
        { error: "Empty recording chunk ignored." },
        { status: 400 }
      );
    }

    // Cap single 10-second chunk size to 25 MB for safety
    if (buffer.length > 25 * 1024 * 1024) {
      return NextResponse.json(
        { error: "Recording chunk exceeds 25 MB safety limit." },
        { status: 413 }
      );
    }

    const mimeType = file.type || "video/webm";
    const streamType = streamTypeRaw as
      | "screen"
      | "webcam"
      | "audio"
      | "snapshot";

    const stored = await storeProctoringBinary({
      attemptId: session.attemptId,
      candidateId: session.candidateId,
      streamType,
      segmentIndex,
      mimeType,
      buffer,
    });

    const record = await recordUploadedRecordingChunk({
      attemptId: session.attemptId,
      candidateId: session.candidateId,
      streamType,
      segmentIndex,
      mimeType,
      sizeBytes: buffer.length,
      durationMs,
      storageProvider: stored.storageProvider,
      storageObjectKey: stored.storageObjectKey,
      driveFileId: stored.driveFileId,
      checksumSha256: stored.checksumSha256,
      startedAt,
      endedAt,
    });

    return NextResponse.json({
      success: true,
      recordingId: record.id,
      storageProvider: stored.storageProvider,
    });
  } catch (err: any) {
    console.error("[exam/attempt/recordings] error:", err);
    return NextResponse.json(
      { error: err?.message || "Failed storing recording chunk." },
      { status: 500 }
    );
  }
}

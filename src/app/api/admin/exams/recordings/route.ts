import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import {
  getAdminExamDashboardSnapshot,
  markRecordingSyncedToDrive,
  markRecordingWiped,
} from "@/lib/exam-store";
import {
  deletePhysicalRecordingFile,
  getLocalVaultDiskStats,
  syncLocalVaultItemToGoogleDrive,
} from "@/lib/recording-storage";

export async function POST(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    const snapshot = await getAdminExamDashboardSnapshot();

    // 1. Sync local vault recordings to external Google Drive v3
    if (body.action === "sync_to_google_drive") {
      const localActive = snapshot.recordings.filter(
        (r) =>
          !r.wipedAt &&
          r.storageProvider === "local_vault" &&
          (!body.attemptId || r.attemptId === body.attemptId)
      );

      let syncedCount = 0;
      for (const rec of localActive) {
        const uploaded = await syncLocalVaultItemToGoogleDrive(rec);
        if (uploaded) {
          await markRecordingSyncedToDrive(rec.id, uploaded.driveFileId);
          syncedCount += 1;
        }
      }

      return NextResponse.json({
        success: true,
        syncedCount,
        localVaultStats: getLocalVaultDiskStats(),
      });
    }

    // 2. NDPA Retention Wipe (by attemptId, olderThanDays, or wipe_all)
    if (body.action === "wipe_recordings") {
      const mode: "attempt" | "retention_days" | "all" =
        body.mode || "retention_days";
      const cutoffDays = Number(
        body.olderThanDays ?? snapshot.integrationSettings.recordingRetentionDays ?? 60
      );
      const cutoffMs = Date.now() - cutoffDays * 24 * 60 * 60 * 1000;

      const targets = snapshot.recordings.filter((r) => {
        if (r.wipedAt) return false;
        if (mode === "attempt") return r.attemptId === String(body.attemptId);
        if (mode === "all") return true;
        return new Date(r.createdAt).getTime() <= cutoffMs;
      });

      let wipedCount = 0;
      for (const rec of targets) {
        await deletePhysicalRecordingFile(rec);
        await markRecordingWiped(rec.id);
        wipedCount += 1;
      }

      return NextResponse.json({
        success: true,
        wipedCount,
        localVaultStats: getLocalVaultDiskStats(),
      });
    }

    return NextResponse.json({ error: "Unsupported recording action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Recording vault operation failed." },
      { status: 400 }
    );
  }
}

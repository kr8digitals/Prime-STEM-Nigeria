import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import {
  getIntegrationSettingsSafe,
  updateIntegrationSettings,
} from "@/lib/exam-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  const settings = await getIntegrationSettingsSafe();
  return NextResponse.json(settings, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();
    // Only update secret fields when non-masked / explicitly supplied
    const patch: Record<string, any> = {};
    for (const key of [
      "resendFromEmail",
      "resendReplyTo",
      "adminNotificationEmail",
      "storagePreferredProvider",
      "googleDriveFolderId",
      "googleDriveClientId",
      "googleServiceAccountEmail",
      "recordingRetentionDays",
    ]) {
      if (body[key] !== undefined) {
        patch[key] = body[key];
      }
    }

    for (const secretKey of [
      "resendApiKey",
      "googleDriveClientSecret",
      "googleDriveRefreshToken",
      "googleServiceAccountPrivateKey",
    ]) {
      if (
        typeof body[secretKey] === "string" &&
        !body[secretKey].includes("••••")
      ) {
        patch[secretKey] = body[secretKey].trim();
      }
    }

    const updated = await updateIntegrationSettings(patch);
    return NextResponse.json({ success: true, settings: updated });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed updating integration settings." },
      { status: 400 }
    );
  }
}

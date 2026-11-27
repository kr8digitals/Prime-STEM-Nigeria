import crypto from "crypto";
import fs from "fs";
import os from "os";
import path from "path";
import {
  getRawIntegrationSettings,
  ProctoringRecordingRecord,
} from "@/lib/exam-store";

const IS_SERVERLESS = Boolean(process.env.VERCEL);
const LOCAL_VAULT_ROOT = IS_SERVERLESS
  ? path.join(os.tmpdir(), "prime-stem-proctoring-vault")
  : path.join(process.cwd(), "data", "proctoring-vault");

function ensureVaultDir(subDir?: string): string {
  const target = subDir ? path.join(LOCAL_VAULT_ROOT, subDir) : LOCAL_VAULT_ROOT;
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  return target;
}

// =============================================================
// GOOGLE DRIVE REST API v3 AUTH (OAUTH REFRESH TOKEN OR SERVICE ACCOUNT)
// =============================================================
interface ResolvedDriveCredentials {
  folderId: string;
  mode: "oauth" | "service_account";
  clientId?: string;
  clientSecret?: string;
  refreshToken?: string;
  serviceAccountEmail?: string;
  serviceAccountPrivateKey?: string;
}

async function resolveGoogleDriveConfig(): Promise<ResolvedDriveCredentials | null> {
  const settings = await getRawIntegrationSettings();
  const folderId =
    process.env.GOOGLE_DRIVE_FOLDER_ID || settings.googleDriveFolderId || "";
  if (!folderId.trim()) return null;

  const clientId =
    process.env.GOOGLE_DRIVE_CLIENT_ID || settings.googleDriveClientId || "";
  const clientSecret =
    process.env.GOOGLE_DRIVE_CLIENT_SECRET || settings.googleDriveClientSecret || "";
  const refreshToken =
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN || settings.googleDriveRefreshToken || "";

  if (clientId && clientSecret && refreshToken) {
    return {
      folderId: folderId.trim(),
      mode: "oauth",
      clientId: clientId.trim(),
      clientSecret: clientSecret.trim(),
      refreshToken: refreshToken.trim(),
    };
  }

  const saEmail =
    process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ||
    settings.googleServiceAccountEmail ||
    "";
  const saKeyRaw =
    process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ||
    settings.googleServiceAccountPrivateKey ||
    "";

  if (saEmail && saKeyRaw) {
    return {
      folderId: folderId.trim(),
      mode: "service_account",
      serviceAccountEmail: saEmail.trim(),
      serviceAccountPrivateKey: saKeyRaw.replace(/\\n/g, "\n").trim(),
    };
  }

  return null;
}

async function getGoogleDriveAccessToken(
  creds: ResolvedDriveCredentials
): Promise<string> {
  if (creds.mode === "oauth") {
    const body = new URLSearchParams({
      client_id: creds.clientId!,
      client_secret: creds.clientSecret!,
      refresh_token: creds.refreshToken!,
      grant_type: "refresh_token",
    });
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });
    if (!res.ok) {
      const txt = await res.text();
      throw new Error(`Google Drive OAuth token exchange failed: ${txt}`);
    }
    const json = await res.json();
    return json.access_token as string;
  }

  // Service Account RS256 JWT assertion
  const nowSec = Math.floor(Date.now() / 1000);
  const header = Buffer.from(
    JSON.stringify({ alg: "RS256", typ: "JWT" })
  ).toString("base64url");
  const claimSet = Buffer.from(
    JSON.stringify({
      iss: creds.serviceAccountEmail,
      scope: "https://www.googleapis.com/auth/drive.file",
      aud: "https://oauth2.googleapis.com/token",
      iat: nowSec,
      exp: nowSec + 3600,
    })
  ).toString("base64url");

  const signer = crypto.createSign("RSA-SHA256");
  signer.update(`${header}.${claimSet}`);
  const signature = signer.sign(creds.serviceAccountPrivateKey!, "base64url");
  const assertion = `${header}.${claimSet}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Google Service Account token exchange failed: ${txt}`);
  }
  const json = await res.json();
  return json.access_token as string;
}

async function uploadBufferToGoogleDrive(params: {
  creds: ResolvedDriveCredentials;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  description?: string;
}): Promise<{ driveFileId: string }> {
  const accessToken = await getGoogleDriveAccessToken(params.creds);
  const boundary = `primestem_boundary_${crypto.randomBytes(8).toString("hex")}`;

  const metadata = JSON.stringify({
    name: params.fileName,
    parents: [params.creds.folderId],
    description: params.description || "Prime STEM Nigeria Proctoring Evidence",
  });

  const preamble = Buffer.from(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n--${boundary}\r\nContent-Type: ${params.mimeType}\r\n\r\n`,
    "utf8"
  );
  const ending = Buffer.from(`\r\n--${boundary}--`, "utf8");
  const multipartBody = Buffer.concat([preamble, params.buffer, ending]);

  const res = await fetch(
    "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&supportsAllDrives=true&fields=id,name",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": `multipart/related; boundary=${boundary}`,
      },
      body: multipartBody,
    }
  );

  if (!res.ok) {
    const errTxt = await res.text();
    throw new Error(`Google Drive upload failed (${res.status}): ${errTxt}`);
  }
  const json = await res.json();
  return { driveFileId: json.id as string };
}

// =============================================================
// STORE, STREAM, SYNC & WIPE RECORDINGS
// =============================================================
export async function storeProctoringBinary(params: {
  attemptId: string;
  candidateId: string;
  streamType: "screen" | "webcam" | "audio" | "snapshot";
  segmentIndex: number;
  mimeType: string;
  buffer: Buffer;
}): Promise<{
  storageProvider: "google_drive" | "local_vault";
  storageObjectKey: string;
  driveFileId: string | null;
  checksumSha256: string;
}> {
  const checksumSha256 = crypto
    .createHash("sha256")
    .update(params.buffer)
    .digest("hex");

  const ext = params.mimeType.includes("jpeg")
    ? "jpg"
    : params.mimeType.includes("png")
    ? "png"
    : params.mimeType.includes("mp4")
    ? "mp4"
    : params.mimeType.includes("ogg")
    ? "ogg"
    : "webm";

  const safeAttemptId = params.attemptId.replace(/[^a-zA-Z0-9_-]/g, "");
  const fileName = `${params.streamType}_seg_${String(params.segmentIndex).padStart(
    4,
    "0"
  )}_${Date.now()}.${ext}`;
  const relativeKey = `${safeAttemptId}/${fileName}`;

  const settings = await getRawIntegrationSettings();
  const driveCreds =
    settings.storagePreferredProvider === "local_vault"
      ? null
      : await resolveGoogleDriveConfig();

  if (driveCreds) {
    try {
      const uploaded = await uploadBufferToGoogleDrive({
        creds: driveCreds,
        fileName: `PrimeSTEM_${safeAttemptId}_${fileName}`,
        mimeType: params.mimeType,
        buffer: params.buffer,
        description: `Attempt ${params.attemptId} | Candidate ${params.candidateId} | ${params.streamType} #${params.segmentIndex}`,
      });
      return {
        storageProvider: "google_drive",
        storageObjectKey: relativeKey,
        driveFileId: uploaded.driveFileId,
        checksumSha256,
      };
    } catch (driveErr) {
      if (IS_SERVERLESS) throw new Error("Recording upload to durable storage failed; retry is required.");
      console.warn(
        "[recording-storage] Google Drive upload failed, saving safely in local vault:",
        driveErr
      );
    }
  }

  if (IS_SERVERLESS) throw new Error("Durable recording storage is not configured; recording cannot be saved on this server.");

  // Local development vault (excluded from public web root & .gitignore)
  const dir = ensureVaultDir(safeAttemptId);
  const fullPath = path.join(dir, fileName);
  fs.writeFileSync(fullPath, params.buffer);

  return {
    storageProvider: "local_vault",
    storageObjectKey: relativeKey,
    driveFileId: null,
    checksumSha256,
  };
}

export async function readProctoringBinary(
  recording: ProctoringRecordingRecord,
  rangeHeader?: string | null
): Promise<{
  buffer: Buffer;
  totalSize: number;
  start: number;
  end: number;
  isPartial: boolean;
}> {
  if (recording.wipedAt) {
    throw new Error("This recording was purged under the NDPA retention policy.");
  }

  if (recording.storageProvider === "google_drive" && recording.driveFileId) {
    const creds = await resolveGoogleDriveConfig();
    if (!creds) {
      throw new Error("Google Drive credentials are required to stream Drive-stored recordings.");
    }
    const token = await getGoogleDriveAccessToken(creds);
    const headers: Record<string, string> = {
      Authorization: `Bearer ${token}`,
    };
    if (rangeHeader) headers["Range"] = rangeHeader;

    const res = await fetch(
      `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
        recording.driveFileId
      )}?alt=media&supportsAllDrives=true`,
      { headers }
    );
    if (!res.ok && res.status !== 206) {
      throw new Error(`Failed reading recording from Google Drive (${res.status}).`);
    }
    const arrayBuf = await res.arrayBuffer();
    const buf = Buffer.from(arrayBuf);
    return {
      buffer: buf,
      totalSize: recording.sizeBytes || buf.length,
      start: 0,
      end: Math.max(0, buf.length - 1),
      isPartial: false,
    };
  }

  // Prevent path traversal
  const normalizedKey = path
    .normalize(recording.storageObjectKey)
    .replace(/^(\.\.(\/|\\|$))+/, "");
  const fullPath = path.join(LOCAL_VAULT_ROOT, normalizedKey);
  if (!fullPath.startsWith(LOCAL_VAULT_ROOT) || !fs.existsSync(fullPath)) {
    throw new Error("Recording file not found in local vault.");
  }

  const stat = fs.statSync(fullPath);
  const totalSize = stat.size;

  if (rangeHeader && rangeHeader.startsWith("bytes=")) {
    const parts = rangeHeader.replace(/bytes=/, "").split("-");
    const start = Math.max(0, parseInt(parts[0], 10) || 0);
    const end = parts[1]
      ? Math.min(totalSize - 1, parseInt(parts[1], 10))
      : totalSize - 1;
    if (start < totalSize && start <= end) {
      const chunkLen = end - start + 1;
      const fd = fs.openSync(fullPath, "r");
      const chunk = Buffer.alloc(chunkLen);
      try {
        fs.readSync(fd, chunk, 0, chunkLen, start);
      } finally {
        fs.closeSync(fd);
      }
      return {
        buffer: chunk,
        totalSize,
        start,
        end,
        isPartial: true,
      };
    }
  }

  const fullBuf = fs.readFileSync(fullPath);
  return {
    buffer: fullBuf,
    totalSize,
    start: 0,
    end: Math.max(0, totalSize - 1),
    isPartial: false,
  };
}

export async function syncLocalVaultItemToGoogleDrive(
  recording: ProctoringRecordingRecord
): Promise<{ driveFileId: string } | null> {
  if (recording.wipedAt || recording.storageProvider === "google_drive") {
    return null;
  }
  const creds = await resolveGoogleDriveConfig();
  if (!creds) {
    throw new Error(
      "Google Drive credentials (Folder ID + OAuth Refresh Token or Service Account) are not configured yet."
    );
  }
  const normalizedKey = path
    .normalize(recording.storageObjectKey)
    .replace(/^(\.\.(\/|\\|$))+/, "");
  const fullPath = path.join(LOCAL_VAULT_ROOT, normalizedKey);
  if (!fs.existsSync(fullPath)) return null;

  const buffer = fs.readFileSync(fullPath);
  const uploaded = await uploadBufferToGoogleDrive({
    creds,
    fileName: `PrimeSTEM_${normalizedKey.replace(/[\\/]/g, "_")}`,
    mimeType: recording.mimeType,
    buffer,
    description: `Synced Attempt ${recording.attemptId} | ${recording.streamType} #${recording.segmentIndex}`,
  });

  // Remove local copy once safely uploaded to Google Drive
  try {
    fs.unlinkSync(fullPath);
  } catch {
    // ignore
  }
  return uploaded;
}

export async function deletePhysicalRecordingFile(
  recording: ProctoringRecordingRecord
): Promise<void> {
  if (recording.storageProvider === "google_drive" && recording.driveFileId) {
    const creds = await resolveGoogleDriveConfig();
    if (creds) {
      try {
        const token = await getGoogleDriveAccessToken(creds);
        await fetch(
          `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(
            recording.driveFileId
          )}?supportsAllDrives=true`,
          {
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (err) {
        console.warn("[recording-storage] Failed deleting Google Drive file:", err);
      }
    }
  }

  const normalizedKey = path
    .normalize(recording.storageObjectKey)
    .replace(/^(\.\.(\/|\\|$))+/, "");
  const fullPath = path.join(LOCAL_VAULT_ROOT, normalizedKey);
  if (fullPath.startsWith(LOCAL_VAULT_ROOT) && fs.existsSync(fullPath)) {
    try {
      fs.unlinkSync(fullPath);
    } catch {
      // ignore
    }
  }
}

export function getLocalVaultDiskStats(): {
  fileCount: number;
  totalBytes: number;
  vaultPath: string;
} {
  if (!fs.existsSync(LOCAL_VAULT_ROOT)) {
    return { fileCount: 0, totalBytes: 0, vaultPath: LOCAL_VAULT_ROOT };
  }
  let fileCount = 0;
  let totalBytes = 0;

  function walk(dir: string) {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (entry.isFile()) {
        fileCount += 1;
        totalBytes += fs.statSync(full).size;
      }
    }
  }
  try {
    walk(LOCAL_VAULT_ROOT);
  } catch {
    // ignore
  }
  return { fileCount, totalBytes, vaultPath: LOCAL_VAULT_ROOT };
}

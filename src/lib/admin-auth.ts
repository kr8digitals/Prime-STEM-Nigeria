import crypto from "crypto";
import { NextResponse } from "next/server";

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const AUTH_SECRET =
  process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_AUTH_SECRET;

export const ADMIN_COOKIE_NAME = "prime_admin_auth";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

export function verifyMasterPassword(candidate: string): boolean {
  if (!candidate || !ADMIN_PASSWORD || !AUTH_SECRET) return false;
  const a = Buffer.from(candidate, "utf8");
  const b = Buffer.from(ADMIN_PASSWORD, "utf8");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export const verifyAdminPassword = verifyMasterPassword;

export function createAdminSessionToken(): string {
  if (!AUTH_SECRET) throw new Error("ADMIN_SESSION_SECRET must be configured");
  const payload = JSON.stringify({
    role: "prime_stem_admin",
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
    nonce: crypto.randomBytes(8).toString("hex"),
  });
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const sig = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyAdminSessionToken(token?: string | null): boolean {
  if (!AUTH_SECRET || !token || !token.includes(".")) return false;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return false;

  const expectedSig = crypto
    .createHmac("sha256", AUTH_SECRET)
    .update(encoded)
    .digest("base64url");

  const sigBuf = Buffer.from(sig, "utf8");
  const expBuf = Buffer.from(expectedSig, "utf8");
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return false;
  }

  try {
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    if (parsed.role !== "prime_stem_admin") return false;
    if (typeof parsed.exp !== "number" || Date.now() > parsed.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function parseCookies(cookieHeader: string | null): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const k = part.slice(0, idx).trim();
    const v = part.slice(idx + 1).trim();
    if (k) out[k] = decodeURIComponent(v);
  }
  return out;
}

export function isAdminRequestAuthorized(request: Request): boolean {
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const bearer = authHeader.slice(7).trim();
    if (verifyAdminSessionToken(bearer)) return true;
  }
  const cookies = parseCookies(request.headers.get("cookie"));
  const cookieToken = cookies[ADMIN_COOKIE_NAME];
  return verifyAdminSessionToken(cookieToken);
}

export function requireAdminAuth(request: Request): NextResponse | null {
  if (!isAdminRequestAuthorized(request)) {
    return NextResponse.json(
      { error: "Unauthorized: Administrator authentication required." },
      { status: 401 }
    );
  }
  return null;
}

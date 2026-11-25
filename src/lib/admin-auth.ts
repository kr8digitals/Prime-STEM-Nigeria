import crypto from "crypto";
import { NextResponse } from "next/server";

// The public verification key is safe to commit. The admin password derives the
// signing key at login and is never embedded in the repository or a cookie.
const ADMIN_KEY_SALT = Buffer.from("5bf065574a81fc5d8a978356fe14b309", "hex");
const ADMIN_PUBLIC_KEY_DER = Buffer.from(
  "MCowBQYDK2VwAyEAXX6EkOrHWH/a32DxHMij5SjErzfxeAU3yETktdrCcZg=",
  "base64"
);
const ADMIN_PUBLIC_KEY = crypto.createPublicKey({ key: ADMIN_PUBLIC_KEY_DER, format: "der", type: "spki" });

export const ADMIN_COOKIE_NAME = "prime_admin_auth";
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function passwordKey(password: string): crypto.KeyObject {
  const seed = crypto.scryptSync(password, ADMIN_KEY_SALT, 32);
  return crypto.createPrivateKey({
    key: Buffer.concat([Buffer.from("302e020100300506032b657004220420", "hex"), seed]),
    format: "der",
    type: "pkcs8",
  });
}

export function verifyMasterPassword(candidate: string): boolean {
  if (!candidate || candidate.length > 256) return false;
  const publicKey = crypto.createPublicKey(passwordKey(candidate)).export({ format: "der", type: "spki" });
  return publicKey.length === ADMIN_PUBLIC_KEY_DER.length && crypto.timingSafeEqual(publicKey, ADMIN_PUBLIC_KEY_DER);
}

export const verifyAdminPassword = verifyMasterPassword;

export function createAdminSessionToken(password: string): string {
  const payload = JSON.stringify({
    role: "prime_stem_admin",
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
    nonce: crypto.randomBytes(8).toString("hex"),
  });
  const encoded = Buffer.from(payload, "utf8").toString("base64url");
  const sig = crypto.sign(null, Buffer.from(encoded), passwordKey(password)).toString("base64url");
  return `${encoded}.${sig}`;
}

export function verifyAdminSessionToken(token?: string | null): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return false;
  const [encoded, sig] = parts;
  try {
    if (!crypto.verify(null, Buffer.from(encoded), ADMIN_PUBLIC_KEY, Buffer.from(sig, "base64url"))) return false;
    const parsed = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8"));
    return parsed.role === "prime_stem_admin" && typeof parsed.exp === "number" && Date.now() <= parsed.exp;
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

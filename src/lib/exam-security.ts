import crypto from "crypto";
import { parseCookies } from "@/lib/admin-auth";

const EXAM_SECRET =
  process.env.EXAM_SESSION_SECRET ||
  process.env.ADMIN_AUTH_SECRET ||
  process.env.ADMIN_SESSION_SECRET;

const CODE_PEPPER =
  process.env.EXAM_CODE_PEPPER ||
  EXAM_SECRET;

export const EXAM_SESSION_COOKIE = "prime_exam_session";

// Unambiguous uppercase alphanumeric characters (excludes 0/O, 1/I/L)
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeExamCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}

export function hashExamCode(rawCode: string): string {
  if (!CODE_PEPPER) throw new Error("EXAM_CODE_PEPPER or EXAM_SESSION_SECRET must be configured");
  const normalized = normalizeExamCode(rawCode);
  return crypto
    .createHmac("sha256", CODE_PEPPER)
    .update(`exam-code:${normalized}`)
    .digest("hex");
}

export function generateCandidateAccessCode(prefix = "PSN"): string {
  const cleanPrefix =
    prefix
      .toUpperCase()
      .replace(/[^A-Z0-9-]/g, "")
      .slice(0, 8) || "PSN";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += CODE_ALPHABET[crypto.randomInt(0, CODE_ALPHABET.length)];
    part2 += CODE_ALPHABET[crypto.randomInt(0, CODE_ALPHABET.length)];
  }
  return `${cleanPrefix}-${part1}-${part2}`;
}

/**
 * Cryptographic Fisher-Yates shuffle of permanent question IDs.
 * IMPORTANT: Only question IDs are shuffled per candidate.
 * Answer options A, B, C, D are NEVER shuffled.
 */
export function shuffleQuestionIds(questionIds: string[]): string[] {
  const copy = [...questionIds];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = crypto.randomInt(0, i + 1);
    const tmp = copy[i];
    copy[i] = copy[j];
    copy[j] = tmp;
  }
  return copy;
}

export interface ExamSessionClaims {
  attemptId: string;
  candidateId: string;
  examId: string;
  iat: number;
  exp: number;
}

export function createExamSessionToken(
  claims: Omit<ExamSessionClaims, "iat" | "exp">,
  ttlHours = 12
): string {
  if (!EXAM_SECRET) throw new Error("EXAM_SESSION_SECRET must be configured");
  const fullClaims: ExamSessionClaims = {
    ...claims,
    iat: Date.now(),
    exp: Date.now() + ttlHours * 60 * 60 * 1000,
  };
  const encoded = Buffer.from(JSON.stringify(fullClaims), "utf8").toString(
    "base64url"
  );
  const sig = crypto
    .createHmac("sha256", EXAM_SECRET)
    .update(encoded)
    .digest("base64url");
  return `${encoded}.${sig}`;
}

export function verifyExamSessionToken(
  token?: string | null
): ExamSessionClaims | null {
  if (!EXAM_SECRET || !token || !token.includes(".")) return null;
  const [encoded, sig] = token.split(".");
  if (!encoded || !sig) return null;

  const expectedSig = crypto
    .createHmac("sha256", EXAM_SECRET)
    .update(encoded)
    .digest("base64url");

  const sigBuf = Buffer.from(sig, "utf8");
  const expBuf = Buffer.from(expectedSig, "utf8");
  if (
    sigBuf.length !== expBuf.length ||
    !crypto.timingSafeEqual(sigBuf, expBuf)
  ) {
    return null;
  }

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, "base64url").toString("utf8")
    ) as ExamSessionClaims;
    if (!parsed.candidateId || !parsed.attemptId || !parsed.examId) return null;
    if (typeof parsed.exp !== "number" || Date.now() > parsed.exp) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function getExamSessionFromRequest(
  request: Request
): ExamSessionClaims | null {
  const headerToken = request.headers.get("x-exam-session");
  if (headerToken) {
    const claims = verifyExamSessionToken(headerToken);
    if (claims) return claims;
  }
  const cookies = parseCookies(request.headers.get("cookie"));
  return verifyExamSessionToken(cookies[EXAM_SESSION_COOKIE]);
}

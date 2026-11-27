import fs from "fs";
import os from "os";
import path from "path";
import * as defaultData from "@/data/content";
import { pool } from "@/db";

// The repository ships seed JSON in ./data. On Vercel (and most serverless hosts)
// local changes are stored separately. Serverless mutations require PostgreSQL.
const SEED_DIR = path.join(process.cwd(), "data");
const IS_SERVERLESS = Boolean(process.env.VERCEL);
const RUNTIME_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), "prime-stem-data")
  : path.join(SEED_DIR, "runtime");

const CONTENT_FILENAME = "site-content.json";
const SUBMISSIONS_FILENAME = "submissions.json";

function readDirs(): string[] {
  return RUNTIME_DIR === SEED_DIR ? [SEED_DIR] : [RUNTIME_DIR, SEED_DIR];
}

function ensureDir() {
  try {
    if (!fs.existsSync(RUNTIME_DIR)) {
      fs.mkdirSync(RUNTIME_DIR, { recursive: true });
    }
  } catch (err) {
    console.warn("[content-store] Could not create data directory:", err);
  }
}

function readJson(filename: string): any | null {
  for (const dir of readDirs()) {
    try {
      const file = path.join(dir, filename);
      if (!fs.existsSync(file)) continue;
      return JSON.parse(fs.readFileSync(file, "utf-8"));
    } catch (err) {
      console.warn(`[content-store] Could not read ${filename} from ${dir}:`, err);
    }
  }
  return null;
}

function writeJson(filename: string, value: unknown): void {
  ensureDir();
  const target = path.join(RUNTIME_DIR, filename);
  const temp = `${target}.${process.pid}.${Date.now()}.tmp`;
  fs.writeFileSync(temp, JSON.stringify(value, null, 2), "utf-8");
  fs.renameSync(temp, target);
}

export function getDefaultContent() {
  return {
    organization: defaultData.ORGANIZATION,
    earlyBirdOffer: defaultData.EARLY_BIRD_OFFER,
    stemGuideForSchools: defaultData.STEM_GUIDE_FOR_SCHOOLS,
    stats: defaultData.STATS,
    programs: defaultData.PROGRAMS,
    services: defaultData.SERVICES,
    events: defaultData.EVENTS,
    winners: defaultData.WINNERS,
    partners: defaultData.PARTNERS,
    accreditedSchools: defaultData.ACCREDITED_SCHOOLS,
    team: defaultData.TEAM,
    news: defaultData.NEWS,
    gallery: defaultData.GALLERY,
    vision: defaultData.VISION,
    mission: defaultData.MISSION,
    goal: defaultData.GOAL,
    values: defaultData.VALUES,
    whyPrime: defaultData.WHY_PRIME,
    approach: defaultData.APPROACH,
    lastUpdated: new Date().toISOString(),
  };
}

type Submissions = { registrations: any[]; contactMessages: any[] };
const blankSubmissions = (): Submissions => ({ registrations: [], contactMessages: [] });

function seedDocument(filename: string): any {
  const file = path.join(SEED_DIR, filename);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8"));
  return filename === CONTENT_FILENAME ? getDefaultContent() : blankSubmissions();
}

async function readDocument(filename: string, key: string): Promise<any> {
  if (!pool) return readJson(filename) ?? seedDocument(filename);
  await pool.query(`CREATE TABLE IF NOT EXISTS public.site_content_store (key VARCHAR(64) PRIMARY KEY, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  const result = await pool.query("SELECT payload FROM public.site_content_store WHERE key = $1", [key]);
  return result.rows[0]?.payload ?? seedDocument(filename);
}

// Mutations serialize on the relevant row across application instances. Local
// writes use a separate atomic runtime file, preserving the checked-in seed.
async function mutateDocument<T>(filename: string, key: string, fn: (value: any) => T): Promise<T> {
  if (!pool) {
    if (IS_SERVERLESS) throw new Error("DATABASE_URL is required for durable serverless writes.");
    const value = readJson(filename) ?? seedDocument(filename);
    const result = fn(value);
    writeJson(filename, value);
    return result;
  }
  await pool.query(`CREATE TABLE IF NOT EXISTS public.site_content_store (key VARCHAR(64) PRIMARY KEY, payload JSONB NOT NULL, updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query("INSERT INTO public.site_content_store (key, payload, updated_at) VALUES ($1, $2::jsonb, NOW()) ON CONFLICT (key) DO NOTHING", [key, JSON.stringify(seedDocument(filename))]);
    const row = await client.query("SELECT payload FROM public.site_content_store WHERE key = $1 FOR UPDATE", [key]);
    const value = row.rows[0].payload;
    const result = fn(value);
    await client.query("UPDATE public.site_content_store SET payload = $2::jsonb, updated_at = NOW() WHERE key = $1", [key, JSON.stringify(value)]);
    await client.query("COMMIT");
    return result;
  } catch (error) { await client.query("ROLLBACK"); throw error; }
  finally { client.release(); }
}

export async function getSiteContent() {
  const parsed = await readDocument(CONTENT_FILENAME, "site_content_v1");
  return { ...getDefaultContent(), ...parsed };
}
export async function saveSiteContent(newUpdates: any) {
  if (!newUpdates || typeof newUpdates !== "object" || Array.isArray(newUpdates)) throw new Error("Invalid content payload.");
  return mutateDocument(CONTENT_FILENAME, "site_content_v1", value => {
    Object.assign(value, newUpdates, { lastUpdated: new Date().toISOString() });
    return { ...getDefaultContent(), ...value };
  });
}
export async function resetSiteContent() {
  return mutateDocument(CONTENT_FILENAME, "site_content_v1", value => {
    Object.keys(value).forEach(k => delete value[k]);
    Object.assign(value, getDefaultContent());
    return value;
  });
}
export async function getSubmissions(): Promise<Submissions> {
  const parsed = await readDocument(SUBMISSIONS_FILENAME, "site_submissions_v1");
  return { registrations: Array.isArray(parsed.registrations) ? parsed.registrations : [], contactMessages: Array.isArray(parsed.contactMessages) ? parsed.contactMessages : [] };
}
export async function recordRegistration(data: { fullName: string; email: string; phone: string; category: string; program: string; message?: string }) {
  return mutateDocument(SUBMISSIONS_FILENAME, "site_submissions_v1", current => {
    current.registrations ||= [];
    const id = Math.max(0, ...current.registrations.map((r: any) => Number(r.id) || 0)) + 1;
    const record = { id, ...data, status: "Pending", createdAt: new Date().toISOString() };
    current.registrations.unshift(record);
    return record;
  });
}
export async function recordContactMessage(data: { fullName: string; email: string; phone?: string; category: string; subject: string; message: string }) {
  return mutateDocument(SUBMISSIONS_FILENAME, "site_submissions_v1", current => {
    current.contactMessages ||= [];
    const id = Math.max(0, ...current.contactMessages.map((r: any) => Number(r.id) || 0)) + 1;
    const record = { id, ...data, status: "New", createdAt: new Date().toISOString() };
    current.contactMessages.unshift(record);
    return record;
  });
}
export async function deleteSubmission(type: "registrations" | "contactMessages", id: number) {
  if (!["registrations", "contactMessages"].includes(type)) throw new Error("Invalid submission type.");
  return mutateDocument(SUBMISSIONS_FILENAME, "site_submissions_v1", current => {
    const items = current[type] || [];
    current[type] = items.filter((item: any) => item.id !== id);
    return items.length !== current[type].length;
  });
}
export async function updateSubmissionStatus(type: "registrations" | "contactMessages", id: number, status: string) {
  if (!["registrations", "contactMessages"].includes(type)) throw new Error("Invalid submission type.");
  return mutateDocument(SUBMISSIONS_FILENAME, "site_submissions_v1", current => {
    const item = (current[type] || []).find((s: any) => s.id === id);
    if (item) item.status = status;
    return item ?? null;
  });
}

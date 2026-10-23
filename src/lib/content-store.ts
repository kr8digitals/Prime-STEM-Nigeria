import fs from "fs";
import os from "os";
import path from "path";
import * as defaultData from "@/data/content";

// The repository ships seed JSON in ./data. On Vercel (and most serverless hosts)
// the deployment filesystem is read-only, so runtime writes go to a temp directory
// instead. Both locations are read on startup, newest-wins.
const SEED_DIR = path.join(process.cwd(), "data");
const IS_SERVERLESS = Boolean(process.env.VERCEL);
const RUNTIME_DIR = IS_SERVERLESS
  ? path.join(os.tmpdir(), "prime-stem-data")
  : SEED_DIR;

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

function writeJson(filename: string, value: unknown): boolean {
  ensureDir();
  for (const dir of readDirs()) {
    try {
      fs.writeFileSync(path.join(dir, filename), JSON.stringify(value, null, 2), "utf-8");
      return true;
    } catch (err) {
      // Read-only filesystem (e.g. a deployment without a database) — try the next location.
      console.warn(`[content-store] Could not write ${filename} to ${dir}:`, err);
    }
  }
  return false;
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

export function getSiteContent() {
  const def = getDefaultContent();
  const parsed = readJson(CONTENT_FILENAME);

  if (!parsed) {
    writeJson(CONTENT_FILENAME, def);
    return def;
  }

  return {
    ...def,
    ...parsed,
  };
}

export function saveSiteContent(newUpdates: any) {
  const current = getSiteContent();
  const updated = {
    ...current,
    ...newUpdates,
    lastUpdated: new Date().toISOString(),
  };
  writeJson(CONTENT_FILENAME, updated);
  return updated;
}

export function resetSiteContent() {
  const def = getDefaultContent();
  writeJson(CONTENT_FILENAME, def);
  return def;
}

export function getSubmissions() {
  const parsed = readJson(SUBMISSIONS_FILENAME);
  if (!parsed) {
    const initial = { contactMessages: [], registrations: [] };
    writeJson(SUBMISSIONS_FILENAME, initial);
    return initial;
  }
  return {
    contactMessages: Array.isArray(parsed.contactMessages) ? parsed.contactMessages : [],
    registrations: Array.isArray(parsed.registrations) ? parsed.registrations : [],
  };
}

export function saveSubmissions(submissions: any) {
  writeJson(SUBMISSIONS_FILENAME, submissions);
  return submissions;
}

export function recordRegistration(data: {
  fullName: string;
  email: string;
  phone: string;
  category: string;
  program: string;
  message?: string;
}) {
  const current = getSubmissions();
  const nextId = (current.registrations?.[0]?.id || 0) + 1;
  const newRecord = {
    id: nextId,
    ...data,
    status: "Pending",
    createdAt: new Date().toISOString(),
  };
  current.registrations = [newRecord, ...(current.registrations || [])];
  saveSubmissions(current);
  return newRecord;
}

export function recordContactMessage(data: {
  fullName: string;
  email: string;
  phone?: string;
  category: string;
  subject: string;
  message: string;
}) {
  const current = getSubmissions();
  const nextId = (current.contactMessages?.[0]?.id || 0) + 1;
  const newRecord = {
    id: nextId,
    ...data,
    status: "New",
    createdAt: new Date().toISOString(),
  };
  current.contactMessages = [newRecord, ...(current.contactMessages || [])];
  saveSubmissions(current);
  return newRecord;
}

export function deleteSubmission(type: "registrations" | "contactMessages", id: number) {
  const current = getSubmissions();
  if (current[type]) {
    current[type] = current[type].filter((item: any) => item.id !== id);
    saveSubmissions(current);
    return true;
  }
  return false;
}

export function updateSubmissionStatus(type: "registrations" | "contactMessages", id: number, status: string) {
  const current = getSubmissions();
  if (current[type]) {
    const item = current[type].find((s: any) => s.id === id);
    if (item) {
      item.status = status;
      saveSubmissions(current);
      return item;
    }
  }
  return null;
}

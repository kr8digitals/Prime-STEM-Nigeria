import fs from "fs";
import path from "path";
import * as defaultData from "@/data/content";

const DATA_DIR = path.join(process.cwd(), "data");
const CONTENT_FILE = path.join(DATA_DIR, "site-content.json");
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.json");

function ensureDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
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
  ensureDir();
  if (!fs.existsSync(CONTENT_FILE)) {
    const initial = getDefaultContent();
    fs.writeFileSync(CONTENT_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }

  try {
    const raw = fs.readFileSync(CONTENT_FILE, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading site-content.json, using default:", err);
    return getDefaultContent();
  }
}

export function saveSiteContent(content: any) {
  ensureDir();
  const updated = {
    ...content,
    lastUpdated: new Date().toISOString(),
  };
  fs.writeFileSync(CONTENT_FILE, JSON.stringify(updated, null, 2), "utf-8");
  return updated;
}

export function getSubmissions() {
  ensureDir();
  if (!fs.existsSync(SUBMISSIONS_FILE)) {
    const initial = { contactMessages: [], registrations: [] };
    fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(initial, null, 2), "utf-8");
    return initial;
  }
  try {
    const raw = fs.readFileSync(SUBMISSIONS_FILE, "utf-8");
    return JSON.parse(raw);
  } catch {
    return { contactMessages: [], registrations: [] };
  }
}

export function saveSubmissions(submissions: any) {
  ensureDir();
  fs.writeFileSync(SUBMISSIONS_FILE, JSON.stringify(submissions, null, 2), "utf-8");
  return submissions;
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
    const item = current[type].find((item: any) => item.id === id);
    if (item) {
      item.status = status;
      saveSubmissions(current);
      return item;
    }
  }
  return null;
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

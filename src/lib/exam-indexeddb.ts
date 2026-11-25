"use client";

export interface CachedAnswerItem {
  key: string; // `${attemptId}:${questionId}`
  attemptId: string;
  questionId: string;
  selectedOption: "A" | "B" | "C" | "D" | null;
  clientUpdatedAt: string;
  synced: boolean;
}

export interface CachedRecordingChunk {
  key: string; // `${attemptId}:${streamType}:${segmentIndex}`
  attemptId: string;
  streamType: "screen" | "webcam" | "audio" | "snapshot";
  segmentIndex: number;
  mimeType: string;
  durationMs: number;
  startedAt: string;
  endedAt: string;
  blob: Blob;
}

const DB_NAME = "prime_stem_exam_recovery_v1";
const DB_VERSION = 1;
const STORE_ANSWERS = "pending_answers";
const STORE_CHUNKS = "pending_chunks";

function openRecoveryDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("IndexedDB unavailable"));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_ANSWERS)) {
        const store = db.createObjectStore(STORE_ANSWERS, { keyPath: "key" });
        store.createIndex("by_attempt", "attemptId", { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_CHUNKS)) {
        const store = db.createObjectStore(STORE_CHUNKS, { keyPath: "key" });
        store.createIndex("by_attempt", "attemptId", { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function cacheAnswerLocally(item: Omit<CachedAnswerItem, "key">): Promise<void> {
  try {
    const db = await openRecoveryDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_ANSWERS, "readwrite");
      tx.objectStore(STORE_ANSWERS).put({
        ...item,
        key: `${item.attemptId}:${item.questionId}`,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // Fallback to sessionStorage if private browsing disables IndexedDB
    try {
      const raw = sessionStorage.getItem(`psn_ans_${item.attemptId}`) || "{}";
      const map = JSON.parse(raw);
      map[item.questionId] = item;
      sessionStorage.setItem(`psn_ans_${item.attemptId}`, JSON.stringify(map));
    } catch {
      // ignore
    }
  }
}

export async function markAnswersSyncedLocally(
  attemptId: string,
  questionIds: string[]
): Promise<void> {
  try {
    const db = await openRecoveryDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_ANSWERS, "readwrite");
      const store = tx.objectStore(STORE_ANSWERS);
      for (const qId of questionIds) {
        const key = `${attemptId}:${qId}`;
        const getReq = store.get(key);
        getReq.onsuccess = () => {
          if (getReq.result) {
            store.put({ ...getReq.result, synced: true });
          }
        };
      }
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}

export async function getUnsyncedLocalAnswers(
  attemptId: string
): Promise<CachedAnswerItem[]> {
  try {
    const db = await openRecoveryDb();
    const items = await new Promise<CachedAnswerItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_ANSWERS, "readonly");
      const idx = tx.objectStore(STORE_ANSWERS).index("by_attempt");
      const req = idx.getAll(IDBKeyRange.only(attemptId));
      req.onsuccess = () => resolve((req.result || []) as CachedAnswerItem[]);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return items.filter((i) => !i.synced);
  } catch {
    return [];
  }
}

export async function getAllLocalAnswersMap(
  attemptId: string
): Promise<Record<string, CachedAnswerItem>> {
  const out: Record<string, CachedAnswerItem> = {};
  try {
    const db = await openRecoveryDb();
    const items = await new Promise<CachedAnswerItem[]>((resolve, reject) => {
      const tx = db.transaction(STORE_ANSWERS, "readonly");
      const idx = tx.objectStore(STORE_ANSWERS).index("by_attempt");
      const req = idx.getAll(IDBKeyRange.only(attemptId));
      req.onsuccess = () => resolve((req.result || []) as CachedAnswerItem[]);
      req.onerror = () => reject(req.error);
    });
    db.close();
    for (const item of items) {
      out[item.questionId] = item;
    }
  } catch {
    // ignore
  }
  return out;
}

export async function queueOfflineRecordingChunk(
  chunk: Omit<CachedRecordingChunk, "key">
): Promise<void> {
  try {
    const db = await openRecoveryDb();
    // Cap queued offline chunks to 25 segments so low-RAM mobile browsers stay healthy
    const existing = await new Promise<CachedRecordingChunk[]>((resolve) => {
      const tx = db.transaction(STORE_CHUNKS, "readonly");
      const req = tx
        .objectStore(STORE_CHUNKS)
        .index("by_attempt")
        .getAll(IDBKeyRange.only(chunk.attemptId));
      req.onsuccess = () => resolve((req.result || []) as CachedRecordingChunk[]);
      req.onerror = () => resolve([]);
    });

    if (existing.length < 25) {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_CHUNKS, "readwrite");
        tx.objectStore(STORE_CHUNKS).put({
          ...chunk,
          key: `${chunk.attemptId}:${chunk.streamType}:${chunk.segmentIndex}`,
        });
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    }
    db.close();
  } catch {
    // ignore
  }
}

export async function getQueuedOfflineChunks(
  attemptId: string
): Promise<CachedRecordingChunk[]> {
  try {
    const db = await openRecoveryDb();
    const items = await new Promise<CachedRecordingChunk[]>((resolve, reject) => {
      const tx = db.transaction(STORE_CHUNKS, "readonly");
      const req = tx
        .objectStore(STORE_CHUNKS)
        .index("by_attempt")
        .getAll(IDBKeyRange.only(attemptId));
      req.onsuccess = () => resolve((req.result || []) as CachedRecordingChunk[]);
      req.onerror = () => reject(req.error);
    });
    db.close();
    return items.sort((a, b) => a.segmentIndex - b.segmentIndex);
  } catch {
    return [];
  }
}

export async function removeQueuedOfflineChunk(key: string): Promise<void> {
  try {
    const db = await openRecoveryDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_CHUNKS, "readwrite");
      tx.objectStore(STORE_CHUNKS).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // ignore
  }
}

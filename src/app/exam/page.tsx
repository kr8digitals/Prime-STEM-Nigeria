"use client";

import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Award,
  Bookmark,
  Camera,
  CheckCircle2,
  Clock,
  Cpu,
  Eye,
  FileCheck2,
  KeyRound,
  Laptop,
  Loader2,
  Lock,
  Mic,
  Monitor,
  Printer,
  RefreshCw,
  Send,
  ShieldAlert,
  ShieldCheck,
  Volume2,
  Wifi,
  WifiOff,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AiProctorLiveMetrics,
  startSelfHostedAiProctor,
} from "@/lib/ai-proctor";
import {
  cacheAnswerLocally,
  getAllLocalAnswersMap,
  getQueuedOfflineChunks,
  getUnsyncedLocalAnswers,
  markAnswersSyncedLocally,
  queueOfflineRecordingChunk,
  removeQueuedOfflineChunk,
} from "@/lib/exam-indexeddb";

type StreamPermStatus = "pending" | "granted" | "denied" | "unsupported";

interface SafeQuestion {
  id: string;
  orderIndex: number;
  prompt: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  points: number;
}

interface CandidateInfo {
  id: string;
  fullName: string;
  email: string;
  schoolName: string;
  category: string;
  classLevel: string;
  accessCodeHint: string;
}

interface ExamInfo {
  id: string;
  title: string;
  competitionLabel: string;
  category: string;
  description: string;
  instructions: string;
  durationMinutes: number;
  passMarkPercent: number;
  resultsPublished: boolean;
  proctoringRequired: boolean;
}

interface ScheduleInfo {
  id: string;
  label: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
}

interface AttemptInfo {
  id: string;
  status:
    | "setup"
    | "in_progress"
    | "submitted"
    | "auto_submitted_violation"
    | "auto_submitted_timeout";
  compatibilityMode: boolean;
  incompleteProctoring: boolean;
  screenStatus: StreamPermStatus;
  webcamStatus: StreamPermStatus;
  audioStatus: StreamPermStatus;
  tabSwitchCount: number;
  aiSuspicionCount: number;
  networkDropCount: number;
  startedAt: string | null;
  timerEndsAt: string | null;
  submittedAt: string | null;
  submissionReason: string | null;
  score: number | null;
  maxScore: number | null;
  percentage: number | null;
  resultReleased: boolean;
}

function pickSupportedRecorderMime(kind: "video" | "audio"): string {
  if (typeof MediaRecorder === "undefined") return "";
  const candidates =
    kind === "video"
      ? [
          "video/webm;codecs=vp8,opus",
          "video/webm;codecs=vp9,opus",
          "video/webm",
          "video/mp4",
        ]
      : ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  for (const mime of candidates) {
    try {
      if (MediaRecorder.isTypeSupported(mime)) return mime;
    } catch {
      // ignore
    }
  }
  return "";
}

function formatSeconds(totalSec: number): string {
  const clamped = Math.max(0, Math.floor(totalSec));
  const hrs = Math.floor(clamped / 3600);
  const mins = Math.floor((clamped % 3600) / 60);
  const secs = clamped % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, "0")}:${String(mins).padStart(
      2,
      "0"
    )}:${String(secs).padStart(2, "0")}`;
  }
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export default function OnlineExaminationPortalPage() {
  // Portal top-level view
  const [portalTab, setPortalTab] = useState<"take_exam" | "check_result">(
    "take_exam"
  );
  const [bootChecking, setBootChecking] = useState(true);

  // Access Gate form
  const [emailInput, setEmailInput] = useState("");
  const [codeInput, setCodeInput] = useState("");
  const [gateLoading, setGateLoading] = useState(false);
  const [gateError, setGateError] = useState("");
  const [gateErrorCode, setGateErrorCode] = useState("");

  // Result Lookup state
  const [resultLookupLoading, setResultLookupLoading] = useState(false);
  const [resultLookupError, setResultLookupError] = useState("");
  const [resultSlip, setResultSlip] = useState<any | null>(null);

  // Active Session State
  const [candidate, setCandidate] = useState<CandidateInfo | null>(null);
  const [exam, setExam] = useState<ExamInfo | null>(null);
  const [schedule, setSchedule] = useState<ScheduleInfo | null>(null);
  const [attempt, setAttempt] = useState<AttemptInfo | null>(null);
  const [questions, setQuestions] = useState<SafeQuestion[]>([]);
  const [answers, setAnswers] = useState<
    Record<string, "A" | "B" | "C" | "D" | null>
  >({});
  const [answerTimestamps, setAnswerTimestamps] = useState<
    Record<string, string>
  >({});
  const [flaggedIds, setFlaggedIds] = useState<Record<string, boolean>>({});
  const [currentIdx, setCurrentIdx] = useState(0);

  // Server clock offset (`serverNowMs - Date.now()`)
  const serverOffsetMsRef = useRef<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // Hardware & Proctoring Streams
  const [screenStatus, setScreenStatus] = useState<StreamPermStatus>("pending");
  const [webcamStatus, setWebcamStatus] = useState<StreamPermStatus>("pending");
  const [audioStatus, setAudioStatus] = useState<StreamPermStatus>("pending");
  const [consentConfirmed, setConsentConfirmed] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [startingExam, setStartingExam] = useState(false);
  const [streamsReacquiredForResume, setStreamsReacquiredForResume] =
    useState(false);

  const screenStreamRef = useRef<MediaStream | null>(null);
  const webcamStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const recordersRef = useRef<MediaRecorder[]>([]);
  const aiStopRef = useRef<(() => void) | null>(null);

  const setupVideoRef = useRef<HTMLVideoElement | null>(null);
  const livePipVideoRef = useRef<HTMLVideoElement | null>(null);

  // Live Proctoring & Network Indicators
  const [aiMetrics, setAiMetrics] = useState<AiProctorLiveMetrics>({
    engineReady: false,
    backendName: "initializing",
    facesDetected: 0,
    gazeStatus: "initializing",
    detectedObjects: [],
    speechBandLevelDb: -90,
    voiceActive: false,
    lastCheckedAt: null,
  });
  const [recentAiBanner, setRecentAiBanner] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [unsyncedCount, setUnsyncedCount] = useState(0);
  const [syncBanner, setSyncBanner] = useState<string | null>(null);
  const [streamInterruptedWarning, setStreamInterruptedWarning] = useState<
    string | null
  >(null);

  // Modals (Tab-Switch Warning 1/2 & Confirm Submit)
  const [strikeOneModalOpen, setStrikeOneModalOpen] = useState(false);
  const [confirmSubmitModalOpen, setConfirmSubmitModalOpen] = useState(false);
  const [submittingExam, setSubmittingExam] = useState(false);

  // Refs for latest state inside event listeners
  const attemptRef = useRef<AttemptInfo | null>(null);
  const answersRef = useRef(answers);
  const answerTimestampsRef = useRef(answerTimestamps);
  const submittingRef = useRef(false);

  useEffect(() => {
    attemptRef.current = attempt;
  }, [attempt]);
  useEffect(() => {
    answersRef.current = answers;
  }, [answers]);
  useEffect(() => {
    answerTimestampsRef.current = answerTimestamps;
  }, [answerTimestamps]);

  // Cleanup all hardware streams & recorders
  const stopAllMediaAndAi = useCallback(() => {
    if (aiStopRef.current) {
      aiStopRef.current();
      aiStopRef.current = null;
    }
    for (const rec of recordersRef.current) {
      try {
        if (rec.state !== "inactive") rec.stop();
      } catch {
        // ignore
      }
    }
    recordersRef.current = [];
    for (const streamRef of [screenStreamRef, webcamStreamRef, audioStreamRef]) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => {
          t.onended = null;
          t.stop();
        });
        streamRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    return () => {
      stopAllMediaAndAi();
    };
  }, [stopAllMediaAndAi]);

  // Attach webcam stream to video element whenever stage or stream updates
  useEffect(() => {
    const stream = webcamStreamRef.current;
    if (stream) {
      if (setupVideoRef.current && setupVideoRef.current.srcObject !== stream) {
        setupVideoRef.current.srcObject = stream;
        setupVideoRef.current.play().catch(() => {});
      }
      if (
        livePipVideoRef.current &&
        livePipVideoRef.current.srcObject !== stream
      ) {
        livePipVideoRef.current.srcObject = stream;
        livePipVideoRef.current.play().catch(() => {});
      }
    }
  }, [webcamStatus, attempt?.status, streamsReacquiredForResume]);

  // Hydrate existing session on page reload / browser crash recovery
  const hydrateSessionFromPayload = useCallback(async (data: any) => {
    if (data.serverNow) {
      serverOffsetMsRef.current =
        new Date(data.serverNow).getTime() - Date.now();
    }
    setCandidate(data.candidate);
    setExam(data.exam);
    setSchedule(data.schedule);
    setAttempt(data.attempt);
    setQuestions(data.questions || []);

    // Merge server answers with any newer IndexedDB offline-cached answers
    const serverAnswers: Record<string, "A" | "B" | "C" | "D" | null> = {};
    const timestamps: Record<string, string> = {};
    if (data.answers) {
      for (const [qId, opt] of Object.entries(data.answers)) {
        serverAnswers[qId] = opt as "A" | "B" | "C" | "D" | null;
        timestamps[qId] = new Date(0).toISOString();
      }
    }

    if (data.attempt?.id) {
      const localMap = await getAllLocalAnswersMap(data.attempt.id);
      for (const [qId, item] of Object.entries(localMap)) {
        serverAnswers[qId] = item.selectedOption;
        timestamps[qId] = item.clientUpdatedAt;
      }
      const unsynced = await getUnsyncedLocalAnswers(data.attempt.id);
      setUnsyncedCount(unsynced.length);
    }

    setAnswers(serverAnswers);
    setAnswerTimestamps(timestamps);

    // Detect browser capability defaults on setup screen
    if (typeof navigator !== "undefined") {
      if (
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getDisplayMedia !== "function"
      ) {
        setScreenStatus("unsupported");
      }
      if (
        !navigator.mediaDevices ||
        typeof navigator.mediaDevices.getUserMedia !== "function"
      ) {
        setWebcamStatus("unsupported");
        setAudioStatus("unsupported");
      }
    }
  }, []);

  useEffect(() => {
    fetch("/api/exam/session", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then(async (data) => {
        if (data?.active) {
          await hydrateSessionFromPayload(data);
        }
      })
      .catch(() => {})
      .finally(() => setBootChecking(false));
  }, [hydrateSessionFromPayload]);

  // Upload a single recording / snapshot blob (queues to IndexedDB if offline)
  const uploadOrQueueChunk = useCallback(
    async (params: {
      attemptId: string;
      streamType: "screen" | "webcam" | "audio" | "snapshot";
      segmentIndex: number;
      mimeType: string;
      durationMs: number;
      startedAt: string;
      endedAt: string;
      blob: Blob;
    }) => {
      if (!params.blob || params.blob.size === 0) return;

      const sendForm = async () => {
        const fd = new FormData();
        const ext = params.mimeType.includes("jpeg")
          ? "jpg"
          : params.mimeType.includes("mp4")
          ? "mp4"
          : "webm";
        fd.append(
          "chunk",
          params.blob,
          `${params.streamType}_${params.segmentIndex}.${ext}`
        );
        fd.append("streamType", params.streamType);
        fd.append("segmentIndex", String(params.segmentIndex));
        fd.append("durationMs", String(params.durationMs));
        fd.append("startedAt", params.startedAt);
        fd.append("endedAt", params.endedAt);

        const res = await fetch("/api/exam/attempt/recordings", {
          method: "POST",
          body: fd,
        });
        if (!res.ok) throw new Error("Chunk upload HTTP error");
      };

      if (typeof navigator !== "undefined" && !navigator.onLine) {
        await queueOfflineRecordingChunk(params);
        return;
      }

      try {
        await sendForm();
      } catch {
        await queueOfflineRecordingChunk(params);
      }
    },
    []
  );

  // Start segmented 10-second MediaRecorders + Self-Hosted AI Proctor
  const activateContinuousProctoringPipelines = useCallback(
    (activeAttemptId: string) => {
      // Clear any previous recorders cleanly
      for (const r of recordersRef.current) {
        try {
          if (r.state !== "inactive") r.stop();
        } catch {
          // ignore
        }
      }
      recordersRef.current = [];

      const attachSegmentedRecorder = (
        stream: MediaStream | null,
        streamType: "screen" | "webcam" | "audio",
        kind: "video" | "audio"
      ) => {
        if (!stream || typeof MediaRecorder === "undefined") return;
        const activeTracks = stream
          .getTracks()
          .filter((t) => t.readyState === "live");
        if (activeTracks.length === 0) return;

        const mime = pickSupportedRecorderMime(kind);
        try {
          const recorder = mime
            ? new MediaRecorder(stream, {
                mimeType: mime,
                ...(kind === "video"
                  ? { videoBitsPerSecond: 320_000 }
                  : { audioBitsPerSecond: 48_000 }),
              })
            : new MediaRecorder(stream);

          let segIndex = 0;
          let segStartIso = new Date().toISOString();
          let segStartMs = Date.now();

          recorder.ondataavailable = (ev) => {
            if (ev.data && ev.data.size > 0) {
              const nowIso = new Date().toISOString();
              const dur = Math.max(500, Date.now() - segStartMs);
              const idx = segIndex++;
              const started = segStartIso;
              segStartIso = nowIso;
              segStartMs = Date.now();

              uploadOrQueueChunk({
                attemptId: activeAttemptId,
                streamType,
                segmentIndex: idx,
                mimeType: recorder.mimeType || mime || `${kind}/webm`,
                durationMs: dur,
                startedAt: started,
                endedAt: nowIso,
                blob: ev.data,
              });
            }
          };

          // Emit self-contained 10s chunks or timesliced WebM segments
          recorder.start(10_000);
          recordersRef.current.push(recorder);
        } catch (err) {
          console.warn(`[proctoring] MediaRecorder failed for ${streamType}:`, err);
        }
      };

      attachSegmentedRecorder(screenStreamRef.current, "screen", "video");
      attachSegmentedRecorder(webcamStreamRef.current, "webcam", "video");
      attachSegmentedRecorder(audioStreamRef.current, "audio", "audio");

      // Monitor mid-exam stream stop / revocation
      const bindTrackEndedDetection = (
        stream: MediaStream | null,
        label: string
      ) => {
        if (!stream) return;
        stream.getTracks().forEach((track) => {
          track.onended = () => {
            if (
              submittingRef.current ||
              attemptRef.current?.status !== "in_progress"
            ) {
              return;
            }
            setStreamInterruptedWarning(
              `${label} recording stopped unexpectedly! Please re-enable ${label} immediately — this interruption has been logged for proctoring review.`
            );
            fetch("/api/exam/attempt/event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                eventType: `stream_stopped_${label.toLowerCase()}`,
                classification: "system_notice",
                severity: "critical",
                details: `${label} media track ended mid-examination.`,
              }),
            }).catch(() => {});
          };
        });
      };

      bindTrackEndedDetection(screenStreamRef.current, "Screen");
      bindTrackEndedDetection(webcamStreamRef.current, "Webcam");
      bindTrackEndedDetection(audioStreamRef.current, "Microphone");

      // Start Self-Hosted Browser AI Vision + Spectral Voice Proctor
      if (aiStopRef.current) aiStopRef.current();
      let snapshotIdx = 0;
      const aiController = startSelfHostedAiProctor({
        getVideoElement: () => livePipVideoRef.current,
        audioStream: audioStreamRef.current,
        onMetrics: (m) => setAiMetrics(m),
        onAlert: async (alert) => {
          if (
            submittingRef.current ||
            attemptRef.current?.status !== "in_progress"
          ) {
            return;
          }
          setRecentAiBanner(alert.details);
          setTimeout(() => setRecentAiBanner(null), 6500);

          if (alert.snapshotBlob) {
            const nowIso = new Date().toISOString();
            uploadOrQueueChunk({
              attemptId: activeAttemptId,
              streamType: "snapshot",
              segmentIndex: snapshotIdx++,
              mimeType: "image/jpeg",
              durationMs: 0,
              startedAt: nowIso,
              endedAt: nowIso,
              blob: alert.snapshotBlob,
            });
          }

          try {
            const res = await fetch("/api/exam/attempt/event", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                eventType: alert.eventType,
                classification: "ai_suspicion",
                severity: alert.severity,
                details: alert.details,
              }),
            });
            if (res.ok) {
              const json = await res.json();
              if (json.attempt) setAttempt(json.attempt);
            }
          } catch {
            // Offline — AI suspicion will continue locally while recordings queue
          }
        },
      });
      aiStopRef.current = aiController.stop;
    },
    [uploadOrQueueChunk]
  );

  // Sync any offline-cached answers & chunks automatically on reconnection
  const syncOfflineRecoveryQueue = useCallback(
    async (reconnectedNotice = false) => {
      const curAttempt = attemptRef.current;
      if (!curAttempt || curAttempt.status !== "in_progress") return;

      const unsynced = await getUnsyncedLocalAnswers(curAttempt.id);
      if (unsynced.length > 0) {
        try {
          const res = await fetch("/api/exam/attempt/answers", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              answers: unsynced.map((u) => ({
                questionId: u.questionId,
                selectedOption: u.selectedOption,
                clientUpdatedAt: u.clientUpdatedAt,
              })),
              reconnectedSync: true,
            }),
          });
          if (res.ok) {
            await markAnswersSyncedLocally(
              curAttempt.id,
              unsynced.map((u) => u.questionId)
            );
            setUnsyncedCount(0);
            if (reconnectedNotice) {
              setSyncBanner(
                `Connection restored — ${unsynced.length} offline answer(s) synced safely.`
              );
              setTimeout(() => setSyncBanner(null), 5000);
            }
          }
        } catch {
          setIsOnline(false);
          return;
        }
      } else if (reconnectedNotice) {
        setSyncBanner("Internet connection restored — exam session synced.");
        setTimeout(() => setSyncBanner(null), 4000);
      }

      // Also flush queued IndexedDB proctoring recording chunks
      const queuedChunks = await getQueuedOfflineChunks(curAttempt.id);
      for (const chunk of queuedChunks) {
        try {
          const fd = new FormData();
          fd.append("chunk", chunk.blob, `${chunk.streamType}_${chunk.segmentIndex}.webm`);
          fd.append("streamType", chunk.streamType);
          fd.append("segmentIndex", String(chunk.segmentIndex));
          fd.append("durationMs", String(chunk.durationMs));
          fd.append("startedAt", chunk.startedAt);
          fd.append("endedAt", chunk.endedAt);

          const res = await fetch("/api/exam/attempt/recordings", {
            method: "POST",
            body: fd,
          });
          if (res.ok) {
            await removeQueuedOfflineChunk(chunk.key);
          } else {
            break;
          }
        } catch {
          break;
        }
      }
    },
    []
  );

  // Monitor Online / Offline network events
  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOnline(navigator.onLine);

    const onOffline = () => {
      setIsOnline(false);
    };
    const onOnline = () => {
      setIsOnline(true);
      syncOfflineRecoveryQueue(true);
      if (attemptRef.current?.status === "in_progress") {
        fetch("/api/exam/attempt/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "network_reconnected",
            classification: "system_notice",
            severity: "info",
            details: "Candidate internet connection dropped and automatically reconnected.",
          }),
        }).catch(() => {});
      }
    };

    window.addEventListener("offline", onOffline);
    window.addEventListener("online", onOnline);

    const periodicSync = setInterval(() => {
      if (navigator.onLine) {
        syncOfflineRecoveryQueue(false);
      }
    }, 8000);

    return () => {
      window.removeEventListener("offline", onOffline);
      window.removeEventListener("online", onOnline);
      clearInterval(periodicSync);
    };
  }, [syncOfflineRecoveryQueue]);

  // Build current full answer array for submission / violation auto-submit
  const buildCurrentAnswerBatch = useCallback(() => {
    return Object.entries(answersRef.current).map(([questionId, selectedOption]) => ({
      questionId,
      selectedOption,
      clientUpdatedAt:
        answerTimestampsRef.current[questionId] || new Date().toISOString(),
    }));
  }, []);

  // Finalise submission (manual or timeout)
  const executeFinalSubmission = useCallback(
    async (
      mode: "submitted" | "auto_submitted_timeout",
      reason: string
    ) => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmittingExam(true);
      setConfirmSubmitModalOpen(false);

      // Flush final MediaRecorder chunks before stopping
      for (const rec of recordersRef.current) {
        try {
          if (rec.state === "recording") rec.requestData();
        } catch {
          // ignore
        }
      }
      await new Promise((r) => setTimeout(r, 350));

      try {
        const res = await fetch("/api/exam/attempt/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mode,
            reason,
            finalAnswers: buildCurrentAnswerBatch(),
          }),
        });
        const json = await res.json();
        if (res.ok && json.attempt) {
          stopAllMediaAndAi();
          setAttempt(json.attempt);
          if (json.exam) {
            setExam((prev) => (prev ? { ...prev, ...json.exam } : prev));
          }
        } else {
          submittingRef.current = false;
        }
      } catch {
        // Offline at timeout/submit — retry automatically once online
        submittingRef.current = false;
      } finally {
        setSubmittingExam(false);
      }
    },
    [buildCurrentAnswerBatch, stopAllMediaAndAi]
  );

  // Authoritative Countdown Timer (`timerEndsAt`)
  useEffect(() => {
    if (attempt?.status !== "in_progress" || !attempt.timerEndsAt) {
      setRemainingSeconds(null);
      return;
    }

    const endMs = new Date(attempt.timerEndsAt).getTime();
    const updateClock = () => {
      const calibratedNow = Date.now() + serverOffsetMsRef.current;
      const diffSec = Math.ceil((endMs - calibratedNow) / 1000);
      setRemainingSeconds(Math.max(0, diffSec));
      if (diffSec <= 0 && !submittingRef.current) {
        executeFinalSubmission(
          "auto_submitted_timeout",
          "Examination time limit reached — automatically submitted."
        );
      }
    };

    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, [attempt?.status, attempt?.timerEndsAt, executeFinalSubmission]);

  // =========================================================================
  // PHASE 5 — PRECISION TWO-STRIKE TAB-SWITCHING ENFORCEMENT (Decision 6)
  // Armed ONLY during active `in_progress` examination (and after stream resume)
  // =========================================================================
  useEffect(() => {
    if (attempt?.status !== "in_progress") return;
    // Wait until streams are active if resuming after reload so browser permission popups don't count as tab switches
    const needsResumePopup =
      !screenStreamRef.current &&
      !webcamStreamRef.current &&
      !audioStreamRef.current &&
      !streamsReacquiredForResume;
    if (needsResumePopup) return;

    let hiddenTimer: ReturnType<typeof setTimeout> | null = null;
    let blurTimer: ReturnType<typeof setTimeout> | null = null;
    let blurStartedAt: number | null = null;
    let strikeLockUntil = 0;

    const triggerVerifiedTabSwitch = async (reasonDetail: string) => {
      const now = Date.now();
      if (now < strikeLockUntil || submittingRef.current) return;
      // Prevent double-counting simultaneous visibilitychange + window.blur for the same departure
      strikeLockUntil = now + 2500;

      const occurredAt = new Date().toISOString();
      try {
        const res = await fetch("/api/exam/attempt/event", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            eventType: "tab_switch",
            classification: "verified_violation",
            severity: "critical",
            details: reasonDetail,
            occurredAt,
            pendingAnswers: buildCurrentAnswerBatch(),
          }),
        });
        const json = await res.json();
        if (res.ok && json.attempt) {
          setAttempt(json.attempt);
          if (json.autoSubmitted || json.strikeAction === "auto_submitted") {
            submittingRef.current = true;
            setStrikeOneModalOpen(false);
            stopAllMediaAndAi();
          } else if (json.strikeAction === "warning_1") {
            setStrikeOneModalOpen(true);
          }
        }
      } catch {
        // Offline fallback: increment locally & sync immediately on reconnect
        setStrikeOneModalOpen(true);
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        if (hiddenTimer) clearTimeout(hiddenTimer);
        hiddenTimer = setTimeout(() => {
          if (document.visibilityState === "hidden") {
            triggerVerifiedTabSwitch(
              "Candidate switched away from examination browser tab (visibilitychange hidden >= 1s)."
            );
          }
        }, 1000);
      } else {
        if (hiddenTimer) {
          clearTimeout(hiddenTimer);
          hiddenTimer = null;
        }
      }
    };

    const onWindowBlur = () => {
      blurStartedAt = Date.now();
      if (blurTimer) clearTimeout(blurTimer);
      blurTimer = setTimeout(() => {
        if (!document.hasFocus()) {
          triggerVerifiedTabSwitch(
            "Candidate shifted focus outside examination browser window for > 3 seconds."
          );
        }
      }, 3000);
    };

    const onWindowFocus = () => {
      if (blurTimer) {
        clearTimeout(blurTimer);
        blurTimer = null;
      }
      if (blurStartedAt) {
        const elapsed = Date.now() - blurStartedAt;
        blurStartedAt = null;
        // Brief < 3s OS notification blip logged as system_notice without penalising candidate
        if (elapsed >= 600 && elapsed < 3000 && document.visibilityState === "visible") {
          fetch("/api/exam/attempt/event", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              eventType: "focus_blip_brief",
              classification: "system_notice",
              severity: "info",
              details: `Brief window focus blip (${elapsed}ms < 3s threshold) — logged without strike.`,
            }),
          }).catch(() => {});
        }
      }
    };

    // Deter accidental copy/contextmenu shortcuts inside active exam
    const preventContext = (e: MouseEvent) => e.preventDefault();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("blur", onWindowBlur);
    window.addEventListener("focus", onWindowFocus);
    document.addEventListener("contextmenu", preventContext);

    return () => {
      if (hiddenTimer) clearTimeout(hiddenTimer);
      if (blurTimer) clearTimeout(blurTimer);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("blur", onWindowBlur);
      window.removeEventListener("focus", onWindowFocus);
      document.removeEventListener("contextmenu", preventContext);
    };
  }, [
    attempt?.status,
    streamsReacquiredForResume,
    buildCurrentAnswerBatch,
    stopAllMediaAndAi,
  ]);

  // =========================================================================
  // PERMISSION ACQUISITION HANDLERS (Phase 4)
  // Distinguishes genuine lack of device/browser support vs candidate denial
  // =========================================================================
  const requestScreenPermission = async () => {
    setSetupError("");
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getDisplayMedia !== "function"
    ) {
      setScreenStatus("unsupported");
      return;
    }

    try {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 5, max: 10 } },
        audio: false,
      });
      screenStreamRef.current = stream;
      setScreenStatus("granted");
      setStreamInterruptedWarning(null);
    } catch (err: any) {
      const name = String(err?.name || "");
      // Mobile browsers sometimes expose a stub getDisplayMedia that throws NotSupportedError / TypeError / InvalidStateError
      const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(
        navigator.userAgent || ""
      );
      if (
        name === "NotSupportedError" ||
        name === "TypeError" ||
        (isMobileUA && name !== "NotAllowedError")
      ) {
        setScreenStatus("unsupported");
      } else {
        setScreenStatus("denied");
        setSetupError(
          "Screen recording permission was denied. Your device supports screen sharing — you MUST grant Screen Recording access to start this examination."
        );
      }
    }
  };

  const requestWebcamAndMicPermissions = async () => {
    setSetupError("");
    if (
      typeof navigator === "undefined" ||
      !navigator.mediaDevices ||
      typeof navigator.mediaDevices.getUserMedia !== "function"
    ) {
      setWebcamStatus("unsupported");
      setAudioStatus("unsupported");
      return;
    }

    // Request Webcam independently so we accurately separate missing webcam vs missing mic vs denial
    try {
      if (webcamStreamRef.current) {
        webcamStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const camStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: "user",
        },
        audio: false,
      });
      webcamStreamRef.current = camStream;
      setWebcamStatus("granted");
    } catch (err: any) {
      const name = String(err?.name || "");
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setWebcamStatus("unsupported");
      } else {
        setWebcamStatus("denied");
        setSetupError(
          "Webcam permission was denied. Please allow camera access in your browser address bar and try again."
        );
      }
    }

    // Request Microphone independently
    try {
      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      const micStream = await navigator.mediaDevices.getUserMedia({
        video: false,
        audio: {
          echoCancellation: true,
          noiseSuppression: false,
        },
      });
      audioStreamRef.current = micStream;
      setAudioStatus("granted");
    } catch (err: any) {
      const name = String(err?.name || "");
      if (name === "NotFoundError" || name === "DevicesNotFoundError") {
        setAudioStatus("unsupported");
      } else {
        setAudioStatus("denied");
        setSetupError((prev) =>
          prev
            ? prev
            : "Microphone permission was denied. Please allow microphone access in your browser and try again."
        );
      }
    }

    setStreamInterruptedWarning(null);
  };

  // Access Gate Submit
  const handleAccessGateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGateError("");
    setGateErrorCode("");
    setGateLoading(true);
    try {
      const res = await fetch("/api/exam/access", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.trim(),
          accessCode: codeInput.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setGateError(json.error || "Invalid credentials.");
        setGateErrorCode(json.code || "");
        return;
      }
      await hydrateSessionFromPayload(json);
    } catch {
      setGateError("Network error connecting to Examination Server.");
    } finally {
      setGateLoading(false);
    }
  };

  // Result Lookup Submit
  const handleResultLookupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setResultLookupError("");
    setResultSlip(null);
    setResultLookupLoading(true);
    try {
      const res = await fetch("/api/exam/result", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: emailInput.trim(),
          accessCode: codeInput.trim(),
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setResultLookupError(json.error || "Could not locate examination record.");
        return;
      }
      setResultSlip(json);
    } catch {
      setResultLookupError("Network error checking result.");
    } finally {
      setResultLookupLoading(false);
    }
  };

  // Start Examination Attempt (after mandatory 3-stream check & consent)
  const handleStartExamAttempt = async () => {
    if (!attempt || !exam) return;
    setSetupError("");

    if (
      screenStatus === "pending" ||
      webcamStatus === "pending" ||
      audioStatus === "pending"
    ) {
      setSetupError(
        "Please complete all three proctoring permission checks (Screen, Webcam, and Microphone) before starting."
      );
      return;
    }

    if (
      screenStatus === "denied" ||
      webcamStatus === "denied" ||
      audioStatus === "denied"
    ) {
      setSetupError(
        "Examination start blocked: You denied one or more required device permissions supported by your browser. Click the permission buttons above and grant access."
      );
      return;
    }

    if (!consentConfirmed) {
      setSetupError(
        "Parent, Legal Guardian, or Authorised School consent must be confirmed before starting."
      );
      return;
    }

    setStartingExam(true);
    try {
      const res = await fetch("/api/exam/attempt/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          screenStatus,
          webcamStatus,
          audioStatus,
          consentConfirmed,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setSetupError(json.error || "Unable to start examination.");
        return;
      }

      if (json.serverNow) {
        serverOffsetMsRef.current =
          new Date(json.serverNow).getTime() - Date.now();
      }
      submittingRef.current = false;
      setAttempt(json.attempt);
      setQuestions(json.questions || []);
      setCurrentIdx(0);
      setStreamsReacquiredForResume(true);
      activateContinuousProctoringPipelines(json.attempt.id);
    } catch {
      setSetupError("Network error starting examination. Please try again.");
    } finally {
      setStartingExam(false);
    }
  };

  // Select Option A, B, C, or D (NEVER shuffled; saved locally + synced to server)
  const handleSelectOption = async (
    questionId: string,
    option: "A" | "B" | "C" | "D"
  ) => {
    if (!attempt || attempt.status !== "in_progress") return;
    const nowIso = new Date().toISOString();

    setAnswers((prev) => ({ ...prev, [questionId]: option }));
    setAnswerTimestamps((prev) => ({ ...prev, [questionId]: nowIso }));

    await cacheAnswerLocally({
      attemptId: attempt.id,
      questionId,
      selectedOption: option,
      clientUpdatedAt: nowIso,
      synced: false,
    });

    if (typeof navigator !== "undefined" && !navigator.onLine) {
      setIsOnline(false);
      const unsynced = await getUnsyncedLocalAnswers(attempt.id);
      setUnsyncedCount(unsynced.length);
      return;
    }

    try {
      const res = await fetch("/api/exam/attempt/answers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          answers: [
            {
              questionId,
              selectedOption: option,
              clientUpdatedAt: nowIso,
            },
          ],
        }),
      });
      if (res.ok) {
        await markAnswersSyncedLocally(attempt.id, [questionId]);
      } else {
        const unsynced = await getUnsyncedLocalAnswers(attempt.id);
        setUnsyncedCount(unsynced.length);
      }
    } catch {
      setIsOnline(false);
      const unsynced = await getUnsyncedLocalAnswers(attempt.id);
      setUnsyncedCount(unsynced.length);
    }
  };

  // Sign out of exam session (only allowed before or after exam)
  const handleExitPortalSession = async () => {
    stopAllMediaAndAi();
    await fetch("/api/exam/access", { method: "DELETE" }).catch(() => {});
    setCandidate(null);
    setExam(null);
    setSchedule(null);
    setAttempt(null);
    setQuestions([]);
    setAnswers({});
  };

  const answeredCount = useMemo(
    () => Object.values(answers).filter((v) => v !== null && v !== undefined).length,
    [answers]
  );

  const currentQuestion = questions[currentIdx] || null;

  // =========================================================================
  // RENDER 0: LOADING
  // =========================================================================
  if (bootChecking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0B132B] text-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-9 w-9 animate-spin text-cyan-400" />
          <p className="text-sm font-bold text-slate-300">
            Initializing Prime STEM Examination Workstation…
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER 1: PUBLIC ACCESS CODE GATE & RESULT LOOKUP (No active session)
  // =========================================================================
  if (!attempt || !candidate || !exam) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0B132B] via-[#111C44] to-[#0B132B] text-white">
        {/* Portal Top Bar */}
        <div className="border-b border-white/10 bg-[#0B132B]/90 px-5 py-4 backdrop-blur">
          <div className="mx-auto flex max-w-6xl items-center justify-between">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white p-1">
                <img
                  src="/images/logo-tight.png"
                  alt="Prime STEM Nigeria"
                  className="h-full w-full object-contain"
                />
              </div>
              <div>
                <span className="block text-base font-black tracking-tight text-white">
                  PRIME STEM <span className="text-cyan-400">EXAM PORTAL</span>
                </span>
                <span className="block text-[0.65rem] font-semibold uppercase tracking-widest text-slate-400">
                  AI-Proctored Computer-Based Assessment
                </span>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                href="/register"
                className="hidden rounded-full border border-cyan-400/30 bg-cyan-500/10 px-4 py-1.5 text-xs font-bold text-cyan-300 hover:bg-cyan-500/20 sm:inline-flex"
              >
                Register for Exam
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/20"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Main Website
              </Link>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-5xl px-5 py-12 sm:py-16">
          <div className="grid gap-10 lg:grid-cols-12 items-start">
            {/* Left Info Column */}
            <div className="lg:col-span-5 space-y-6">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-500/15 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-cyan-300 ring-1 ring-cyan-400/30">
                  <ShieldCheck className="h-3.5 w-3.5" /> Official Assessment Gateway
                </span>
                <h1 className="mt-4 text-3xl font-black leading-tight text-white sm:text-4xl">
                  Prime STEM Online Examination Center
                </h1>
                <p className="mt-3 text-sm leading-relaxed text-slate-300">
                  Log in with your registered email address and your unique Administrator-activated Examination Access Code during your scheduled window.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3.5 text-xs text-slate-300">
                <h3 className="font-extrabold uppercase tracking-wider text-amber-300 text-xs">
                  Before You Enter the Exam Room
                </h3>
                <div className="flex items-start gap-2.5">
                  <Monitor className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                  <p>
                    <strong className="text-white">3 Mandatory Streams:</strong> Screen Recording, Webcam, and Microphone must be granted before the timer starts.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />
                  <p>
                    <strong className="text-white">Zero Tab-Switching Rule:</strong> 1st tab switch triggers an immediate formal warning. 2nd tab switch <strong>immediately auto-submits</strong> your examination.
                  </p>
                </div>
                <div className="flex items-start gap-2.5">
                  <Wifi className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  <p>
                    <strong className="text-white">Offline Protection:</strong> Brief internet drops automatically preserve your answers locally and sync upon reconnection.
                  </p>
                </div>
              </div>
            </div>

            {/* Right Login / Result Card */}
            <div className="lg:col-span-7">
              <div className="rounded-3xl border border-white/15 bg-white text-slate-900 p-6 sm:p-8 shadow-2xl">
                <div className="mb-6 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-xs font-extrabold">
                  <button
                    type="button"
                    onClick={() => {
                      setPortalTab("take_exam");
                      setGateError("");
                      setResultLookupError("");
                    }}
                    className={`rounded-lg py-2.5 transition ${
                      portalTab === "take_exam"
                        ? "bg-[#172554] text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Enter Examination Room
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPortalTab("check_result");
                      setGateError("");
                      setResultLookupError("");
                    }}
                    className={`rounded-lg py-2.5 transition ${
                      portalTab === "check_result"
                        ? "bg-[#172554] text-white shadow"
                        : "text-slate-600 hover:text-slate-900"
                    }`}
                  >
                    Check Official Result
                  </button>
                </div>

                {portalTab === "take_exam" ? (
                  <form onSubmit={handleAccessGateSubmit} className="space-y-4">
                    <div>
                      <label
                        htmlFor="exam-email"
                        className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[#172554]"
                      >
                        Registered Candidate Email *
                      </label>
                      <input
                        id="exam-email"
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="candidate@example.com"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="exam-code"
                        className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[#172554]"
                      >
                        Unique Examination Access Code *
                      </label>
                      <input
                        id="exam-code"
                        type="text"
                        required
                        value={codeInput}
                        onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
                        placeholder="e.g. PSN-XXXX-XXXX"
                        className="w-full rounded-xl border border-slate-200 px-4 py-3 font-mono text-base font-bold uppercase tracking-wider text-[#172554] focus:border-blue-600 focus:outline-none focus:ring-4 focus:ring-blue-500/10"
                      />
                    </div>

                    {gateError && (
                      <div
                        className={`rounded-xl border p-4 text-xs font-semibold leading-relaxed ${
                          gateErrorCode === "PENDING_APPROVAL"
                            ? "border-amber-200 bg-amber-50 text-amber-900"
                            : "border-red-200 bg-red-50 text-red-700"
                        }`}
                      >
                        {gateError}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={gateLoading}
                      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-blue-600/25 transition hover:brightness-110 disabled:opacity-60"
                    >
                      {gateLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <KeyRound className="h-4 w-4" />
                      )}
                      {gateLoading
                        ? "Verifying Access Code & Schedule…"
                        : "Verify Code & Proceed to Pre-Exam Setup"}
                    </button>
                  </form>
                ) : (
                  <div className="space-y-5">
                    <form onSubmit={handleResultLookupSubmit} className="space-y-4">
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                          <label
                            htmlFor="res-email"
                            className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[#172554]"
                          >
                            Registered Email *
                          </label>
                          <input
                            id="res-email"
                            type="email"
                            required
                            value={emailInput}
                            onChange={(e) => setEmailInput(e.target.value)}
                            placeholder="candidate@example.com"
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-900 focus:border-blue-600 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label
                            htmlFor="res-code"
                            className="mb-1.5 block text-xs font-extrabold uppercase tracking-wider text-[#172554]"
                          >
                            Exam Access Code *
                          </label>
                          <input
                            id="res-code"
                            type="text"
                            required
                            value={codeInput}
                            onChange={(e) =>
                              setCodeInput(e.target.value.toUpperCase())
                            }
                            placeholder="PSN-XXXX-XXXX"
                            className="w-full rounded-xl border border-slate-200 px-4 py-2.5 font-mono text-sm font-bold uppercase text-[#172554] focus:border-blue-600 focus:outline-none"
                          />
                        </div>
                      </div>

                      {resultLookupError && (
                        <div className="rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs font-semibold text-red-700">
                          {resultLookupError}
                        </div>
                      )}

                      <button
                        type="submit"
                        disabled={resultLookupLoading}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-[#172554] px-6 py-3 text-sm font-extrabold text-white transition hover:bg-[#1E3A8A] disabled:opacity-60"
                      >
                        {resultLookupLoading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Award className="h-4 w-4 text-amber-300" />
                        )}
                        Check Submission &amp; Result Status
                      </button>
                    </form>

                    {resultSlip && (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 space-y-3">
                        <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                          <div>
                            <p className="text-xs font-bold uppercase text-blue-700">
                              {resultSlip.exam.competitionLabel}
                            </p>
                            <h3 className="text-base font-black text-[#172554]">
                              {resultSlip.exam.title}
                            </h3>
                          </div>
                          <button
                            type="button"
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100"
                          >
                            <Printer className="h-3.5 w-3.5" /> Print
                          </button>
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-slate-500 block">Candidate</span>
                            <strong className="text-slate-900">
                              {resultSlip.candidate.fullName}
                            </strong>
                          </div>
                          <div>
                            <span className="text-slate-500 block">School</span>
                            <strong className="text-slate-900">
                              {resultSlip.candidate.schoolName}
                            </strong>
                          </div>
                        </div>

                        {!resultSlip.attempt ? (
                          <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs font-semibold text-amber-900">
                            No completed attempt recorded yet for this Access Code.
                          </div>
                        ) : resultSlip.resultVisible ? (
                          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center">
                            <span className="text-[0.68rem] font-bold uppercase tracking-wider text-emerald-700">
                              Verified Official Score
                            </span>
                            <p className="text-3xl font-black text-emerald-950 mt-1">
                              {resultSlip.attempt.score ?? 0} /{" "}
                              {resultSlip.attempt.maxScore ?? 0}{" "}
                              <span className="text-lg text-emerald-700">
                                ({resultSlip.attempt.percentage ?? 0}%)
                              </span>
                            </p>
                            <p className="mt-1 text-xs font-extrabold text-emerald-800">
                              {(resultSlip.attempt.percentage ?? 0) >=
                              resultSlip.exam.passMarkPercent
                                ? "QUALIFIED / PASSED"
                                : "COMPLETED"}
                            </p>
                          </div>
                        ) : (
                          <div className="rounded-xl bg-blue-50 border border-blue-200 p-4 text-xs font-semibold text-blue-900">
                            Your examination submission was received on{" "}
                            <strong>
                              {resultSlip.attempt.submittedAt
                                ? new Date(
                                    resultSlip.attempt.submittedAt
                                  ).toLocaleString()
                                : "record"}
                            </strong>
                            . Official scores are currently awaiting release by the Prime STEM Examination Board following proctoring verification.
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER 2: COMPLETED / SUBMITTED / AUTO-SUBMITTED SCREEN
  // =========================================================================
  if (
    attempt.status === "submitted" ||
    attempt.status === "auto_submitted_violation" ||
    attempt.status === "auto_submitted_timeout"
  ) {
    const isViolation = attempt.status === "auto_submitted_violation";
    const resultVisible = exam.resultsPublished || attempt.resultReleased;

    return (
      <div className="min-h-screen bg-[#0B132B] px-5 py-12 text-white">
        <div className="mx-auto max-w-2xl rounded-3xl border border-white/15 bg-white p-7 sm:p-10 text-slate-900 shadow-2xl">
          <div className="text-center">
            {isViolation ? (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-red-600">
                <ShieldAlert className="h-9 w-9" />
              </div>
            ) : (
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                <FileCheck2 className="h-9 w-9" />
              </div>
            )}

            <span
              className={`mt-4 inline-block rounded-full px-3.5 py-1 text-xs font-extrabold uppercase tracking-wider ${
                isViolation
                  ? "bg-red-100 text-red-700"
                  : "bg-emerald-100 text-emerald-800"
              }`}
            >
              {isViolation
                ? "Auto-Submitted — 2nd Tab-Switch Violation"
                : attempt.status === "auto_submitted_timeout"
                ? "Auto-Submitted — Time Completed"
                : "Examination Submitted Successfully"}
            </span>

            <h1 className="mt-3 text-2xl font-black text-[#172554]">
              {exam.title}
            </h1>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {candidate.fullName} &bull; {candidate.schoolName}
            </p>
          </div>

          <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500">Submitted Timestamp:</span>
              <strong className="text-slate-900">
                {attempt.submittedAt
                  ? new Date(attempt.submittedAt).toLocaleString()
                  : "Recorded"}
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Tab-Switch Count:</span>
              <strong
                className={
                  attempt.tabSwitchCount > 0 ? "text-red-600" : "text-emerald-700"
                }
              >
                {attempt.tabSwitchCount}
              </strong>
            </div>
            <div className="pt-1 border-t border-slate-200 text-slate-700">
              <strong>Log Note:</strong> {attempt.submissionReason || "Completed"}
            </div>
          </div>

          {resultVisible ? (
            <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-6 text-center">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-700">
                Official Marked Score
              </span>
              <div className="mt-1 text-4xl font-black text-emerald-950">
                {attempt.score ?? 0} / {attempt.maxScore ?? 0}
              </div>
              <div className="mt-1 text-base font-extrabold text-emerald-800">
                {attempt.percentage ?? 0}% &bull;{" "}
                {(attempt.percentage ?? 0) >= exam.passMarkPercent
                  ? "QUALIFIED / PASSED"
                  : "COMPLETED"}
              </div>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-blue-200 bg-blue-50 p-5 text-xs leading-relaxed text-blue-950">
              <strong className="block text-sm font-extrabold mb-1">
                Responses Saved &amp; Automatically Marked
              </strong>
              Your answers have been graded and stored securely on the server. Official scores will become visible on the Result Lookup tab and sent to{" "}
              <strong>{candidate.email}</strong> once released by the Prime STEM Examination Board after proctoring verification.
            </div>
          )}

          <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={handleExitPortalSession}
              className="rounded-full bg-[#172554] px-6 py-3 text-xs font-extrabold text-white hover:bg-[#1E3A8A]"
            >
              Finish &amp; Exit Session
            </button>
            <Link
              href="/"
              onClick={() => {
                fetch("/api/exam/access", { method: "DELETE" }).catch(() => {});
              }}
              className="rounded-full border border-slate-300 px-6 py-3 text-xs font-bold text-slate-700 hover:bg-slate-100"
            >
              Return to Prime STEM Website
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER 3: PRE-EXAM PERMISSION GATE & COMPATIBILITY SETUP (`status === "setup"`)
  // =========================================================================
  if (attempt.status === "setup") {
    const anyCompatibilityUnsupported =
      screenStatus === "unsupported" ||
      webcamStatus === "unsupported" ||
      audioStatus === "unsupported";

    const anyDenied =
      screenStatus === "denied" ||
      webcamStatus === "denied" ||
      audioStatus === "denied";

    const allChecked =
      screenStatus !== "pending" &&
      webcamStatus !== "pending" &&
      audioStatus !== "pending";

    const canStart = allChecked && !anyDenied && consentConfirmed;

    const badgeFor = (st: StreamPermStatus) => {
      if (st === "granted")
        return (
          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[0.7rem] font-extrabold text-emerald-800">
            Granted &amp; Ready
          </span>
        );
      if (st === "denied")
        return (
          <span className="rounded-full bg-red-100 px-2.5 py-0.5 text-[0.7rem] font-extrabold text-red-700">
            Denied — Blocked
          </span>
        );
      if (st === "unsupported")
        return (
          <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-[0.7rem] font-extrabold text-amber-800">
            Device Unsupported (Compatibility Mode)
          </span>
        );
      return (
        <span className="rounded-full bg-slate-200 px-2.5 py-0.5 text-[0.7rem] font-bold text-slate-700">
          Required Check
        </span>
      );
    };

    return (
      <div className="min-h-screen bg-[#0B132B] px-4 py-8 sm:px-6 text-white">
        <div className="mx-auto max-w-5xl space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 px-5 py-4">
            <div>
              <span className="text-[0.68rem] font-extrabold uppercase tracking-wider text-cyan-300">
                Pre-Examination Proctoring Verification (Timer Not Started)
              </span>
              <h1 className="text-xl font-black text-white">{exam.title}</h1>
              <p className="text-xs text-slate-300">
                Candidate: <strong>{candidate.fullName}</strong> ({candidate.schoolName}) &bull; Duration:{" "}
                <strong>{exam.durationMinutes} Minutes</strong> &bull; Slot:{" "}
                <strong>{schedule?.label}</strong>
              </p>
            </div>
            <button
              type="button"
              onClick={handleExitPortalSession}
              className="rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/20"
            >
              Cancel &amp; Exit
            </button>
          </div>

          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left: Mandatory 3-Stream Permission Gate */}
            <div className="lg:col-span-7 rounded-3xl bg-white p-6 sm:p-7 text-slate-900 shadow-xl space-y-5">
              <div>
                <h2 className="text-lg font-black text-[#172554]">
                  Step 1: Grant Mandatory Proctoring Permissions
                </h2>
                <p className="mt-1 text-xs text-slate-600 leading-relaxed">
                  Your {exam.durationMinutes}-minute countdown timer has <strong>not</strong> started yet. Grant Screen, Webcam, and Microphone recording permissions below to unlock the examination.
                </p>
              </div>

              <div className="space-y-3">
                {/* 1. Screen Recording */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
                      <Monitor className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-[#172554]">
                          1. Screen Recording
                        </span>
                        {badgeFor(screenStatus)}
                      </div>
                      <p className="text-xs text-slate-500">
                        Select &ldquo;Entire Screen&rdquo; when prompted by your browser.
                      </p>
                    </div>
                  </div>
                  {screenStatus !== "unsupported" && (
                    <button
                      type="button"
                      onClick={requestScreenPermission}
                      className="rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-700"
                    >
                      {screenStatus === "granted"
                        ? "Re-Select Screen"
                        : "Enable Screen Recording"}
                    </button>
                  )}
                </div>

                {/* 2 & 3. Webcam + Microphone */}
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-100 text-purple-700">
                      <Camera className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-[#172554]">
                          2. Webcam Video
                        </span>
                        {badgeFor(webcamStatus)}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <span className="text-sm font-extrabold text-[#172554]">
                          3. Microphone Audio
                        </span>
                        {badgeFor(audioStatus)}
                      </div>
                    </div>
                  </div>
                  {(webcamStatus !== "unsupported" ||
                    audioStatus !== "unsupported") && (
                    <button
                      type="button"
                      onClick={requestWebcamAndMicPermissions}
                      className="rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-extrabold text-white hover:bg-blue-700"
                    >
                      {webcamStatus === "granted" && audioStatus === "granted"
                        ? "Refresh Camera & Mic"
                        : "Enable Camera & Mic"}
                    </button>
                  )}
                </div>
              </div>

              {/* Alternative Device Compatibility Mode Banner (only when genuinely unsupported) */}
              {anyCompatibilityUnsupported && !anyDenied && (
                <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs leading-relaxed text-amber-950">
                  <strong className="flex items-center gap-1.5 font-extrabold text-amber-900">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    Alternative Device Compatibility Mode Activated
                  </strong>
                  <p className="mt-1">
                    Your current device/browser genuinely does not support{" "}
                    {[
                      screenStatus === "unsupported" ? "Screen Capture" : null,
                      webcamStatus === "unsupported" ? "Webcam" : null,
                      audioStatus === "unsupported" ? "Microphone" : null,
                    ]
                      .filter(Boolean)
                      .join(", ")}
                    . All supported streams will still be continuously recorded and AI-monitored, and your attempt will be flagged for Administrator Compatibility Review.
                  </p>
                </div>
              )}

              {/* NDPA Parental / School Consent Confirmation */}
              <div className="pt-2 border-t border-slate-200">
                <h3 className="text-sm font-black text-[#172554] mb-2">
                  Step 2: Examination Rules &amp; NDPA Proctoring Consent
                </h3>
                <div className="rounded-xl bg-slate-50 border border-slate-200 p-3.5 text-xs text-slate-700 space-y-1.5 mb-3">
                  <p>
                    <strong>Instructions:</strong> {exam.instructions}
                  </p>
                  <p className="text-red-700 font-semibold">
                    <strong>Strict Tab-Switching Enforcement:</strong> Switching tabs or leaving the browser window once issues an immediate warning. Switching tabs a <strong>second time automatically submits</strong> your examination immediately.
                  </p>
                </div>

                <label className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50/60 p-3.5 text-xs leading-relaxed text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentConfirmed}
                    onChange={(e) => setConsentConfirmed(e.target.checked)}
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600"
                  />
                  <span>
                    <strong>Authorised Consent Confirmation:</strong> I confirm that Parent, Legal Guardian, or Authorised School consent has been granted for continuous non-public proctoring recording and AI malpractice review during this examination, and I agree to abide by all Prime STEM Nigeria rules.
                  </span>
                </label>
              </div>

              {setupError && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700">
                  {setupError}
                </div>
              )}

              <button
                type="button"
                disabled={!canStart || startingExam}
                onClick={handleStartExamAttempt}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-emerald-500 via-blue-600 to-indigo-700 px-8 py-4 text-sm font-black text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {startingExam ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <Lock className="h-5 w-5" />
                )}
                {startingExam
                  ? "Locking Workstation & Loading Shuffled Questions…"
                  : `Start Proctored Examination (${exam.durationMinutes} Mins)`}
              </button>
            </div>

            {/* Right: Live Camera Framing Preview */}
            <div className="lg:col-span-5 space-y-4">
              <div className="rounded-3xl border border-white/15 bg-white/5 p-5">
                <h3 className="text-sm font-extrabold text-white flex items-center gap-2">
                  <Camera className="h-4 w-4 text-cyan-400" /> Live Webcam Framing Check
                </h3>
                <p className="mt-1 text-xs text-slate-400">
                  Ensure your face is clearly centered, well-lit, and no second person, phone, or textbook is in frame.
                </p>
                <div className="mt-4 aspect-video w-full overflow-hidden rounded-2xl bg-slate-950 ring-1 ring-white/15 flex items-center justify-center">
                  {webcamStatus === "granted" ? (
                    <video
                      ref={setupVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="text-center px-4 text-xs text-slate-500">
                      <Camera className="mx-auto h-8 w-8 mb-2 opacity-40" />
                      {webcamStatus === "unsupported"
                        ? "No camera hardware detected on this device."
                        : "Click 'Enable Camera & Mic' to preview your webcam."}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER 4: ACTIVE LOCKED-DOWN EXAMINATION WORKSTATION (`status === "in_progress"`)
  // =========================================================================
  const needsStreamResumeAfterReload =
    !screenStreamRef.current &&
    !webcamStreamRef.current &&
    !audioStreamRef.current &&
    !streamsReacquiredForResume;

  const isLowTime = remainingSeconds !== null && remainingSeconds <= 300;
  const isCriticalTime = remainingSeconds !== null && remainingSeconds <= 60;

  return (
    <div className="min-h-screen select-none bg-slate-100 text-slate-900">
      {/* Top Locked-Down Exam Header */}
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-[#0B132B] px-4 py-3 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white p-1">
              <img
                src="/images/logo-tight.png"
                alt="Prime STEM"
                className="h-full w-full object-contain"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-white line-clamp-1">
                  {exam.title}
                </span>
                <span className="hidden rounded bg-red-500/20 px-2 py-0.5 text-[0.65rem] font-extrabold text-red-300 ring-1 ring-red-400/30 sm:inline-flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-ping" />
                  REC &amp; AI PROCTORED
                </span>
              </div>
              <p className="text-[0.68rem] text-slate-400">
                {candidate.fullName} &bull; {candidate.schoolName}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            {/* Network Connectivity Pill */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                isOnline
                  ? "bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/30"
                  : "bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/40 animate-pulse"
              }`}
            >
              {isOnline ? (
                <Wifi className="h-3.5 w-3.5" />
              ) : (
                <WifiOff className="h-3.5 w-3.5" />
              )}
              <span className="hidden sm:inline">
                {isOnline
                  ? unsyncedCount > 0
                    ? `Syncing (${unsyncedCount})…`
                    : "Synced"
                  : `Offline (${unsyncedCount} queued)`}
              </span>
            </div>

            {/* Tab-Switch Strike Indicator */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-extrabold ${
                attempt.tabSwitchCount === 0
                  ? "bg-white/10 text-slate-200"
                  : "bg-red-600 text-white animate-pulse"
              }`}
              title="1st tab switch warns; 2nd tab switch auto-submits immediately"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Tab Strikes: {attempt.tabSwitchCount}/2</span>
            </div>

            {/* Countdown Timer */}
            <div
              className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 font-mono text-base font-black ${
                isCriticalTime
                  ? "bg-red-600 text-white animate-pulse"
                  : isLowTime
                  ? "bg-amber-500 text-slate-950"
                  : "bg-white/10 text-cyan-300 ring-1 ring-cyan-400/30"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span>
                {remainingSeconds !== null
                  ? formatSeconds(remainingSeconds)
                  : "--:--"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setConfirmSubmitModalOpen(true)}
              disabled={submittingExam}
              className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-extrabold text-white shadow hover:bg-emerald-500 disabled:opacity-60"
            >
              Submit Exam
            </button>
          </div>
        </div>
      </header>

      {/* Offline / Reconnected / Stream / AI Alert Banners */}
      <div className="mx-auto max-w-7xl px-4 pt-3 space-y-2">
        {!isOnline && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2.5 text-xs font-bold text-amber-950">
            <span className="flex items-center gap-2">
              <WifiOff className="h-4 w-4 text-amber-600 shrink-0" />
              Internet connection interrupted! Keep answering normally — every answer and proctoring segment is saved locally on your device and will sync automatically on reconnection.
            </span>
          </div>
        )}

        {syncBanner && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2.5 text-xs font-bold text-emerald-900">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            {syncBanner}
          </div>
        )}

        {streamInterruptedWarning && (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-300 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-800">
            <span>{streamInterruptedWarning}</span>
            <button
              type="button"
              onClick={async () => {
                await requestScreenPermission();
                await requestWebcamAndMicPermissions();
                activateContinuousProctoringPipelines(attempt.id);
              }}
              className="rounded-lg bg-red-600 px-3 py-1 text-white hover:bg-red-700"
            >
              Reconnect Streams Now
            </button>
          </div>
        )}

        {recentAiBanner && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-xs font-bold text-amber-900">
            <Eye className="h-4 w-4 text-amber-600 shrink-0" />
            {recentAiBanner}
          </div>
        )}
      </div>

      {/* Main Two-Column Exam Workstation */}
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-5 lg:grid-cols-12">
        {/* Left: Active Question Card */}
        <div className="lg:col-span-8 space-y-4">
          {currentQuestion ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="rounded-lg bg-[#172554] px-3 py-1 text-xs font-black text-white">
                    Question {currentIdx + 1} of {questions.length}
                  </span>
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700">
                    {currentQuestion.points}{" "}
                    {currentQuestion.points === 1 ? "Mark" : "Marks"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setFlaggedIds((prev) => ({
                      ...prev,
                      [currentQuestion.id]: !prev[currentQuestion.id],
                    }))
                  }
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-bold transition ${
                    flaggedIds[currentQuestion.id]
                      ? "bg-amber-100 text-amber-800 ring-1 ring-amber-300"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  <Bookmark className="h-3.5 w-3.5" />
                  {flaggedIds[currentQuestion.id]
                    ? "Flagged for Review"
                    : "Flag for Review"}
                </button>
              </div>

              {/* Question Prompt */}
              <div className="mt-6 text-base sm:text-lg font-bold leading-relaxed text-[#0F172A]">
                {currentQuestion.prompt}
              </div>

              {/* Options A, B, C, D — NEVER SHUFFLED */}
              <div className="mt-6 space-y-3">
                {(
                  [
                    { letter: "A", text: currentQuestion.optionA },
                    { letter: "B", text: currentQuestion.optionB },
                    { letter: "C", text: currentQuestion.optionC },
                    { letter: "D", text: currentQuestion.optionD },
                  ] as const
                ).map((opt) => {
                  const isSelected =
                    answers[currentQuestion.id] === opt.letter;
                  return (
                    <button
                      key={opt.letter}
                      type="button"
                      onClick={() =>
                        handleSelectOption(currentQuestion.id, opt.letter)
                      }
                      className={`flex w-full items-start gap-4 rounded-2xl border-2 p-4 text-left transition ${
                        isSelected
                          ? "border-[#2563EB] bg-blue-50/80 shadow-xs"
                          : "border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50"
                      }`}
                    >
                      <span
                        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-sm font-black ${
                          isSelected
                            ? "bg-[#2563EB] text-white"
                            : "bg-slate-100 text-[#172554]"
                        }`}
                      >
                        {opt.letter}
                      </span>
                      <span className="pt-1 text-sm sm:text-base font-semibold text-slate-800">
                        {opt.text}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Previous / Next Navigation */}
              <div className="mt-8 flex items-center justify-between border-t border-slate-100 pt-5">
                <button
                  type="button"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  <ArrowLeft className="h-4 w-4" /> Previous
                </button>

                {currentIdx < questions.length - 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setCurrentIdx((i) => Math.min(questions.length - 1, i + 1))
                    }
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-5 py-2.5 text-xs font-extrabold text-white hover:bg-blue-700"
                  >
                    Next Question <ArrowRight className="h-4 w-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmSubmitModalOpen(true)}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-500"
                  >
                    Review &amp; Submit Exam <Send className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="rounded-3xl bg-white p-8 text-center text-sm text-slate-600">
              No questions configured for this examination.
            </div>
          )}
        </div>

        {/* Right: Question Navigator + Live AI Proctoring HUD */}
        <div className="lg:col-span-4 space-y-5">
          {/* Question Palette */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-[#172554]">
                Question Navigator
              </h3>
              <span className="text-xs font-bold text-slate-600">
                {answeredCount} / {questions.length} Answered
              </span>
            </div>

            <div className="grid grid-cols-5 sm:grid-cols-6 gap-2">
              {questions.map((q, idx) => {
                const answered =
                  answers[q.id] !== null && answers[q.id] !== undefined;
                const flagged = Boolean(flaggedIds[q.id]);
                const active = idx === currentIdx;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`relative flex h-9 items-center justify-center rounded-xl text-xs font-extrabold transition ${
                      active
                        ? "ring-2 ring-[#172554] ring-offset-1 "
                        : ""
                    }${
                      answered
                        ? "bg-emerald-600 text-white"
                        : flagged
                        ? "bg-amber-100 text-amber-900 border border-amber-300"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {idx + 1}
                    {flagged && (
                      <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-400 ring-1 ring-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Self-Hosted AI Proctoring Monitor Card */}
          <div className="rounded-3xl border border-slate-800 bg-[#0B132B] p-5 text-white shadow-md space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-300">
                <Cpu className="h-3.5 w-3.5" /> Live AI Proctoring Monitor
              </span>
              <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[0.65rem] font-bold text-emerald-300">
                {aiMetrics.engineReady
                  ? `Active (${aiMetrics.backendName})`
                  : "Loading Models…"}
              </span>
            </div>

            <div className="aspect-video w-full overflow-hidden rounded-2xl bg-slate-950 ring-1 ring-white/15 relative">
              <video
                ref={livePipVideoRef}
                autoPlay
                playsInline
                muted
                className="h-full w-full object-cover"
              />
              {attempt.compatibilityMode && (
                <span className="absolute bottom-2 left-2 rounded bg-amber-500/90 px-2 py-0.5 text-[0.62rem] font-extrabold text-slate-950">
                  Compatibility Mode Logged
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[0.7rem]">
              <div className="rounded-xl bg-white/5 px-3 py-2">
                <span className="text-slate-400 block">Faces in Frame</span>
                <strong
                  className={
                    aiMetrics.facesDetected === 1
                      ? "text-emerald-300"
                      : "text-amber-300"
                  }
                >
                  {aiMetrics.gazeStatus === "initializing"
                    ? "Calibrating…"
                    : `${aiMetrics.facesDetected} (${aiMetrics.gazeStatus.replace(
                        "_",
                        " "
                      )})`}
                </strong>
              </div>
              <div className="rounded-xl bg-white/5 px-3 py-2">
                <span className="text-slate-400 block">Mic Speech Band</span>
                <strong
                  className={
                    aiMetrics.voiceActive ? "text-amber-300" : "text-emerald-300"
                  }
                >
                  {aiMetrics.voiceActive ? "Speech Detected" : "Quiet Room"}
                </strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* RESUME STREAMS MODAL (if browser reloaded mid-attempt) */}
      {needsStreamResumeAfterReload && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-xs">
          <div className="max-w-md rounded-3xl bg-white p-7 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-[#172554]">
              <RefreshCw className="h-6 w-6 text-blue-600" />
              <h3 className="text-lg font-black">
                Reconnect Proctoring Streams to Resume
              </h3>
            </div>
            <p className="text-xs leading-relaxed text-slate-600">
              Your examination session and saved answers were restored safely! Because the browser reloaded, click below to re-enable your recording streams and continue right where you left off.
            </p>
            <button
              type="button"
              onClick={async () => {
                if (attempt.screenStatus !== "unsupported") {
                  await requestScreenPermission();
                }
                await requestWebcamAndMicPermissions();
                setStreamsReacquiredForResume(true);
                activateContinuousProctoringPipelines(attempt.id);
              }}
              className="w-full rounded-full bg-[#2563EB] py-3.5 text-xs font-extrabold text-white hover:bg-blue-700"
            >
              Re-Enable Proctoring &amp; Continue Exam
            </button>
          </div>
        </div>
      )}

      {/* STRIKE 1 OF 2 — TAB-SWITCH FORMAL WARNING MODAL */}
      {strikeOneModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-red-950/85 p-4 backdrop-blur-xs">
          <div className="max-w-md rounded-3xl border-2 border-red-500 bg-white p-7 text-slate-900 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-700">
              <ShieldAlert className="h-8 w-8 shrink-0" />
              <div>
                <span className="text-[0.68rem] font-black uppercase tracking-wider text-red-600">
                  Official Malpractice Warning (Strike 1 of 2)
                </span>
                <h3 className="text-lg font-black text-slate-950">
                  Tab / Window Departure Recorded!
                </h3>
              </div>
            </div>
            <p className="text-xs leading-relaxed text-slate-700">
              You left or switched away from the active examination tab. This violation and its exact timestamp have been permanently recorded in your proctoring log.
            </p>
            <div className="rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-extrabold text-red-800">
              FINAL WARNING: If you switch tabs or leave the examination window ONE MORE TIME, your examination will be IMMEDIATELY and AUTOMATICALLY SUBMITTED.
            </div>
            <button
              type="button"
              onClick={() => setStrikeOneModalOpen(false)}
              className="w-full rounded-full bg-red-600 py-3.5 text-xs font-black text-white hover:bg-red-700"
            >
              I Understand — Return &amp; Continue Examination
            </button>
          </div>
        </div>
      )}

      {/* CONFIRM MANUAL SUBMISSION MODAL */}
      {confirmSubmitModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-xs">
          <div className="max-w-md rounded-3xl bg-white p-7 text-slate-900 shadow-2xl space-y-4">
            <h3 className="text-lg font-black text-[#172554]">
              Confirm Final Examination Submission
            </h3>
            <p className="text-xs leading-relaxed text-slate-600">
              You have answered <strong>{answeredCount}</strong> out of{" "}
              <strong>{questions.length}</strong> questions. Once submitted, you cannot reopen or alter your responses.
            </p>
            {answeredCount < questions.length && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-900">
                Heads up: {questions.length - answeredCount} question(s) are still unanswered!
              </div>
            )}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmSubmitModalOpen(false)}
                className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50"
              >
                Keep Reviewing
              </button>
              <button
                type="button"
                disabled={submittingExam}
                onClick={() =>
                  executeFinalSubmission(
                    "submitted",
                    "Submitted manually by candidate."
                  )
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-extrabold text-white hover:bg-emerald-500 disabled:opacity-60"
              >
                {submittingExam && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Submit Final Answers
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

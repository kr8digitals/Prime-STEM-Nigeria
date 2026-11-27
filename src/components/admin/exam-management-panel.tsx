"use client";

import {
  AlertTriangle,
  Award,
  BookOpen,
  CalendarClock,
  Camera,
  Check,
  CheckCircle2,
  CloudUpload,
  Copy,
  Cpu,
  Download,
  Edit3,
  Eye,
  FileCheck2,
  HardDrive,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Mic,
  Monitor,
  Play,
  Plus,
  RefreshCw,
  Send,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
  Video,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useContent } from "@/context/content-context";

interface AdminExamPanelProps {
  showToast: (msg: string) => void;
}

function toDatetimeLocalValue(iso?: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return "0 B";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function ExamManagementPanel({ showToast }: AdminExamPanelProps) {
  const { content } = useContent();

  const [subTab, setSubTab] = useState<
    "exams" | "questions" | "candidates" | "attempts" | "emails" | "integrations"
  >("exams");

  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<{
    examinations: any[];
    questions: any[];
    schedules: any[];
    candidates: any[];
    attempts: any[];
    recordings: any[];
    events: any[];
    emailLogs: any[];
    subscribers: any[];
    integrationSettings: any;
    localVaultStats: { fileCount: number; totalBytes: number; vaultPath: string };
  } | null>(null);

  const [selectedExamFilter, setSelectedExamFilter] = useState<string>("all");
  const [candidateSearch, setCandidateSearch] = useState("");
  const [candidateStatusFilter, setCandidateStatusFilter] = useState("all");

  const [importExamId, setImportExamId] = useState("");
  const [importCsv, setImportCsv] = useState("");
  const [importPreview, setImportPreview] = useState<any[] | null>(null);
  const [importError, setImportError] = useState("");
  const [importBusy, setImportBusy] = useState(false);
  const [answerCsv, setAnswerCsv] = useState("");
  const [answerCount, setAnswerCount] = useState<number | null>(null);

  // Modals & Drawers
  const [examModal, setExamModal] = useState<any | null>(null);
  const [scheduleModal, setScheduleModal] = useState<any | null>(null);
  const [questionModal, setQuestionModal] = useState<any | null>(null);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [approveModalCandidate, setApproveModalCandidate] = useState<any | null>(
    null
  );
  const [customCodeInput, setCustomCodeInput] = useState("");
  const [issuedCodeBanner, setIssuedCodeBanner] = useState<{
    candidateName: string;
    email: string;
    code: string;
    emailStatus: string;
  } | null>(null);

  // Detailed Attempt Review Drawer
  const [attemptDetail, setAttemptDetail] = useState<any | null>(null);
  const [loadingAttemptDetail, setLoadingAttemptDetail] = useState(false);
  const [activeMediaRecording, setActiveMediaRecording] = useState<any | null>(
    null
  );
  const [reviewNotesDraft, setReviewNotesDraft] = useState("");

  // Email Preview & Composer
  const [previewEmailLog, setPreviewEmailLog] = useState<any | null>(null);
  const [composerMode, setComposerMode] = useState<"custom" | "broadcast">(
    "custom"
  );
  const [composerTo, setComposerTo] = useState("");
  const [composerSubject, setComposerSubject] = useState("");
  const [composerBody, setComposerBody] = useState("");
  const [sendingEmailAction, setSendingEmailAction] = useState(false);

  // Integrations Form
  const [intForm, setIntForm] = useState<Record<string, any>>({});
  const [savingInt, setSavingInt] = useState(false);
  const [vaultBusy, setVaultBusy] = useState(false);

  const fetchSnapshot = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/exams", { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        setSnapshot(data);
        if (data.integrationSettings) {
          setIntForm({
            resendApiKey: "",
            resendFromEmail: data.integrationSettings.resendFromEmail || "",
            resendReplyTo: data.integrationSettings.resendReplyTo || "",
            adminNotificationEmail:
              data.integrationSettings.adminNotificationEmail || "",
            storagePreferredProvider:
              data.integrationSettings.storagePreferredProvider ||
              "google_drive",
            googleDriveFolderId:
              data.integrationSettings.googleDriveFolderId || "",
            googleDriveClientId:
              data.integrationSettings.googleDriveClientId || "",
            googleDriveClientSecret: "",
            googleDriveRefreshToken: "",
            googleServiceAccountEmail:
              data.integrationSettings.googleServiceAccountEmail || "",
            googleServiceAccountPrivateKey: "",
            recordingRetentionDays:
              data.integrationSettings.recordingRetentionDays || 60,
          });
        }
      }
    } catch (err) {
      console.error("Failed loading exam snapshot:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSnapshot();
  }, [fetchSnapshot]);

  const exams = snapshot?.examinations || [];
  const questions = snapshot?.questions || [];
  const schedules = snapshot?.schedules || [];
  const candidates = snapshot?.candidates || [];
  const attempts = snapshot?.attempts || [];
  const emailLogs = snapshot?.emailLogs || [];
  const subscribers = snapshot?.subscribers || [];

  const filteredQuestions = useMemo(() => {
    if (selectedExamFilter === "all") return questions;
    return questions.filter((q) => q.examId === selectedExamFilter);
  }, [questions, selectedExamFilter]);

  const filteredCandidates = useMemo(() => {
    return candidates.filter((c) => {
      if (selectedExamFilter !== "all" && c.examId !== selectedExamFilter)
        return false;
      if (
        candidateStatusFilter !== "all" &&
        c.approvalStatus !== candidateStatusFilter
      )
        return false;
      if (candidateSearch.trim()) {
        const q = candidateSearch.toLowerCase();
        return (
          c.fullName.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.schoolName.toLowerCase().includes(q) ||
          (c.accessCodeHint || "").toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [candidates, selectedExamFilter, candidateStatusFilter, candidateSearch]);

  const filteredAttempts = useMemo(() => {
    if (selectedExamFilter === "all") return attempts;
    return attempts.filter((a) => a.examId === selectedExamFilter);
  }, [attempts, selectedExamFilter]);

  // Actions
  const handleSaveExam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: examModal?.id || undefined,
      title: fd.get("title"),
      competitionLabel: fd.get("competitionLabel"),
      programSlug: fd.get("programSlug"),
      category: fd.get("category"),
      durationMinutes: Number(fd.get("durationMinutes") || 30),
      passMarkPercent: Number(fd.get("passMarkPercent") || 50),
      status: fd.get("status"),
      description: fd.get("description"),
      instructions: fd.get("instructions"),
      resultsPublished: Boolean(examModal?.resultsPublished),
      proctoringRequired: true,
    };

    const res = await fetch("/api/admin/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      showToast(`Error: ${json.error}`);
      return;
    }
    setExamModal(null);
    showToast("Examination saved successfully!");
    fetchSnapshot();
  };

  const handleToggleExamResults = async (
    examItem: any,
    notifyCandidates: boolean
  ) => {
    const res = await fetch("/api/admin/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "toggle_results_published",
        examId: examItem.id,
        published: !examItem.resultsPublished,
        notifyCandidates,
      }),
    });
    const json = await res.json();
    if (res.ok) {
      showToast(
        !examItem.resultsPublished
          ? `Results published${
              json.emailedCount ? ` & ${json.emailedCount} email(s) queued/sent` : ""
            }!`
          : "Results placed back under Admin hold."
      );
      fetchSnapshot();
    }
  };

  const handleDeleteExam = async (examId: string) => {
    if (
      !window.confirm(
        "Delete this examination and all linked schedules/questions/attempts?"
      )
    )
      return;
    const res = await fetch(`/api/admin/exams?id=${encodeURIComponent(examId)}`, {
      method: "DELETE",
    });
    if (res.ok) {
      showToast("Examination deleted.");
      fetchSnapshot();
    }
  };

  const handleSaveSchedule = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: scheduleModal?.id || undefined,
      examId: fd.get("examId"),
      label: fd.get("label"),
      startsAt: new Date(String(fd.get("startsAt"))).toISOString(),
      endsAt: new Date(String(fd.get("endsAt"))).toISOString(),
      capacity: Number(fd.get("capacity") || 250),
      isActive: fd.get("isActive") === "on",
    };

    const res = await fetch("/api/admin/exams/schedules", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      showToast(`Error: ${json.error}`);
      return;
    }
    setScheduleModal(null);
    showToast("Schedule time window saved!");
    fetchSnapshot();
  };

  const handleDeleteSchedule = async (id: string) => {
    if (!window.confirm("Remove this schedule slot?")) return;
    const res = await fetch(
      `/api/admin/exams/schedules?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      showToast("Schedule removed.");
      fetchSnapshot();
    }
  };

  const handleBulkImport = async (commit: boolean) => {
    setImportError(""); setImportBusy(true);
    try {
      const res = await fetch("/api/admin/exams/questions/import", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ examId: importExamId, csv: importCsv, commit }),
      });
      const data = await res.json();
      if (!res.ok) { setImportError(data.error || "Import failed."); return; }
      if (!commit) setImportPreview(data.questions);
      else { showToast(`${data.count} questions imported.`); setImportPreview(null); setImportCsv(""); await fetchSnapshot(); }
    } catch { setImportError("Could not reach the server. Check your connection and try again."); }
    finally { setImportBusy(false); }
  };

  const downloadAnswerTemplate = () => {
    const rows = (snapshot?.questions || []).filter(q => q.examId === importExamId);
    if (!rows.length) { setImportError("There are no questions in this examination."); return; }
    const cell = (value: string) => `"${String(value).replace(/^[=+@\-\t\r]/, "'$&").replace(/"/g, '""')}"`;
    const csv = "question_id,question,answer\n" + rows.map(q => [cell(q.id), cell(q.prompt), cell(q.correctOption || "")].join(",")).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a"); link.href = url; link.download = "prime-stem-answer-key.csv"; link.click(); URL.revokeObjectURL(url);
  };
  const handleAnswerImport = async (commit: boolean) => {
    setImportError(""); setImportBusy(true);
    try {
      const res = await fetch("/api/admin/exams/questions/answers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ examId: importExamId, csv: answerCsv, commit }) });
      const data = await res.json();
      if (!res.ok) { setImportError(data.error || "Answer import failed."); return; }
      if (commit) { showToast(`${data.count} answers saved.`); setAnswerCsv(""); setAnswerCount(null); await fetchSnapshot(); }
      else setAnswerCount(data.count);
    } catch { setImportError("Could not reach the server."); }
    finally { setImportBusy(false); }
  };

  const handleSaveQuestion = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const payload = {
      id: questionModal?.id || undefined,
      examId: fd.get("examId"),
      prompt: fd.get("prompt"),
      optionA: fd.get("optionA"),
      optionB: fd.get("optionB"),
      optionC: fd.get("optionC"),
      optionD: fd.get("optionD"),
      correctOption: fd.get("correctOption"),
      points: Number(fd.get("points") || 1),
      explanation: fd.get("explanation") || "",
    };

    const res = await fetch("/api/admin/exams/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      showToast(`Error: ${json.error}`);
      return;
    }
    setQuestionModal(null);
    showToast("MCQ Question saved with permanent UUID!");
    fetchSnapshot();
  };

  const handleDeleteQuestion = async (id: string) => {
    if (!window.confirm("Delete this MCQ question?")) return;
    const res = await fetch(
      `/api/admin/exams/questions?id=${encodeURIComponent(id)}`,
      { method: "DELETE" }
    );
    if (res.ok) {
      showToast("Question removed.");
      fetchSnapshot();
    }
  };

  const handleApproveAndIssueCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approveModalCandidate) return;

    const res = await fetch("/api/admin/exams/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "approve_and_issue_code",
        candidateId: approveModalCandidate.id,
        customCode: customCodeInput.trim() || undefined,
      }),
    });
    const json = await res.json();
    if (!res.ok) {
      showToast(`Error: ${json.error}`);
      return;
    }

    setIssuedCodeBanner({
      candidateName: json.candidate.fullName,
      email: json.candidate.email,
      code: json.plainAccessCode,
      emailStatus: json.emailStatus,
    });
    setApproveModalCandidate(null);
    setCustomCodeInput("");
    showToast("Candidate approved & Examination Access Code issued!");
    fetchSnapshot();
  };

  const handleManualEnroll = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const examId = String(fd.get("examId") || "");
    const scheduleId = String(fd.get("scheduleId") || "");
    const payload = {
      examId,
      scheduleId,
      fullName: fd.get("fullName"),
      email: fd.get("email"),
      phone: fd.get("phone"),
      schoolName: fd.get("schoolName"),
      category: "Student",
      classLevel: fd.get("classLevel"),
      approveImmediately: fd.get("approveImmediately") === "on",
      customCode: String(fd.get("customCode") || "").trim() || undefined,
      parentConsentGiven: true,
    };

    const res = await fetch("/api/admin/exams/candidates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const json = await res.json();
    if (!res.ok) {
      showToast(`Error: ${json.error}`);
      return;
    }
    setEnrollModalOpen(false);
    if (json.plainAccessCode) {
      setIssuedCodeBanner({
        candidateName: json.candidate.fullName,
        email: json.candidate.email,
        code: json.plainAccessCode,
        emailStatus: json.emailStatus || "queued",
      });
    }
    showToast("Candidate enrolled successfully!");
    fetchSnapshot();
  };

  const openAttemptInspector = async (attemptId: string) => {
    setLoadingAttemptDetail(true);
    setActiveMediaRecording(null);
    try {
      const res = await fetch(
        `/api/admin/exams/attempts?attemptId=${encodeURIComponent(attemptId)}`,
        { cache: "no-store" }
      );
      if (res.ok) {
        const data = await res.json();
        setAttemptDetail(data);
        setReviewNotesDraft(data.attempt.adminReviewNotes || "");
        const firstVideo = (data.recordings || []).find(
          (r: any) => !r.wipedAt && r.streamType !== "snapshot"
        );
        if (firstVideo) setActiveMediaRecording(firstVideo);
      }
    } finally {
      setLoadingAttemptDetail(false);
    }
  };

  const handleSaveAttemptRelease = async (
    attemptId: string,
    released: boolean,
    notifyCandidate: boolean
  ) => {
    const res = await fetch("/api/admin/exams/attempts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        attemptId,
        released,
        notifyCandidate,
        adminReviewNotes: reviewNotesDraft,
      }),
    });
    if (res.ok) {
      showToast(
        released
          ? "Candidate score released & saved!"
          : "Score placed under Admin hold."
      );
      openAttemptInspector(attemptId);
      fetchSnapshot();
    }
  };

  const exportCandidatesAndScoresCsv = () => {
    const rows = [
      [
        "Candidate Name",
        "Email",
        "Phone",
        "School",
        "Class",
        "Examination",
        "Approval Status",
        "Code Hint",
        "Attempt Status",
        "Score",
        "Max Score",
        "Percentage",
        "Tab Switches",
        "AI Suspicions",
        "Compatibility Mode",
      ],
    ];
    for (const c of filteredCandidates) {
      const ex = exams.find((e) => e.id === c.examId);
      const att = attempts.find((a) => a.candidateId === c.id);
      rows.push([
        c.fullName,
        c.email,
        c.phone,
        c.schoolName,
        c.classLevel || "",
        ex?.title || "",
        c.approvalStatus,
        c.accessCodeHint || "",
        att?.status || "not_started",
        att?.score !== null && att?.score !== undefined ? String(att.score) : "",
        att?.maxScore !== null && att?.maxScore !== undefined
          ? String(att.maxScore)
          : "",
        att?.percentage !== null && att?.percentage !== undefined
          ? `${att.percentage}%`
          : "",
        String(att?.tabSwitchCount ?? 0),
        String(att?.aiSuspicionCount ?? 0),
        att?.compatibilityMode ? "Yes" : "No",
      ]);
    }
    const csv = rows
      .map((r) =>
        r.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `PrimeSTEM_Exam_Candidates_Results_${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading && !snapshot) {
    return (
      <div className="flex items-center justify-center rounded-3xl border border-white/10 bg-white/5 py-20 text-slate-300">
        <Loader2 className="mr-2 h-6 w-6 animate-spin text-cyan-400" />
        Loading Examination &amp; AI Proctoring Command Center…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Summary Metrics */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
            Active Examinations
          </span>
          <div className="mt-1 text-2xl font-black text-white">
            {exams.length}
          </div>
          <span className="text-xs text-cyan-300">
            {questions.length} MCQs • {schedules.length} Time Slots
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
            Exam Candidates
          </span>
          <div className="mt-1 text-2xl font-black text-white">
            {candidates.length}
          </div>
          <span className="text-xs text-amber-300">
            {
              candidates.filter((c) => c.approvalStatus === "pending_approval")
                .length
            }{" "}
            Awaiting Code Approval
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
            Exam Attempts
          </span>
          <div className="mt-1 text-2xl font-black text-white">
            {attempts.length}
          </div>
          <span className="text-xs text-emerald-300">
            {
              attempts.filter((a) =>
                [
                  "submitted",
                  "auto_submitted_violation",
                  "auto_submitted_timeout",
                ].includes(a.status)
              ).length
            }{" "}
            Marked &amp; Stored
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
            Malpractice &amp; AI Alerts
          </span>
          <div className="mt-1 text-2xl font-black text-rose-300">
            {
              attempts.filter(
                (a) => a.tabSwitchCount > 0 || a.aiSuspicionCount > 0
              ).length
            }
          </div>
          <span className="text-xs text-slate-400">
            {
              attempts.filter((a) => a.status === "auto_submitted_violation")
                .length
            }{" "}
            Auto-Submitted (2 Strikes)
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <span className="text-[0.68rem] font-bold uppercase tracking-wider text-slate-400">
            Proctoring Vault
          </span>
          <div className="mt-1 text-2xl font-black text-cyan-300">
            {(snapshot?.recordings || []).filter((r) => !r.wipedAt).length}
          </div>
          <span className="text-xs text-slate-400">
            Local:{" "}
            {formatBytes(snapshot?.localVaultStats?.totalBytes || 0)}
          </span>
        </div>
      </div>

      {/* Newly Issued Access Code Banner */}
      {issuedCodeBanner && (
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-emerald-400/40 bg-emerald-500/15 p-5 text-white">
          <div>
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-300">
              Active Examination Access Code Issued
            </span>
            <p className="mt-1 text-sm text-slate-200">
              Candidate: <strong>{issuedCodeBanner.candidateName}</strong> (
              {issuedCodeBanner.email}) &bull; Email Dispatch:{" "}
              <strong className="text-cyan-300">
                {issuedCodeBanner.emailStatus === "sent"
                  ? "Delivered via Resend"
                  : "Logged in Resend Outbox (Ready to Send)"}
              </strong>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded-xl border border-amber-400/40 bg-black/40 px-4 py-2 font-mono text-lg font-black tracking-widest text-amber-300">
              {issuedCodeBanner.code}
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(issuedCodeBanner.code);
                showToast("Access Code copied to clipboard!");
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-2 text-xs font-extrabold text-slate-950 hover:bg-cyan-400"
            >
              <Copy className="h-3.5 w-3.5" /> Copy Code
            </button>
            <button
              type="button"
              onClick={() => setIssuedCodeBanner(null)}
              className="rounded-lg p-1.5 text-slate-400 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Sub-Navigation Bar + Exam Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/5 p-3">
        <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
          {[
            { id: "exams", label: "Exams & Schedules", icon: CalendarClock },
            {
              id: "questions",
              label: `MCQ Bank (${questions.length})`,
              icon: BookOpen,
            },
            {
              id: "candidates",
              label: `Candidates & Codes (${candidates.length})`,
              icon: KeyRound,
            },
            {
              id: "attempts",
              label: `Scores & Proctoring (${attempts.length})`,
              icon: Video,
            },
            {
              id: "emails",
              label: `Resend Outbox (${emailLogs.length})`,
              icon: Mail,
            },
            {
              id: "integrations",
              label: "Vault & Integrations",
              icon: Settings,
            },
          ].map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSubTab(t.id as any)}
              className={`inline-flex items-center gap-1.5 rounded-xl px-3.5 py-2 transition ${
                subTab === t.id
                  ? "bg-cyan-500 text-slate-950 shadow"
                  : "text-slate-300 hover:bg-white/10"
              }`}
            >
              <t.icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedExamFilter}
            onChange={(e) => setSelectedExamFilter(e.target.value)}
            className="rounded-xl border border-white/15 bg-[#0B132B] px-3 py-1.5 text-xs font-bold text-white"
          >
            <option value="all">All Examinations</option>
            {exams.map((ex) => (
              <option key={ex.id} value={ex.id}>
                {ex.title}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={fetchSnapshot}
            className="inline-flex items-center gap-1 rounded-xl bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/20"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* ================================================================= */}
      {/* SUB-TAB 1: EXAMINATIONS & SCHEDULES                               */}
      {/* ================================================================= */}
      {subTab === "exams" && (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">
                Configured Competitions &amp; Online Examinations
              </h2>
              <p className="text-xs text-slate-400">
                Create examinations, attach multiple-choice questions, configure date/time windows, and control official score publication.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setScheduleModal({
                    examId: exams[0]?.id || "",
                    label: "Online Qualifying Batch",
                    startsAt: new Date().toISOString(),
                    endsAt: new Date(
                      Date.now() + 7 * 24 * 3600 * 1000
                    ).toISOString(),
                    capacity: 250,
                    isActive: true,
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl border border-cyan-400/30 bg-cyan-500/15 px-4 py-2 text-xs font-extrabold text-cyan-300 hover:bg-cyan-500/25"
              >
                <Plus className="h-4 w-4" /> Add Time Slot
              </button>
              <button
                type="button"
                onClick={() =>
                  setExamModal({
                    title: "",
                    competitionLabel: "5th Edition STEM Kids Championship",
                    programSlug:
                      content.programs[0]?.slug || "stem-kids-championship",
                    category: "Upper Basic (JSS 1–3)",
                    durationMinutes: 35,
                    passMarkPercent: 50,
                    status: "published",
                    description: "",
                    instructions:
                      "Answer all multiple-choice questions carefully. Screen, Webcam, and Microphone recording must remain active throughout. Switching tabs twice auto-submits immediately.",
                  })
                }
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-extrabold text-white shadow hover:brightness-110"
              >
                <Plus className="h-4 w-4" /> Create New Examination
              </button>
            </div>
          </div>

          <div className="grid gap-5">
            {exams.map((ex) => {
              const exQuestions = questions.filter((q) => q.examId === ex.id);
              const exSchedules = schedules.filter((s) => s.examId === ex.id);
              const exCandidates = candidates.filter((c) => c.examId === ex.id);
              return (
                <div
                  key={ex.id}
                  className="rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-blue-500/20 px-3 py-0.5 text-[0.68rem] font-extrabold text-cyan-300">
                          {ex.competitionLabel}
                        </span>
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[0.68rem] font-bold text-slate-300">
                          {ex.category}
                        </span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[0.68rem] font-extrabold ${
                            ex.resultsPublished
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {ex.resultsPublished
                            ? "Results Released to Candidates"
                            : "Results Held (Admin Review)"}
                        </span>
                      </div>
                      <h3 className="mt-2 text-lg font-black text-white">
                        {ex.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-400 max-w-3xl">
                        {ex.description}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-slate-300">
                        <span>
                          Duration: <strong>{ex.durationMinutes} mins</strong>
                        </span>
                        <span>
                          Pass Mark: <strong>{ex.passMarkPercent}%</strong>
                        </span>
                        <span>
                          Questions: <strong>{exQuestions.length} MCQs</strong>
                        </span>
                        <span>
                          Candidates: <strong>{exCandidates.length}</strong>
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const notify = !ex.resultsPublished
                            ? window.confirm(
                                "Also send official result notification emails to completed candidates via Resend?"
                              )
                            : false;
                          handleToggleExamResults(ex, notify);
                        }}
                        className={`rounded-xl px-3.5 py-2 text-xs font-extrabold transition ${
                          ex.resultsPublished
                            ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30"
                            : "bg-emerald-600 text-white hover:bg-emerald-500"
                        }`}
                      >
                        {ex.resultsPublished
                          ? "Hold Results"
                          : "Release Exam Results"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setExamModal(ex)}
                        className="rounded-xl bg-white/10 px-3 py-2 text-xs font-bold text-slate-200 hover:bg-white/20"
                      >
                        Edit Exam
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteExam(ex.id)}
                        className="rounded-xl bg-red-500/15 p-2 text-red-300 hover:bg-red-500/30"
                        title="Delete Examination"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Linked Schedules Table */}
                  <div className="rounded-2xl border border-white/10 bg-[#0B132B]/70 p-4">
                    <div className="flex items-center justify-between mb-2.5">
                      <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300">
                        Scheduled Date &amp; Time Windows ({exSchedules.length})
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setScheduleModal({
                            examId: ex.id,
                            label: `${ex.category} — Online Slot`,
                            startsAt: new Date().toISOString(),
                            endsAt: new Date(
                              Date.now() + 7 * 24 * 3600 * 1000
                            ).toISOString(),
                            capacity: 250,
                            isActive: true,
                          })
                        }
                        className="text-xs font-bold text-cyan-300 hover:underline"
                      >
                        + Add Slot
                      </button>
                    </div>

                    {exSchedules.length === 0 ? (
                      <p className="text-xs text-slate-500">
                        No schedules created yet.
                      </p>
                    ) : (
                      <div className="space-y-2">
                        {exSchedules.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-white/5 bg-white/5 px-3.5 py-2 text-xs"
                          >
                            <div>
                              <strong className="text-white">{slot.label}</strong>
                              <span className="ml-2 text-slate-400">
                                {new Date(slot.startsAt).toLocaleString()} &ndash;{" "}
                                {new Date(slot.endsAt).toLocaleString()} (Cap:{" "}
                                {slot.capacity})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => setScheduleModal(slot)}
                                className="text-cyan-300 hover:underline"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSchedule(slot.id)}
                                className="text-red-400 hover:underline"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 2: SINGLE-CORRECT-ANSWER MCQ QUESTION BANK                */}
      {/* ================================================================= */}
      {subTab === "questions" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-black text-white">
                Multiple-Choice Question Bank (Single Correct Option A–D)
              </h2>
              <p className="text-xs text-slate-400">
                Question sequence is shuffled per candidate. Options A–D remain in their original order. Imported questions with a pending answer require review before candidates can access that exam.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setQuestionModal({
                  examId:
                    selectedExamFilter !== "all"
                      ? selectedExamFilter
                      : exams[0]?.id || "",
                  prompt: "",
                  optionA: "",
                  optionB: "",
                  optionC: "",
                  optionD: "",
                  correctOption: "A",
                  points: 2,
                  explanation: "",
                })
              }
              className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2.5 text-xs font-extrabold text-white shadow"
            >
              <Plus className="h-4 w-4" /> Add MCQ Question
            </button>
          </div>

          <section className="space-y-4 rounded-2xl border border-cyan-400/20 bg-white/5 p-5" aria-label="Bulk import questions">
            <div><h3 className="font-extrabold text-white">Bulk import from a spreadsheet</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-300">Download the template, enter one question per row in Excel or Google Sheets, and save as CSV UTF-8. Answer can be blank and entered later. Review the preview before importing. Questions are shuffled by ID; options stay in A–D order.</p></div>
            <a className="inline-flex text-sm font-bold text-cyan-300 underline" download="prime-stem-questions-template.csv" href={'data:text/csv;charset=utf-8,' + encodeURIComponent('question,option_a,option_b,option_c,option_d,answer,points\n"What is 2 + 2?",2,3,4,5,C,2\n')}>Download CSV template</a>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="text-xs font-bold text-slate-300">Target examination
                <select value={importExamId} onChange={e => { setImportExamId(e.target.value); setImportPreview(null); setAnswerCsv(""); setAnswerCount(null); }} className="mt-1 w-full rounded-xl border border-white/15 bg-[#0B132B] p-3 text-white"><option value="">Choose an examination</option>{exams.map(e => <option key={e.id} value={e.id}>{e.title}</option>)}</select>
              </label>
              <label className="text-xs font-bold text-slate-300">CSV file (up to 1 MB, 500 questions)
                <input type="file" accept=".csv,text/csv" className="mt-1 block w-full rounded-xl border border-white/15 p-2 text-slate-200" onChange={async e => { const file = e.target.files?.[0]; setImportPreview(null); setImportError(""); if (!file) { setImportCsv(""); return; } if (file.size > 1048576) { setImportCsv(""); setImportError("File must be 1 MB or smaller."); return; } setImportCsv(await file.text()); }} />
              </label>
            </div>
            <button type="button" disabled={!importExamId || !importCsv || importBusy} onClick={() => handleBulkImport(false)} className="rounded-xl bg-cyan-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Preview questions</button>
            <div className="border-t border-white/10 pt-4 space-y-3">
              <h4 className="text-sm font-bold text-white">Set answers in bulk later</h4>
              <p className="text-xs text-slate-300">Choose the exam above, download its answer-key file, fill in A–D for every row, then upload and review. Question IDs keep answers matched even when question order is shuffled.</p>
              <button type="button" disabled={!importExamId} onClick={downloadAnswerTemplate} className="text-sm font-bold text-cyan-300 underline disabled:opacity-50">Download answer-key CSV</button>
              <input type="file" aria-label="Answer-key CSV file" accept=".csv,text/csv" className="block w-full text-xs text-slate-200" onChange={async e => { const file = e.target.files?.[0]; setAnswerCount(null); setImportError(""); if (!file) { setAnswerCsv(""); return; } if (file.size > 1048576) { setAnswerCsv(""); setImportError("File must be 1 MB or smaller."); return; } setAnswerCsv(await file.text()); }} />
              <button type="button" disabled={!importExamId || !answerCsv || importBusy} onClick={() => handleAnswerImport(false)} className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">Check answer file</button>
              {answerCount !== null && <div className="flex flex-wrap items-center gap-3"><span className="text-sm text-cyan-300">{answerCount} answers validated for this examination.</span><button type="button" disabled={importBusy} onClick={() => handleAnswerImport(true)} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950">Save answers</button></div>}
            </div>
            {importError && <p role="alert" className="text-sm font-semibold text-red-300">{importError}</p>}
            {importPreview && <div className="space-y-3"><p className="text-sm font-bold text-cyan-300">{importPreview.length} questions ready • {importPreview.filter(q => !q.correctOption).length} answers to set later</p>
              <div className="max-h-96 space-y-2 overflow-y-auto">{importPreview.map((q, i) => <div key={i} className="rounded-xl bg-black/30 p-3 text-xs text-slate-200"><p className="font-bold">{i + 1}. {q.prompt}</p><p className="mt-1">A. {q.optionA} · B. {q.optionB} · C. {q.optionC} · D. {q.optionD}</p><p className="mt-1 text-cyan-300">Answer: {q.correctOption || "Not set"} · {q.points} points</p></div>)}</div>
              <button type="button" disabled={importBusy} onClick={() => handleBulkImport(true)} className="rounded-xl bg-emerald-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50">Import all {importPreview.length} questions</button>
            </div>}
          </section>

          <div className="space-y-3">
            {filteredQuestions.map((q, idx) => {
              const ex = exams.find((e) => e.id === q.examId);
              return (
                <div
                  key={q.id}
                  className="rounded-2xl border border-white/10 bg-white/5 p-5 space-y-3"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-[0.68rem]">
                        <span className="rounded bg-cyan-500/20 px-2 py-0.5 font-extrabold text-cyan-300">
                          #{idx + 1} &bull; {ex?.title || "Exam"}
                        </span>
                        <span className="rounded bg-emerald-500/20 px-2 py-0.5 font-extrabold text-emerald-300">
                          {q.correctOption ? `Correct Answer: Option ${q.correctOption}` : "Answer key pending review"} ({q.points} pts)
                        </span>
                        <span className="font-mono text-slate-500">
                          UUID: {q.id.slice(0, 12)}…
                        </span>
                      </div>
                      <p className="text-sm font-bold text-white">{q.prompt}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setQuestionModal(q)}
                        className="rounded-lg bg-white/10 px-3 py-1.5 text-xs font-bold text-slate-200 hover:bg-white/20"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteQuestion(q.id)}
                        className="rounded-lg bg-red-500/15 p-1.5 text-red-300 hover:bg-red-500/30"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2 text-xs">
                    {(["A", "B", "C", "D"] as const).map((letter) => {
                      const val = q[`option${letter}`];
                      const isCorrect = q.correctOption === letter;
                      return (
                        <div
                          key={letter}
                          className={`rounded-xl border px-3 py-2 ${
                            isCorrect
                              ? "border-emerald-400/50 bg-emerald-500/15 text-emerald-200 font-bold"
                              : "border-white/10 bg-[#0B132B]/60 text-slate-300"
                          }`}
                        >
                          <strong className="mr-1.5">{letter}.</strong> {val}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 3: CANDIDATES, APPROVAL & CUSTOM EXAM ACCESS CODES        */}
      {/* ================================================================= */}
      {subTab === "candidates" && (
        <div className="space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={candidateSearch}
                onChange={(e) => setCandidateSearch(e.target.value)}
                placeholder="Search name, email, school, code…"
                className="rounded-xl border border-white/15 bg-[#0B132B] px-3.5 py-2 text-xs text-white placeholder-slate-400"
              />
              <select
                value={candidateStatusFilter}
                onChange={(e) => setCandidateStatusFilter(e.target.value)}
                className="rounded-xl border border-white/15 bg-[#0B132B] px-3 py-2 text-xs font-bold text-white"
              >
                <option value="all">All Statuses</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="approved">Approved (Code Active)</option>
                <option value="revoked">Revoked</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={exportCandidatesAndScoresCsv}
                className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/10 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-white/20"
              >
                <Download className="h-3.5 w-3.5" /> Export CSV
              </button>
              <button
                type="button"
                onClick={() => setEnrollModalOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-4 py-2 text-xs font-extrabold text-white shadow"
              >
                <UserPlus className="h-4 w-4" /> Enroll Candidate Manually
              </button>
            </div>
          </div>

          {filteredCandidates.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-xs text-slate-400">
              No examination candidates match the current filter. Candidates who register on{" "}
              <code className="text-cyan-300">/register</code> or via manual enrollment appear here for approval &amp; Exam Access Code activation.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/5">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 bg-[#0B132B]/70 text-[0.68rem] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Candidate &amp; School</th>
                    <th className="px-4 py-3">Exam &amp; Slot</th>
                    <th className="px-4 py-3">Approval &amp; Access Code</th>
                    <th className="px-4 py-3">NDPA Consent</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredCandidates.map((c) => {
                    const ex = exams.find((e) => e.id === c.examId);
                    const slot = schedules.find((s) => s.id === c.scheduleId);
                    return (
                      <tr key={c.id} className="hover:bg-white/5">
                        <td className="px-4 py-3.5">
                          <strong className="block text-sm text-white">
                            {c.fullName}
                          </strong>
                          <span className="text-slate-400">
                            {c.email} &bull; {c.phone}
                          </span>
                          <span className="block text-cyan-300 font-semibold">
                            {c.schoolName} ({c.classLevel || c.category})
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <strong className="block text-slate-200">
                            {ex?.title || "Unknown Exam"}
                          </strong>
                          <span className="text-slate-400">
                            {slot?.label || "Slot"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[0.68rem] font-extrabold ${
                              c.approvalStatus === "approved"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : c.approvalStatus === "revoked"
                                ? "bg-red-500/20 text-red-300"
                                : "bg-amber-500/20 text-amber-300"
                            }`}
                          >
                            {c.approvalStatus === "approved"
                              ? "Approved • Code Active"
                              : c.approvalStatus === "revoked"
                              ? "Revoked"
                              : "Pending Payment / Admin Approval"}
                          </span>
                          {c.accessCodeHint && (
                            <span className="mt-1 block font-mono text-amber-300 font-bold">
                              Hint: {c.accessCodeHint}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          {c.parentConsentGiven ? (
                            <span className="text-emerald-300 font-bold">
                              Verified
                            </span>
                          ) : (
                            <span className="text-amber-300">Pending</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-right space-x-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setApproveModalCandidate(c);
                              setCustomCodeInput("");
                            }}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-3 py-1.5 font-extrabold text-white hover:bg-emerald-500"
                          >
                            <KeyRound className="h-3.5 w-3.5" />
                            {c.approvalStatus === "approved"
                              ? "Re-Issue / Custom Code"
                              : "Approve & Send Code"}
                          </button>

                          {c.approvalStatus === "approved" && (
                            <button
                              type="button"
                              onClick={async () => {
                                await fetch("/api/admin/exams/candidates", {
                                  method: "POST",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    action: "revoke",
                                    candidateId: c.id,
                                  }),
                                });
                                showToast("Candidate access revoked.");
                                fetchSnapshot();
                              }}
                              className="rounded-lg bg-amber-500/20 px-2.5 py-1.5 font-bold text-amber-300 hover:bg-amber-500/30"
                            >
                              Revoke
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={async () => {
                              if (
                                !window.confirm(
                                  `Delete candidate ${c.fullName}?`
                                )
                              )
                                return;
                              await fetch(
                                `/api/admin/exams/candidates?id=${encodeURIComponent(
                                  c.id
                                )}`,
                                { method: "DELETE" }
                              );
                              showToast("Candidate removed.");
                              fetchSnapshot();
                            }}
                            className="rounded-lg bg-red-500/15 p-1.5 text-red-300 hover:bg-red-500/30"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 4: ATTEMPTS, AUTOMATIC SCORES & AI PROCTORING REVIEW      */}
      {/* ================================================================= */}
      {subTab === "attempts" && (
        <div className="space-y-5">
          <div>
            <h2 className="text-lg font-black text-white">
              Candidate Attempts, Automatic Marking &amp; AI Proctoring Evidence
            </h2>
            <p className="text-xs text-slate-400">
              Inspect protected screen/webcam/audio recordings, AI suspicion alerts vs verified tab-switch violations, compatibility mode flags, and release individual candidate scores.
            </p>
          </div>

          {filteredAttempts.length === 0 ? (
            <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-xs text-slate-400">
              No candidate examination attempts recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-3xl border border-white/10 bg-white/5">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-white/10 bg-[#0B132B]/70 text-[0.68rem] uppercase tracking-wider text-slate-400">
                  <tr>
                    <th className="px-4 py-3">Candidate</th>
                    <th className="px-4 py-3">Examination</th>
                    <th className="px-4 py-3">Attempt Status</th>
                    <th className="px-4 py-3">Score</th>
                    <th className="px-4 py-3">Proctoring &amp; Flags</th>
                    <th className="px-4 py-3 text-right">Inspect</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {filteredAttempts.map((att) => {
                    const cand = candidates.find(
                      (c) => c.id === att.candidateId
                    );
                    const ex = exams.find((e) => e.id === att.examId);
                    return (
                      <tr key={att.id} className="hover:bg-white/5">
                        <td className="px-4 py-3.5">
                          <strong className="block text-white">
                            {cand?.fullName || "Candidate"}
                          </strong>
                          <span className="text-slate-400">
                            {cand?.schoolName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-slate-200">
                          {ex?.title}
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-[0.68rem] font-extrabold ${
                              att.status === "auto_submitted_violation"
                                ? "bg-red-500/25 text-red-300"
                                : att.status === "submitted" ||
                                  att.status === "auto_submitted_timeout"
                                ? "bg-emerald-500/20 text-emerald-300"
                                : "bg-cyan-500/20 text-cyan-300"
                            }`}
                          >
                            {att.status.replace(/_/g, " ").toUpperCase()}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          {att.score !== null ? (
                            <div>
                              <strong className="text-sm text-white">
                                {att.score} / {att.maxScore} ({att.percentage}%)
                              </strong>
                              <span className="block text-[0.68rem] text-slate-400">
                                {ex?.resultsPublished || att.resultReleased
                                  ? "Visible to Candidate"
                                  : "Held (Admin Only)"}
                              </span>
                            </div>
                          ) : (
                            <span className="text-slate-500">In Progress</span>
                          )}
                        </td>
                        <td className="px-4 py-3.5 space-y-1">
                          <div className="flex flex-wrap gap-1.5">
                            <span
                              className={`rounded px-2 py-0.5 text-[0.65rem] font-bold ${
                                att.tabSwitchCount > 0
                                  ? "bg-red-500/25 text-red-300"
                                  : "bg-white/10 text-slate-300"
                              }`}
                            >
                              Tab Switches: {att.tabSwitchCount}
                            </span>
                            <span
                              className={`rounded px-2 py-0.5 text-[0.65rem] font-bold ${
                                att.aiSuspicionCount > 0
                                  ? "bg-amber-500/25 text-amber-300"
                                  : "bg-white/10 text-slate-300"
                              }`}
                            >
                              AI Alerts: {att.aiSuspicionCount}
                            </span>
                            {att.compatibilityMode && (
                              <span className="rounded bg-amber-500/25 px-2 py-0.5 text-[0.65rem] font-bold text-amber-200">
                                Compatibility / Incomplete Proctoring
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => openAttemptInspector(att.id)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500 px-3.5 py-1.5 font-extrabold text-slate-950 hover:bg-cyan-400"
                          >
                            <Play className="h-3.5 w-3.5" /> Review Recordings &amp; Report
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 5: RESEND EMAIL OUTBOX & SUBSCRIBER BROADCASTS            */}
      {/* ================================================================= */}
      {subTab === "emails" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-black text-white">
                  Resend Transactional Email Outbox ({emailLogs.length})
                </h2>
                <p className="text-xs text-slate-400">
                  Every registration receipt, Exam Access Code, result slip, and contact alert is tracked here.
                </p>
              </div>
              <button
                type="button"
                onClick={async () => {
                  const res = await fetch("/api/admin/emails", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "retry_all_queued" }),
                  });
                  const json = await res.json();
                  if (!res.ok) {
                    showToast(`Error: ${json.error}`);
                    return;
                  }
                  showToast(
                    `Retried queued emails: ${json.sentCount} sent, ${json.failedCount} pending.`
                  );
                  fetchSnapshot();
                }}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-500/20 px-3.5 py-2 text-xs font-extrabold text-cyan-300 hover:bg-cyan-500/30"
              >
                <RefreshCw className="h-3.5 w-3.5" /> Retry Queued Emails
              </button>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {emailLogs.length === 0 ? (
                <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-xs text-slate-400">
                  No transactional emails logged yet.
                </div>
              ) : (
                emailLogs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-2xl border border-white/10 bg-white/5 p-4 text-xs flex flex-wrap items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.65rem] font-extrabold ${
                            log.status === "sent"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : log.status === "failed"
                              ? "bg-red-500/20 text-red-300"
                              : "bg-amber-500/20 text-amber-300"
                          }`}
                        >
                          {log.status}
                        </span>
                        <span className="text-slate-400">{log.category}</span>
                        <span className="text-slate-500">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <strong className="block text-white">{log.subject}</strong>
                      <span className="text-slate-400">
                        To: {log.recipientName} &lt;{log.recipientEmail}&gt;
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setPreviewEmailLog(log)}
                        className="rounded-lg bg-white/10 px-2.5 py-1.5 font-bold text-slate-200 hover:bg-white/20"
                      >
                        Preview HTML
                      </button>
                      {log.status !== "sent" && (
                        <button
                          type="button"
                          onClick={async () => {
                            const res = await fetch("/api/admin/emails", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({
                                action: "retry_single",
                                logId: log.id,
                              }),
                            });
                            const json = await res.json();
                            if (!res.ok) {
                              showToast(`Resend: ${json.error}`);
                              return;
                            }
                            showToast("Email dispatched via Resend!");
                            fetchSnapshot();
                          }}
                          className="rounded-lg bg-cyan-500 px-2.5 py-1.5 font-extrabold text-slate-950"
                        >
                          Send Now
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Right: Direct Email / Newsletter Broadcast Composer */}
          <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4">
            <h3 className="text-base font-black text-white">
              Resend Composer &amp; Newsletter Broadcast ({subscribers.length}{" "}
              Subscribers)
            </h3>
            <div className="grid grid-cols-2 rounded-xl bg-[#0B132B] p-1 text-xs font-extrabold">
              <button
                type="button"
                onClick={() => setComposerMode("custom")}
                className={`rounded-lg py-2 ${
                  composerMode === "custom"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-300"
                }`}
              >
                Direct Email
              </button>
              <button
                type="button"
                onClick={() => setComposerMode("broadcast")}
                className={`rounded-lg py-2 ${
                  composerMode === "broadcast"
                    ? "bg-cyan-500 text-slate-950"
                    : "text-slate-300"
                }`}
              >
                Broadcast to Subscribers ({subscribers.length})
              </button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSendingEmailAction(true);
                try {
                  const res = await fetch("/api/admin/emails", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(
                      composerMode === "custom"
                        ? {
                            action: "send_custom",
                            recipientEmail: composerTo,
                            subject: composerSubject,
                            messageBody: composerBody,
                          }
                        : {
                            action: "broadcast_subscribers",
                            subject: composerSubject,
                            messageBody: composerBody,
                          }
                    ),
                  });
                  const json = await res.json();
                  if (!res.ok) {
                    showToast(`Error: ${json.error}`);
                    return;
                  }
                  setComposerSubject("");
                  setComposerBody("");
                  showToast("Email dispatched/queued in Resend Outbox!");
                  fetchSnapshot();
                } finally {
                  setSendingEmailAction(false);
                }
              }}
              className="space-y-3 text-xs"
            >
              {composerMode === "custom" && (
                <div>
                  <label className="block font-bold text-slate-300 mb-1">
                    Recipient Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={composerTo}
                    onChange={(e) => setComposerTo(e.target.value)}
                    placeholder="school@example.com"
                    className="w-full rounded-xl border border-white/15 bg-[#0B132B] px-3.5 py-2.5 text-white"
                  />
                </div>
              )}
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Subject *
                </label>
                <input
                  type="text"
                  required
                  value={composerSubject}
                  onChange={(e) => setComposerSubject(e.target.value)}
                  placeholder="Official Prime STEM Update"
                  className="w-full rounded-xl border border-white/15 bg-[#0B132B] px-3.5 py-2.5 text-white"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Message Body *
                </label>
                <textarea
                  rows={5}
                  required
                  value={composerBody}
                  onChange={(e) => setComposerBody(e.target.value)}
                  placeholder="Write your official communication…"
                  className="w-full rounded-xl border border-white/15 bg-[#0B132B] px-3.5 py-2.5 text-white"
                />
              </div>
              <button
                type="submit"
                disabled={sendingEmailAction}
                className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 py-3 font-extrabold text-white"
              >
                <Send className="h-4 w-4" />
                {composerMode === "custom"
                  ? "Dispatch Email via Resend"
                  : `Broadcast to ${subscribers.length} Subscribers`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 6: CLOUD VAULT, RESEND & NDPA RECORDING RETENTION         */}
      {/* ================================================================= */}
      {subTab === "integrations" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 rounded-3xl border border-white/10 bg-white/5 p-6 space-y-5">
            <div>
              <h2 className="text-lg font-black text-white">
                Resend Email &amp; Dedicated Google Drive v3 Vault Configuration
              </h2>
              <p className="text-xs text-slate-400">
                Paste your Resend API Key and your dedicated Google Drive Proctoring Vault credentials here (or set them via environment variables). Secrets are stored server-side only.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setSavingInt(true);
                try {
                  const res = await fetch("/api/admin/integrations", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(intForm),
                  });
                  if (res.ok) {
                    showToast("Integration settings saved!");
                    fetchSnapshot();
                  }
                } finally {
                  setSavingInt(false);
                }
              }}
              className="space-y-4 text-xs"
            >
              <div className="rounded-2xl border border-white/10 bg-[#0B132B]/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-cyan-300">
                    1. Resend Email API Integration
                  </strong>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[0.65rem] font-bold">
                    {snapshot?.integrationSettings?.hasResendKey
                      ? "API Key Configured"
                      : "Awaiting RESEND_API_KEY"}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Resend API Key (`re_...`)
                    </label>
                    <input
                      type="password"
                      value={intForm.resendApiKey || ""}
                      onChange={(e) =>
                        setIntForm({ ...intForm, resendApiKey: e.target.value })
                      }
                      placeholder={
                        snapshot?.integrationSettings?.hasResendKey
                          ? "•••••••• (Leave blank to keep)"
                          : "re_xxxxxxxxx"
                      }
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Verified Sender (`from`)
                    </label>
                    <input
                      type="text"
                      value={intForm.resendFromEmail || ""}
                      onChange={(e) =>
                        setIntForm({
                          ...intForm,
                          resendFromEmail: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#0B132B]/70 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <strong className="text-sm text-cyan-300">
                    2. Dedicated Google Drive v3 Proctoring Vault
                  </strong>
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[0.65rem] font-bold">
                    {snapshot?.integrationSettings?.hasGoogleDriveCredentials
                      ? "Google Drive Ready"
                      : "Using Protected Local Vault"}
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Preferred Recording Target
                    </label>
                    <select
                      value={intForm.storagePreferredProvider || "google_drive"}
                      onChange={(e) =>
                        setIntForm({
                          ...intForm,
                          storagePreferredProvider: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                    >
                      <option value="google_drive">
                        Google Drive v3 (Auto-fallback to Local Vault)
                      </option>
                      <option value="local_vault">
                        Protected Local Vault Only
                      </option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      Google Drive Private Folder ID
                    </label>
                    <input
                      type="text"
                      value={intForm.googleDriveFolderId || ""}
                      onChange={(e) =>
                        setIntForm({
                          ...intForm,
                          googleDriveFolderId: e.target.value,
                        })
                      }
                      placeholder="1AbCdEfGhIjKlMnOp..."
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                    />
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="block text-slate-400 mb-1">
                      OAuth Client ID
                    </label>
                    <input
                      type="text"
                      value={intForm.googleDriveClientId || ""}
                      onChange={(e) =>
                        setIntForm({
                          ...intForm,
                          googleDriveClientId: e.target.value,
                        })
                      }
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      OAuth Client Secret
                    </label>
                    <input
                      type="password"
                      value={intForm.googleDriveClientSecret || ""}
                      onChange={(e) =>
                        setIntForm({
                          ...intForm,
                          googleDriveClientSecret: e.target.value,
                        })
                      }
                      placeholder="Leave blank to keep"
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-slate-400 mb-1">
                      OAuth Refresh Token
                    </label>
                    <input
                      type="password"
                      value={intForm.googleDriveRefreshToken || ""}
                      onChange={(e) =>
                        setIntForm({
                          ...intForm,
                          googleDriveRefreshToken: e.target.value,
                        })
                      }
                      placeholder="Leave blank to keep"
                      className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={savingInt}
                className="rounded-xl bg-cyan-500 px-6 py-2.5 font-extrabold text-slate-950 hover:bg-cyan-400"
              >
                {savingInt ? "Saving…" : "Save Integration Configuration"}
              </button>
            </form>
          </div>

          {/* Right: Vault Sync & NDPA Wipe Controls */}
          <div className="lg:col-span-5 rounded-3xl border border-white/10 bg-white/5 p-6 space-y-4 text-xs">
            <h3 className="text-base font-black text-white flex items-center gap-2">
              <HardDrive className="h-4 w-4 text-cyan-400" /> Protected Vault &amp; NDPA Retention Wipe
            </h3>
            <p className="text-slate-400 leading-relaxed">
              Recordings are stored strictly outside <code className="text-cyan-300">public/</code> and gitignored. Sync local segments to your dedicated Google Drive or wipe recordings cleanly after review.
            </p>

            <div className="rounded-2xl bg-[#0B132B] p-4 space-y-1.5 border border-white/10">
              <div className="flex justify-between">
                <span className="text-slate-400">Local Vault Files:</span>
                <strong className="text-white">
                  {snapshot?.localVaultStats?.fileCount || 0} files
                </strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Local Disk Used:</span>
                <strong className="text-cyan-300">
                  {formatBytes(snapshot?.localVaultStats?.totalBytes || 0)}
                </strong>
              </div>
            </div>

            <button
              type="button"
              disabled={vaultBusy}
              onClick={async () => {
                setVaultBusy(true);
                try {
                  const res = await fetch("/api/admin/exams/recordings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "sync_to_google_drive" }),
                  });
                  const json = await res.json();
                  if (!res.ok) {
                    showToast(`Sync notice: ${json.error}`);
                    return;
                  }
                  showToast(
                    `Synced ${json.syncedCount} local recording(s) to Google Drive!`
                  );
                  fetchSnapshot();
                } finally {
                  setVaultBusy(false);
                }
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-3 font-extrabold text-white hover:bg-blue-500"
            >
              <CloudUpload className="h-4 w-4" /> Sync Local Vault → Google Drive
            </button>

            <button
              type="button"
              disabled={vaultBusy}
              onClick={async () => {
                if (
                  !window.confirm(
                    "Permanently wipe ALL stored proctoring video/audio files from disk & Google Drive while preserving marked candidate scores?"
                  )
                )
                  return;
                setVaultBusy(true);
                try {
                  const res = await fetch("/api/admin/exams/recordings", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                      action: "wipe_recordings",
                      mode: "all",
                    }),
                  });
                  const json = await res.json();
                  if (res.ok) {
                    showToast(
                      `Wiped ${json.wipedCount} proctoring recording file(s) cleanly.`
                    );
                    fetchSnapshot();
                  }
                } finally {
                  setVaultBusy(false);
                }
              }}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-red-400/30 bg-red-500/15 py-3 font-extrabold text-red-300 hover:bg-red-500/25"
            >
              <Trash2 className="h-4 w-4" /> Wipe All Proctoring Media Files (Keep Scores)
            </button>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: APPROVE CANDIDATE & GENERATE / CUSTOMISE ACCESS CODE        */}
      {/* ================================================================= */}
      {approveModalCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleApproveAndIssueCode}
            className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0F172A] p-6 text-white shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white">
                Approve Candidate &amp; Activate Exam Code
              </h3>
              <button
                type="button"
                onClick={() => setApproveModalCandidate(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Approving <strong>{approveModalCandidate.fullName}</strong> (
              {approveModalCandidate.email}) activates their examination login and automatically sends their confirmed Access Code &amp; schedule instructions via Resend.
            </p>
            <div>
              <label className="block text-xs font-bold text-cyan-300 mb-1.5">
                Custom Examination Code (Optional — leave blank to auto-generate)
              </label>
              <input
                type="text"
                value={customCodeInput}
                onChange={(e) => setCustomCodeInput(e.target.value.toUpperCase())}
                placeholder="e.g. SKC2026-ZARIA-01 (or leave empty)"
                className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-2.5 font-mono text-sm font-bold uppercase text-amber-300"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setApproveModalCandidate(null)}
                className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-slate-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-5 py-2 text-xs font-extrabold text-white hover:bg-emerald-500"
              >
                <KeyRound className="h-3.5 w-3.5" /> Approve, Issue Code &amp; Email Candidate
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: MANUAL CANDIDATE ENROLLMENT                                */}
      {/* ================================================================= */}
      {enrollModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-xs">
          <form
            onSubmit={handleManualEnroll}
            className="w-full max-w-lg rounded-3xl border border-white/15 bg-[#0F172A] p-6 text-white shadow-2xl space-y-3.5 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black">Enroll Candidate Manually</h3>
              <button
                type="button"
                onClick={() => setEnrollModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-slate-300 mb-1">Full Name *</label>
                <input
                  name="fullName"
                  required
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Email *</label>
                <input
                  name="email"
                  type="email"
                  required
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Phone *</label>
                <input
                  name="phone"
                  required
                  defaultValue="+234"
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">School *</label>
                <input
                  name="schoolName"
                  required
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Class Level</label>
                <input
                  name="classLevel"
                  placeholder="JSS 2 / Primary 5"
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  Custom Code (Optional)
                </label>
                <input
                  name="customCode"
                  placeholder="Blank = Auto"
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 font-mono uppercase text-amber-300"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Examination *</label>
              <select
                name="examId"
                required
                defaultValue={exams[0]?.id || ""}
                className="w-full rounded-xl border border-white/15 bg-[#0B132B] px-3 py-2 text-white"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">
                Schedule Time Window *
              </label>
              <select
                name="scheduleId"
                required
                defaultValue={schedules[0]?.id || ""}
                className="w-full rounded-xl border border-white/15 bg-[#0B132B] px-3 py-2 text-white"
              >
                {schedules.map((s) => {
                  const ex = exams.find((e) => e.id === s.examId);
                  return (
                    <option key={s.id} value={s.id}>
                      [{ex?.category}] {s.label}
                    </option>
                  );
                })}
              </select>
            </div>
            <label className="flex items-center gap-2 pt-1 cursor-pointer">
              <input
                type="checkbox"
                name="approveImmediately"
                defaultChecked
                className="h-4 w-4 rounded"
              />
              <span className="font-bold text-emerald-300">
                Approve immediately, activate Access Code &amp; send email now
              </span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEnrollModalOpen(false)}
                className="rounded-xl bg-white/10 px-4 py-2 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-cyan-500 px-5 py-2 font-extrabold text-slate-950"
              >
                Enroll Candidate
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CREATE / EDIT EXAMINATION                                  */}
      {/* ================================================================= */}
      {examModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveExam}
            className="w-full max-w-xl rounded-3xl border border-white/15 bg-[#0F172A] p-6 text-white shadow-2xl space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black">
                {examModal.id ? "Edit Examination" : "Create Examination"}
              </h3>
              <button
                type="button"
                onClick={() => setExamModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Exam Title *</label>
              <input
                name="title"
                required
                defaultValue={examModal.title}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-slate-300 mb-1">
                  Competition Label *
                </label>
                <input
                  name="competitionLabel"
                  required
                  defaultValue={examModal.competitionLabel}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  Linked Programme *
                </label>
                <select
                  name="programSlug"
                  defaultValue={examModal.programSlug}
                  className="w-full rounded-xl border border-white/15 bg-[#0B132B] px-3 py-2 text-white"
                >
                  {content.programs.map((p) => (
                    <option key={p.slug} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-slate-300 mb-1">Category *</label>
                <input
                  name="category"
                  required
                  defaultValue={examModal.category}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  Duration (Minutes) *
                </label>
                <input
                  name="durationMinutes"
                  type="number"
                  min={5}
                  max={300}
                  required
                  defaultValue={examModal.durationMinutes}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  Pass Mark (%) *
                </label>
                <input
                  name="passMarkPercent"
                  type="number"
                  min={1}
                  max={100}
                  required
                  defaultValue={examModal.passMarkPercent}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Status</label>
              <select
                name="status"
                defaultValue={examModal.status || "published"}
                className="w-full rounded-xl border border-white/15 bg-[#0B132B] px-3 py-2 text-white"
              >
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Description</label>
              <textarea
                name="description"
                rows={2}
                defaultValue={examModal.description}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block text-slate-300 mb-1">
                Candidate Pre-Exam Instructions
              </label>
              <textarea
                name="instructions"
                rows={3}
                defaultValue={examModal.instructions}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setExamModal(null)}
                className="rounded-xl bg-white/10 px-4 py-2 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-cyan-500 px-5 py-2 font-extrabold text-slate-950"
              >
                Save Examination
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CREATE / EDIT SCHEDULE TIME SLOT                           */}
      {/* ================================================================= */}
      {scheduleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <form
            onSubmit={handleSaveSchedule}
            className="w-full max-w-md rounded-3xl border border-white/15 bg-[#0F172A] p-6 text-white shadow-2xl space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black">
                {scheduleModal.id ? "Edit Schedule Slot" : "Add Schedule Slot"}
              </h3>
              <button
                type="button"
                onClick={() => setScheduleModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Examination *</label>
              <select
                name="examId"
                defaultValue={scheduleModal.examId}
                className="w-full rounded-xl border border-white/15 bg-[#0B132B] px-3 py-2 text-white"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Slot Label *</label>
              <input
                name="label"
                required
                defaultValue={scheduleModal.label}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-slate-300 mb-1">
                  Window Opens *
                </label>
                <input
                  name="startsAt"
                  type="datetime-local"
                  required
                  defaultValue={toDatetimeLocalValue(scheduleModal.startsAt)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">
                  Window Closes *
                </label>
                <input
                  name="endsAt"
                  type="datetime-local"
                  required
                  defaultValue={toDatetimeLocalValue(scheduleModal.endsAt)}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </div>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">
                Max Seat Capacity *
              </label>
              <input
                name="capacity"
                type="number"
                min={1}
                defaultValue={scheduleModal.capacity || 250}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
              />
            </div>
            <label className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                name="isActive"
                defaultChecked={scheduleModal.isActive !== false}
              />
              <span>Slot Open for Registration &amp; Login</span>
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setScheduleModal(null)}
                className="rounded-xl bg-white/10 px-4 py-2 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-cyan-500 px-5 py-2 font-extrabold text-slate-950"
              >
                Save Schedule
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: CREATE / EDIT MCQ QUESTION                                 */}
      {/* ================================================================= */}
      {questionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveQuestion}
            className="w-full max-w-xl rounded-3xl border border-white/15 bg-[#0F172A] p-6 text-white shadow-2xl space-y-3 text-xs"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black">
                {questionModal.id
                  ? "Edit Multiple-Choice Question"
                  : "Add Multiple-Choice Question"}
              </h3>
              <button
                type="button"
                onClick={() => setQuestionModal(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">Examination *</label>
              <select
                name="examId"
                defaultValue={questionModal.examId}
                className="w-full rounded-xl border border-white/15 bg-[#0B132B] px-3 py-2 text-white"
              >
                {exams.map((ex) => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-slate-300 mb-1">
                Question Prompt *
              </label>
              <textarea
                name="prompt"
                required
                rows={3}
                defaultValue={questionModal.prompt}
                className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-slate-300 mb-1">Option A *</label>
                <input
                  name="optionA"
                  required
                  defaultValue={questionModal.optionA}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Option B *</label>
                <input
                  name="optionB"
                  required
                  defaultValue={questionModal.optionB}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Option C *</label>
                <input
                  name="optionC"
                  required
                  defaultValue={questionModal.optionC}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Option D *</label>
                <input
                  name="optionD"
                  required
                  defaultValue={questionModal.optionD}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-emerald-300 font-bold mb-1">
                  Single Correct Answer *
                </label>
                <select
                  name="correctOption"
                  defaultValue={questionModal.correctOption || ""}
                  required
                  className="w-full rounded-xl border border-emerald-400/40 bg-[#0B132B] px-3 py-2 font-bold text-emerald-300"
                >
                  <option value="" disabled>Select and verify an answer</option>
                  <option value="A">Option A</option>
                  <option value="B">Option B</option>
                  <option value="C">Option C</option>
                  <option value="D">Option D</option>
                </select>
              </div>
              <div>
                <label className="block text-slate-300 mb-1">Marks *</label>
                <input
                  name="points"
                  type="number"
                  min={1}
                  max={20}
                  defaultValue={questionModal.points || 2}
                  className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-white"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setQuestionModal(null)}
                className="rounded-xl bg-white/10 px-4 py-2 font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-xl bg-cyan-500 px-5 py-2 font-extrabold text-slate-950"
              >
                Save MCQ Question
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: ATTEMPT PROCTORING RECORDINGS & MARKING INSPECTOR          */}
      {/* ================================================================= */}
      {(attemptDetail || loadingAttemptDetail) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 overflow-y-auto">
          <div className="w-full max-w-5xl max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-[#0F172A] p-6 text-white shadow-2xl space-y-6">
            {loadingAttemptDetail || !attemptDetail ? (
              <div className="py-16 text-center text-slate-300">
                <Loader2 className="mx-auto h-8 w-8 animate-spin text-cyan-400 mb-2" />
                Loading protected proctoring evidence &amp; marking breakdown…
              </div>
            ) : (
              <>
                <div className="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-4">
                  <div>
                    <span className="text-xs font-extrabold uppercase tracking-wider text-cyan-300">
                      Protected Proctoring &amp; Marking Dossier
                    </span>
                    <h3 className="text-xl font-black text-white">
                      {attemptDetail.candidate.fullName} &mdash;{" "}
                      {attemptDetail.exam.title}
                    </h3>
                    <p className="text-xs text-slate-400">
                      School: {attemptDetail.candidate.schoolName} &bull; Score:{" "}
                      <strong className="text-emerald-300">
                        {attemptDetail.attempt.score ?? 0} /{" "}
                        {attemptDetail.attempt.maxScore ?? 0} (
                        {attemptDetail.attempt.percentage ?? 0}%)
                      </strong>{" "}
                      &bull; Status:{" "}
                      <strong className="text-amber-300">
                        {attemptDetail.attempt.status}
                      </strong>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttemptDetail(null)}
                    className="rounded-xl bg-white/10 p-2 text-slate-300 hover:text-white"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Protected Recording Player + Segments */}
                <div className="grid gap-5 lg:grid-cols-12">
                  <div className="lg:col-span-7 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-cyan-300">
                      Restricted Admin-Only Media Playback (Screen / Webcam / Audio)
                    </h4>

                    {activeMediaRecording ? (
                      <div className="rounded-2xl border border-white/15 bg-black p-3 space-y-2">
                        {activeMediaRecording.streamType === "audio" ? (
                          <audio
                            key={activeMediaRecording.id}
                            controls
                            src={`/api/admin/exams/recordings/${activeMediaRecording.id}/stream`}
                            className="w-full"
                          />
                        ) : activeMediaRecording.streamType === "snapshot" ? (
                          <img
                            src={`/api/admin/exams/recordings/${activeMediaRecording.id}/stream`}
                            alt="AI Evidence Snapshot"
                            className="max-h-72 mx-auto rounded-xl object-contain"
                          />
                        ) : (
                          <video
                            key={activeMediaRecording.id}
                            controls
                            src={`/api/admin/exams/recordings/${activeMediaRecording.id}/stream`}
                            className="aspect-video w-full rounded-xl bg-slate-950"
                          />
                        )}
                        <p className="text-[0.68rem] text-slate-400">
                          Stream:{" "}
                          <strong className="text-white uppercase">
                            {activeMediaRecording.streamType}
                          </strong>{" "}
                          #{activeMediaRecording.segmentIndex} &bull; Vault:{" "}
                          {activeMediaRecording.storageProvider} &bull;{" "}
                          {formatBytes(activeMediaRecording.sizeBytes)}
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-xs text-slate-400">
                        Select any recorded segment on the right to stream securely.
                      </div>
                    )}

                    {/* Segment Selector Pills */}
                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
                      {(attemptDetail.recordings || []).map((rec: any) => (
                        <button
                          key={rec.id}
                          type="button"
                          disabled={Boolean(rec.wipedAt)}
                          onClick={() => setActiveMediaRecording(rec)}
                          className={`rounded-lg px-2.5 py-1 text-[0.68rem] font-bold transition ${
                            rec.wipedAt
                              ? "bg-white/5 text-slate-600 line-through"
                              : activeMediaRecording?.id === rec.id
                              ? "bg-cyan-500 text-slate-950"
                              : "bg-white/10 text-slate-200 hover:bg-white/20"
                          }`}
                        >
                          {rec.streamType.toUpperCase()} #{rec.segmentIndex}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right: AI Suspicions vs Verified Violations Timeline */}
                  <div className="lg:col-span-5 space-y-3">
                    <h4 className="text-xs font-black uppercase tracking-wider text-amber-300">
                      Chronological AI &amp; Tab-Switch Audit Log (
                      {(attemptDetail.events || []).length})
                    </h4>
                    <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                      {(attemptDetail.events || []).map((ev: any) => (
                        <div
                          key={ev.id}
                          className={`rounded-xl border p-3 text-xs ${
                            ev.classification === "verified_violation"
                              ? "border-red-400/40 bg-red-500/15 text-red-200"
                              : ev.classification === "ai_suspicion"
                              ? "border-amber-400/40 bg-amber-500/15 text-amber-100"
                              : "border-white/10 bg-white/5 text-slate-300"
                          }`}
                        >
                          <div className="flex items-center justify-between text-[0.65rem] font-extrabold uppercase">
                            <span>
                              {ev.classification.replace("_", " ")} &bull;{" "}
                              {ev.eventType}
                            </span>
                            <span>
                              {new Date(ev.occurredAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <p className="mt-1 leading-snug">{ev.details}</p>
                        </div>
                      ))}
                    </div>

                    {/* Individual Result Release & Notes */}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3.5 space-y-2.5 text-xs">
                      <label className="block font-bold text-slate-300">
                        Admin Proctoring Review Notes
                      </label>
                      <textarea
                        rows={2}
                        value={reviewNotesDraft}
                        onChange={(e) => setReviewNotesDraft(e.target.value)}
                        placeholder="Record proctoring clearance or malpractice decision…"
                        className="w-full rounded-xl border border-white/15 bg-black/40 p-2 text-white"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleSaveAttemptRelease(
                              attemptDetail.attempt.id,
                              true,
                              true
                            )
                          }
                          className="rounded-xl bg-emerald-600 px-3.5 py-1.5 font-extrabold text-white hover:bg-emerald-500"
                        >
                          Release Score &amp; Email Candidate
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleSaveAttemptRelease(
                              attemptDetail.attempt.id,
                              false,
                              false
                            )
                          }
                          className="rounded-xl bg-white/10 px-3 py-1.5 font-bold text-slate-200"
                        >
                          Save Notes (Keep Held)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Per-Question Shuffled Order Marking Breakdown */}
                <div className="space-y-2 border-t border-white/10 pt-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Question-by-Question Marking Breakdown (Candidate&apos;s Shuffled Sequence)
                  </h4>
                  <div className="grid gap-2 sm:grid-cols-2 max-h-60 overflow-y-auto pr-1 text-xs">
                    {(attemptDetail.questionBreakdown || []).map(
                      (qb: any, idx: number) => (
                        <div
                          key={qb.questionId}
                          className={`rounded-xl border p-3 ${
                            qb.isCorrect
                              ? "border-emerald-400/30 bg-emerald-500/10"
                              : "border-red-400/30 bg-red-500/10"
                          }`}
                        >
                          <p className="font-bold text-white line-clamp-2">
                            Q{idx + 1}. {qb.prompt}
                          </p>
                          <p className="mt-1 text-[0.7rem] text-slate-300">
                            Selected:{" "}
                            <strong>{qb.selectedOption || "Unanswered"}</strong>{" "}
                            &bull; Correct Key:{" "}
                            <strong className="text-emerald-300">
                              {qb.correctOption}
                            </strong>{" "}
                            &bull; Marks: {qb.earnedPoints}/{qb.points}
                          </p>
                        </div>
                      )
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* MODAL: HTML EMAIL PREVIEW                                         */}
      {/* ================================================================= */}
      {previewEmailLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="w-full max-w-2xl rounded-3xl border border-white/15 bg-white p-5 text-slate-900 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <strong className="text-sm text-[#172554]">
                  {previewEmailLog.subject}
                </strong>
                <p className="text-xs text-slate-500">
                  To: {previewEmailLog.recipientEmail}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewEmailLog(null)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <iframe
              title="Email Preview"
              srcDoc={previewEmailLog.htmlPreview || "<p>No preview</p>"}
              className="h-[440px] w-full rounded-xl border border-slate-200"
            />
          </div>
        </div>
      )}
    </div>
  );
}

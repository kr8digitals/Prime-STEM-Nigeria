"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { z } from "zod";
import {
  CalendarClock,
  CheckCircle2,
  Laptop,
  Loader2,
  Send,
  ShieldCheck,
  UserPlus,
} from "lucide-react";
import Link from "next/link";
import { useContent } from "@/context/content-context";
import { cx } from "@/components/ui";

const contactSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().optional(),
  category: z.string().min(1, "Please select who you are."),
  subject: z.string().min(2, "Please enter a subject."),
  message: z.string().min(10, "Your message should be at least 10 characters."),
});

const registerSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(7, "Please enter a valid phone number."),
  category: z.string().min(1, "Please select who you are."),
  program: z.string().min(1, "Please select a programme."),
  message: z.string().optional(),
});

type FieldErrors = Record<string, string>;

interface PublicScheduleItem {
  id: string;
  examId: string;
  label: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  capacity: number;
  remainingSeats: number;
}

interface PublicExamItem {
  id: string;
  slug: string;
  title: string;
  competitionLabel: string;
  programSlug: string;
  category: string;
  description: string;
  durationMinutes: number;
  proctoringRequired: boolean;
  schedules: PublicScheduleItem[];
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1.5 text-xs font-semibold text-red-500">{message}</p>;
}

const inputClasses =
  "w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 shadow-sm outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

const labelClasses = "mb-1.5 block text-sm font-bold text-[#172554]";

function SubmitButton({
  pending,
  children,
  icon,
}: {
  pending: boolean;
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-cyan-500 via-blue-600 to-purple-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-blue-600/25 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-blue-700/35 disabled:cursor-not-allowed disabled:opacity-70 active:scale-98"
    >
      {pending ? <Loader2 className="h-5 w-5 animate-spin" /> : icon}
      {children}
    </button>
  );
}

function SuccessMessage({
  title,
  message,
  examSummary,
}: {
  title: string;
  message: string;
  examSummary?: {
    examTitle: string;
    scheduleLabel: string;
  } | null;
}) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center animate-fadeIn">
      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
      <h3 className="mt-3 text-lg font-extrabold text-emerald-800">{title}</h3>
      <p className="mt-1 text-sm text-emerald-700">{message}</p>
      {examSummary && (
        <div className="mt-5 rounded-xl border border-emerald-200 bg-white p-4 text-left text-xs text-slate-700 space-y-1.5 shadow-xs">
          <p className="font-extrabold text-[#172554] text-sm">
            Online Examination Slot Reserved (Pending Verification)
          </p>
          <p>
            <strong>Examination:</strong> {examSummary.examTitle}
          </p>
          <p>
            <strong>Selected Schedule:</strong> {examSummary.scheduleLabel}
          </p>
          <p className="text-blue-800 bg-blue-50 p-2.5 rounded-lg border border-blue-100 mt-2">
            <strong>Exam Access Code Activation:</strong> Once the Prime STEM Examination Office confirms your registration/payment, your active Examination Access Code and instructions will be automatically emailed to your registered inbox.
          </p>
          <div className="pt-2">
            <Link
              href="/exam"
              className="inline-flex items-center gap-1.5 font-bold text-[#2563EB] hover:underline"
            >
              Visit Online Examination Portal →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// CONTACT FORM
// -------------------------------------------------------------
export function ContactForm() {
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrors({});
    setServerError("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const result = contactSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setPending(true);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(result.data),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      setSuccess(true);
      form.reset();
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <SuccessMessage
        title="Message Sent Successfully!"
        message="Thank you for reaching out to Prime STEM Nigeria. Our team will review your inquiry and get back to you shortly."
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClasses} htmlFor="ct-name">
            Full Name *
          </label>
          <input
            id="ct-name"
            name="fullName"
            placeholder="e.g. Dr. Ngozi Eze"
            className={inputClasses}
          />
          <FieldError message={errors.fullName} />
        </div>
        <div>
          <label className={labelClasses} htmlFor="ct-email">
            Email Address *
          </label>
          <input
            id="ct-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            className={inputClasses}
          />
          <FieldError message={errors.email} />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClasses} htmlFor="ct-phone">
            Phone Number
          </label>
          <input
            id="ct-phone"
            name="phone"
            placeholder="+234 800 000 0000"
            className={inputClasses}
          />
        </div>
        <div>
          <label className={labelClasses} htmlFor="ct-category">
            I Am A *
          </label>
          <select
            id="ct-category"
            name="category"
            className={inputClasses}
            defaultValue=""
          >
            <option value="" disabled>
              Select one…
            </option>
            {[
              "Student",
              "Parent/Guardian",
              "Teacher",
              "School Administrator",
              "Partner/Sponsor",
              "Other",
            ].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <FieldError message={errors.category} />
        </div>
      </div>
      <div>
        <label className={labelClasses} htmlFor="ct-subject">
          Subject *
        </label>
        <input
          id="ct-subject"
          name="subject"
          placeholder="e.g. Inquiry about 5th STEM Kids Championship"
          className={inputClasses}
        />
        <FieldError message={errors.subject} />
      </div>
      <div>
        <label className={labelClasses} htmlFor="ct-message">
          Your Message *
        </label>
        <textarea
          id="ct-message"
          name="message"
          rows={5}
          placeholder="Tell us how we can help you…"
          className={cx(inputClasses, "resize-y")}
        />
        <FieldError message={errors.message} />
      </div>

      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {serverError}
        </div>
      )}

      <SubmitButton pending={pending} icon={<Send className="h-5 w-5" />}>
        {pending ? "Sending…" : "Send Message"}
      </SubmitButton>
    </form>
  );
}

function formatScheduleWindow(startsAt: string, endsAt: string) {
  try {
    const startStr = new Date(startsAt).toLocaleString("en-NG", {
      timeZone: "Africa/Lagos",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    const endStr = new Date(endsAt).toLocaleString("en-NG", {
      timeZone: "Africa/Lagos",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
    return `${startStr} – ${endStr} WAT`;
  } catch {
    return `${startsAt} – ${endsAt}`;
  }
}

// -------------------------------------------------------------
// REGISTER FORM (Integrated with Online Examination Scheduling)
// -------------------------------------------------------------
export function RegisterForm() {
  const { content } = useContent();
  const programs = content.programs;
  const [errors, setErrors] = useState<FieldErrors>({});
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [step, setStep] = useState(0);
  const [review, setReview] = useState({ fullName: "", email: "", phone: "", category: "" });
  const [examSummary, setExamSummary] = useState<{
    examTitle: string;
    scheduleLabel: string;
  } | null>(null);

  const [publicExams, setPublicExams] = useState<PublicExamItem[]>([]);
  const [selectedProgramName, setSelectedProgramName] = useState("");
  const [enrollOnlineExam, setEnrollOnlineExam] = useState(true);
  const [selectedExamId, setSelectedExamId] = useState("");
  const [selectedScheduleId, setSelectedScheduleId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [classLevel, setClassLevel] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [parentConsentGiven, setParentConsentGiven] = useState(false);

  useEffect(() => {
    fetch("/api/exams/public", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.examinations) {
          setPublicExams(data.examinations);
        }
      })
      .catch(() => {});
  }, []);

  // Links from programme pages carry a slug (or the legacy SKC/AOCT shorthand).
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get("program");
    if (!requested) return;
    const aliases: Record<string, string> = { skc: "stem-kids-championship", aoct: "african-organic-chemistry-tournament" };
    const slug = aliases[requested.toLowerCase()] || requested;
    const programme = programs.find((p) => p.slug === slug);
    if (programme) setSelectedProgramName(programme.name);
  }, [programs]);

  // Match programme selection to linked online examinations
  const matchingExams = useMemo(() => {
    if (!selectedProgramName) return publicExams;
    const matchedProg = programs.find(
      (p) => `${p.name}` === selectedProgramName || selectedProgramName.includes(p.name)
    );
    if (!matchedProg) return [];
    return publicExams.filter((e) => e.programSlug === matchedProg.slug);
  }, [selectedProgramName, programs, publicExams]);

  useEffect(() => {
    if (matchingExams.length > 0) {
      if (!matchingExams.some((e) => e.id === selectedExamId)) {
        const firstExam = matchingExams[0];
        setSelectedExamId(firstExam.id);
        setSelectedScheduleId(firstExam.schedules[0]?.id || "");
      }
    } else {
      setSelectedExamId("");
      setSelectedScheduleId("");
    }
  }, [matchingExams, selectedExamId]);

  const activeExam = useMemo(
    () => publicExams.find((e) => e.id === selectedExamId) || null,
    [publicExams, selectedExamId]
  );

  function advanceStep(form: HTMLFormElement) {
    const values = Object.fromEntries(new FormData(form).entries());
    const parsed = registerSchema.safeParse(values);
    const relevant = step === 0 ? ["fullName", "email", "phone", "category"] : ["program"];
    const nextErrors: FieldErrors = {};
    if (!parsed.success) parsed.error.issues.forEach((issue) => {
      const key = String(issue.path[0]);
      if (relevant.includes(key)) nextErrors[key] = issue.message;
    });
    setErrors(nextErrors);
    setServerError("");
    if (Object.keys(nextErrors).length) return;
    if (step === 1 && enrollOnlineExam && matchingExams.length > 0) {
      if (!selectedScheduleId) { setServerError("Please select an available examination date and time slot."); return; }
      if (!schoolName.trim()) { setServerError("Please enter the candidate's school or institution name."); return; }
      if (!parentConsentGiven) { setServerError("Please confirm parent, guardian, or authorised school consent."); return; }
    }
    setReview({ fullName: String(values.fullName), email: String(values.email), phone: String(values.phone), category: String(values.category) });
    setStep((current) => Math.min(2, current + 1));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (step < 2) {
      advanceStep(e.currentTarget);
      return;
    }
    setErrors({});
    setServerError("");
    const form = e.currentTarget;
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    const result = registerSchema.safeParse(data);
    if (!result.success) {
      const fieldErrors: FieldErrors = {};
      result.error.issues.forEach((issue) => {
        fieldErrors[issue.path[0] as string] = issue.message;
      });
      setErrors(fieldErrors);
      return;
    }

    const isExamEnrollment =
      enrollOnlineExam && matchingExams.length > 0 && Boolean(selectedExamId);

    if (isExamEnrollment) {
      if (!selectedScheduleId) {
        setServerError("Please select an available examination date & time slot.");
        return;
      }
      if (!schoolName.trim()) {
        setServerError("Please enter the candidate's School or Institution name.");
        return;
      }
      if (!parentConsentGiven) {
        setServerError(
          "Please confirm Parent, Legal Guardian, or Authorised School consent to proceed with online proctored examination enrollment."
        );
        return;
      }
    }

    setPending(true);
    try {
      const payload = {
        ...result.data,
        ...(isExamEnrollment
          ? {
              examId: selectedExamId,
              scheduleId: selectedScheduleId,
              schoolName: schoolName.trim(),
              classLevel: classLevel.trim(),
              guardianName: guardianName.trim(),
              parentConsentGiven,
            }
          : {}),
      };

      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setServerError(json.error ?? "Something went wrong. Please try again.");
        return;
      }
      if (json.examRegistration) {
        setExamSummary({
          examTitle: json.examRegistration.examTitle,
          scheduleLabel: json.examRegistration.scheduleLabel,
        });
      }
      setSuccess(true);
      form.reset();
    } catch {
      setServerError("Network error. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (success) {
    return (
      <SuccessMessage
        title="Registration Received!"
        message="Thank you for registering with Prime STEM Nigeria. Check your email for your confirmation summary."
        examSummary={examSummary}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <ol className="grid grid-cols-3 gap-2" aria-label="Registration progress">
        {["Your details", "Programme & exam", "Review"].map ( (label, index) => (
          <li key={label} aria-current={step === index ? "step" : undefined} className={`rounded-xl px-3 py-3 text-center text-xs font-bold ${step === index ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-600"}`}>
            <span className="block text-[10px] uppercase tracking-wide">Step {index + 1}</span>{label}
          </li>
        ))}
      </ol>
      <div hidden={step !== 0} className="space-y-5">

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClasses} htmlFor="rg-name">
            Candidate / Applicant Full Name *
          </label>
          <input
            id="rg-name"
            name="fullName"
            placeholder="e.g. Adewale Johnson"
            className={inputClasses}
          />
          <FieldError message={errors.fullName} />
        </div>
        <div>
          <label className={labelClasses} htmlFor="rg-email">
            Email Address (For Exam Access Code) *
          </label>
          <input
            id="rg-email"
            name="email"
            type="email"
            placeholder="you@example.com"
            className={inputClasses}
          />
          <FieldError message={errors.email} />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClasses} htmlFor="rg-phone">
            Phone / WhatsApp Number *
          </label>
          <input
            id="rg-phone"
            name="phone"
            placeholder="+234 800 000 0000"
            className={inputClasses}
          />
          <FieldError message={errors.phone} />
        </div>
        <div>
          <label className={labelClasses} htmlFor="rg-category">
            I Am Registering As *
          </label>
          <select
            id="rg-category"
            name="category"
            className={inputClasses}
            defaultValue=""
          >
            <option value="" disabled>
              Select one…
            </option>
            {[
              "Student",
              "Parent/Guardian",
              "School",
              "Teacher",
              "Organization",
              "Partner",
              "Other",
            ].map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <FieldError message={errors.category} />
        </div>
      </div>
      </div>
      <div hidden={step !== 1} className="space-y-5">
      <div>
        <label className={labelClasses} htmlFor="rg-program">
          Competition / Programme *
        </label>
        <select
          id="rg-program"
          name="program"
          className={inputClasses}
          value={selectedProgramName}
          onChange={(e) => setSelectedProgramName(e.target.value)}
        >
          <option value="" disabled>
            Select a programme…
          </option>
          {programs.map((p) => (
            <option key={p.slug} value={p.name}>
              {p.name} ({p.shortName})
            </option>
          ))}
          <option value="Other STEM Event">Other STEM Event / Tour</option>
        </select>
        <FieldError message={errors.program} />
      </div>

      {/* Dynamic Online Examination Slot Selector when competition has online exams */}
      {selectedProgramName && matchingExams.length > 0 && (
        <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Laptop className="h-5 w-5 text-[#2563EB]" />
              <span className="text-sm font-extrabold text-[#172554]">
                Online Computer-Based Examination Enrollment
              </span>
            </div>
            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={enrollOnlineExam}
                onChange={(e) => setEnrollOnlineExam(e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-600"
              />
              Reserve Online Exam Slot
            </label>
          </div>

          {enrollOnlineExam && (
            <div className="space-y-4 pt-1">
              <div>
                <label className={labelClasses} htmlFor="rg-exam-track">
                  Select Examination Track / Category *
                </label>
                <select
                  id="rg-exam-track"
                  className={inputClasses}
                  value={selectedExamId}
                  onChange={(e) => {
                    const nextId = e.target.value;
                    setSelectedExamId(nextId);
                    const nextExam = publicExams.find((ex) => ex.id === nextId);
                    setSelectedScheduleId(nextExam?.schedules[0]?.id || "");
                  }}
                >
                  {matchingExams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.category} • {ex.durationMinutes} mins)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={labelClasses} htmlFor="rg-exam-schedule">
                  Select Available Examination Date &amp; Time Slot *
                </label>
                {activeExam && activeExam.schedules.length > 0 ? (
                  <select
                    id="rg-exam-schedule"
                    className={inputClasses}
                    value={selectedScheduleId}
                    onChange={(e) => setSelectedScheduleId(e.target.value)}
                  >
                    {activeExam.schedules.map((slot) => (
                      <option key={slot.id} value={slot.id}>
                        {slot.label} — {formatScheduleWindow(slot.startsAt, slot.endsAt)} (
                        {slot.remainingSeats} seats open)
                      </option>
                    ))}
                  </select>
                ) : (
                  <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-semibold text-amber-800">
                    All online slots for this track are currently full or closed. Uncheck &ldquo;Reserve Online Exam Slot&rdquo; to submit a general/physical registration inquiry.
                  </p>
                )}
                <p className="mt-1.5 flex items-center gap-1.5 text-[0.72rem] text-slate-600">
                  <CalendarClock className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                  Candidates may only select from official Administrator-published examination windows.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className={labelClasses} htmlFor="rg-school">
                    School / Institution *
                  </label>
                  <input
                    id="rg-school"
                    value={schoolName}
                    onChange={(e) => setSchoolName(e.target.value)}
                    placeholder="e.g.Therbow School Zaria"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="rg-class">
                    Class / Level
                  </label>
                  <input
                    id="rg-class"
                    value={classLevel}
                    onChange={(e) => setClassLevel(e.target.value)}
                    placeholder="e.g. Primary 5 / JSS 2 / SS 2"
                    className={inputClasses}
                  />
                </div>
                <div>
                  <label className={labelClasses} htmlFor="rg-guardian">
                    Parent / School Rep Name
                  </label>
                  <input
                    id="rg-guardian"
                    value={guardianName}
                    onChange={(e) => setGuardianName(e.target.value)}
                    placeholder="Guardian or Coordinator"
                    className={inputClasses}
                  />
                </div>
              </div>

              <label className="flex items-start gap-3 rounded-xl border border-blue-200 bg-white p-3.5 text-xs leading-relaxed text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={parentConsentGiven}
                  onChange={(e) => setParentConsentGiven(e.target.checked)}
                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-slate-300 text-blue-600"
                />
                <span>
                  <strong className="text-[#172554] inline-flex items-center gap-1">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> NDPA Child Protection &amp; AI Proctoring Consent:
                  </strong>{" "}
                  As a Parent, Legal Guardian, or Authorised School Representative, I consent to the candidate participating in the Prime STEM online examination, including temporary non-public screen, webcam, and microphone proctoring recordings used solely for examination integrity review.
                </span>
              </label>
            </div>
          )}
        </div>
      )}

      </div>
      <div hidden={step !== 2} className="space-y-5">
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5 text-sm text-slate-700">
          <h3 className="mb-3 font-extrabold text-[#172554]">Review your registration</h3>
          <dl className="grid gap-2 sm:grid-cols-2">
            <div><dt className="font-bold">Name</dt><dd>{review.fullName}</dd></div>
            <div><dt className="font-bold">Email</dt><dd>{review.email}</dd></div>
            <div><dt className="font-bold">Phone</dt><dd>{review.phone}</dd></div>
            <div><dt className="font-bold">Registering as</dt><dd>{review.category}</dd></div>
            <div><dt className="font-bold">Programme</dt><dd>{selectedProgramName}</dd></div>
            {enrollOnlineExam && activeExam && <div><dt className="font-bold">Exam</dt><dd>{activeExam.title}</dd></div>}
          </dl>
        </div>
      <div>
        <label className={labelClasses} htmlFor="rg-message">
          Additional Notes or Payment Reference
        </label>
        <textarea
          id="rg-message"
          name="message"
          rows={3}
          placeholder="UBA transfer reference, multiple school candidates, or preferred examination notes…"
          className={cx(inputClasses, "resize-y")}
        />
      </div>

      </div>
      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {serverError}
        </div>
      )}

      <div className="flex gap-3">
        {step > 0 && <button type="button" onClick={() => { setStep(step - 1); setServerError(""); }} className="rounded-full border border-slate-300 px-6 py-3 font-bold text-slate-700">Back</button>}
        {step < 2 ? <button type="button" onClick={(event) => advanceStep(event.currentTarget.form!)} className="w-full rounded-full bg-blue-700 px-6 py-4 font-bold text-white hover:bg-blue-800">Continue</button> : <SubmitButton pending={pending} icon={<UserPlus className="h-5 w-5" />}>
          {pending ? "Submitting Registration…" : "Complete Registration"}
        </SubmitButton>}
      </div>
    </form>
  );
}

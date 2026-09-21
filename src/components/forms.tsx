"use client";

import { FormEvent, useState } from "react";
import { z } from "zod";
import { CheckCircle2, Loader2, Send, UserPlus } from "lucide-react";
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

function SuccessMessage({ title, message }: { title: string; message: string }) {
  return (
    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-6 text-center animate-fadeIn">
      <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-500" />
      <h3 className="mt-3 text-lg font-extrabold text-emerald-800">{title}</h3>
      <p className="mt-1 text-sm text-emerald-700">{message}</p>
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
          <label className={labelClasses} htmlFor="ct-name">Full Name *</label>
          <input id="ct-name" name="fullName" placeholder="e.g. Dr. Ngozi Eze" className={inputClasses} />
          <FieldError message={errors.fullName} />
        </div>
        <div>
          <label className={labelClasses} htmlFor="ct-email">Email Address *</label>
          <input id="ct-email" name="email" type="email" placeholder="you@example.com" className={inputClasses} />
          <FieldError message={errors.email} />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClasses} htmlFor="ct-phone">Phone Number</label>
          <input id="ct-phone" name="phone" placeholder="+234 800 000 0000" className={inputClasses} />
        </div>
        <div>
          <label className={labelClasses} htmlFor="ct-category">I Am A *</label>
          <select id="ct-category" name="category" className={inputClasses} defaultValue="">
            <option value="" disabled>Select one…</option>
            {["Student", "Parent/Guardian", "Teacher", "School Administrator", "Partner/Sponsor", "Other"].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <FieldError message={errors.category} />
        </div>
      </div>
      <div>
        <label className={labelClasses} htmlFor="ct-subject">Subject *</label>
        <input id="ct-subject" name="subject" placeholder="e.g. Inquiry about 5th STEM Kids Championship" className={inputClasses} />
        <FieldError message={errors.subject} />
      </div>
      <div>
        <label className={labelClasses} htmlFor="ct-message">Your Message *</label>
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

// -------------------------------------------------------------
// REGISTER FORM
// -------------------------------------------------------------
export function RegisterForm() {
  const { content } = useContent();
  const programs = content.programs;
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

    const result = registerSchema.safeParse(data);
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
      const res = await fetch("/api/register", {
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
        title="Registration Received!"
        message="Thank you for registering with Prime STEM Nigeria. Our examination coordinator will contact you with candidate confirmation and syllabus details."
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClasses} htmlFor="rg-name">Full Name *</label>
          <input id="rg-name" name="fullName" placeholder="e.g. Adewale Johnson" className={inputClasses} />
          <FieldError message={errors.fullName} />
        </div>
        <div>
          <label className={labelClasses} htmlFor="rg-email">Email Address *</label>
          <input id="rg-email" name="email" type="email" placeholder="you@example.com" className={inputClasses} />
          <FieldError message={errors.email} />
        </div>
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label className={labelClasses} htmlFor="rg-phone">Phone Number *</label>
          <input id="rg-phone" name="phone" placeholder="+234 800 000 0000" className={inputClasses} />
          <FieldError message={errors.phone} />
        </div>
        <div>
          <label className={labelClasses} htmlFor="rg-category">I Am A *</label>
          <select id="rg-category" name="category" className={inputClasses} defaultValue="">
            <option value="" disabled>Select one…</option>
            {["Student", "Parent/Guardian", "School", "Teacher", "Organization", "Partner", "Other"].map((opt) => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
          <FieldError message={errors.category} />
        </div>
      </div>
      <div>
        <label className={labelClasses} htmlFor="rg-program">Programme *</label>
        <select id="rg-program" name="program" className={inputClasses} defaultValue="">
          <option value="" disabled>Select a programme…</option>
          {programs.map((p) => (
            <option key={p.slug} value={p.name}>{p.name} ({p.shortName})</option>
          ))}
          <option value="Other STEM Event">Other STEM Event / Tour</option>
        </select>
        <FieldError message={errors.program} />
      </div>
      <div>
        <label className={labelClasses} htmlFor="rg-message">Additional Notes or Candidate List</label>
        <textarea
          id="rg-message"
          name="message"
          rows={4}
          placeholder="Number of candidates, school name, preferred examination format (Physical/Online)…"
          className={cx(inputClasses, "resize-y")}
        />
      </div>

      {serverError && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-600">
          {serverError}
        </div>
      )}

      <SubmitButton pending={pending} icon={<UserPlus className="h-5 w-5" />}>
        {pending ? "Submitting Registration…" : "Complete Registration"}
      </SubmitButton>
    </form>
  );
}

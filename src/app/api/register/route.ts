import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { recordRegistration } from "@/lib/content-store";
import {
  sendAdminAlertEmail,
  sendCandidateRegistrationReceivedEmail,
} from "@/lib/email";
import { registerExamCandidate } from "@/lib/exam-store";

const schema = z.object({
  fullName: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(7, "Please enter a valid phone number."),
  category: z.string().min(1, "Please select who you are."),
  program: z.string().min(1, "Please select a programme."),
  message: z.string().optional(),
  // Optional online examination fields when registering for an exam-enabled competition
  examId: z.string().optional(),
  scheduleId: z.string().optional(),
  schoolName: z.string().optional(),
  classLevel: z.string().optional(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  parentConsentGiven: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid submission." },
        { status: 400 }
      );
    }

    const {
      fullName,
      email,
      phone,
      category,
      program,
      message,
      examId,
      scheduleId,
      schoolName,
      classLevel,
      guardianName,
      guardianPhone,
      parentConsentGiven,
    } = parsed.data;

    let examRegistrationResult: {
      candidateId: string;
      examTitle: string;
      scheduleLabel: string;
      approvalStatus: string;
    } | null = null;

    if (examId && examId.trim()) {
      if (!scheduleId || !scheduleId.trim()) {
        return NextResponse.json(
          { error: "Please select an available examination date and time slot." },
          { status: 400 }
        );
      }
      if (!parentConsentGiven) {
        return NextResponse.json(
          {
            error:
              "Parent, Legal Guardian, or Authorised School consent is required under NDPA child-protection guidelines.",
          },
          { status: 400 }
        );
      }
    }

    // 1. Always preserve registration in Admin Powerhouse submissions store
    const savedSubmission = recordRegistration({
      fullName,
      email,
      phone,
      category,
      program,
      message: examId
        ? `[Exam Slot Selected] School: ${schoolName || "N/A"} | Class: ${
            classLevel || "N/A"
          } | Guardian/Rep: ${guardianName || "N/A"}${
            message ? ` | Notes: ${message}` : ""
          }`
        : message,
    });

    // 2. Also attempt DB insert if PostgreSQL is connected
    try {
      await db.insert(registrations).values({
        fullName,
        email,
        phone,
        category,
        program,
        message: message || null,
      });
    } catch (dbErr) {
      console.warn("DB insert fallback:", dbErr);
    }

    // 3. If registering for a scheduled Online Examination, create ExamCandidateRecord (pending Admin approval)
    if (examId && scheduleId) {
      try {
        const { candidate, exam, schedule } = await registerExamCandidate({
          registrationId: savedSubmission?.id ?? null,
          examId,
          scheduleId,
          fullName,
          email,
          phone,
          schoolName: schoolName?.trim() || "Independent / School Pending",
          category,
          classLevel: classLevel?.trim() || category,
          guardianName: guardianName?.trim() || "",
          guardianPhone: guardianPhone?.trim() || phone,
          parentConsentGiven: Boolean(parentConsentGiven),
          notes: message || "",
        });

        examRegistrationResult = {
          candidateId: candidate.id,
          examTitle: exam.title,
          scheduleLabel: schedule.label,
          approvalStatus: candidate.approvalStatus,
        };

        // Send candidate registration receipt (explaining Admin code activation)
        await sendCandidateRegistrationReceivedEmail({
          candidate,
          exam,
          schedule,
        });
      } catch (examErr: any) {
        return NextResponse.json(
          {
            error:
              examErr?.message ||
              "Could not assign examination schedule slot. Please choose another slot.",
          },
          { status: 400 }
        );
      }
    }

    // 4. Notify Prime STEM Admin Office
    await sendAdminAlertEmail({
      subject: `New Registration: ${fullName} — ${program}`,
      heading: "New Programme / Competition Registration",
      detailsHtml: `
        <p><strong>Applicant:</strong> ${fullName} (${category})</p>
        <p><strong>Email:</strong> ${email} &bull; <strong>Phone:</strong> ${phone}</p>
        <p><strong>Programme:</strong> ${program}</p>
        ${
          examRegistrationResult
            ? `<p><strong>Examination Slot:</strong> ${examRegistrationResult.examTitle} &mdash; ${examRegistrationResult.scheduleLabel} (<em>Awaiting Admin Approval &amp; Exam Code Dispatch</em>)</p>`
            : ""
        }
        ${message ? `<p><strong>Notes:</strong> ${message}</p>` : ""}
      `,
      relatedEntityId: examRegistrationResult?.candidateId || String(savedSubmission.id),
    });

    return NextResponse.json({
      success: true,
      examRegistration: examRegistrationResult,
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Unable to complete registration. Please try again later." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import {
  sendCandidateRegistrationReceivedEmail,
  sendExamCodeConfirmationEmail,
} from "@/lib/email";
import {
  approveCandidateAndIssueCode,
  deleteCandidate,
  registerExamCandidate,
  revokeCandidateAccess,
} from "@/lib/exam-store";

export async function POST(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();

    // 1. Approve candidate & activate auto-generated OR custom Examination Access Code + Email candidate
    if (body.action === "approve_and_issue_code") {
      const issued = await approveCandidateAndIssueCode({
        candidateId: String(body.candidateId),
        customCode: body.customCode ? String(body.customCode) : undefined,
        scheduleId: body.scheduleId ? String(body.scheduleId) : undefined,
        notes: body.notes !== undefined ? String(body.notes) : undefined,
      });

      const emailResult = await sendExamCodeConfirmationEmail({
        candidate: issued.candidate,
        exam: issued.exam,
        schedule: issued.schedule,
        accessCode: issued.plainAccessCode,
      });

      return NextResponse.json({
        success: true,
        candidate: issued.candidate,
        plainAccessCode: issued.plainAccessCode,
        emailStatus: emailResult.status,
        emailDelivered: emailResult.delivered,
      });
    }

    // 2. Revoke candidate access code
    if (body.action === "revoke") {
      const candidate = await revokeCandidateAccess(
        String(body.candidateId),
        body.reason ? String(body.reason) : undefined
      );
      return NextResponse.json({ success: true, candidate });
    }

    // 3. Admin manual enrollment (with optional immediate approval & code dispatch)
    const created = await registerExamCandidate({
      registrationId: body.registrationId ? Number(body.registrationId) : null,
      examId: String(body.examId),
      scheduleId: String(body.scheduleId),
      fullName: String(body.fullName || "").trim(),
      email: String(body.email || "").trim(),
      phone: String(body.phone || "").trim(),
      schoolName: String(body.schoolName || "").trim(),
      category: String(body.category || "Student").trim(),
      classLevel: String(body.classLevel || "").trim(),
      guardianName: String(body.guardianName || "School / Guardian Verified").trim(),
      guardianPhone: String(body.guardianPhone || body.phone || "").trim(),
      parentConsentGiven: body.parentConsentGiven !== false,
      notes: String(body.notes || "").trim(),
    });

    if (body.approveImmediately) {
      const issued = await approveCandidateAndIssueCode({
        candidateId: created.candidate.id,
        customCode: body.customCode ? String(body.customCode) : undefined,
      });
      const emailResult = await sendExamCodeConfirmationEmail({
        candidate: issued.candidate,
        exam: issued.exam,
        schedule: issued.schedule,
        accessCode: issued.plainAccessCode,
      });
      return NextResponse.json({
        success: true,
        candidate: issued.candidate,
        plainAccessCode: issued.plainAccessCode,
        emailStatus: emailResult.status,
      });
    }

    await sendCandidateRegistrationReceivedEmail(created);
    return NextResponse.json({
      success: true,
      candidate: created.candidate,
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Candidate operation failed." },
      { status: 400 }
    );
  }
}

export async function DELETE(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing candidate id" }, { status: 400 });
    }
    const ok = await deleteCandidate(id);
    return NextResponse.json({ success: ok });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Failed deleting candidate." },
      { status: 500 }
    );
  }
}

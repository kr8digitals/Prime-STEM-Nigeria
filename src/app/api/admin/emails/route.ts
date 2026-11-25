import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import {
  retryEmailLogById,
  sendCustomOrBroadcastEmail,
} from "@/lib/email";
import { listEmailLogs, listNewsletterSubscribers } from "@/lib/exam-store";

export async function POST(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();

    // 1. Retry a single queued/failed email log
    if (body.action === "retry_single") {
      const res = await retryEmailLogById(String(body.logId));
      return NextResponse.json({ success: true, ...res });
    }

    // 2. Retry all queued emails once RESEND_API_KEY is added
    if (body.action === "retry_all_queued") {
      const logs = await listEmailLogs(500);
      const queued = logs.filter((l) => l.status !== "sent");
      let sentCount = 0;
      let failedCount = 0;
      for (const item of queued) {
        try {
          await retryEmailLogById(item.id);
          sentCount += 1;
        } catch {
          failedCount += 1;
        }
      }
      return NextResponse.json({ success: true, sentCount, failedCount });
    }

    // 3. Broadcast announcement to all active newsletter subscribers
    if (body.action === "broadcast_subscribers") {
      const subject = String(body.subject || "").trim();
      const heading = String(body.heading || subject).trim();
      const messageBody = String(body.messageBody || "").trim();
      if (!subject || !messageBody) {
        return NextResponse.json(
          { error: "Subject and message body are required." },
          { status: 400 }
        );
      }

      const subscribers = (await listNewsletterSubscribers()).filter(
        (s) => s.status === "active"
      );
      let processedCount = 0;
      for (const sub of subscribers) {
        await sendCustomOrBroadcastEmail({
          recipientEmail: sub.email,
          recipientName: sub.fullName,
          subject,
          heading,
          messageBody,
          category: "newsletter_broadcast",
        });
        processedCount += 1;
      }
      return NextResponse.json({ success: true, processedCount });
    }

    // 4. Send direct custom email (e.g. reply to contact inquiry or school coordinator)
    if (body.action === "send_custom") {
      const recipientEmail = String(body.recipientEmail || "").trim();
      const subject = String(body.subject || "").trim();
      const heading = String(body.heading || subject).trim();
      const messageBody = String(body.messageBody || "").trim();
      if (!recipientEmail || !subject || !messageBody) {
        return NextResponse.json(
          { error: "Recipient email, subject, and message are required." },
          { status: 400 }
        );
      }

      const dispatched = await sendCustomOrBroadcastEmail({
        recipientEmail,
        recipientName: body.recipientName ? String(body.recipientName) : "",
        subject,
        heading,
        messageBody,
        category: "admin_custom",
      });
      return NextResponse.json({ success: true, ...dispatched });
    }

    return NextResponse.json({ error: "Unsupported email action." }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Email action failed." },
      { status: 400 }
    );
  }
}

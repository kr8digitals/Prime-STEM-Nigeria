import { NextResponse } from "next/server";
import { z } from "zod";
import { recordContactMessage } from "@/lib/content-store";
import {
  sendAdminAlertEmail,
  sendContactAcknowledgementEmail,
} from "@/lib/email";

const schema = z.object({
  fullName: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().optional(),
  category: z.string().min(1, "Please select who you are."),
  subject: z.string().min(2, "Please enter a subject."),
  message: z.string().min(10, "Your message should be at least 10 characters."),
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

    const { fullName, email, phone, category, subject, message } = parsed.data;

    const saved = await recordContactMessage({
      fullName,
      email,
      phone,
      category,
      subject,
      message,
    });

    await Promise.allSettled([
      sendContactAcknowledgementEmail({
        name: fullName,
        email,
        subject,
        message,
      }),
      sendAdminAlertEmail({
        subject: `Contact Enquiry: ${subject} (${fullName})`,
        heading: "New Contact Form Message",
        detailsHtml: `
          <p><strong>From:</strong> ${fullName} (${category})</p>
          <p><strong>Email:</strong> ${email} &bull; <strong>Phone:</strong> ${phone || "N/A"}</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Message:</strong><br/>${message}</p>
        `,
        relatedEntityId: String(saved.id),
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Unable to send your message. Please try again later." },
      { status: 500 }
    );
  }
}

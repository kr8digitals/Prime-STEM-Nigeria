import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { contactMessages } from "@/db/schema";
import { recordContactMessage } from "@/lib/content-store";

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

    // Save to file-based content store (persisted for Admin Powerhouse)
    recordContactMessage({
      fullName,
      email,
      phone,
      category,
      subject,
      message,
    });

    // Also attempt DB insert if sqlite exists
    try {
      await db.insert(contactMessages).values({
        fullName,
        email,
        phone: phone || null,
        category,
        subject,
        message,
      });
    } catch (dbErr) {
      console.warn("DB insert fallback:", dbErr);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Unable to send your message. Please try again later." },
      { status: 500 }
    );
  }
}

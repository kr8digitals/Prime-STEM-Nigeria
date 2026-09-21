import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { recordRegistration } from "@/lib/content-store";

const schema = z.object({
  fullName: z.string().min(2, "Please enter your full name."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().min(7, "Please enter a valid phone number."),
  category: z.string().min(1, "Please select who you are."),
  program: z.string().min(1, "Please select a programme."),
  message: z.string().optional(),
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

    const { fullName, email, phone, category, program, message } = parsed.data;

    // Save to file-based content store (persisted for Admin Powerhouse)
    recordRegistration({
      fullName,
      email,
      phone,
      category,
      program,
      message,
    });

    // Also attempt DB insert if sqlite exists
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

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Unable to complete registration. Please try again later." },
      { status: 500 }
    );
  }
}

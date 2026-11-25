import { NextResponse } from "next/server";
import { z } from "zod";
import { sendNewsletterWelcomeEmail } from "@/lib/email";
import { subscribeNewsletter } from "@/lib/exam-store";

const schema = z.object({
  email: z.string().email("Please enter a valid email address."),
  fullName: z.string().optional(),
  source: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message ?? "Invalid email address." },
        { status: 400 }
      );
    }

    const { subscriber, alreadySubscribed } = await subscribeNewsletter({
      email: parsed.data.email,
      fullName: parsed.data.fullName,
      source: parsed.data.source || "footer_form",
    });

    if (!alreadySubscribed) {
      await sendNewsletterWelcomeEmail({
        email: subscriber.email,
        fullName: subscriber.fullName,
      });
    }

    return NextResponse.json({
      success: true,
      alreadySubscribed,
      message: alreadySubscribed
        ? "You are already subscribed to Prime STEM Nigeria updates."
        : "Subscribed! Watch your inbox for official Prime STEM announcements.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || "Could not complete subscription." },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { getSiteContent, saveSiteContent, resetSiteContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function GET() {
  const content = getSiteContent();
  return NextResponse.json(content, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // If reset request
    if (body.action === "reset") {
      const reset = resetSiteContent();
      return NextResponse.json({ success: true, content: reset });
    }

    // Save modified content (merges with existing)
    const payload = body.content ? body.content : body;
    const updated = saveSiteContent(payload);
    return NextResponse.json({ success: true, content: updated });
  } catch (error: any) {
    console.error("Error saving content:", error);
    return NextResponse.json({ error: error.message || "Failed to update content" }, { status: 500 });
  }
}

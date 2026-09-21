import { NextResponse } from "next/server";
import { getSiteContent, saveSiteContent, getDefaultContent } from "@/lib/content-store";

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
      const def = getDefaultContent();
      const saved = saveSiteContent(def);
      return NextResponse.json({ success: true, content: saved });
    }

    // Save modified content
    const updated = saveSiteContent(body.content || body);
    return NextResponse.json({ success: true, content: updated });
  } catch (error: any) {
    console.error("Error saving content:", error);
    return NextResponse.json({ error: error.message || "Failed to update content" }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { requireAdminAuth } from "@/lib/admin-auth";
import { getSiteContent, saveSiteContent, resetSiteContent } from "@/lib/content-store";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  const content = await getSiteContent();
  return NextResponse.json(content, {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  const denied = requireAdminAuth(request);
  if (denied) return denied;

  try {
    const body = await request.json();

    if (body.action === "reset") {
      const reset = await resetSiteContent();
      return NextResponse.json({ success: true, content: reset });
    }

    const payload = body.content ? body.content : body;
    const updated = await saveSiteContent(payload);
    return NextResponse.json({ success: true, content: updated });
  } catch (error: any) {
    console.error("Error saving content:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update content" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";

const ADMIN_PASSWORD = "Pr!me@Ad?nàccess";
const SESSION_TOKEN = "prime_stem_admin_secure_session_token_2026";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    if (!password) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    if (password === ADMIN_PASSWORD) {
      const response = NextResponse.json({
        success: true,
        message: "Authenticated successfully",
        token: SESSION_TOKEN,
      });

      // Set cookie for persistence
      response.cookies.set("prime_admin_auth", SESSION_TOKEN, {
        httpOnly: false, // allow client-side reading for instant UI state
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json(
      { error: "Access Denied: Incorrect administrator password" },
      { status: 401 }
    );
  } catch (error) {
    return NextResponse.json({ error: "Server authentication error" }, { status: 500 });
  }
}

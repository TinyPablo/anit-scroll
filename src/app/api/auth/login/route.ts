import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { clearAttempts, tooManyAttempts } from "@/lib/rate-limit";
import { SESSION_COOKIE, SESSION_MAX_AGE, checkPassword, createSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";

  if (tooManyAttempts(ip)) {
    return NextResponse.json({ error: "too_many_attempts" }, { status: 429 });
  }

  const body = await request.json().catch(() => null);

  if (!checkPassword(body?.password)) {
    return NextResponse.json({ error: "invalid_password" }, { status: 401 });
  }

  clearAttempts(ip);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, createSession(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return response;
}

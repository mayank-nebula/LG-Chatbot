import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "anon_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function genUuid(): string {
  // Use Web Crypto API available in Edge runtime
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  // fallback: simple UUID v4 generator (cryptographically weaker)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function proxy(req: NextRequest) {
  const url = req.nextUrl.pathname;
  const sessionId = req.cookies.get(COOKIE_NAME)?.value ?? null;

  const isApiRoute = url.startsWith("/api");

  // Protected path: reject if no session
  if (isApiRoute) {
    if (!sessionId) {
      return new NextResponse(JSON.stringify({ error: "Session required" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }
    return NextResponse.next();
  }

  // Public paths: create session cookie if missing
  if (!sessionId) {
    const id = genUuid();
    const res = NextResponse.next();
    res.cookies.set({
      name: COOKIE_NAME,
      value: id,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: THIRTY_DAYS,
    });
    return res;
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/:path*",
};

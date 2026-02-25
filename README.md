import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { urlMap } from "./lib/urlMap";

const COOKIE_NAME = "anon_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function genUuid(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function proxy(req: NextRequest) {
  const pathname = req.nextUrl.pathname;

  if (urlMap[pathname]) {
    const destination = urlMap[pathname];
    const redirectUrl = new URL(destination, req.url);

    return NextResponse.redirect(redirectUrl, {
      status: 301,
    });
  }

  const sessionId = req.cookies.get(COOKIE_NAME)?.value;

  if (!sessionId) {
    const id = genUuid();
    const response = NextResponse.next();
    response.cookies.set({
      name: COOKIE_NAME,
      value: id,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: THIRTY_DAYS,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};

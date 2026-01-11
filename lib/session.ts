import { cookies } from "next/headers";

const COOKIE_NAME = "anon_session";
const THIRTY_DAYS = 60 * 60 * 24 * 30;

function getUuid(): string {
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

export async function ensureSession() {
  const store = await cookies();
  const existing = store.get(COOKIE_NAME)?.value;
  if (existing) return existing;

  const id = getUuid();
  store.set({
    name: COOKIE_NAME,
    value: id,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });

  return id;
}

export async function getSession() {
  const store = await cookies();
  return store.get(COOKIE_NAME)?.value ?? null;
}

export async function rotateSession() {
  const store = await cookies();
  const newId = getUuid();

  store.set({
    name: COOKIE_NAME,
    value: newId,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: THIRTY_DAYS,
  });

  return newId;
}

import { randomUUID } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE = "docuchat_sid";
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * Anonymous per-browser session. Every document and chunk is scoped to it,
 * so visitors of the public demo never see each other's files.
 */
export async function getSessionId(): Promise<string> {
  const store = await cookies();
  const existing = store.get(COOKIE)?.value;
  if (existing && UUID.test(existing)) return existing;

  const id = randomUUID();
  store.set(COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
  return id;
}

export const isUuid = (value: string) => UUID.test(value);

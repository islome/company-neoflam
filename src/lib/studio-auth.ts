import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

/**
 * Staff access to the 3D Studio. One shared password in the STUDIO_PASSWORD
 * env var; the session cookie holds an HMAC of it (never the password), so
 * changing the password signs everyone out. Without STUDIO_PASSWORD the
 * Studio is switched off.
 */
const COOKIE = "neoflam_studio";
const MAX_AGE = 60 * 60 * 24 * 7;

const password = () => process.env.STUDIO_PASSWORD || null;
export const studioEnabled = () => password() !== null;

const token = (secret: string) => createHmac("sha256", secret).update("neoflam-studio-session-v1").digest("hex");

function same(a: string, b: string) {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export async function isStudioAuthed() {
  const secret = password();
  if (!secret) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  return !!value && same(value, token(secret));
}

/** Checks the password and starts a session. Call only from a Server Function. */
export async function signIn(input: string) {
  const secret = password();
  if (!secret || !same(createHmac("sha256", "cmp").update(input).digest("hex"), createHmac("sha256", "cmp").update(secret).digest("hex"))) {
    return false;
  }
  (await cookies()).set(COOKIE, token(secret), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: MAX_AGE,
  });
  return true;
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}

/** Throws unless the request has a valid Studio session. */
export async function requireStudio() {
  if (!(await isStudioAuthed())) throw new Error("Not signed in to the 3D Studio.");
}

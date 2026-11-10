import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "nomad_session";

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

/** The session value is derived from the password, so changing it logs every device out. */
export function sessionToken() {
  const password = process.env.APP_PASSWORD;
  if (!password) return null;
  return createHmac("sha256", password).update("nomad-session-v1").digest("hex");
}

export function isValidSession(value: string | undefined) {
  const expected = sessionToken();
  return Boolean(expected && value && safeEqual(value, expected));
}

export function isCorrectPassword(input: string) {
  const password = process.env.APP_PASSWORD;
  return Boolean(password && safeEqual(input, password));
}

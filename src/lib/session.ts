import { createHmac, timingSafeEqual } from "node:crypto";

export const SESSION_COOKIE = "tally_session";
export const SESSION_MAX_AGE = 60 * 60 * 24 * 365;

function secret(): string {
  const value = process.env.SESSION_SECRET;
  if (!value) throw new Error("SESSION_SECRET is not set");
  return value;
}

function sign(issuedAt: string): string {
  return createHmac("sha256", secret()).update(issuedAt).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export function createSession(): string {
  const issuedAt = String(Math.floor(Date.now() / 1000));
  return `${issuedAt}.${sign(issuedAt)}`;
}

export function verifySession(value: string | undefined): boolean {
  if (!value) return false;
  const [issuedAt, signature] = value.split(".");
  if (!issuedAt || !signature) return false;
  if (!safeEqual(signature, sign(issuedAt))) return false;

  const age = Math.floor(Date.now() / 1000) - Number(issuedAt);
  return Number.isFinite(age) && age >= 0 && age < SESSION_MAX_AGE;
}

/** Compares HMAC digests so the comparison is constant length regardless of input. */
export function checkPassword(candidate: unknown): boolean {
  const expected = process.env.APP_PASSWORD;
  if (!expected || typeof candidate !== "string") return false;
  return safeEqual(
    createHmac("sha256", secret()).update(candidate).digest("hex"),
    createHmac("sha256", secret()).update(expected).digest("hex"),
  );
}

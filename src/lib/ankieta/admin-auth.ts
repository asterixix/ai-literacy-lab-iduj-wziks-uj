import { createHmac, timingSafeEqual } from "node:crypto";

export const SURVEY_ADMIN_COOKIE = "survey_admin_session";
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;

function getAdminPassword(): string {
  const password = process.env.SURVEY_ADMIN_PASSWORD;
  if (!password) {
    throw new Error("Brakuje zmiennej środowiskowej SURVEY_ADMIN_PASSWORD.");
  }

  return password;
}

function getSessionSecret(): string {
  return process.env.SURVEY_ADMIN_SESSION_SECRET ?? getAdminPassword();
}

function signPayload(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

export function isValidAdminPassword(password: string): boolean {
  const expected = Buffer.from(getAdminPassword(), "utf-8");
  const incoming = Buffer.from(password, "utf-8");

  if (expected.length !== incoming.length) {
    return false;
  }

  return timingSafeEqual(expected, incoming);
}

export function createAdminSessionToken(): string {
  const issuedAt = Date.now().toString();
  const signature = signPayload(issuedAt);
  return `${issuedAt}.${signature}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  const [issuedAt, signature] = token.split(".");
  if (!issuedAt || !signature) {
    return false;
  }

  const expectedSignature = signPayload(issuedAt);
  const expectedBuffer = Buffer.from(expectedSignature, "utf-8");
  const actualBuffer = Buffer.from(signature, "utf-8");

  if (expectedBuffer.length !== actualBuffer.length) {
    return false;
  }

  if (!timingSafeEqual(expectedBuffer, actualBuffer)) {
    return false;
  }

  const issuedAtMs = Number(issuedAt);
  if (Number.isNaN(issuedAtMs)) {
    return false;
  }

  return Date.now() - issuedAtMs < SESSION_MAX_AGE_SECONDS * 1000;
}

export const ADMIN_SESSION_MAX_AGE = SESSION_MAX_AGE_SECONDS;

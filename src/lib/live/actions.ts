"use server";

import { cookies } from "next/headers";

const COOKIE_NAME = "live_auth";
const COOKIE_MAX_AGE = 60 * 60 * 8;

export async function verifyLivePassword(
  password: string,
): Promise<{ success: boolean; error?: string }> {
  const envPassword = process.env.LIVE_PASSWORD;
  if (!envPassword) {
    return { success: false, error: "Hasło nie zostało skonfigurowane w środowisku." };
  }
  if (password !== envPassword) {
    return { success: false, error: "Nieprawidłowe hasło." };
  }
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: COOKIE_MAX_AGE,
  });
  return { success: true };
}

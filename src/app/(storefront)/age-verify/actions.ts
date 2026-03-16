"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const AGE_COOKIE_NAME = "age_verified";
const AGE_COOKIE_MAX_AGE = 30 * 24 * 60 * 60; // 30 days

export async function verifyAge(returnTo?: string) {
  const cookieStore = await cookies();

  cookieStore.set(AGE_COOKIE_NAME, "true", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: AGE_COOKIE_MAX_AGE,
    path: "/",
  });

  redirect(returnTo || "/shop");
}

/** Exported for testing only — not a server action */
export async function getAgeGateConstants() {
  return { AGE_COOKIE_NAME, AGE_COOKIE_MAX_AGE };
}

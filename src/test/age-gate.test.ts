import { describe, it, expect, vi } from "vitest";

vi.mock("next/headers", () => ({
  cookies: vi.fn(() => ({
    set: vi.fn(),
    get: vi.fn(),
  })),
}));

vi.mock("next/navigation", () => ({
  redirect: vi.fn(),
}));

describe("Age Gate", () => {
  it("should define AGE_COOKIE_NAME as age_verified", async () => {
    const { getAgeGateConstants } = await import("@/app/(storefront)/age-verify/actions");
    const { AGE_COOKIE_NAME } = await getAgeGateConstants();
    expect(AGE_COOKIE_NAME).toBe("age_verified");
  });

  it("should define AGE_COOKIE_MAX_AGE as 30 days in seconds", async () => {
    const { getAgeGateConstants } = await import("@/app/(storefront)/age-verify/actions");
    const { AGE_COOKIE_MAX_AGE } = await getAgeGateConstants();
    expect(AGE_COOKIE_MAX_AGE).toBe(30 * 24 * 60 * 60);
  });
});

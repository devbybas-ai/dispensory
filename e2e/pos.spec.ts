import { test, expect } from "@playwright/test";

test.describe("POS", () => {
  test("page loads with products", async ({ page }) => {
    await page.goto("/pos");
    await expect(
      page.getByRole("heading", { name: /point of sale/i }),
    ).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

test.describe("Dashboard", () => {
  test("loads with metric cards", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    // Check for metric cards
    await expect(page.locator("[data-slot='card']").first()).toBeVisible();
  });

  test("sidebar navigation works", async ({ page }) => {
    await page.goto("/");
    // Navigate to POS
    await page.getByRole("link", { name: /point of sale|pos/i }).click();
    await expect(page).toHaveURL(/\/pos/);
    // Navigate to Inventory
    await page.getByRole("link", { name: /inventory/i }).click();
    await expect(page).toHaveURL(/\/inventory/);
  });
});

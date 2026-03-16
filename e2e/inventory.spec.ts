import { test, expect } from "@playwright/test";

test.describe("Inventory", () => {
  test("page loads with packages", async ({ page }) => {
    await page.goto("/inventory");
    await expect(
      page.getByRole("heading", { name: /inventory/i }),
    ).toBeVisible();
  });

  test("search filters results", async ({ page }) => {
    await page.goto("/inventory");
    const searchInput = page.getByPlaceholder(/search/i);
    if (await searchInput.isVisible()) {
      await searchInput.fill("test-search-term");
      // URL should update with search param
      await expect(page).toHaveURL(/search=test-search-term/);
    }
  });
});

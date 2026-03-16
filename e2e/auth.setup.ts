import { test as setup, expect } from "@playwright/test";

setup("authenticate as admin", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("admin@greenvalley.example");
  await page.getByLabel(/password/i).fill("Admin123!");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL("/");
  await page.context().storageState({ path: ".auth/admin.json" });
});

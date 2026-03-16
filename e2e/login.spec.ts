import { test, expect } from "@playwright/test";

test.describe("Login", () => {
  test.use({ storageState: { cookies: [], origins: [] } }); // No auth for login tests

  test("successful login redirects to dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("admin@greenvalley.example");
    await page.getByLabel(/password/i).fill("Admin123!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL("/");
  });

  test("invalid credentials show error", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill("wrong@example.com");
    await page.getByLabel(/password/i).fill("WrongPassword1!");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible();
  });
});

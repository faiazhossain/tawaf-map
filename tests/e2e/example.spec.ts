import { test, expect } from "@playwright/test";

test.describe("HomePage", () => {
  test("should load the home page", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/TawafMap/);
  });

  test("should display the heading", async ({ page }) => {
    await page.goto("/");
    const heading = page.getByText("TawafMap");
    await expect(heading).toBeVisible();
  });

  test("should display the description", async ({ page }) => {
    await page.goto("/");
    const description = page.getByText(/Navigate Makkah & Madinah/);
    await expect(description).toBeVisible();
  });
});

import { test, expect } from "@playwright/test";

test("ওমরাহ মানচিত্র ওভারলে ও ধাপ মার্কার রেন্ডার হয়", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.removeItem("umrah-guide-storage"));
  await page.goto("http://localhost:3000/map", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /ওমরাহ/ }).first().click();
  await page.getByRole("button", { name: "পুরুষ" }).click();
  await page.getByRole("button", { name: "পরবর্তী" }).click();
  await page.getByRole("button", { name: /ঢাকা -> জেদ্দা/ }).click();
  await page.getByRole("button", { name: "পরবর্তী" }).click();
  await page.getByRole("button", { name: "পরবর্তী" }).click();
  await page.getByRole("button", { name: /গাইড শুরু করুন/ }).click();
  await page.waitForTimeout(2000); // map overlay + markers to settle

  // ক্লায়েন্ট-সাইড ক্র্যাশ নেই
  const body = await page.locator("body").innerText();
  expect(body.includes("Application error")).toBe(false);

  // ধাপ মার্কার DOM এ আছে (অ্যাংকর সহ ধাপ: enter, tawaf, pray, sai = ৪টি)
  const stepMarkerCount = await page.locator(".map-marker-umrah-step").count();
  expect(stepMarkerCount).toBeGreaterThanOrEqual(4);

  await page.screenshot({ path: "test-results/umrah-map-overlay.png" });
});

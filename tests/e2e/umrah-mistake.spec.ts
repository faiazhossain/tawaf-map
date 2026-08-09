import { test, expect } from "@playwright/test";

test("ভুল সহায়ক ফ্লো কাজ করে", async ({ page }) => {
  await page.addInitScript(() => window.localStorage.removeItem("umrah-guide-storage"));
  await page.goto("http://localhost:3000/map", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: /ওমরাহ/ }).first().click();
  await page.getByRole("button", { name: "পুরুষ" }).click();
  await page.getByRole("button", { name: "পরবর্তী" }).click();
  await page.getByRole("button", { name: /ঢাকা -> জেদ্দা/ }).click();
  await page.getByRole("button", { name: "পরবর্তী" }).click();
  await page.getByRole("button", { name: "পরবর্তী" }).click();
  await page.getByRole("button", { name: /গাইড শুরু করুন/ }).click();
  await page.waitForTimeout(800);
  const panel = page.getByTestId("umrah-step-list-desktop");
  // ভুল সহায়ক খুলুন
  await panel.getByRole("button", { name: /ভুল করেছি/ }).click();
  await expect(page.getByText("আমি একটি ভুল করেছি")).toBeVisible();
  // ইহরাম শ্রেণি -> মিকাত পার হওয়া
  await page.getByRole("button", { name: /ইহরাম \/ মিকাত/ }).click();
  await expect(page.getByText("মিকাত পার হওয়ার সময় কি আপনি ইহরাম বাঁধেননি?")).toBeVisible();
  await page.getByRole("button", { name: "মিকাত পার হওয়ার সময় কি আপনি ইহরাম বাঁধেননি?" }).click();
  await page.getByRole("button", { name: /ওমরাহর নিয়ত নিয়েই ছিলাম/ }).click();
  await page.getByRole("button", { name: /না, ফিরে যাইনি/ }).click();
  // ফলাফলে বৈধতা ও কাফফারা দেখায়
  await expect(page.getByText("ওমরাহ বৈধ", { exact: true })).toBeVisible();
  await expect(page.getByText(/দম \(একটি পশু কুরবানি, হারামের ভেতরে\)/)).toBeVisible();
});

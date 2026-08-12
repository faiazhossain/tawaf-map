import { test, expect } from "@playwright/test";

/**
 * মিকাত সারসংক্ষেপ + বিমানে ইহরাম কার্ড - e2e স্মোক টেস্ট
 *
 * অনবোর্ডিং (বিমান পথ) -> প্রস্তুতি ধাপে ফ্লাইট ইহরাম কার্ড দৃশ্যমান ->
 * মিকাত সারসংক্ষেপ মানচিত্র খোলা -> মিকাত মার্কার ও সক্রিয় মিকাত (ইয়ালামলাম) যাচাই।
 */
test.describe("Umrah Miqat Overview", () => {
  test.beforeEach(async ({ page }) => {
    // প্রতিটি টেস্টে পরিষ্কার অবস্থা নিশ্চিত করতে সংরক্ষণ মুছুন
    await page.addInitScript(() => {
      window.localStorage.removeItem("umrah-guide-storage");
    });
  });

  test("বিমান পথে ফ্লাইট কার্ড ও মিকাত সারসংক্ষেপ মানচিত্র কাজ করে", async ({ page }) => {
    await page.goto("/map", { waitUntil: "networkidle" });

    // অনবোর্ডিং: পুরুষ, ঢাকা → জেদ্দা
    await page.getByRole("button", { name: /ওমরাহ/ }).first().click();
    await page.getByRole("button", { name: "পুরুষ" }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: /ঢাকা → জেদ্দা/ }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: /গাইড শুরু করুন/ }).click();

    const panel = page.getByTestId("umrah-step-list-desktop");
    await expect(panel.getByText("ধাপ ১ / ৯")).toBeVisible({ timeout: 5000 });

    // প্রস্তুতি ধাপে বিমানে ইহরাম কার্ড দৃশ্যমান (air পথে; অন্য পথে এটি রেন্ডার হয় না)
    await expect(panel.getByText(/বিমানে ইহরাম — ঢাকা/)).toBeVisible();
    await expect(panel.getByRole("button", { name: /তালবিয়া/ })).toBeVisible();
    // দম-সতর্কতা (জেদ্দা বিমানবন্দরে ইহরাম)
    await expect(panel.getByText(/দম \(একটি পশু কুরবানি\)/)).toBeVisible();

    // মিকাত সারসংক্ষেপ খুলুন (হেডারের মিকাত বোতাম)
    await panel.getByRole("button", { name: /^মিকাত$/ }).click();

    // ধাপ-তালিকা বন্ধ হয়ে মিকাত প্যানেল খোলে (পরস্পরবিরোধী)
    const miqatPanel = page.getByTestId("umrah-miqat-overview-desktop");
    await expect(miqatPanel.getByText("মিকাত সারসংক্ষেপ")).toBeVisible();
    // সক্রিয় মিকাত হাইলাইট হিসেবে চিহ্নিত (air পথে ইয়ালামলাম) - "আপনার মিকাত" ব্যাজ দৃশ্যমান
    await expect(miqatPanel.getByText("আপনার মিকাত")).toBeVisible();
    // সক্রিয় কলআউটে ইয়ালামলাম নাম দৃশ্যমান
    await expect(miqatPanel.getByText("ইয়ালামলাম (আস-সাদিয়্যাহ)").first()).toBeVisible();

    // মানচিত্রে মিকাত মার্কার রেন্ডার হয়েছে (৫ মূল মিকাত + তানাইম = ৬)
    await page.waitForTimeout(2000); // মানচিত্র + মার্কার স্থির হতে অপেক্ষা
    const markerCount = await page.locator(".map-marker-umrah-miqat").count();
    expect(markerCount).toBeGreaterThanOrEqual(6);

    // ক্লায়েন্ট-সাইড ক্র্যাশ নেই
    const body = await page.locator("body").innerText();
    expect(body.includes("Application error")).toBe(false);

    await page.screenshot({ path: "test-results/umrah-miqat-overview.png" });
  });
});

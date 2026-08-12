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

    // মিকাত সারসংক্ষেপ খুলুন (হেডারের মিকাত বোতাম; অ্যাক্সেসিবল নাম = aria-label)
    await panel.getByRole("button", { name: /মিকাত সারসংক্ষে/ }).click();

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

/**
 * মিকাত সীমানা রূপরেখার ভূমিকা অ্যানিমেশন - ihram ধাপে পৌঁছালে বাইরের মিকাত পয়েন্টগুলো
 * ঘিরে একটি রেখা ঘড়ির বিপরীত দিকে আঁকা হয়, তারপর ম্লান হয়ে যায়। MapLibre ক্যানভাসে
 * রেন্ডার হয়, তাই DOM-স্তরের অ্যাসার্ট নয় — আচরণগত: ক্র্যাশ নেই, অ্যানিমেশনের পরেও
 * পরবর্তী ধাপে এগিয়ে যাওয়া কাজ করে।
 */
test.describe("Umrah Miqat Boundary Intro", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("umrah-guide-storage");
    });
  });

  test("ihram ধাপে সীমানা ভূমিকা অ্যানিমেশন চলে ও ক্র্যাশ করে না", async ({ page }) => {
    await page.goto("/map");

    // অনবোর্ডিং: পুরুষ, ঢাকা→জেদ্দা, অ্যাক্সেসিবিলিটি স্কিপ, গাইড শুরু
    await page.getByRole("button", { name: /ওমরাহ/ }).first().click();
    await page.getByRole("button", { name: "পুরুষ" }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: /ঢাকা → জেদ্দা/ }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: /গাইড শুরু করুন/ }).click();

    const panel = page.getByTestId("umrah-step-list-desktop");
    const nextBtn = panel.getByRole("button", { name: "পরবর্তী ধাপ" });
    await expect(nextBtn).toBeVisible({ timeout: 5000 });

    // প্রস্তুতি ধাপ সম্পন্ন চিহ্নিত করে ইহরাম (মীকাত) ধাপে যান
    await nextBtn.click();
    await page.getByRole("button", { name: "সম্পন্ন করেছি" }).click();
    await expect(
      panel.getByRole("tab", { name: /মীকাতে ইহরামে প্রবেশ করুন/, selected: true })
    ).toBeVisible();

    // ভূমিকা অ্যানিমেশন চলাকালীন স্ক্রিনশট (রিং আঁকা দৃশ্যমান হওয়া উচিত)
    await page.waitForTimeout(1500);
    await page.screenshot({ path: "test-results/umrah-miqat-intro-tracing.png" });

    // অ্যানিমেশন (ট্রেস ~২.৮সে + ফেড ~০.৬সে) শেষ হতে অপেক্ষা
    await page.waitForTimeout(3000);

    // ক্লায়েন্ট-সাইড ক্র্যাশ নেই
    const body = await page.locator("body").innerText();
    expect(body.includes("Application error")).toBe(false);

    // অ্যানিমেশনের পরেও পরবর্তী ধাপে এগিয়ে যাওয়া কাজ করে (UI প্রতিক্রিয়াশীল)
    await nextBtn.click();
    await expect(page.getByText("ধাপটি এখনো সম্পন্ন হয়নি")).toBeVisible();
  });

  test("reduced-motion-এ স্থির রূপরেখা দেখায় ও ক্র্যাশ করে না", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/map");

    await page.getByRole("button", { name: /ওমরাহ/ }).first().click();
    await page.getByRole("button", { name: "পুরুষ" }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: /ঢাকা → জেদ্দা/ }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: /গাইড শুরু করুন/ }).click();

    const panel = page.getByTestId("umrah-step-list-desktop");
    const nextBtn = panel.getByRole("button", { name: "পরবর্তী ধাপ" });
    await expect(nextBtn).toBeVisible({ timeout: 5000 });

    await nextBtn.click();
    await page.getByRole("button", { name: "সম্পন্ন করেছি" }).click();
    await expect(
      panel.getByRole("tab", { name: /মীকাতে ইহরামে প্রবেশ করুন/, selected: true })
    ).toBeVisible();

    // reduced-motion: কোনো rAF ট্রেস ছাড়াই স্থির রূপরেখা, ধরে রাখা, তারপর পরিষ্কার।
    await page.waitForTimeout(2000);
    const body = await page.locator("body").innerText();
    expect(body.includes("Application error")).toBe(false);
    await page.screenshot({ path: "test-results/umrah-miqat-intro-reduced.png" });
  });
});

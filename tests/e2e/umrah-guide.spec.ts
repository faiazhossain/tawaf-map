import { test, expect } from "@playwright/test";

/**
 * ওমরাহ গাইড ফ্লো - e2e স্মোক টেস্ট
 * অনবোর্ডিং উইজার্ড -> ধাপ-তালিকা -> তওয়াফ কাউন্টার পর্যন্ত যাচাই।
 */
test.describe("Umrah Guide", () => {
  test.beforeEach(async ({ page }) => {
    // প্রতিটি টেস্টে পরিষ্কার অবস্থা নিশ্চিত করতে সংরক্ষণ মুছুন
    await page.addInitScript(() => {
      window.localStorage.removeItem("umrah-guide-storage");
    });
  });

  test("অনবোর্ডিং থেকে ধাপ-তালিকা পর্যন্ত প্রবাহ (পুরুষ, বিমানে)", async ({ page }) => {
    await page.goto("/map");

    // হেডারে ওমরাহ গাইড বোতাম খুঁজে ক্লিক (ডেস্কটপে লেখা দৃশ্যমান)
    const umrahBtn = page.getByRole("button", { name: /ওমরাহ/ }).first();
    await umrahBtn.click();

    // উইজার্ড খোলে
    await expect(page.getByText("আপনি কোন লিঙ্গের?")).toBeVisible();

    // পুরুষ নির্বাচন
    await page.getByRole("button", { name: "পুরুষ" }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();

    // যাত্রাপথ - ঢাকা -> জেদ্দা
    await expect(page.getByText("আপনি কীভাবে আসছেন?")).toBeVisible();
    await page.getByRole("button", { name: /ঢাকা -> জেদ্দা/ }).click();
    await expect(page.getByText(/ইয়ালামলাম/)).toBeVisible();
    await page.getByRole("button", { name: "পরবর্তী" }).click();

    // প্রবেশযোগ্যতা (ঐচ্ছিক) - এড়িয়ে যান
    await page.getByRole("button", { name: "পরবর্তী" }).click();

    // মাযহাব - গাইড শুরু
    await expect(page.getByText("মাযহাব (ঐচ্ছিক)")).toBeVisible();
    await page.getByRole("button", { name: /গাইড শুরু করুন/ }).click();

    // ধাপ-তালিকা প্যানেল খোলে (ডেস্কটপ ভাসমান প্যানেলে স্কোপ করা)
    const panel = page.getByTestId("umrah-step-list-desktop");
    await expect(panel.getByText("আপনার ওমরাহ যাত্রা")).toBeVisible({ timeout: 5000 });

    // তওয়াফ ধাপে যান ও কাউন্টার যাচাই
    await panel.getByText("তওয়াফ (৭ চক্কর)").click();
    await expect(panel.getByText("কী করবেন")).toBeVisible();
    // কাউন্টার বাড়ান (প্লাস বোতাম)
    const plusBtn = panel.getByRole("button", { name: "বাড়ান" });
    for (let i = 0; i < 7; i++) {
      await plusBtn.click();
    }
    // ৭ হলে স্বয়ংক্রিয় সম্পন্ন - অগ্রগতি বাড়া ১ ধাপ (তওয়াফ সম্পন্ন)
    await expect(panel.getByText("1 / 9 ধাপ সম্পন্ন")).toBeVisible();
  });

  test("নারী প্রোফাইলে মাহরাম/সঙ্গ ধাপ আসে", async ({ page }) => {
    await page.goto("/map");
    await page.getByRole("button", { name: /ওমরাহ/ }).first().click();

    await page.getByRole("button", { name: "নারী" }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: /ঢাকা -> জেদ্দা/ }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();

    // নারী হলে সঙ্গ ধাপ
    await expect(page.getByText("আপনি কার সাথে ভ্রমণ করছেন?")).toBeVisible();
    await expect(page.getByText(/মাহরাম বিষয়ে আলেমদের মতভেদ/)).toBeVisible();
  });
});

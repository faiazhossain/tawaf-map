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
    await expect(page.getByText("আপনি কি পুরুষ, নাকি নারী?")).toBeVisible();

    // পুরুষ নির্বাচন
    await page.getByRole("button", { name: "পুরুষ" }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();

    // যাত্রাপথ - ঢাকা → জেদ্দা
    await expect(page.getByText("আপনি কোথা থেকে মক্কায় আসছেন?")).toBeVisible();
    await page.getByRole("button", { name: /ঢাকা → জেদ্দা/ }).click();
    await expect(page.getByText(/ইয়ালামলাম/)).toBeVisible();
    await page.getByRole("button", { name: "পরবর্তী" }).click();

    // প্রবেশযোগ্যতা (ঐচ্ছিক) - এড়িয়ে যান
    await page.getByRole("button", { name: "পরবর্তী" }).click();

    // মাযহাব - গাইড শুরু
    await expect(page.getByText("মাযহাব (ঐচ্ছিক)")).toBeVisible();
    await page.getByRole("button", { name: /গাইড শুরু করুন/ }).click();

    // গাইড প্যানেল খোলে - পেজিনেশন ধাপ ১ দৃশ্যমান (ডেস্কটপ ভাসমান প্যানেলে স্কোপ করা)
    const panel = page.getByTestId("umrah-step-list-desktop");
    await expect(panel.getByText("ধাপ ১ / ৯")).toBeVisible({ timeout: 5000 });

    // পেজিনেশনে তওয়াফ চিহ্নে ট্যাপ করে সেই ধাপে যান ও কাউন্টার যাচাই
    await panel.getByRole("tab", { name: /তওয়াফ/ }).click();
    await expect(panel.getByText("কী করবেন")).toBeVisible();
    // কাউন্টার max (৭) পর্যন্ত বাড়ান। তওয়াফ min=১, max=৭ — তাই ৬ বার ক্লিকে
    // ১ → ৭ হয় এবং ধাপটি স্বয়ংক্রিয়ভাবে সম্পন্ন চিহ্নিত হয় (৭ম ক্লিকের দরকার নেই)।
    const plusBtn = panel.getByRole("button", { name: "বাড়ান" });
    for (let i = 0; i < 6; i++) {
      await plusBtn.click();
    }
    // ৭ হলে স্বয়ংক্রিয় সম্পন্ন - অগ্রগতি বাড়া ১ ধাপ (তওয়াফ সম্পন্ন)
    await expect(panel.getByText("১ / ৯ ধাপ সম্পন্ন")).toBeVisible();
  });

  test("নারী প্রোফাইলে মাহরাম/সঙ্গ ধাপ আসে", async ({ page }) => {
    await page.goto("/map");
    await page.getByRole("button", { name: /ওমরাহ/ }).first().click();

    await page.getByRole("button", { name: "নারী" }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: /ঢাকা → জেদ্দা/ }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();

    // নারী হলে সঙ্গ ধাপ
    await expect(page.getByText("আপনি কার সাথে ভ্রমণ করছেন?")).toBeVisible();
    await expect(page.getByText(/মাহরাম বিষয়ে আলেমদের মতভেদ/)).toBeVisible();
  });

  test("অসম্পন্ন ধাপে 'পরবর্তী ধাপ' চাপলে সতর্ক মডাল বাধা দেয়", async ({ page }) => {
    await page.goto("/map");
    await page.getByRole("button", { name: /ওমরাহ/ }).first().click();

    // অনবোর্ডিং: পুরুষ, ঢাকা→জেদ্দা, অ্যাক্সেসিবিলিটি স্কিপ, গাইড শুরু
    await page.getByRole("button", { name: "পুরুষ" }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: /ঢাকা → জেদ্দা/ }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: /গাইড শুরু করুন/ }).click();

    const panel = page.getByTestId("umrah-step-list-desktop");
    const nextBtn = panel.getByRole("button", { name: "পরবর্তী ধাপ" });
    await expect(nextBtn).toBeVisible({ timeout: 5000 });

    // প্রস্তুতি ধাপ অসম্পন্ন — 'পরবর্তী ধাপ' চাপলে সতর্ক মডাল আসে
    await nextBtn.click();
    await expect(page.getByText("ধাপটি এখনো সম্পন্ন হয়নি")).toBeVisible();
    await expect(page.getByText(/গুরুত্বপূর্ণ: নিচের বোতামে/)).toBeVisible();
    await expect(page.getByRole("button", { name: "সম্পন্ন করেছি" })).toBeVisible();

    // 'এখনো বাকি' — মডাল বন্ধ, এখনো প্রথম ধাপে
    await page.getByRole("button", { name: "এখনো বাকি" }).click();
    await expect(page.getByText("ধাপটি এখনো সম্পন্ন হয়নি")).toBeHidden();

    // এবার নিশ্চিত করে সম্পন্ন চিহ্নিত → পরবর্তী ধাপে (মীকাতে ইহরাম) যায়।
    // মীকাতে ইহরাম ধাপটি এখন 'বর্তমান' (পেজিনেশনে নির্বাচিত) — অগ্রগতি সত্যি হলো।
    await nextBtn.click();
    await page.getByRole("button", { name: "সম্পন্ন করেছি" }).click();
    await expect(
      panel.getByRole("tab", { name: /মীকাতে ইহরামে প্রবেশ করুন/, selected: true })
    ).toBeVisible();
  });
});

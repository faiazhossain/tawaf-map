import { test, expect, type Page } from "@playwright/test";

/**
 * ওমরাহ গাইড ফ্লো - e2e স্মোক টেস্ট
 * অনবোর্ডিং উইজার্ড -> ধাপ-তালিকা -> তওয়াফ কাউন্টার পর্যন্ত যাচাই।
 */
test.describe("Umrah Guide", () => {
  test.beforeEach(async ({ page }) => {
    // এই ডেস্ক্রাইবের টেস্টগুলো umrah-step-list-desktop (ভাসমান প্যানেল) ধরে
    // চলে - মোবাইল প্রজেক্টে প্যানেল রেন্ডারই হয় না (শীট দেখায়), তাই স্কিপ।
    test.skip(test.info().project.name === "Mobile Chrome", "ডেস্কটপ প্যানেল প্রয়োজন");
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

/** মোবাইল অনবোর্ডিং: পুরুষ, ঢাকা→জেদ্দা, অ্যাক্সেসিবিলিটি স্কিপ, গাইড শুরু। */
async function startMobileGuide(page: Page) {
  await page.goto("/map");
  await page.getByRole("button", { name: /ওমরাহ/ }).first().click();
  await page.getByRole("button", { name: "পুরুষ" }).click();
  await page.getByRole("button", { name: "পরবর্তী" }).click();
  await page.getByRole("button", { name: /ঢাকা → জেদ্দা/ }).click();
  await page.getByRole("button", { name: "পরবর্তী" }).click();
  await page.getByRole("button", { name: "পরবর্তী" }).click();
  await page.getByRole("button", { name: /গাইড শুরু করুন/ }).click();
}

/** গাইড শীটটি অন্য ডায়ালগ থেকে আলাদা করে চেনায় - মোবাইল শীট aria-modal="true",
 *  ডেস্কটপ প্যানেল aria-modal="false" (DOM-এ থাকে কিন্তু লুকানো)। ধাপ-গণনা টেক্সট
 *  দিয়ে ফিল্টার; \d শুধু ASCII মেলায়, বাংলা সংখ্যার (১-৯) জন্য [০-৯] দরকার। */
function guideSheetLocator(page: Page) {
  return page.locator('[role="dialog"][aria-modal="true"]').filter({ hasText: /ধাপ [০-৯] \/ ৯/ });
}

async function sheetHeight(page: Page): Promise<number> {
  const box = await guideSheetLocator(page).boundingBox();
  return box?.height ?? 0;
}

/**
 * মোবাইল শীট কোরিওগ্রাফি - বিস্তারিত (০.৯২) থেকে ধাপ এগোলে শীট normal (০.৪২)
 * স্ন্যাপে নেমে আসে, যাতে ক্যামেরার flyTo ও হিরো নির্দেশ একই সময়ে দৃশ্যমান থাকে।
 */
test.describe("Umrah Guide sheet choreography (mobile)", () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("umrah-guide-storage");
    });
  });

  test("বিস্তারিত থেকে ধাপ এগোলে শীট normal স্ন্যাপে ফিরে আসে", async ({ page }) => {
    await startMobileGuide(page);
    const guideSheet = guideSheetLocator(page);
    await expect(guideSheet).toBeVisible({ timeout: 8000 });

    // বিস্তারিতে প্রসারণ - উচ্চতা ~০.৯২ × ভিউপোর্ট
    await page.getByRole("button", { name: "বিস্তারিত" }).click();
    await expect.poll(() => sheetHeight(page), { timeout: 2000 }).toBeGreaterThan(0.9 * 844 - 30);
    // বিস্তারিত ফুটারে এখন সরাসরি পরবর্তী বোতাম
    const nextBtn = guideSheet.getByRole("button", { name: "পরবর্তী ধাপ" });
    await expect(nextBtn).toBeVisible();

    // অসম্পন্ন ধাপ - মডাল বাধা দেয়, নিশ্চিত করে এগোনো হয়
    await nextBtn.click();
    await page.getByRole("button", { name: "সম্পন্ন করেছি" }).click();

    // কোরিওগ্রাফি: শীট ~০.৪২ × ভিউপোর্টে নেমে আসে (সেটল ≤৪০০ms + মডাল বন্ধ)
    await expect.poll(() => sheetHeight(page), { timeout: 2000 }).toBeLessThan(0.42 * 844 + 40);
    await expect.poll(() => sheetHeight(page), { timeout: 2000 }).toBeGreaterThan(0.42 * 844 - 40);
    // কম্প্যাক্ট ভিউতে ফিরেছে
    await expect(page.getByRole("button", { name: "বিস্তারিত" })).toBeVisible();
  });

  test("তওয়াফ ধাপে ল্যান্ডমার্ক ইঙ্গিত শীটের ওপরে থাকে", async ({ page }) => {
    // হাজরে আসওয়াদের ঠিক কাছে অবস্থান - proximity ইঙ্গিত নিশ্চিতভাবে দেখায়
    await page.context().grantPermissions(["geolocation"]);
    await page.context().setGeolocation({ latitude: 21.4224, longitude: 39.8266 });

    await startMobileGuide(page);
    const guideSheet = guideSheetLocator(page);
    await expect(guideSheet).toBeVisible({ timeout: 8000 });

    // পেজিনেশন থেকে তওয়াফ ধাপে যান - ধাপ বদলের কোরিওগ্রাফি শীটকে normal-এ রাখে
    await guideSheet.getByRole("tab", { name: /তওয়াফ/ }).click();
    await expect.poll(() => sheetHeight(page), { timeout: 2000 }).toBeLessThan(0.42 * 844 + 40);

    // তওয়াফ ইঙ্গিত দৃশ্যমান (RitualRoundHud-ও role=status, তাই টেক্সটে আলাদা করা)
    // - শীটের ওপরের ধার ছাড়িয়ে যায় না
    const hint = page.locator('[role="status"]').filter({ hasText: /কালো পাথর/ });
    await expect(hint).toBeVisible({ timeout: 8000 });
    const hintBox = await hint.boundingBox();
    const sheetBox = await guideSheet.boundingBox();
    expect(hintBox).not.toBeNull();
    expect(sheetBox).not.toBeNull();
    if (hintBox && sheetBox) {
      expect(hintBox.y + hintBox.height).toBeLessThanOrEqual(sheetBox.y + 24);
    }
  });
});

/**
 * ৬৪০-৭৬৭px ট্যাবলেট ব্যান্ড - এই প্রস্থে শীট থাকে (শীট/প্যানেল বিভাজন md:768),
 * তাই কোরিওগ্রাফি ও শীট-সচেতন অবস্থান এখানেও প্রযোজ্য হতে হবে।
 */
test.describe("Umrah Guide sheet choreography (tablet band)", () => {
  test.use({ viewport: { width: 700, height: 800 } });

  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.removeItem("umrah-guide-storage");
    });
  });

  test("ধাপ এগোলে শীট normal স্ন্যাপে থাকে", async ({ page }) => {
    await startMobileGuide(page);
    const guideSheet = guideSheetLocator(page);
    await expect(guideSheet).toBeVisible({ timeout: 8000 });

    await guideSheet.getByRole("tab", { name: /তওয়াফ/ }).click();
    await expect.poll(() => sheetHeight(page), { timeout: 2000 }).toBeGreaterThan(0.42 * 800 - 40);
    await expect.poll(() => sheetHeight(page), { timeout: 2000 }).toBeLessThan(0.42 * 800 + 40);
  });
});

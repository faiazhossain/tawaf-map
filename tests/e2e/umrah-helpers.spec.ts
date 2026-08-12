import { test, expect } from "@playwright/test";

/**
 * U6 সহায়ক - e2e: দলের যোগাযোগ, হুইলচেয়ার টিপস ও প্রস্থান-রিমাইন্ডার রেন্ডার যাচাই।
 */
test.describe("Umrah U6 helpers", () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => window.localStorage.removeItem("umrah-guide-storage"));
  });

  test("দলের যোগাযোগ কার্ড ও প্রস্থান-রিমাইন্ডার দেখায়", async ({ page }) => {
    await page.goto("/map", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /ওমরাহ/ }).first().click();
    await page.getByRole("button", { name: "পুরুষ" }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: /ঢাকা → জেদ্দা/ }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: /গাইড শুরু করুন/ }).click();

    const panel = page.getByTestId("umrah-step-list-desktop");
    await expect(panel.getByText("ধাপ ১ / ৯")).toBeVisible({ timeout: 5000 });

    // প্রস্তুতি ধাপে lost-group helper এর যোগ-করার প্রম্পট দৃশ্যমান
    await expect(panel.getByText(/দলনেতার ফোন ও মিলনস্থল সংরক্ষণ করুন/)).toBeVisible();

    // সমাপ্ত ধাপে গিয়ে প্রস্থান-রিমাইন্ডার দৃশ্যমান
    await panel.getByRole("tab", { name: /ওমরাহ সম্পন্ন/ }).click();
    await expect(panel.getByText("মক্কা ত্যাগের আগে মনে রাখুন")).toBeVisible();
  });

  test("হুইলচেয়ার প্রোফাইলে তওয়াফ ধাপে হুইলচেয়ার টিপস দেখায়", async ({ page }) => {
    await page.goto("/map", { waitUntil: "networkidle" });
    await page.getByRole("button", { name: /ওমরাহ/ }).first().click();
    await page.getByRole("button", { name: "পুরুষ" }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: /ঢাকা → জেদ্দা/ }).click();
    await page.getByRole("button", { name: "পরবর্তী" }).click();

    // প্রবেশযোগ্যতা ধাপে হুইলচেয়ার চেকবক্স চালু
    await page.getByRole("checkbox").first().check();
    await page.getByRole("button", { name: "পরবর্তী" }).click();
    await page.getByRole("button", { name: /গাইড শুরু করুন/ }).click();

    const panel = page.getByTestId("umrah-step-list-desktop");
    await expect(panel.getByText("ধাপ ১ / ৯")).toBeVisible({ timeout: 5000 });

    // তওয়াফ ধাপে গিয়ে হুইলচেয়ার সহায়তা কার্ড দৃশ্যমান
    await panel.getByRole("tab", { name: /তওয়াফ/ }).click();
    await expect(panel.getByText("হুইলচেয়ার সহায়তা")).toBeVisible();
  });
});

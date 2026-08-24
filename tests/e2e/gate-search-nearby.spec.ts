import { test, expect } from "@playwright/test";

/**
 * "গেট খুঁজুন" সার্চ এখন নিকট-প্রবাহের অংশ: গেট বিভাগ সক্রিয় করে একই
 * ডিটেইল শিট খোলে (আলাদা GateInfoPanel নেই)। শিট খোলা থাকায় নিচের চিপ-বার
 * লুকানো থাকে (নির্বাচন-নিয়ম); শিট বন্ধ করলে ফিরে আসে এবং বিভাগ-চিপ চাপা
 * থাকে — নির্বাচন মাত্র পরিষ্কার হয়।
 */
test("gate search activates the nearby gate category and opens the shared detail sheet", async ({
  page,
}) => {
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({ latitude: 21.4225, longitude: 39.8262, accuracy: 10 });
  await page.addInitScript(() => {
    window.localStorage.removeItem("umrah-guide-storage");
    window.localStorage.removeItem("tawaf:nearby-settings");
  });
  await page.goto("/map", { waitUntil: "networkidle" });

  // গেট সার্চ খুলে একটি গেট বাছাই
  await page.getByRole("button", { name: "গেট খুঁজুন" }).click();
  const dialog = page.getByRole("dialog", { name: "গেট তালিকা" });
  await expect(dialog).toBeVisible();
  await dialog.getByRole("button").first().click();

  // একই ডিটেইল শিট — লাইভ দূরত্বসহ
  await expect(page.getByTestId("nearby-detail-distance")).toBeVisible({ timeout: 20000 });

  // উপরের নেভবার বোতাম চাপা (শিট খোলা থাকায় চিপ-বার এখন লুকানো)
  await expect(page.getByTestId("nearby-category-button-gate")).toHaveAttribute(
    "aria-pressed",
    "true"
  );

  // নিকট-মার্কার পরিবার থেকেই গেট-মার্কার বসে (সার্চ-নির্বাচিতটিসহ)
  await expect(
    page
      .locator(
        ".map-marker-gate.map-marker-nearby-compact, .map-marker-gate.map-marker-nearby-pulse-strong, .map-marker-gate.map-marker-nearby-pulse-soft"
      )
      .first()
  ).toBeVisible({ timeout: 20000 });

  // শিট বন্ধ করলে নির্বাচন যায়, চিপ-বার ফেরে, বিভাগ থাকে
  await page.getByTestId("nearby-detail-close").click();
  await expect(page.getByTestId("nearby-detail-distance")).toHaveCount(0);
  await expect(page.getByTestId("nearby-chip-gate")).toHaveAttribute("aria-pressed", "true");
});

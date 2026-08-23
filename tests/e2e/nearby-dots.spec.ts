import { test, expect } from "@playwright/test";

/**
 * "আমার কাছে" বিন্দু-মার্কার e2e: ঘন গেট-গুচ্ছেও hover নির্ভুল —
 * যে বিন্দুতে মাউস, সেই বিন্দুই সম্প্রসারিত (হিট-ব্যাসার্ধ 8px পর্যন্ত
 * বিচ্যুতি), ক্যামেরা স্থির, এবং খালি জায়গায় সরে গেলে কিছুই খোলা থাকে না।
 */
test("nearby dot hover expands the hovered dot in place without moving the camera", async ({
  page,
}) => {
  await page.context().grantPermissions(["geolocation"]);
  await page.context().setGeolocation({
    latitude: 21.4225,
    longitude: 39.8262,
    accuracy: 10,
  });
  await page.addInitScript(() => window.localStorage.removeItem("umrah-guide-storage"));
  await page.goto("/map", { waitUntil: "networkidle" });

  // লোকেশন ফিক্স → গণনা বসা → চিপ সক্রিয় হওয়া পর্যন্ত অপেক্ষা
  const gateChip = page.getByTestId("nearby-chip-gate");
  await expect(gateChip).toBeEnabled({ timeout: 20000 });
  await gateChip.click();
  await page.waitForTimeout(2500); // fly-to-bounds + markers settle

  const dots = page.locator(".map-marker-nearby-dot");
  const dotCount = await dots.count();
  expect(dotCount).toBeGreaterThan(0);

  // ক্যামেরা-স্থিরতার রেফারেন্স: একটি kept মার্কারের বাউন্ডিং বক্স
  const kept = page.locator(".map-marker-nearby-compact, .map-marker-nearby-pulse-strong").first();
  const keptBefore = await kept.boundingBox();
  expect(keptBefore).not.toBeNull();

  // প্রথম ৮টি বিন্দুতে পরপর hover — kept মার্কারের দৃশ্যমান বৃত্তে ঢাকা
  // বিন্দু বাদ (সেখানে মার্কারই জয়ী — সঠিক)। বাকিদের জন্য: ১টিই
  // সম্প্রসারিত, তার কেন্দ্র মাউসের ৯px-এর (হিট-ব্যাসার্ধ ৮px + মার্জিন)
  // মধ্যে, আর সরে গেলে collapse।
  const expanded = page.locator(".map-marker-nearby-dot-expanded");
  let hovered = 0;
  const sample = Math.min(8, dotCount);
  for (let i = 0; i < sample && hovered < 4; i += 1) {
    const handle = await dots.nth(i).elementHandle();
    const box = await handle!.boundingBox();
    const cx = box!.x + box!.width / 2;
    const cy = box!.y + box!.height / 2;

    // বিন্দুর কেন্দ্রে হিট-টেস্ট করা যাচ্ছে বিন্দুর ভেতরেই কি না
    const hitIsDot = await page.evaluate(
      ([x, y]) => {
        const el = document.elementFromPoint(x, y);
        return Boolean(el?.closest(".map-marker-nearby-dot"));
      },
      [cx, cy]
    );
    if (!hitIsDot) continue; // kept মার্কারের বৃত্তে ঢাকা — স্কিপ
    hovered += 1;

    await page.mouse.move(cx, cy);
    await page.waitForTimeout(250);
    await expect(expanded).toHaveCount(1);

    const expandedBox = await expanded.first().boundingBox();
    const drift = Math.hypot(
      expandedBox!.x + expandedBox!.width / 2 - cx,
      expandedBox!.y + expandedBox!.height / 2 - cy
    );
    expect(drift).toBeLessThan(9);

    await page.mouse.move(10, 300); // বিন্দু-নিরপেক্ষ জায়গায় বেরিয়ে যাওয়া
    await page.waitForTimeout(150);
    await expect(expanded).toHaveCount(0);
  }
  expect(hovered).toBeGreaterThan(0);

  // hover-চক্র শেষে ক্যামেরা নড়েনি — kept মার্কার একই জায়গায়
  const keptAfter = await kept.boundingBox();
  const cameraDrift = Math.hypot(
    keptBefore!.x + keptBefore!.width / 2 - (keptAfter!.x + keptAfter!.width / 2),
    keptBefore!.y + keptBefore!.height / 2 - (keptAfter!.y + keptAfter!.height / 2)
  );
  expect(cameraDrift).toBeLessThan(2);

  // kept মার্কারে ক্লিক — ডিটেইল শিট খোলে (makeAccessible-এর ক্লিক ওয়্যারিং)
  const keptBox = keptAfter!;
  await page.mouse.move(keptBox.x + keptBox.width / 2, keptBox.y + keptBox.height / 2);
  await page.mouse.down();
  await page.mouse.up();
  await page.waitForTimeout(1200);
  const sheetNames = await page.evaluate(() =>
    Array.from(document.querySelectorAll("h3")).map((h) => h.textContent)
  );
  expect(sheetNames.length).toBeGreaterThan(0);
});

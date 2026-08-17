// একবার ব্যবহারযোগ্য ভিজ্যুয়াল যাচাই: মোবাইলে শুধু ওমরাহ + মোড + হ্যামবার্গার
// দৃশ্যমান, বাকি সব মেনুর ভেতরে; ডেস্কটপে পুরো টুলবার — DOM-লেভেল অ্যাসার্শন।
import { chromium } from "@playwright/test";

const BASE = "http://localhost:3000";
const browser = await chromium.launch();

async function visible(page, label) {
  const el = page.getByRole("button", { name: label }).first();
  return (await el.count()) > 0 && (await el.isVisible());
}

function fail(message) {
  console.error(`FAIL: ${message}`);
  process.exitCode = 1;
}

// --- মোবাইল (390px) ---
const mobile = await browser.newPage({ viewport: { width: 390, height: 844 } });
await mobile.goto(`${BASE}/map`, { waitUntil: "domcontentloaded" });
await mobile.waitForSelector("header", { timeout: 30000 });
await mobile.waitForTimeout(1500);

const themeVisible =
  (await visible(mobile, "আলো মোডে যান")) || (await visible(mobile, "অন্ধকার মোডে যান"));
console.log(`mobile theme toggle: visible=${themeVisible} (want true)`);
if (!themeVisible) fail("mobile theme toggle not visible");

for (const [label, want] of [
  ["মেনু খুলুন", true], // হ্যামবার্গার
  ["ওমরাহ", true], // ওমরাহ বোতাম
  ["Hotels", false],
  ["Gates", false],
  ["গেট খুঁজুন", false],
]) {
  const got = await visible(mobile, label);
  console.log(`mobile ${label}: visible=${got} (want ${want})`);
  if (got !== want) fail(`mobile "${label}" visible=${got}, want ${want}`);
}

// হ্যামবার্গার খুলুন — বাকি আইটেম তখন দৃশ্যমান
await mobile.getByRole("button", { name: "মেনু খুলুন" }).click();
await mobile.waitForTimeout(500);
for (const [label, want] of [
  ["Hotels", true],
  ["Hist", true],
  ["Terr", true],
  ["3D", true],
  ["Gates", true],
  ["গেট খুঁজুন", true],
]) {
  const got = await visible(mobile, label);
  console.log(`mobile-open ${label}: visible=${got} (want ${want})`);
  if (got !== want) fail(`menu open "${label}" visible=${got}, want ${want}`);
}

// লোগো বামে আছে কি না
const logo = mobile.locator("header a[href='/']");
const box = await logo.boundingBox();
console.log(`logo x=${Math.round(box.x)} (want near left edge 16)`);
if (box.x > 40) fail("logo is not on the left");

await mobile.close();

// --- ডেস্কটপ (1280px) ---
const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
await desktop.goto(`${BASE}/map`, { waitUntil: "domcontentloaded" });
await desktop.waitForSelector("header", { timeout: 30000 });
await desktop.waitForTimeout(1500);

for (const [label, want] of [
  ["Hotels", true],
  ["Gates", true],
  ["গেট খুঁজুন", true],
  ["ওমরাহ", true],
]) {
  const got = await visible(desktop, label);
  console.log(`desktop ${label}: visible=${got} (want ${want})`);
  if (got !== want) fail(`desktop "${label}" visible=${got}, want ${want}`);
}
const hamburgerDesktop = await desktop.getByRole("button", { name: "মেনু খুলুন" }).count();
if (hamburgerDesktop > 0) fail("hamburger should not exist on desktop");
console.log(`desktop hamburger count=${hamburgerDesktop} (want 0)`);

await desktop.close();
await browser.close();
console.log(process.exitCode ? "RESULT: FAIL" : "RESULT: PASS");

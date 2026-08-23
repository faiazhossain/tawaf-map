/**
 * `/api/directions`-এর ভাগাভাগি-করা ফেচ — প্রাথমিক রুট আর নেভিগেশনের
 * রিয়ারাউট একই রিকোয়েস্ট/পার্স/এরর পথ ব্যবহার করে। `useMapRouting`
 * থেকে বের করা হয়েছে যাতে হুকের বাইরে থেকেও (useNavigation) ডাকা যায়।
 */

import { buildApproach, buildApproximateRoute } from "@/lib/routing/approach";
import type { Route, RouteStep } from "@/types/navigation";

/**
 * হেঁটে চলার রুট আনে। সফল হলে `id`-সহ Route রিজলভ করে; ইঞ্জিন সত্যিই
 * পথ না পেলে (422 NoRoute) আনুমানিক ডটেড রুট রিজলভ করে; বাকি ব্যর্থতায়
 * বাংলা বার্তাসহ Error রিজেক্ট করে (কলারের দায়িত্ব ধরে নেওয়া)।
 */
export async function fetchWalkingRoute(
  origin: [number, number],
  destination: [number, number]
): Promise<Route> {
  let response: Response;
  try {
    response = await fetch("/api/directions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin, destination }),
    });
  } catch {
    // fetch নিজে ব্যর্থ হলে (অফলাইন/DNS) ব্রাউজারের ইংরেজি বার্তা উঠে
    // আসে — ব্যবহারকারীর ভাষায় রূপান্তর করে নিই।
    throw new Error("নেটওয়ার্ক সমস্যা — রুট বের করা যায়নি।");
  }

  const data = (await response.json().catch(() => null)) as {
    route?: Omit<Route, "id" | "steps"> & { steps?: RouteStep[] };
    error?: string;
    code?: string;
  } | null;

  if (!response.ok || !data?.route) {
    // ইঞ্জিন সত্যিই হাঁটার পথ পায়নি — পুরো ট্রিপের আনুমানিক রুট। নেটওয়ার্ক/
    // আপস্ট্রিম ব্যর্থতা (502) এখানে পড়ে না — সেগুলোতে রিট্রাই-ই সঠিক,
    // সম্ভাব্য বাজে সরলরেখা দেখানো নয়।
    if (data?.code === "NoRoute") {
      return buildApproximateRoute(origin, destination);
    }
    throw new Error(data?.error ?? "রুট বের করা যায়নি — আবার চেষ্টা করুন।");
  }

  return {
    id: `route-${Date.now()}`,
    geometry: data.route.geometry,
    distance: data.route.distance,
    duration: data.route.duration,
    steps: data.route.steps ?? [],
    // রাস্তার শেষ বিন্দু গন্তব্যের আগে শেষ হলে বাঁকা সংযোগকারী — প্রাথমিক
    // রুট ও রিয়ারাউট দুটোতেই এই একই ফাঁক দিয়ে হিসাব হয়।
    approach: buildApproach(data.route.geometry, destination),
  };
}

/**
 * OSRM-ধাঁচের নির্দেশনা → বাংলা নির্দেশনা
 *
 * Barikoi v2 রুট API OSRM ফরম্যাটে ধাপ দেয়: প্রতিটি step-এ maneuver
 * (type + modifier) থাকে এবং অনেক ক্ষেত্রে ইংরেজি `instruction` টেক্সটও।
 * অ্যাপ বাংলা-প্রথম, তাই type+modifier থেকে স্থানীয় বাংলা বাক্য বানানো
 * হয়; রাস্তার নাম (লাতিন/আরবি) বাক্যের ভেতরেই থাকে।
 *
 * অজানা ধরনে ধাপ কখনো ফাঁকা যায় না — আপস্ট্রিমের instruction, না থাকলে
 * সাধারণ বাক্যে ফলব্যাক।
 */
import type { RouteStep } from "@/types/navigation";
import { toBengaliNumber } from "@/lib/utils/bengali-number";

/** Barikoi/OSRM রেসপন্সের একটি step (আমাদের দরকারিগুলো)। */
export interface OsrmStep {
  distance?: number;
  /** সেকেন্ডে */
  duration?: number;
  name?: string;
  exit?: number;
  maneuver?: {
    type?: string;
    modifier?: string;
    instruction?: string;
  };
}

/** modifier অনুযায়ী মোড়ের বাংলা বাক্য; না মিললে null। */
const TURN_PHRASES: Record<string, string> = {
  left: "বাঁয়ে মোড় নিন",
  right: "ডানে মোড় নিন",
  "sharp left": "তীক্ষ্ণভাবে বাঁয়ে মোড় নিন",
  "sharp right": "তীক্ষ্ণভাবে ডানে মোড় নিন",
  "slight left": "সামান্য বাঁয়ে মোড় নিন",
  "slight right": "সামান্য ডানে মোড় নিন",
  straight: "সোজা চলুন",
  uturn: "উ-টার্ন নিন",
};

/** "ডানে"/"বাঁয়ে"-জাতীয় দিক শনাক্ত করে fork/merge-এর জন্য। */
function sideWord(modifier?: string): string | null {
  if (!modifier) return null;
  if (modifier.includes("left")) return "বাঁ";
  if (modifier.includes("right")) return "ডান";
  return null;
}

/** রাস্তার নাম "X ধরে" প্রস্তুত করে; নাম না থাকলে ফাঁকা স্ট্রিং। */
function via(name?: string): string {
  return name ? `${name} ধরে ` : "";
}

/** একটি OSRM step-কে বাংলা RouteStep-এ রূপান্তর করে। */
export function osrmStepToRouteStep(step: OsrmStep): RouteStep {
  const street = typeof step.name === "string" ? step.name : "";
  const distance = typeof step.distance === "number" ? step.distance : 0;
  const duration = typeof step.duration === "number" ? step.duration : 0;
  const type = step.maneuver?.type ?? "";
  const modifier = step.maneuver?.modifier ?? "";

  const turnPhrase = TURN_PHRASES[modifier];
  let instruction: string | null = null;
  let maneuver = type || "continue";

  switch (type) {
    case "depart":
      instruction = street ? `${street} ধরে হাঁটা শুরু করুন` : "হাঁটা শুরু করুন";
      maneuver = "depart";
      break;
    case "arrive":
      instruction = street ? `${street}-এ গন্তব্যে পৌঁছেছেন` : "গন্তব্যে পৌঁছেছেন";
      maneuver = "arrive";
      break;
    case "turn":
    case "continue":
    case "new name":
    case "end of road":
      if (turnPhrase) instruction = `${via(street)}${turnPhrase}`;
      maneuver = modifier ? `${type === "continue" ? "continue" : "turn"} ${modifier}` : type;
      break;
    case "roundabout":
    case "rotary":
    case "roundabout turn": {
      const exit =
        typeof step.exit === "number" && step.exit > 0
          ? `${toBengaliNumber(step.exit)} নম্বর এক্সিট নিন`
          : "বের হয়ে যান";
      instruction = `গোল চত্বর (রাউন্ডঅ্যাবাউট) ঘুরে ${exit}`;
      maneuver = "roundabout";
      break;
    }
    case "merge": {
      const side = sideWord(modifier);
      instruction = street
        ? `${street}-এ মিশে যান`
        : `মূল পথে${side ? ` ${side} দিক থেকে` : ""} মিশে যান`;
      maneuver = "merge";
      break;
    }
    case "fork": {
      const side = sideWord(modifier);
      instruction = `সামনে রাস্তা দুই ভাগে ভাগ হয়েছে — ${side ? `${side} দিকটি` : "সামনের পথ"} ধরুন`;
      maneuver = "fork";
      break;
    }
    default:
      break;
  }

  // বাকি ধরন (notification, on/off ramp ইত্যাদি হাঁটার পথে বিরল) বা অজানা
  // modifier — আপস্ট্রিমের ইংরেজি instruction-এ ফলব্যাক
  if (!instruction) {
    instruction = step.maneuver?.instruction?.trim() || `${via(street)}এগিয়ে চলুন`;
  }

  return { instruction, distance, duration, maneuver };
}

/** সব leg-এর সব step এক তালিকায় বাংলা করে। */
export function osrmLegsToSteps(legs: Array<{ steps?: OsrmStep[] }>): RouteStep[] {
  return (legs ?? []).flatMap((leg) => (leg.steps ?? []).map(osrmStepToRouteStep));
}

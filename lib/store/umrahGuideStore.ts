import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { UmrahProfile, UmrahStep, TravelPath } from "@/types/umrah";
import { getStepById } from "@/lib/data/umrah/steps";
import { resolveMiqatForTravelPath } from "@/lib/data/umrah/miqat";
import { resolveSteps, isCounterComplete, isStepComplete } from "@/lib/data/umrah/sequence";

/** গাইডের বর্তমান মোড */
export type UmrahGuideMode = "guide" | "mistake-assistant" | "miqat-overview";

interface UmrahGuideState {
  // প্রোফাইল ও সমাধানকৃত অনুক্রম
  profile: UmrahProfile | null;
  onboarded: boolean;
  stepIds: string[];
  currentIndex: number;
  completed: Record<string, boolean>;
  counters: Record<string, number>;
  mode: UmrahGuideMode;

  // প্রোফাইল/গাইড নিয়ন্ত্রণ
  setProfile: (profile: UmrahProfile) => void;
  startGuide: () => void;
  reset: () => void;

  // ধাপ নেভিগেশন
  nextStep: () => void;
  prevStep: () => void;
  goToStep: (index: number) => void;
  goToStepId: (id: string) => void;

  // সম্পন্নকরণ ও কাউন্টার
  markComplete: (stepId: string) => void;
  markIncomplete: (stepId: string) => void;
  incrementCounter: (stepId: string) => void;
  decrementCounter: (stepId: string) => void;
  setCounter: (stepId: string, value: number) => void;

  // মোড
  setMode: (mode: UmrahGuideMode) => void;
  openMistakeAssistant: () => void;
}

/** প্রোফাইল থেকে ধাপের id অনুক্রম সমাধান (ডিফল্ট প্রোফাইলের জন্য খালি) */
function deriveStepIds(profile: UmrahProfile | null): string[] {
  if (!profile) return [];
  return resolveSteps(profile).map((s) => s.id);
}

/** একটি ধাপের কাউন্টারের প্রারম্ভিক মান (min বা 0) */
function initialCounterValue(step: UmrahStep | undefined): number {
  return step?.counter?.min ?? 0;
}

export const useUmrahGuideStore = create<UmrahGuideState>()(
  persist(
    (set, get) => ({
      profile: null,
      onboarded: false,
      stepIds: [],
      currentIndex: 0,
      completed: {},
      counters: {},
      mode: "guide",

      setProfile: (profile) =>
        set({
          profile,
          onboarded: true,
          stepIds: deriveStepIds(profile),
          currentIndex: 0,
          completed: {},
          counters: {},
          mode: "guide",
        }),

      startGuide: () => {
        const { profile } = get();
        if (!profile) return;
        set({
          mode: "guide",
          stepIds: deriveStepIds(profile),
          currentIndex: 0,
        });
      },

      reset: () =>
        set({
          profile: null,
          onboarded: false,
          stepIds: [],
          currentIndex: 0,
          completed: {},
          counters: {},
          mode: "guide",
        }),

      nextStep: () =>
        set((state) => ({
          currentIndex: Math.min(state.currentIndex + 1, Math.max(state.stepIds.length - 1, 0)),
        })),

      prevStep: () =>
        set((state) => ({
          currentIndex: Math.max(state.currentIndex - 1, 0),
        })),

      goToStep: (index) =>
        set((state) => ({
          currentIndex: Math.max(0, Math.min(index, Math.max(state.stepIds.length - 1, 0))),
        })),

      goToStepId: (id) =>
        set((state) => {
          const index = state.stepIds.indexOf(id);
          if (index === -1) return {};
          return { currentIndex: index };
        }),

      markComplete: (stepId) =>
        set((state) => ({
          completed: { ...state.completed, [stepId]: true },
        })),

      markIncomplete: (stepId) =>
        set((state) => {
          const completed = { ...state.completed };
          delete completed[stepId];
          return { completed };
        }),

      incrementCounter: (stepId) =>
        set((state) => {
          const step = getStepById(stepId);
          if (!step?.counter) return {};
          const current = state.counters[stepId] ?? initialCounterValue(step);
          const next = Math.min(current + 1, step.counter.max);
          const counters = { ...state.counters, [stepId]: next };
          const completed = { ...state.completed };

          // স্বয়ংক্রিয় অগ্রগতি: কাউন্টার max হলে ধাপ সম্পন্ন চিহ্নিত
          if (isCounterComplete(step, next)) {
            completed[stepId] = true;
          }
          return { counters, completed };
        }),

      decrementCounter: (stepId) =>
        set((state) => {
          const step = getStepById(stepId);
          if (!step?.counter) return {};
          const current = state.counters[stepId] ?? initialCounterValue(step);
          const next = Math.max(current - 1, step.counter.min);
          const counters = { ...state.counters, [stepId]: next };
          const completed = { ...state.completed };

          // max থেকে নিচে নামলে সম্পন্ন চিহ্ন তুলে দিন
          if (completed[stepId] && !isCounterComplete(step, next)) {
            delete completed[stepId];
          }
          return { counters, completed };
        }),

      setCounter: (stepId, value) =>
        set((state) => {
          const step = getStepById(stepId);
          if (!step?.counter) return {};
          const clamped = Math.max(step.counter.min, Math.min(value, step.counter.max));
          const counters = { ...state.counters, [stepId]: clamped };
          const completed = { ...state.completed };
          if (isCounterComplete(step, clamped)) {
            completed[stepId] = true;
          } else if (completed[stepId]) {
            delete completed[stepId];
          }
          return { counters, completed };
        }),

      setMode: (mode) => set({ mode }),

      openMistakeAssistant: () => set({ mode: "mistake-assistant" }),
    }),
    {
      name: "umrah-guide-storage",
      // শুধু সিরিয়ালাইজযোগ্য ডেটা সংরক্ষণ; ফাংশন বাদ
      partialize: (state) => ({
        profile: state.profile,
        onboarded: state.onboarded,
        currentIndex: state.currentIndex,
        completed: state.completed,
        counters: state.counters,
        mode: state.mode,
      }),
      // রিহাইড্রেটেশনে ধাপের অনুক্রম প্রোফাইল থেকে পুনঃনির্ধারণ (ডেটা পরিবর্তনে সুরক্ষিত)
      onRehydrateStorage: () => (state) => {
        if (state && state.profile) {
          state.stepIds = deriveStepIds(state.profile);
        }
      },
    }
  )
);

// ----- সিলেক্টর হেল্পার (pure) -----

/** বর্তমান ধাপের অবজেক্ট (বা null) */
export function selectCurrentStep(state: UmrahGuideState): UmrahStep | null {
  const id = state.stepIds[state.currentIndex];
  return id ? (getStepById(id) ?? null) : null;
}

/** সমাধানকৃত সম্পূর্ণ ধাপের অবজেক্ট তালিকা */
export function selectSteps(state: UmrahGuideState): UmrahStep[] {
  return state.stepIds.map((id) => getStepById(id)).filter((s): s is UmrahStep => s !== undefined);
}

/** একটি ধাপের বর্তমান কাউন্টার মান */
export function selectCounter(state: UmrahGuideState, stepId: string): number {
  const step = getStepById(stepId);
  if (!step?.counter) return 0;
  return state.counters[stepId] ?? step.counter.min;
}

/** একটি ধাপ সম্পন্ন কিনা */
export function selectIsComplete(state: UmrahGuideState, stepId: string): boolean {
  const step = getStepById(stepId);
  if (!step) return false;
  const counterValue = selectCounter(state, stepId);
  return isStepComplete(step, counterValue, !!state.completed[stepId]);
}

/** যাত্রাপথ অনুযায়ী মিকাত id (প্রোফাইল তৈরির সুবিধার্থে); নির্দিষ্ট মিকাত না থাকলে undefined */
export function miqatIdForTravelPath(travelPath: TravelPath): string | undefined {
  return resolveMiqatForTravelPath(travelPath).miqatId ?? undefined;
}

/** ডিফল্ট সমাধানকৃত ধাপ সংখ্যা (স্টোর ছাড়া পরীক্ষার সুবিধার্থে রপ্তানি) */
export { resolveSteps };

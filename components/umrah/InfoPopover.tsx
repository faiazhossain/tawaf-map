"use client";

import { useCallback, useEffect, useId, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

interface InfoPopoverProps {
  /** বোতামের দৃশ্যমান লেখা — পপওভার কী ব্যাখ্যা করে তা বলে। */
  label: string;
  /** পপওভারের ভেতরের বিষয়বস্তু। */
  children: ReactNode;
  className?: string;
}

const POPOVER_WIDTH = 320;
const CLOSE_DELAY_MS = 120;
const POPOVER_GAP = 8;
const VIEWPORT_PAD = 12;

/**
 * ছোট টেক্সট-চিপ বোতাম যা হোভার/ফোকাস বা ক্লিকে একটি portaled পপওভার দেখায়।
 *
 * পপওভারটি document.body-তে portal করা হয়, ফলে overflow-clip হওয়া কন্টেইনার
 * (স্ক্রল এরিয়া, বটম শীট) থেকেও নির্বিঘ্নে দেখা যায়; অ্যাঙ্কর বোতামের সাপেক্ষে
 * fixed অবস্থানে থাকে। মাউস (hover), কীবোর্ড (focus) ও টাচ (tap) উভয়ের জন্য কাজ করে।
 *
 * ইন্টারঅ্যাকশন মডেল (hover-card):
 *   - হোভার বা কীবোর্ড ফোকাসে পূর্বরূপ (preview) খোলে।
 *   - ক্লিক/ট্যাপ "পিন" টগল করে — পিন করা থাকলে মাউস সরালেও খোলা থাকে (পড়া/স্ক্রল)।
 *   - বাইরে ক্লিক বা Escape সব বন্ধ করে।
 * suppressFocusOpen ফ্ল্যাগ mousedown-এ সেট হয়, যাতে ক্লিকের ঠিক আগের focus
 * ইভেন্ট পূর্বরূপ না খুলে ক্লিককে টগল করতে দেয়।
 */
export function InfoPopover({ label, children, className }: InfoPopoverProps) {
  const [hovered, setHovered] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(null);
  const open = hovered || pinned;

  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressFocusOpen = useRef(false);
  const tipId = useId();

  // Portal শুধুমাত্র ক্লায়েন্টে (SSR-এ document নেই)।
  useEffect(() => {
    setMounted(true);
  }, []);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const openPreview = useCallback(() => {
    cancelClose();
    setHovered(true);
  }, [cancelClose]);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setHovered(false), CLOSE_DELAY_MS);
  }, [cancelClose]);

  // খোলা অবস্থায় পপওভারের অবস্থান নির্ধারণ + স্ক্রল/রিসাইজে আপডেট।
  useEffect(() => {
    if (!open) return;
    const place = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;
      const maxWidth = Math.min(POPOVER_WIDTH, window.innerWidth - 2 * VIEWPORT_PAD);
      const approxHeight = 280;

      // সাধারণত নিচে; জায়গা না থাকলে উপরে।
      let top = rect.bottom + POPOVER_GAP;
      if (top + approxHeight > window.innerHeight - VIEWPORT_PAD) {
        top = Math.max(VIEWPORT_PAD, rect.top - POPOVER_GAP - approxHeight);
      }

      // বোতামের সাথে সারিবদ্ধ; ডানে overflow হলে বামে সরায়।
      let left = rect.left;
      if (left + maxWidth > window.innerWidth - VIEWPORT_PAD) {
        left = window.innerWidth - VIEWPORT_PAD - maxWidth;
      }
      left = Math.max(VIEWPORT_PAD, left);

      setCoords({ top, left });
    };

    place();
    window.addEventListener("resize", place);
    window.addEventListener("scroll", place, true);
    return () => {
      window.removeEventListener("resize", place);
      window.removeEventListener("scroll", place, true);
    };
  }, [open]);

  // বাইরে ক্লিক ও Escape-এ সম্পূর্ণ বন্ধ।
  useEffect(() => {
    if (!open) return;
    const closeAll = () => {
      setHovered(false);
      setPinned(false);
    };
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (popoverRef.current?.contains(target)) return;
      if (buttonRef.current?.contains(target)) return;
      closeAll();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeAll();
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // আনমাউন্টে টাইমার পরিষ্কার।
  useEffect(() => () => cancelClose(), [cancelClose]);

  const width =
    typeof window !== "undefined"
      ? Math.min(POPOVER_WIDTH, window.innerWidth - 2 * VIEWPORT_PAD)
      : POPOVER_WIDTH;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={tipId}
        onMouseDown={() => {
          suppressFocusOpen.current = true;
        }}
        onMouseEnter={openPreview}
        onMouseLeave={scheduleClose}
        onFocus={() => {
          if (!suppressFocusOpen.current) openPreview();
        }}
        onBlur={() => {
          suppressFocusOpen.current = false;
          scheduleClose();
        }}
        onClick={() => {
          suppressFocusOpen.current = false;
          setPinned((prev) => !prev);
        }}
        className={cn(
          "inline-flex shrink-0 items-center rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 align-middle text-[11px] font-semibold text-primary transition-colors hover:bg-primary/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40",
          className
        )}
      >
        {label}
      </button>
      {mounted && open && coords
        ? createPortal(
            <div
              ref={popoverRef}
              id={tipId}
              role="dialog"
              aria-label={label}
              onMouseEnter={openPreview}
              onMouseLeave={scheduleClose}
              style={{ position: "fixed", top: coords.top, left: coords.left, width }}
              className="z-[200] max-h-[60vh] overflow-y-auto rounded-xl border border-border/60 bg-surface/95 p-3 shadow-2xl backdrop-blur-xl"
            >
              {children}
            </div>,
            document.body
          )
        : null}
    </>
  );
}

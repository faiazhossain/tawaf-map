"use client";

import { useEffect, type RefObject } from "react";

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

/**
 * Focus trap + restore for modal-like containers (BottomSheet, Onboarding,
 * MistakeAssistant).
 *
 * Behavior:
 *   - On `active=true`: remember the currently focused element, move focus into
 *     the container (first focusable or the container itself), and constrain
 *     Tab/Shift-Tab to focusables within the container.
 *   - On `active=false` (or unmount): restore focus to the saved element.
 *
 * The caller still owns Escape handling and body scroll lock — this hook only
 * manages focus. (The BottomSheet already implements Escape + scroll lock.)
 *
 * Audit reference: "No focus trap anywhere. Nothing moves focus into a
 * sheet/panel/dialog on open, constrains Tab, or restores focus on close."
 */
export function useFocusTrap<T extends HTMLElement>(containerRef: RefObject<T>, active: boolean) {
  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused = document.activeElement as HTMLElement | null;

    // Move focus into the container.
    const focusables = () =>
      Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
        (el) => el.offsetParent !== null || el === document.activeElement
      );

    const initialFocusables = focusables();
    if (initialFocusables.length > 0) {
      initialFocusables[0]?.focus();
    } else {
      container.tabIndex = -1;
      container.focus();
    }

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const items = focusables();
      if (items.length === 0) {
        e.preventDefault();
        return;
      }
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    container.addEventListener("keydown", handleKeydown);

    return () => {
      container.removeEventListener("keydown", handleKeydown);
      // Restore focus on close (microtask defer to avoid race with re-mount).
      window.setTimeout(() => {
        if (previouslyFocused && typeof previouslyFocused.focus === "function") {
          previouslyFocused.focus();
        }
      }, 0);
    };
  }, [containerRef, active]);
}

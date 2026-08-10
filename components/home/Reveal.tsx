"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Lightweight scroll-reveal wrapper. Adds `.is-visible` to `.tawaf-reveal` when
 * the element enters the viewport (once). No JS transitions — the CSS in
 * globals.css owns the actual animation, and respects reduced-motion there.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  as: Tag = "div",
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  as?: React.ElementType;
}) {
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Reduced-motion: show immediately, skip observer overhead.
    // (optional chaining guards jsdom/SSR where matchMedia may be undefined.)
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      el.classList.add("is-visible");
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            el.classList.add("is-visible");
            io.disconnect();
          }
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={cn("tawaf-reveal", className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </Tag>
  );
}

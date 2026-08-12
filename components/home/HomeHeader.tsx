"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { Menu, X, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { BetaBadge } from "@/components/ui/beta-badge";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "#how", label: "তওয়াফ যেভাবে হয়" },
  { href: "#rounds", label: "সাত চক্কর" },
  { href: "#map", label: "ম্যাপ" },
  { href: "#landmarks", label: "চিহ্নিত স্থান" },
];

export function HomeHeader() {
  const [scrolled, setScrolled] = React.useState(false);
  const [open, setOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-300",
        scrolled
          ? "border-b border-border bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70"
          : "border-b border-transparent bg-transparent"
      )}
    >
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5" aria-label="TawafMap home">
          <Image src="/icons/Tawafmap.webp" alt="" width={32} height={32} className="rounded-lg" />
          <span className="text-base font-semibold tracking-tight text-foreground">
            Tawaf<span className="text-primary">Map</span>
          </span>
          <BetaBadge className="-translate-y-1.5 self-start" />
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {NAV.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle className="hidden sm:inline-flex" />
          <Link href="/map" className="hidden sm:block">
            <Button size="sm" className="gap-1.5 rounded-full px-4">
              তওয়াফ শুরু করুন
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-foreground hover:bg-accent lg:hidden"
            aria-label={open ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
            aria-expanded={open}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile sheet */}
      {open && (
        <div className="border-t border-border bg-background lg:hidden">
          <div className="space-y-1 px-4 py-3">
            {NAV.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="block rounded-md px-3 py-3 text-base font-medium text-foreground hover:bg-accent"
              >
                {item.label}
              </a>
            ))}
            <Link href="/map" onClick={() => setOpen(false)} className="block pt-2">
              <Button className="w-full gap-1.5 rounded-full">
                তওয়াফ শুরু করুন
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
            <div className="pt-2">
              <ThemeToggle />
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

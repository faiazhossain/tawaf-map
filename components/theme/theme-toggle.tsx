"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/theme/theme-provider";
import { cn } from "@/lib/utils";

/**
 * Compact light/dark toggle. Icon button on small screens, icon + label on >=sm.
 * Matches the map header's control button sizing.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "আলো থিমে যান" : "গাঢ় থিমে যান"}
      title={isDark ? "আলো থিম" : "গাঢ় থিম"}
      className={cn(
        "inline-flex h-10 w-10 sm:h-auto sm:w-auto sm:min-w-[4.5rem] sm:px-4 items-center justify-center gap-1.5 rounded-xl",
        "border border-border bg-surface/80 text-muted-foreground",
        "hover:bg-muted hover:text-foreground transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        className
      )}
    >
      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      <span className="hidden sm:inline whitespace-nowrap text-sm font-medium">
        {isDark ? "আলো" : "গাঢ়"}
      </span>
    </button>
  );
}

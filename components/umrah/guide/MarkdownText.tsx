"use client";

import { Fragment, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Render a tiny, dependency-free markdown subset used in Umrah guide content:
 *   - lines beginning with "* " become bullet list items
 *   - **bold** segments render as <strong>
 *   - other lines render as paragraphs
 *
 * Extend cautiously; this is intentionally minimal, not a full parser.
 */

/** Split a single text segment on **bold** markers, preserving order. */
function renderInline(text: string, keyPrefix: string): ReactNode[] {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) => {
    // Odd indices are the captured bold content (regex capture group).
    if (i % 2 === 1) {
      return (
        <strong key={`${keyPrefix}-${i}`} className="font-semibold text-foreground">
          {part}
        </strong>
      );
    }
    return <Fragment key={`${keyPrefix}-${i}`}>{part}</Fragment>;
  });
}

export function MarkdownText({ content, className }: { content: string; className?: string }) {
  const lines = content.split("\n").filter((line) => line.trim().length > 0);
  const bulletLines = lines.filter((line) => /^\*\s+/.test(line));
  const isAllBullets = bulletLines.length > 0 && bulletLines.length === lines.length;

  if (isAllBullets) {
    return (
      <ul className={cn("list-disc space-y-1.5 pl-4 marker:text-primary", className)}>
        {lines.map((line, i) => (
          <li key={i} className="text-[13px] leading-relaxed text-foreground">
            {renderInline(line.replace(/^\*\s+/, ""), `li-${i}`)}
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className={cn("space-y-1.5", className)}>
      {lines.map((line, i) => (
        <p key={i} className="text-[13px] leading-relaxed text-foreground">
          {renderInline(line.replace(/^\*\s+/, ""), `p-${i}`)}
        </p>
      ))}
    </div>
  );
}

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * TawafMapPreview — the visual heart of the homepage.
 *
 * A schematic, map-like SVG of Tawaf around the Kaaba: seven counter-clockwise
 * arcs, the Black Stone start, the Yemeni Corner, Maqam Ibrahim, direction
 * chevrons, and a slow pilgrim dot circulating the ring. Built from the same
 * concepts (ellipse ring, 7 arcs, counter-clockwise travel) as the real
 * MapLibre overlay in lib/map/umrah-overlay.ts, but rendered as lightweight SVG
 * so the hero stays fast on mid-range phones — no WebGL on the landing page.
 *
 * Counter-clockwise convention: math angle θ, screen point (cx + r·cosθ, cy − r·sinθ).
 * Increasing θ traces the ring counter-clockwise on screen (Kaaba on the
 * pilgrim's left), matching the real Tawaf direction.
 */

const SIZE = 420;
const CX = 210;
const CY = 210;
const R = 146; // ring centerline radius
const ROUNDS = 7;
const GAP = 0.06; // rad gap between arcs

/** Polar → screen (math convention, y flipped so CCW looks correct on screen). */
function polar(cx: number, cy: number, r: number, theta: number): [number, number] {
  return [cx + r * Math.cos(theta), cy - r * Math.sin(theta)];
}

/** SVG arc path between two math angles, drawn counter-clockwise on screen. */
function arcPath(cx: number, cy: number, r: number, a0: number, a1: number): string {
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  const large = a1 - a0 > Math.PI ? 1 : 0;
  // sweep-flag 0 = counter-clockwise in SVG user space = CCW on screen
  return `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 0 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
}

type ArcState = "future" | "active" | "completed";

const arcClass: Record<ArcState, string> = {
  future: "stroke-map-route-upcoming/55",
  active: "stroke-primary",
  completed: "stroke-primary/70",
};

const arcWidth: Record<ArcState, number> = {
  future: 10,
  active: 16,
  completed: 12,
};

/** Precomputed arc metadata. */
const ARCS = Array.from({ length: ROUNDS }, (_, i) => {
  const span = (2 * Math.PI) / ROUNDS;
  const a0 = i * span + GAP / 2;
  const a1 = (i + 1) * span - GAP / 2;
  const mid = (a0 + a1) / 2;
  return { i, a0, a1, mid, d: arcPath(CX, CY, R, a0, a1) };
});

/** Direction-chevron rotation (deg) so it points along CCW travel at angle θ. */
function chevronRotation(theta: number): number {
  const dx = -Math.sin(theta);
  const dy = -Math.cos(theta);
  return (Math.atan2(dy, dx) * 180) / Math.PI;
}

// Full circle path (CCW on screen) for the circulating pilgrim dot's offset-path.
const CIRCULATE_PATH = `M ${CX - R} ${CY} a ${R} ${R} 0 1 0 ${2 * R} 0 a ${R} ${R} 0 1 0 ${-2 * R} 0`;

// Landmark pins on/near the ring (math angles, schematic).
const LANDMARKS: Record<
  string,
  { theta: number; r: number; label: string; kind: "gold" | "neutral" }
> = {
  "black-stone": { theta: -0.32, r: R, label: "Black Stone", kind: "gold" },
  "rukn-yamani": { theta: 3.9, r: R, label: "Yemeni Corner", kind: "neutral" },
  "maqam-ibrahim": { theta: -0.02, r: R + 36, label: "Maqam Ibrahim", kind: "neutral" },
  kaaba: { theta: Math.PI / 2, r: 0, label: "Kaaba", kind: "gold" },
};

export function TawafMapPreview({
  activeRound = 1,
  highlightLandmark,
  interactive = false,
  staticPilgrim = false,
  className,
}: {
  activeRound?: number;
  highlightLandmark?: string | null;
  interactive?: boolean;
  staticPilgrim?: boolean;
  className?: string;
}) {
  const [hovered, setHovered] = React.useState<string | null>(null);
  const focus = highlightLandmark ?? hovered;
  const activeIdx = Math.max(0, Math.min(ROUNDS - 1, activeRound - 1));

  return (
    <div
      className={cn(
        "relative aspect-square w-full select-none",
        interactive && "cursor-pointer",
        className
      )}
    >
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="h-full w-full overflow-visible"
        role="img"
        aria-label="কাবার চারপাশে সাতটি প্রদক্ষিণ — বাম দিকে ঘুরে চলার নকশা"
      >
        {/* Outer faint ring — depth / mataf boundary */}
        <circle cx={CX} cy={CY} r={R + 26} fill="none" className="stroke-border" strokeWidth={1} />
        <circle
          cx={CX}
          cy={CY}
          r={R - 30}
          fill="none"
          className="stroke-border/60"
          strokeWidth={1}
        />

        {/* Seven Tawaf arcs */}
        <g strokeLinecap="round">
          {ARCS.map((arc) => {
            const state: ArcState =
              arc.i < activeIdx ? "completed" : arc.i === activeIdx ? "active" : "future";
            return (
              <g key={arc.i}>
                <path
                  d={arc.d}
                  fill="none"
                  className="stroke-background"
                  strokeWidth={arcWidth[state] + 6}
                />
                <path
                  d={arc.d}
                  fill="none"
                  className={arcClass[state]}
                  strokeWidth={arcWidth[state]}
                />
                {/* Active arc: a soft animated dash to imply forward motion */}
                {state === "active" && (
                  <path
                    d={arc.d}
                    fill="none"
                    className="tawaf-dash stroke-primary-foreground/70"
                    strokeWidth={2.5}
                  />
                )}
              </g>
            );
          })}
        </g>

        {/* Direction chevrons along each arc midpoint */}
        <g className="fill-primary" opacity={0.85}>
          {ARCS.map((arc) => {
            const [cxp, cyp] = polar(CX, CY, R, arc.mid);
            const rot = chevronRotation(arc.mid);
            const dim = focus && focus !== "kaaba" ? 0.35 : 1;
            return (
              <path
                key={`ch-${arc.i}`}
                d="M -5 -5 L 6 0 L -5 5 Z"
                transform={`translate(${cxp.toFixed(2)} ${cyp.toFixed(2)}) rotate(${rot.toFixed(1)})`}
                opacity={dim}
              />
            );
          })}
        </g>

        {/* Kaaba cube at center */}
        <g
          onPointerEnter={interactive ? () => setHovered("kaaba") : undefined}
          onPointerLeave={interactive ? () => setHovered(null) : undefined}
          className={interactive ? "cursor-pointer" : undefined}
        >
          {/* Soft ground shadow */}
          <ellipse cx={CX} cy={CY + 30} rx={42} ry={11} className="fill-foreground/10" />
          {/* Cube */}
          <g>
            <rect
              x={CX - 23}
              y={CY - 27}
              width={46}
              height={54}
              rx={3}
              className="fill-foreground"
            />
            {/* Kiswah gold band */}
            <rect x={CX - 23} y={CY - 12} width={46} height={3.5} className="fill-gold" />
            <rect
              x={CX - 23}
              y={CY - 27}
              width={46}
              height={54}
              rx={3}
              fill="none"
              className="stroke-gold/40"
              strokeWidth={1}
            />
            {(focus === "kaaba" || !focus) && (
              <circle cx={CX} cy={CY} r={40} className="tawaf-pulse-soft fill-gold/40" />
            )}
          </g>
        </g>

        {/* Landmark pins */}
        {Object.entries(LANDMARKS)
          .filter(([, l]) => l.r > 0)
          .map(([id, l]) => {
            const [px, py] = polar(CX, CY, l.r, l.theta);
            const isGold = l.kind === "gold";
            const isFocus = focus === id;
            const dim = focus && !isFocus ? 0.4 : 1;
            return (
              <g
                key={id}
                transform={`translate(${px.toFixed(2)} ${py.toFixed(2)})`}
                opacity={dim}
                onPointerEnter={interactive ? () => setHovered(id) : undefined}
                onPointerLeave={interactive ? () => setHovered(null) : undefined}
                className={interactive ? "cursor-pointer" : undefined}
              >
                {isFocus && (
                  <circle r={15} className={isGold ? "fill-gold/30" : "fill-map-landmark/30"} />
                )}
                <circle r={9} className="stroke-background" strokeWidth={3} fill="none" />
                <circle
                  r={6}
                  className={isGold ? "fill-gold" : "fill-map-landmark"}
                  stroke="hsl(var(--surface))"
                  strokeWidth={2}
                />
              </g>
            );
          })}

        {/* Circulating pilgrim dot (counter-clockwise). The <g> owns the
            offset-distance animation; the inner circle owns the scale pulse,
            so the two transforms never collide. */}
        {!staticPilgrim && (
          <g className="tawaf-circulate" style={{ offsetPath: `path('${CIRCULATE_PATH}')` }}>
            <circle r={10} className="tawaf-pulse-soft fill-gold/45" />
            <circle r={7} className="fill-gold stroke-background" strokeWidth={3} />
          </g>
        )}
        {staticPilgrim && (
          <g transform={`translate(${CX - R} ${CY})`}>
            <circle r={9} className="fill-gold/30" />
            <circle r={7} className="fill-gold stroke-background" strokeWidth={3} />
          </g>
        )}
      </svg>
    </div>
  );
}

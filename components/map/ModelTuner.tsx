"use client";

// DEV-ONLY live tuning widget for 3D models. Mutates the layer's shared
// transform object directly and triggers a map repaint on each change, so the
// model updates instantly without re-loading its GLB. Parameterized per model
// (buildInitial / formatConfig / title), so one widget tunes any GLB.
//
// Currently mounted in MapView.tsx for the Nabawi model (dev-only, gated by
// NODE_ENV) while it awaits its first alignment. The Masjid + clock tower
// render their baked defaults in lib/map/model-config.ts; the tower was
// aligned with this widget and its final values are baked in. Once the Nabawi
// values are baked too, remove the render block again.

import { useMemo, useState } from "react";
import type { ModelTransform } from "@/lib/map/three-model-layer";
import { buildInitialModelTransform } from "@/lib/map/model-config";

interface ModelTunerProps {
  /** Mutable transform shared with the layer. Mutated in place on each change. */
  transform: ModelTransform;
  /** Call after mutating to trigger a map repaint. */
  onRepaint: () => void;
  /** Notified with the full transform after each change/reset (persistence). */
  onChange?: (transform: ModelTransform) => void;
  /** Panel heading. */
  title?: string;
  /** "Reset" target — the model's baked defaults from model-config.ts. */
  buildInitial?: () => ModelTransform;
  /** "Copy config" output — emit the model's own constant names. */
  formatConfig?: (transform: ModelTransform) => string;
  className?: string;
}

const RAD_TO_DEG = 180 / Math.PI;

/** Keys whose values are plain numbers (excludes the `center` tuple). */
type NumberTransformKey = {
  [K in keyof ModelTransform]: ModelTransform[K] extends number ? K : never;
}[keyof ModelTransform];

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step, display, onChange }: SliderProps) {
  return (
    <label className="block">
      <div className="flex justify-between text-[11px] text-muted-foreground mb-1">
        <span>{label}</span>
        <span className="tabular-nums text-foreground">{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary cursor-pointer"
      />
    </label>
  );
}

/** Default "Copy config" output — the Masjid constants (kept for reference). */
function formatMasjidConfig(v: ModelTransform): string {
  return [
    `export const MODEL_ORIGIN: [number, number] = [${v.originLng.toFixed(7)}, ${v.originLat.toFixed(7)}];`,
    "",
    "export const MODEL_CONFIG = {",
    `  altitudeMeters: ${v.altitudeMeters},`,
    `  rotateX: ${v.rotateX.toFixed(4)},`,
    `  rotateY: ${v.rotateY.toFixed(4)},`,
    `  rotateZ: ${v.rotateZ.toFixed(4)},`,
    `  scaleMultiplier: ${v.scaleMultiplier.toFixed(4)},`,
    `  offsetEastMeters: ${v.offsetEastMeters},`,
    `  offsetNorthMeters: ${v.offsetNorthMeters},`,
    "} as const;",
  ].join("\n");
}

/** "Copy config" output for the Nabawi model — emits its own constant names. */
export function formatNabawiConfig(v: ModelTransform): string {
  return [
    `export const NABAWI_ORIGIN: [number, number] = [${v.originLng.toFixed(7)}, ${v.originLat.toFixed(7)}];`,
    "",
    "export const NABAWI_CONFIG = {",
    `  altitudeMeters: ${v.altitudeMeters},`,
    `  rotateX: ${v.rotateX.toFixed(4)},`,
    `  rotateY: ${v.rotateY.toFixed(4)},`,
    `  rotateZ: ${v.rotateZ.toFixed(4)},`,
    `  scaleMultiplier: ${v.scaleMultiplier.toFixed(4)},`,
    `  offsetEastMeters: ${v.offsetEastMeters},`,
    `  offsetNorthMeters: ${v.offsetNorthMeters},`,
    "} as const;",
  ].join("\n");
}

export function ModelTuner({
  transform,
  onRepaint,
  onChange,
  title = "3D Tuner",
  buildInitial = buildInitialModelTransform,
  formatConfig = formatMasjidConfig,
  className = "",
}: ModelTunerProps) {
  // Local mirror drives the controlled inputs; the live transform drives the map.
  const [v, setV] = useState<ModelTransform>({ ...transform });
  const [copied, setCopied] = useState(false);
  // The lng/lat slider window centers on THIS model's baked origin (the ranges
  // used to be hardcoded to Makkah, pinning every model there). Half-spans
  // preserve the original masjid window: ±0.0125° lng / ±0.015° lat
  // (~1.3km × ~1.7km).
  const initial = useMemo(() => buildInitial(), [buildInitial]);
  const lngRange = {
    min: Number((initial.originLng - 0.0125).toFixed(6)),
    max: Number((initial.originLng + 0.0125).toFixed(6)),
  };
  const latRange = {
    min: Number((initial.originLat - 0.015).toFixed(6)),
    max: Number((initial.originLat + 0.015).toFixed(6)),
  };

  function update(key: NumberTransformKey, value: number) {
    setV((prev) => ({ ...prev, [key]: value }) as ModelTransform);
    transform[key] = value;
    onRepaint();
    onChange?.({ ...transform });
  }

  function handleReset() {
    const fresh = buildInitial();
    Object.assign(transform, fresh);
    setV({ ...transform });
    onRepaint();
    onChange?.({ ...transform });
  }

  async function handleCopy() {
    const text = formatConfig(v);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard unavailable (e.g. non-secure context) — ignore.
    }
  }

  return (
    <div
      className={`absolute top-28 left-4 z-[45] w-72 max-h-[72vh] overflow-y-auto rounded-xl bg-surface/95 backdrop-blur-xl border border-border/50 shadow-xl p-3 text-foreground ${className}`}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {title}
          <span className="ml-1.5 rounded bg-amber-500/20 text-amber-600 px-1 py-0.5 text-[10px]">
            dev
          </span>
        </h3>
        <div className="flex gap-1.5">
          <button
            type="button"
            onClick={handleReset}
            className="text-[11px] px-2 py-1 rounded-md border border-border/60 hover:bg-muted text-muted-foreground"
          >
            Reset
          </button>
          <button
            type="button"
            onClick={handleCopy}
            className="text-[11px] px-2 py-1 rounded-md bg-primary text-primary-foreground hover:opacity-90"
          >
            {copied ? "Copied" : "Copy config"}
          </button>
        </div>
      </div>

      <div className="space-y-3">
        <fieldset className="space-y-2">
          <legend className="text-[11px] font-medium text-foreground/80 mb-1">
            Position (coordinates)
          </legend>
          <Slider
            label="Longitude"
            value={v.originLng}
            min={lngRange.min}
            max={lngRange.max}
            step={0.000001}
            display={v.originLng.toFixed(6)}
            onChange={(val) => update("originLng", val)}
          />
          <Slider
            label="Latitude"
            value={v.originLat}
            min={latRange.min}
            max={latRange.max}
            step={0.000001}
            display={v.originLat.toFixed(6)}
            onChange={(val) => update("originLat", val)}
          />
          <Slider
            label="Altitude (m)"
            value={v.altitudeMeters}
            min={-600}
            max={300}
            step={1}
            display={`${v.altitudeMeters} m`}
            onChange={(val) => update("altitudeMeters", val)}
          />
          <Slider
            label="Offset East (m)"
            value={v.offsetEastMeters}
            min={-400}
            max={400}
            step={1}
            display={`${v.offsetEastMeters} m`}
            onChange={(val) => update("offsetEastMeters", val)}
          />
          <Slider
            label="Offset North (m)"
            value={v.offsetNorthMeters}
            min={-400}
            max={400}
            step={1}
            display={`${v.offsetNorthMeters} m`}
            onChange={(val) => update("offsetNorthMeters", val)}
          />
        </fieldset>

        <fieldset className="space-y-2 pt-1 border-t border-border/40">
          <legend className="text-[11px] font-medium text-foreground/80 mb-1">Rotation</legend>
          <Slider
            label="Rotate X"
            value={v.rotateX}
            min={0}
            max={Math.PI}
            step={0.005}
            display={`${(v.rotateX * RAD_TO_DEG).toFixed(1)} deg`}
            onChange={(val) => update("rotateX", val)}
          />
          <Slider
            label="Rotate Y"
            value={v.rotateY}
            min={-Math.PI}
            max={Math.PI}
            step={0.005}
            display={`${(v.rotateY * RAD_TO_DEG).toFixed(1)} deg`}
            onChange={(val) => update("rotateY", val)}
          />
          <Slider
            label="Rotate Z (heading)"
            value={v.rotateZ}
            min={-Math.PI}
            max={Math.PI}
            step={0.005}
            display={`${(v.rotateZ * RAD_TO_DEG).toFixed(1)} deg`}
            onChange={(val) => update("rotateZ", val)}
          />
        </fieldset>

        <fieldset className="space-y-2 pt-1 border-t border-border/40">
          <legend className="text-[11px] font-medium text-foreground/80 mb-1">Scale</legend>
          <Slider
            label="Scale multiplier"
            value={v.scaleMultiplier}
            min={0.05}
            max={3}
            step={0.001}
            display={`${v.scaleMultiplier.toFixed(3)}x`}
            onChange={(val) => update("scaleMultiplier", val)}
          />
        </fieldset>
      </div>
    </div>
  );
}

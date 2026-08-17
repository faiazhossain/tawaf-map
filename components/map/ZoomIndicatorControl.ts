import type { IControl, Map as MapLibreMap } from "maplibre-gl";

/**
 * Zoom-level pill rendered as a native MapLibre control inside the
 * `maplibregl-ctrl-top-right` stack, directly below the NavigationControl and
 * FullscreenControl groups. Living in the control column (instead of an
 * absolutely-positioned overlay) means MapLibre owns the spacing and the
 * corner layout on any viewport — no hardcoded pixel offsets to keep in sync,
 * and no extra footprint on mobile beyond the existing control column.
 *
 * The label is informational only: it is aria-hidden and pointer-events-none
 * so it never steals a tap/drag from the map on touch devices.
 */
export class ZoomIndicatorControl implements IControl {
  private map: MapLibreMap | null = null;
  private container: HTMLDivElement | null = null;
  private label: HTMLSpanElement | null = null;
  // Only the integer part is displayed; tracked so per-frame zoom events that
  // don't change the rounded value skip the DOM write entirely.
  private renderedZoom: number | null = null;
  private readonly handleZoom = () => this.render();

  onAdd(map: MapLibreMap): HTMLElement {
    const container = document.createElement("div");
    // `maplibregl-ctrl` places the element in the corner column flow with the
    // standard control gap; `maplibregl-ctrl-group` adopts the exact chrome of
    // the sibling controls (white bg, 4px radius, 2px ring shadow, and the
    // forced-colors variant) straight from MapLibre's own stylesheet, so the
    // pill can never drift from the NavigationControl above it. Row sizing
    // (29px, like the group buttons) and centering come from utilities;
    // tabular-nums keeps the pill width stable as the value ticks (9z -> 10z).
    container.className =
      "maplibregl-ctrl maplibregl-ctrl-group pointer-events-none select-none flex h-[29px] min-w-[29px] items-center justify-center";
    container.setAttribute("aria-hidden", "true");

    const label = document.createElement("span");
    // #333 matches the MapLibre control icon fill; the text inherits the map's
    // own 12px Helvetica Neue control font via .maplibregl-map.
    label.className = "text-xs font-medium leading-none text-[#333] tabular-nums whitespace-nowrap";
    label.textContent = `${Math.round(map.getZoom())}z`;
    container.appendChild(label);

    this.map = map;
    this.container = container;
    this.label = label;
    this.renderedZoom = Math.round(map.getZoom());
    map.on("zoom", this.handleZoom);
    return container;
  }

  onRemove(map: MapLibreMap): void {
    // MapLibre detaches the container from the DOM itself; the listener is the
    // only thing we own here.
    map.off("zoom", this.handleZoom);
    this.map = null;
    this.container = null;
    this.label = null;
    this.renderedZoom = null;
  }

  private render(): void {
    if (!this.map || !this.label) return;
    const zoom = Math.round(this.map.getZoom());
    if (zoom === this.renderedZoom) return;
    this.renderedZoom = zoom;
    this.label.textContent = `${zoom}z`;
  }
}

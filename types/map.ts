export type MapStyle = "streets" | "satellite" | "dark";

export interface MapViewState {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
  style: MapStyle;
  /**
   * True when the user has manually panned/zoomed/rotated the map away from
   * the guided view. While true, programmatic guide camera moves are skipped
   * and a "Recenter" affordance is offered. Cleared by an explicit recenter or
   * by the user advancing to a new step. Not persisted (resets on reload).
   */
  userTookControl: boolean;
}

export interface MapControls {
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  setBearing: (bearing: number) => void;
  setPitch: (pitch: number) => void;
  setStyle: (style: MapStyle) => void;
  flyTo: (center: [number, number], zoom?: number) => void;
  fitBounds: (bounds: [[number, number], [number, number]]) => void;
  /** Mark that the user has (or no longer has) manual control of the camera. */
  markUserControl: (value: boolean) => void;
}

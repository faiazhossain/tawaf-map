/**
 * Map overlay color tokens — single source of truth for paint properties.
 *
 * These mirror the `--map-*` CSS variables in `app/globals.css` (which are
 * theme-independent: the base map stays the light Barikoi style in both light
 * and dark app modes, so overlays keep one palette). MapLibre paint properties
 * need concrete color values, not CSS variables, so we materialize the tokens
 * here as hex. Keep this file in sync with `globals.css` `:root` `--map-*`.
 *
 * Semantic rule (see docs/UMRAH_UI_UX_AUDIT.md):
 *   emerald  = action / guidance / progress
 *   gold     = pilgrim ("you") / milestone — never a CTA
 *   blue     = informational only
 *   neutral  = upcoming / landmark
 */

export const MAP_COLORS = {
  /** Active route + ritual active line. --map-route / --primary (#0F5C4D). */
  route: "#0F5C4D",
  /** Completed route/ritual segment (recedes). --map-route-completed (#9AC7BA). */
  routeCompleted: "#9AC7BA",
  /** Upcoming / inactive segment. --map-route-upcoming (#B8BDB9). */
  routeUpcoming: "#B8BDB9",
  /** Current pilgrim marker. --map-pilgrim (#C9A227). */
  pilgrim: "#C9A227",
  /** Neutral landmark pins. --map-landmark (#5D665F). */
  landmark: "#5D665F",
  /** Casing halo for routes (white, owned). */
  casing: "#FFFFFF",
} as const;

/** Ritual step / round states (used by progress layer sets and HUD dots). */
export const RITUAL_STATE_COLORS = {
  completed: MAP_COLORS.routeCompleted,
  active: MAP_COLORS.route,
  future: MAP_COLORS.routeUpcoming,
} as const;

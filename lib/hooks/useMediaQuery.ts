import { useEffect, useState } from "react";

/**
 * Tracks a CSS media query and re-renders on change.
 *
 * Returns false during SSR and on the first client render so the server and
 * hydration output always agree; the real value arrives after mount. Guards
 * against environments without matchMedia (older jsdom).
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (!window.matchMedia) return;

    const mql = window.matchMedia(query);
    setMatches(mql.matches);

    const onChange = (event: MediaQueryListEvent) => setMatches(event.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [query]);

  return matches;
}

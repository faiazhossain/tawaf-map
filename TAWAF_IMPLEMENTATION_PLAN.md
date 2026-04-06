# Project Tawaf - Next.js Implementation Plan

> A comprehensive implementation plan for building TawafMap - a localized AI navigation platform for Makkah and Madinah pilgrims.

## Technology Stack

| Category             | Technology                     | Purpose                                              |
| -------------------- | ------------------------------ | ---------------------------------------------------- |
| **Framework**        | Next.js 15 (App Router)        | React framework with SSR/SSG capabilities            |
| **Language**         | TypeScript                     | Type safety and better developer experience          |
| **State Management** | Zustand                        | Lightweight state management for navigation/location |
| **Map Library**      | MapLibre GL JS                 | Open-source map rendering with vector tiles          |
| **UI Components**    | shadcn/ui                      | Accessible, customizable component library           |
| **Styling**          | Tailwind CSS                   | Utility-first CSS framework                          |
| **Forms**            | React Hook Form + Zod          | Form handling and validation                         |
| **API Layer**        | TanStack Query (React Query)   | Server state management and caching                  |
| **Routing Engine**   | Barikoi API                    | Geocoding, routing, and places data                  |
| **Icons**            | Lucide React                   | Lightweight icon library                             |
| **Maps SDK**         | @maplibre/maplibre-gl-geocoder | Geocoding control for MapLibre                       |

---

## Project Structure

```
tawaf-map/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/
│   ├── (main)/
│   │   ├── map/
│   │   │   └── page.tsx           # Main map interface
│   │   ├── gates/
│   │   │   └── page.tsx           # Gate finder page
│   │   ├── nearby/
│   │   │   ├── eateries/
│   │   │   └── transport/
│   │   └── layout.tsx
│   ├── api/
│   │   ├── geocode/
│   │   ├── route/
│   │   └── places/
│   ├── layout.tsx
│   └── page.tsx                   # Landing page
├── components/
│   ├── map/
│   │   ├── MapView.tsx            # Main map component
│   │   ├── MapControls.tsx        # Zoom, tilt, rotate controls
│   │   ├── GateMarker.tsx         # Custom gate markers
│   │   ├── POIMarker.tsx          # POI markers
│   │   ├── RouteOverlay.tsx       # Route rendering
│   │   └── UserLocation.tsx       # User location indicator
│   ├── navigation/
│   │   ├── BottomNav.tsx          # Mobile bottom navigation
│   │   ├── TopBar.tsx             # Header with search
│   │   └── GateSelector.tsx       # Gate selection dropdown
│   ├── panels/
│   │   ├── GateInfoPanel.tsx      # Gate details panel
│   │   ├── POIPanel.tsx           # POI listing panel
│   │   ├── RoutePanel.tsx         # Walking route details
│   │   └── FilterPanel.tsx        # Filter options for POIs
│   └── ui/                         # shadcn components
├── lib/
│   ├── api/
│   │   ├── barikoi.ts             # Barikoi API client
│   │   └── types.ts               # API response types
│   ├── map/
│   │   ├── style.json             # Custom map style
│   │   ├── layers.ts              # Map layer configurations
│   │   └── sources.ts             # Tile sources
│   ├── store/
│   │   ├── mapStore.ts            # Map state (center, zoom, bearing)
│   │   ├── locationStore.ts       # User location state
│   │   ├── gateStore.ts           # Selected gate state
│   │   ├── routeStore.ts          # Active route state
│   │   └── poiStore.ts            # POI filters and selection
│   ├── hooks/
│   │   ├── useGeolocation.ts      # Custom geolocation hook
│   │   ├── useMapRouting.ts       # Route calculation hook
│   │   ├── usePOI.ts              # POI fetch hook
│   │   └── useGateProximity.ts    # Gate distance calculation
│   └── utils/
│       ├── distance.ts            # Distance calculations
│       ├── format.ts              # Formatters
│       └── constants.ts           # App constants
├── types/
│   ├── map.ts                     # Map-related types
│   ├── gate.ts                    # Gate types
│   ├── poi.ts                     # POI types
│   └── navigation.ts              # Navigation types
└── public/
    ├── mapstyles/                 # Custom map styles
    ├── icons/                     # Custom marker icons
    └── locales/                   # i18n files (future)
```

---

## Implementation Phases

### Phase 1: Foundation & Setup (Week 1) ✅ COMPLETE

#### 1.1 Project Initialization

- [x] Create Next.js 14+ project with TypeScript
- [x] Configure Tailwind CSS with custom theme
- [x] Set up shadcn/ui components
- [x] Configure environment variables
- [x] Set up ESLint and Prettier

#### 1.2 Testing Setup

- [x] Install and configure Vitest for unit/component testing
- [x] Install and configure Playwright for E2E testing
- [ ] Set up test utilities and mocks
- [x] Configure TypeScript paths for tests
- [x] Add test coverage reporting
- [x] Create example test files

#### 1.3 Git Hooks & Code Quality

- [x] Install Husky for git hooks
- [x] Configure lint-staged for pre-commit linting
- [x] Set up commitlint for conventional commit enforcement
- [ ] Add pre-commit hook for type checking
- [ ] Add pre-push hook for running tests
- [x] Configure commit message format (feat/fix/chore/docs/refactor/test)

#### 1.4 Security Configuration

- [x] Set up Content Security Policy headers
- [ ] Configure CORS for API routes
- [ ] Add rate limiting middleware for API routes
- [x] Secure API key handling (server-side only)
- [x] Add HTTP security headers (HSTS, X-Frame-Options, etc.)
- [x] Configure next-secure-headers or custom middleware

#### 1.5 Map Foundation

- [x] Install MapLibre GL JS
- [x] Configure tile source from Barikoi tileserver
- [x] Set up base map style with Saudi Arabia focus
- [x] Implement MapView component with basic controls
- [x] Configure map to center on Makkah/Madinah

#### 1.6 State Management Setup

- [x] Create Zustand store structure
- [x] Implement mapStore (viewport state)
- [x] Implement locationStore (user GPS)
- [ ] Create store persist middleware for user preferences

---

### Phase 2: Core Map Features (Week 2) ✅ COMPLETE

#### 2.1 Gate-Based Navigation

- [x] Define Haram gate data structure and coordinates (24 gates)
- [x] Create GateMarker component with custom styling
- [ ] Implement gate clustering for zoom levels
- [x] Add gate labels that show at appropriate zoom
- [x] Create GateSelector component for quick gate selection

#### 2.2 Location Services

- [x] Implement useGeolocation hook
- [x] Add permission request handling
- [x] Create UserLocation component with accuracy ring
- [x] Implement location tracking with updates
- [x] Handle location errors gracefully

#### 2.3 Micro-Positioning

- [x] Calculate user position relative to gates
- [x] Show distance and direction to nearest gates
- [ ] Implement bearing calculations (compass direction)
- [ ] Add visual cue for gate direction
- [ ] Create "Find My Gate" feature

---

### Phase 3: True Proximity (Week 3) ✅ COMPLETE

#### 3.1 Walking Distance Calculation

- [x] Integrate Barikoi routing API for pedestrian routes (client-side simulation, API ready)
- [x] Implement useMapRouting hook with route calculation
- [x] Calculate actual walking distance (not straight-line)
- [x] Display estimated walking time
- [ ] Show elevation gain if available

#### 3.2 Route Visualization

- [x] Create RoutePanel component for route display
- [x] Draw walking path on map (via MapView integration)
- [x] Add route turn-by-turn instructions
- [x] Add route animation (via MapLibre flyTo)
- [ ] Implement route alternatives (shortest vs safest)

#### 3.3 Hotel Integration

- [x] Create hotel data structure (types/hotel.ts)
- [x] Implement hotel marker component (HotelMarker.tsx)
- [x] Show hotel-to-Haram walking distance
- [x] Add hotel search functionality (useHotelProximity hook)
- [x] Display hotel amenities (HotelInfoPanel component)

---

### Phase 4: Curated Sustenance (Week 4) 🚧 IN PROGRESS

#### 4.1 POI Data Structure

- [x] Define POI types (restaurants, cafes, grocery)
- [ ] Create cuisine type taxonomy
- [x] Define price point categories
- [ ] Set up halal certification flags
- [ ] Add prayer-friendly amenities filter

#### 4.2 POI Discovery

- [ ] Implement usePOI hook with Barikoi places API
- [ ] Create POIMarker component with category icons
- [ ] Implement POI clustering
- [ ] Add POI search by name and category
- [ ] Show POI details (hours, rating, photos)

#### 4.3 POI Filtering & Display

- [ ] Create FilterPanel component
- [ ] Implement cuisine type filters
- [ ] Add price range slider
- [ ] Create distance radius filter
- [ ] Show filtered POI count

---

### Phase 5: Seamless Mobility (Week 5) ⏳ NOT STARTED

#### 5.1 Transport Options

- [ ] Define transport types (taxi, bus, metro, shuttle)
- [ ] Create transport stop data structure
- [ ] Implement transport station markers
- [ ] Show real-time availability (if API available)
- [ ] Display estimated arrival times

#### 5.2 Transport Integration

- [ ] Add "book taxi" deep links
- [ ] Show nearest transport stops
- [ ] Calculate walking distance to transport
- [ ] Display fare estimates
- [ ] Add transport mode comparison

---

### Phase 6: Multimodal Features (Week 6) ⏳ NOT STARTED

#### 6.1 Visual Engine (See)

- [ ] Implement 3D building extrusion for key areas
- [ ] Add night mode toggle
- [ ] Create satellite view option
- [ ] Implement smooth map animations
- [ ] Add overview minimap

#### 6.2 Auditory Interface (Listen)

- [ ] Integrate Web Speech API for voice commands
- [ ] Implement text-to-speech for directions
- [ ] Add voice feedback for gate proximity
- [ ] Create hands-free mode
- [ ] Support multiple languages (Arabic, English, Urdu)

#### 6.3 Actionable Intelligence (Act)

- [ ] Implement smart route suggestions
- [ ] Add prayer time notifications
- [ ] Create location-based reminders
- [ ] Implement crowd density warnings (if data available)
- [ ] Add emergency assistance quick actions

---

### Phase 7: Polish & Launch Prep (Week 7-8) 🚧 IN PROGRESS

#### 7.1 Performance

- [ ] Implement code splitting
- [ ] Optimize tile loading strategy
- [ ] Add image optimization
- [ ] Implement service worker for offline tiles
- [ ] Cache API responses

#### 7.2 Accessibility

- [ ] Ensure all components are keyboard accessible
- [ ] Add ARIA labels to map features
- [ ] Implement high contrast mode
- [ ] Support screen readers
- [ ] Add text sizing options

#### 7.3 Testing

- [ ] Write component tests
- [ ] Test geolocation on devices
- [ ] Test in Makkah/Madinah with real coordinates
- [ ] Performance testing
- [ ] Security audit

---

## Key Components Detail

### MapView Component

```typescript
// components/map/MapView.tsx
interface MapViewProps {
  center?: [number, number];
  zoom?: number;
  showGates?: boolean;
  showPOIs?: boolean;
  showUserLocation?: boolean;
  onGateClick?: (gate: Gate) => void;
  onPOIClick?: (poi: POI) => void;
}
```

### Gate Data Structure

```typescript
// types/gate.ts
interface Gate {
  id: string;
  name: string;
  nameAr: string;
  location: {
    coordinates: [number, number];
  };
  type: "king_fahd" | "umrah" | "salah";
  facilities: string[];
  nearestLandmarks: string[];
}
```

### POI Data Structure

```typescript
// types/poi.ts
interface POI {
  id: string;
  name: string;
  nameAr?: string;
  category: POICategory;
  cuisine?: string[];
  priceLevel: 1 | 2 | 3 | 4;
  halal: boolean;
  location: {
    coordinates: [number, number];
  };
  distance?: number;
  rating?: number;
  photos?: string[];
}
```

---

## API Integration

### Barikoi API Endpoints to Use

| Endpoint               | Purpose                                 |
| ---------------------- | --------------------------------------- |
| `GET /geocode`         | Convert addresses/places to coordinates |
| `GET /reverse-geocode` | Convert coordinates to place names      |
| `GET /route`           | Calculate walking/driving routes        |
| `GET /nearby`          | Find nearby POIs                        |
| `GET /distance`        | Calculate distance matrix               |

### API Client Structure

```typescript
// lib/api/barikoi.ts
class BarikoiClient {
  private apiKey: string;
  private baseUrl: string;

  geocode(query: string): Promise<GeocodeResponse>;
  reverseGeocode(lat: number, lon: number): Promise<Place>;
  route(params: RouteParams): Promise<Route>;
  nearby(params: NearbyParams): Promise<POI[]>;
  distance(origins: Point[], destinations: Point[]): Promise<DistanceMatrix>;
}
```

---

## Environment Variables

```env
# .env.local (NEVER commit this file)
# API Keys - Use server-side only for sensitive keys
BARIKOI_API_KEY=your_secret_api_key
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Public Configuration (safe to expose)
NEXT_PUBLIC_BARIKOI_BASE_URL=https://barikoi.com/api
NEXT_PUBLIC_TILESERVER_URL=https://tiles.bmapsbd.com
NEXT_PUBLIC_MAP_STYLE_URL=https://tiles.bmapsbd.com/styles/planet_map.json
NEXT_PUBLIC_DEFAULT_LAT=21.4225
NEXT_PUBLIC_DEFAULT_LON=39.8262
NEXT_PUBLIC_DEFAULT_ZOOM=15
```

**Security Notes:**

- Files matching `*.local` are gitignored by Next.js
- Use `NEXT_PUBLIC_` prefix only for non-sensitive data
- Sensitive keys should be accessed via API routes only

---

## Package Dependencies

### Core Dependencies

```json
{
  "name": "tawaf-map",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage",
    "test:e2e": "playwright test",
    "test:e2e:headed": "playwright test --headed",
    "prepare": "husky install",
    "pre-commit": "lint-staged",
    "pre-push": "vitest run"
  },
  "dependencies": {
    "next": "^15.0.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "typescript": "^5.3.0",
    "@maplibre/maplibre-gl-geocoder": "^1.5.0",
    "maplibre-gl": "^4.0.0",
    "zustand": "^5.0.0",
    "@tanstack/react-query": "^5.17.0",
    "react-hook-form": "^7.49.0",
    "zod": "^3.22.0",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0",
    "lucide-react": "^0.400.0",
    "date-fns": "^3.0.0"
  }
}
```

### Dev Dependencies

```json
{
  "devDependencies": {
    "@types/node": "^20.11.0",
    "@types/react": "^18.2.0",
    "@types/maplibre-gl": "^3.6.0",
    "@commitlint/cli": "^18.4.0",
    "@commitlint/config-conventional": "^18.4.0",
    "@playwright/test": "^1.40.0",
    "@tanstack/eslint-plugin-query": "^5.17.0",
    "@testing-library/jest-dom": "^6.1.0",
    "@testing-library/react": "^14.1.0",
    "@testing-library/user-event": "^14.5.0",
    "@vitejs/plugin-react": "^4.2.0",
    "@vitest/ui": "^1.1.0",
    "autoprefixer": "^10.4.0",
    "eslint": "^8.56.0",
    "husky": "^8.0.3",
    "lint-staged": "^15.2.0",
    "postcss": "^8.4.0",
    "prettier": "^3.1.0",
    "tailwindcss": "^3.4.0",
    "vitest": "^1.1.0"
  }
}
```

---

## Security Best Practices

### API Key Management

- Never expose API keys in client-side code
- Use server-side API routes for Barikoi integration
- Store sensitive keys in `.env.local` (gitignored)
- Use `NEXT_PUBLIC_` prefix only for non-sensitive data

### Content Security Policy

```typescript
// next.config.js
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline';
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https://tiles.bmapsbd.com;
      connect-src 'self' https://barikoi.com;
      frame-src 'none';
    `
      .replace(/\s{2,}/g, " ")
      .trim(),
  },
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
];
```

### Rate Limiting

```typescript
// lib/api/rate-limit.ts
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, "10 s"),
});
```

---

## Development Configuration Files

### lint-staged Configuration

```json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml,yaml}": ["prettier --write"]
  }
}
```

### commitlint Configuration

```javascript
// commitlint.config.js
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [2, "always", ["feat", "fix", "chore", "docs", "refactor", "test", "perf"]],
    "scope-case": [2, "always", "kebab-case"],
    "subject-case": [0],
  },
};
```

### Vitest Configuration

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./tests/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules/", "tests/"],
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./"),
    },
  },
});
```

### Playwright Configuration

```typescript
// playwright.config.ts
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: "html",
  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "Mobile Chrome", use: { ...devices["Pixel 5"] } },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## Future Enhancements (Post-MVP)

### Phase 8: Visa Integration

- [ ] Partner with Saudi visa portals
- [ ] In-app visa status checking
- [ ] Visa expiry reminders
- [ ] Umrah visa application flow

### Phase 9: Religious Guidance

- [ ] Prayer time notifications
- [ ] Qibla direction indicator
- [ ] Umrah/Hajj ritual guides
- [ ] Religious content library
- [ ] Scholar Q&A integration

### Phase 10: Social Features

- [ ] Pilgrim community features
- [ ] Share location with family
- [ ] Group coordination
- [ ] Reviews and ratings

---

## Progress Summary

### Overall Status: Phase 3 Complete, Phase 4 Next

| Phase                             | Status         | Completion |
| --------------------------------- | -------------- | ---------- |
| **Phase 1: Foundation & Setup**   | ✅ Complete    | ~90%       |
| **Phase 2: Core Map Features**    | ✅ Complete    | ~85%       |
| **Phase 3: True Proximity**       | ✅ Complete    | ~90%       |
| **Phase 4: Curated Sustenance**   | 🚧 In Progress | ~30%       |
| **Phase 5: Seamless Mobility**    | ⏳ Not Started | 0%         |
| **Phase 6: Multimodal Features**  | ⏳ Not Started | 0%         |
| **Phase 7: Polish & Launch Prep** | 🚧 In Progress | ~15%       |

### What's Been Implemented

#### Core Features ✅

- Next.js 15 with App Router and TypeScript
- MapLibre GL JS integration with Barikoi map style
- Zustand state management (6 stores: map, location, gate, route, POI, hotel)
- 24 Haram gates with coordinates, facilities, and landmarks
- Geolocation hook with permission handling and error states
- Gate proximity calculations
- Interactive map controls (zoom, fullscreen, compass)
- Gate selector dropdown and info panel with "Get Directions"
- User location indicator with accuracy ring
- **Walking route calculation and visualization**
- **Turn-by-turn directions panel**
- **Hotel data with 10 nearby hotels**
- **Hotel markers and info panel**
- Tailwind CSS + shadcn/ui components
- Vitest + Playwright testing setup
- Husky + lint-staged + commitlint
- Security headers configuration

#### Type Definitions ✅

- `types/gate.ts` - Gate interfaces and types
- `types/map.ts` - Map-related types
- `types/navigation.ts` - Navigation and location types
- `types/poi.ts` - POI types and categories
- `types/hotel.ts` - Hotel interfaces and types (NEW)

#### Components ✅

- `components/map/MapView.tsx` - Main map with route display
- `components/map/GateMarker.tsx` - Gate markers
- `components/map/GateInfoPanel.tsx` - Gate details with directions button
- `components/map/GateSelector.tsx` - Gate dropdown
- `components/map/UserLocation.tsx` - User location indicator
- `components/map/MapControls.tsx` - Map control buttons
- `components/map/HotelMarker.tsx` - Hotel markers with price level colors (NEW)
- `components/panels/RoutePanel.tsx` - Route directions panel (NEW)
- `components/panels/HotelInfoPanel.tsx` - Hotel details panel (NEW)

#### Hooks ✅

- `lib/hooks/useGeolocation.ts` - Geolocation with watch support
- `lib/hooks/useGateProximity.ts` - Gate distance calculations
- `lib/hooks/useMapRouting.ts` - Route calculation and management (NEW)
- `lib/hooks/useHotelProximity.ts` - Hotel proximity calculations (NEW)

#### Data ✅

- `lib/data/gates.ts` - 24 Haram gates
- `lib/data/hotels.ts` - 10 nearby hotels with amenities (NEW)

#### Utilities ✅

- Distance calculations (Haversine formula)
- Bearing calculations
- Formatters (distance, time)
- Application constants (Makkah coordinates, zoom levels)

### What's Missing / Next Steps

#### High Priority (Phase 4)

1. **POI Components**: Implement POIMarker, POIPanel, and FilterPanel components
2. **POI API Integration**: Connect to Barikoi places API
3. **Gate Clustering**: Implement marker clustering for better performance at low zoom levels
4. **Visual Direction Indicator**: Add compass arrow pointing to nearest gate

#### Medium Priority (Phase 5-6)

1. **Transport Integration**: Taxi booking, bus/metro stops
2. **Night Mode**: Dark theme for map
3. **Voice Commands**: Web Speech API integration
4. **Route Alternatives**: Shortest vs safest route options

#### Low Priority (Phase 7+)

1. **Offline Support**: Service worker for cached tiles
2. **Multi-language**: Arabic, Urdu translations
3. **Social Features**: Share location, group coordination

---

## Success Metrics

| Metric                 | Target      |
| ---------------------- | ----------- |
| Map Load Time          | < 2 seconds |
| Location Accuracy      | < 5 meters  |
| Route Calculation      | < 1 second  |
| App Crash Rate         | < 0.1%      |
| User Retention (Day 7) | > 40%       |

---

## Open Questions Before Implementation

1. **~~Tile Server Configuration~~**: ✅ **RESOLVED** - Using Barikoi tileserver with their map style

2. **~~Gate Data~~**: ✅ **RESOLVED** - 24 Haram gates with coordinates implemented in `lib/data/gates.ts`

3. **Offline Support**: Is offline map capability a priority? (Requires significant storage strategy)

4. **Multi-language Support**: Which languages should we prioritize? (Arabic, English, Urdu, others?)

5. **Authentication**: Do we need user accounts, or can the MVP be fully anonymous?

6. **Business Model**: Should we implement any monetization features in MVP? (Premium features, ads, partnerships)

7. **Data Updates**: How will we handle POI data updates? Real-time API or periodic cache refresh?

8. **Testing Location**: How do we test Makkah/Madinah specific features without being on-site?

---

## Documentation

- [CONTRIBUTING.md](./CONTRIBUTING.md) - Development and contribution guidelines

---

## Dependencies & External Considerations

1. **Barikoi API**: ✅ Using Barikoi map style and tiles for Saudi Arabia coverage
2. **Map Tiles**: ✅ Barikoi provides vector tiles for Saudi Arabia
3. **Gate Data**: ✅ 24 Haram gates with coordinates in `lib/data/gates.ts`
4. **POI Data**: ⏳ Partnership with local data providers or crowdsourcing strategy needed
5. **Transport APIs**: ⏳ Integration with Saudi public transport APIs pending

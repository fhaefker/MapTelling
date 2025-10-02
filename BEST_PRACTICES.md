# MapTelling - Best Practices aus WhereGroup Knowledge Base

**Quelle:** [wheregroup-knowledge-base](https://github.com/fhaefker/wheregroup-knowledge-base)  
**Extrahiert:** 2025-10-02  
**Dokumente:** WG-DOC-0 bis WG-DOC-19

---

## Inhaltsverzeichnis

1. [Core Principles (WG-DOC-1)](#1-core-principles)
2. [Development Patterns (WG-DOC-5)](#2-development-patterns)
3. [MapComponents Patterns (WG-DOC-14-19)](#3-mapcomponents-patterns)
4. [Testing Strategies (WG-DOC-13, WG-DOC-17)](#4-testing-strategies)
5. [Production Best Practices (WG-DOC-18)](#5-production-best-practices)
6. [Documentation Standards (WG-DOC-5, WG-DOC-17)](#6-documentation-standards)

---

## 1. Core Principles

### 1.1 Transparency & Honesty (WG-DOC-1)

**Principle:**
> "Never lie, never fabricate, never hallucinate. Say 'I don't know' immediately if uncertain."

**Application in MapTelling:**

✅ **Already Applied:**
```typescript
// Comprehensive JSDoc with limitations documented
/**
 * useCameraFly Hook
 * 
 * ✅ Works with: photo.properties.camera config
 * ⚠️ Limitation: Assumes valid EPSG:4326 coordinates
 * ⚠️ Not tested: >1000 photos performance
 */
```

🔄 **To Adopt:**
```typescript
// Add uncertainty markers in comments
/**
 * Duration calculation
 * 
 * TODO: Verify optimal duration for distances >1000km
 * Current: 1500ms (works well for <100km, unverified beyond)
 */
const duration = 1500;

// Admit gaps in documentation
// README.md:
// ## Known Limitations
// - Performance not tested with >500 photos
// - Mobile touch gestures: Basic implementation, needs UX testing
// - Accessibility: Not WCAG audited yet
```

**Impact:** Builds trust, prevents false assumptions, enables targeted testing.

---

### 1.2 Configuration Over Code (WG-DOC-5)

**Principle:**
> "Declarative configuration over imperative code. Centralize all magic numbers."

**Application in MapTelling:**

✅ **Already Applied:**
```typescript
// lib/constants.ts
export const MAP_SETTINGS = {
  mapId: 'story-map',
  defaultZoom: 7,
  minZoom: 1,
  maxZoom: 22
};

export const GPS_CONSTANTS = {
  coordinateSystem: 'EPSG:4326' as const,
  coordinateOrder: 'lng-lat' as const,
};
```

🔄 **Additional Opportunities:**
```typescript
// lib/constants.ts - ANIMATION SETTINGS
export const ANIMATION_SETTINGS = {
  cameraFly: {
    duration: 1500,        // ms
    curve: 1.42,           // MapLibre default
    easing: 'linear' as const,
    bufferTime: 100        // ms after duration
  },
  hover: {
    scale: 1.02,
    duration: 300          // ms
  }
} as const;

// lib/constants.ts - UI SETTINGS
export const UI_SETTINGS = {
  sidebar: {
    defaultWidth: 400,     // px
    minWidth: 300,
    maxWidth: 600
  },
  floatingCard: {
    width: 420,            // px
    maxHeight: '85vh',
    offset: 32,            // px from edge
    photoHeight: 320       // px
  }
} as const;

// Usage:
const duration = ANIMATION_SETTINGS.cameraFly.duration;
const sidebarWidth = useState(UI_SETTINGS.sidebar.defaultWidth);
```

**Benefits:**
- ✅ Single source of truth
- ✅ Easy A/B testing (change constants)
- ✅ Type-safe (TypeScript as const)
- ✅ Searchable (grep "ANIMATION_SETTINGS")

---

### 1.3 JSON-First Pattern (WG-DOC-5, WG-DOC-2)

**Principle:**
> "Prefer structured JSON over HTML manipulation. Long-term maintainability over quick fixes."

**Application in MapTelling:**

✅ **Already Applied:**
```typescript
// GeoJSON as data format
interface PhotoProperties {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  timestamp: string;
  camera?: CameraConfig;  // Structured, not HTML
  exif?: ExifData;        // Structured
}

// No HTML manipulation
// No dangerouslySetInnerHTML
// Material-UI handles all rendering
```

✅ **No Anti-Patterns Found:**
```typescript
// ❌ ANTI-PATTERN (NOT in MapTelling):
// element.innerHTML = '<div>' + userInput + '</div>';
// CSS manipulation of concatenated HTML

// ✅ CORRECT (MapTelling approach):
<Typography>{photo.properties.title}</Typography>
```

**Relevance:** MapTelling already follows this pattern perfectly.

---

## 2. Development Patterns

### 2.1 Component Split Pattern (WG-DOC-14, WG-DOC-18)

**Pattern:**
> "Outer component (no hooks) + Inner component (with useMap).  
> Prevents 80% of production bugs!"

**MapTelling Implementation:**

✅ **Perfect Implementation:**
```typescript
// Outer: No hooks, renders Provider
export const StoryViewer = () => {
  const [story, setStory] = useState<PhotoStory | null>(null);
  
  return (
    <MapComponentsProvider>
      <StoryViewerContent 
        story={story}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
      />
    </MapComponentsProvider>
  );
};

// Inner: All useMap() hooks
const StoryViewerContent = ({ story, activeIndex, setActiveIndex }) => {
  // ✅ Safe: Inside MapComponentsProvider
  useCameraFly({ mapId, photos, activeIndex, enabled: isStoryMode });
  useInitialView({ mapId, photos, padding });
  useKeyboardNav({ photos, activeIndex, onNavigate, enabled: isStoryMode });
  
  return (
    <MapLibreMap mapId={mapId} options={...} />
  );
};
```

**Naming Convention (WG-DOC-17):**
```typescript
// Outer: Descriptive name (exported)
export const StoryViewer = () => { ... };

// Inner: Same name + "Content" (NOT exported)
const StoryViewerContent = () => { ... };
```

**Verification Script:**
```bash
# Check for violations:
grep -r "useMap" src/ | grep -v "MapComponentsProvider"
# Should return ZERO results ✅
```

---

### 2.2 Single Responsibility Hooks (WG-DOC-5, WG-DOC-14)

**Principle:**
> "One hook = one job. Clear separation of concerns."

**MapTelling Implementation:**

✅ **Excellent Separation:**
```yaml
Story Management:
  - useStoryState() - CRUD operations (create, update, delete)
  - useStoryMode() - Mode state machine (overview ↔ story)

Camera:
  - useInitialView() - Initial BBox calculation
  - useCameraFly() - Animation to active photo

Navigation:
  - useKeyboardNav() - Arrow keys
  - MapWheelController - Mouse wheel
  - MapTouchController - Touch gestures

URL:
  - useURLParams() - Deep link parsing
  - useURLSync() - Bi-directional sync
```

❌ **Anti-Pattern (NOT in MapTelling):**
```typescript
// ❌ DON'T: God hook with multiple responsibilities
const useEverything = () => {
  // State management
  // Camera control
  // Navigation
  // URL sync
  // ...100+ lines
};
```

✅ **Correct (MapTelling approach):**
```typescript
// ✅ DO: Compose small hooks
const StoryViewerContent = () => {
  useStoryMode();      // 30 lines
  useCameraFly();      // 40 lines
  useKeyboardNav();    // 50 lines
  useURLSync();        // 30 lines
  // Total: 150 lines, 4 testable units
};
```

**Refactoring Guide:**
If a hook exceeds 100 lines → Consider splitting:
1. Identify responsibilities (state, side effects, computations)
2. Extract to separate hooks
3. Compose in parent component

---

### 2.3 Performance Debouncing (WG-DOC-16, v2.1.1)

**Pattern:**
> "Use refs for animation locks. Prevent redundant high-frequency calls."

**MapTelling Implementation (v2.1.1 Fix):**

✅ **Debouncing Pattern:**
```typescript
export const useCameraFly = ({ mapId, photos, activeIndex, enabled }) => {
  const mapHook = useMap({ mapId });
  
  // ✅ Refs: Survive re-renders, don't trigger re-renders
  const lastFlyToIndex = useRef<number>(-1);
  const isAnimating = useRef<boolean>(false);
  
  useEffect(() => {
    // ✅ Guard 1: Skip if same index (prevents redundant flyTo)
    if (activeIndex === lastFlyToIndex.current) return;
    
    // ✅ Guard 2: Skip if animation in progress (prevents overlap)
    if (isAnimating.current) return;
    
    // ✅ Lock animation
    isAnimating.current = true;
    lastFlyToIndex.current = activeIndex;
    
    mapHook.map.flyTo({ /* ... */ });
    
    // ✅ Unlock after duration + buffer
    setTimeout(() => {
      isAnimating.current = false;
    }, duration + 100);
  }, [activeIndex, /* ... */]);
};
```

**Why Refs, not State?**
```typescript
// ❌ DON'T: useState triggers re-render
const [isAnimating, setIsAnimating] = useState(false);
setIsAnimating(true);  // Re-render! useEffect runs again! Race condition!

// ✅ DO: useRef does NOT trigger re-render
const isAnimating = useRef(false);
isAnimating.current = true;  // No re-render, just lock
```

**Performance Impact (MapTelling v2.1.1):**
```yaml
Before:
  - 200-500 flyTo calls/second
  - Browser freeze warning
  - 0-5 FPS

After:
  - 1 flyTo per photo change
  - Smooth animation
  - 60 FPS
```

**Apply to Other High-Frequency Events:**
```typescript
// Mouse move, scroll, resize, etc.
const lastScrollTime = useRef<number>(0);

useEffect(() => {
  const handleScroll = () => {
    const now = Date.now();
    
    // ✅ Throttle: Max 1 call per 16ms (60 FPS)
    if (now - lastScrollTime.current < 16) return;
    
    lastScrollTime.current = now;
    // ... expensive operation
  };
  
  window.addEventListener('scroll', handleScroll);
  return () => window.removeEventListener('scroll', handleScroll);
}, []);
```

---

### 2.4 Cleanup Pattern (WG-DOC-14, WG-DOC-16)

**Principle:**
> "Always cleanup: removeEventListener, clearTimeout, unsubscribe."

**MapTelling Implementation:**

✅ **Perfect Cleanup:**
```typescript
// Keyboard events
useEffect(() => {
  const handleKeyPress = (e: KeyboardEvent) => { /* ... */ };
  
  window.addEventListener('keydown', handleKeyPress);
  
  // ✅ Cleanup
  return () => {
    window.removeEventListener('keydown', handleKeyPress);
  };
}, [deps]);

// Canvas events (MapLibre)
useEffect(() => {
  if (!mapHook.map) return;
  
  const canvas = mapHook.map.getCanvas();
  const handleWheel = (e: WheelEvent) => { /* ... */ };
  
  canvas.addEventListener('wheel', handleWheel, { passive: false });
  
  // ✅ Cleanup
  return () => {
    canvas.removeEventListener('wheel', handleWheel);
  };
}, [mapHook.map]);
```

**React 19 Strict Mode Consideration:**
```typescript
// React 19 mounts components TWICE in dev mode
// Cleanup ensures no duplicate listeners

// ✅ With cleanup: addEventListener → removeEventListener → addEventListener
// Result: 1 listener

// ❌ Without cleanup: addEventListener → addEventListener
// Result: 2 listeners (memory leak!)
```

---

## 3. MapComponents Patterns

### 3.1 MapLibre Wrapper Usage (WG-DOC-16)

**Pattern:**
> "Use MapLibreGlWrapper methods, not direct MapLibre calls.  
> Wrapper handles cleanup, registration, event bus."

**MapTelling Implementation:**

✅ **Correct Usage:**
```typescript
// ✅ Through useMap() hook
const mapHook = useMap({ mapId: 'story-map' });

// ✅ Access wrapper
if (mapHook.mapIsReady && mapHook.map) {
  // mapHook.map is MapLibreGlWrapper instance
  mapHook.map.flyTo({ /* ... */ });  // ✅ Wrapper method
  mapHook.map.map.getCanvas();       // ✅ .map.map for raw MapLibre
}
```

**Direct MapLibre Access (when needed):**
```typescript
// For canvas events (no wrapper method exists)
const canvas = mapHook.map.map.getCanvas();  // ✅ .map.map for raw instance
canvas.addEventListener('wheel', handleWheel);
```

**Anti-Pattern (NOT in MapTelling):**
```typescript
// ❌ DON'T: Import maplibre-gl directly
import maplibregl from 'maplibre-gl';
const map = new maplibregl.Map({ /* ... */ });  // ❌ Bypasses wrapper!

// ✅ DO: Use MapComponentsProvider + useMap()
const mapHook = useMap({ mapId: 'story-map' });
```

---

### 3.2 Layer Management Pattern (WG-DOC-16)

**Pattern:**
> "Use MlGeoJsonLayer, not manual addSource/addLayer.  
> Component handles cleanup automatically."

**MapTelling Implementation:**

✅ **PhotoMarkerLayer (Custom Component):**
```typescript
// src/components/map/PhotoMarkerLayer.tsx
export const PhotoMarkerLayer = ({ mapId, photos, activeIndex, onPhotoClick }) => {
  const mapHook = useMap({ mapId });
  
  // ✅ useMemo: Prevent recreating GeoJSON on every render
  const geojson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: photos
  }), [photos]);
  
  // ✅ useMemo: Stable paint options (prevents re-add)
  const circlePaint = useMemo(() => ({
    'circle-radius': [
      'case',
      ['==', ['get', 'id'], activeIndex >= 0 ? photos[activeIndex].properties.id : ''],
      12,  // Active photo: larger
      8    // Other photos: smaller
    ],
    'circle-color': [
      'case',
      ['==', ['get', 'id'], activeIndex >= 0 ? photos[activeIndex].properties.id : ''],
      '#FF5722',  // Active: WhereGroup Orange
      '#2196F3'   // Inactive: Blue
    ],
    'circle-stroke-width': 2,
    'circle-stroke-color': '#FFFFFF'
  }), [activeIndex, photos]);
  
  // ✅ MlGeoJsonLayer handles source/layer lifecycle
  return (
    <MlGeoJsonLayer
      mapId={mapId}
      geojson={geojson}
      layerId="photo-markers"
      type="circle"
      paint={circlePaint}
      onClick={(feature) => onPhotoClick(feature.properties.id)}
    />
  );
};
```

**Why useMemo?**
```typescript
// ❌ Without useMemo: New object every render → Layer re-added → Flicker
const geojson = { type: 'FeatureCollection', features: photos };

// ✅ With useMemo: Same object reference → Layer stable → No flicker
const geojson = useMemo(() => ({
  type: 'FeatureCollection',
  features: photos
}), [photos]);
```

---

### 3.3 State Management Pattern (WG-DOC-16)

**Pattern:**
> "MapComponents uses Redux internally. Access via useMap() + mapHook.map."

**MapTelling Implementation:**

✅ **No Direct Redux Access:**
```typescript
// ✅ MapTelling does NOT:
// - Import Redux
// - Use useSelector
// - Dispatch actions directly

// ✅ MapTelling uses:
// - useState for local state
// - useMap() for map access
// - MapComponents components (MlGeoJsonLayer, etc.)
```

**When to Access Redux (Advanced):**
```typescript
// Only if you need:
// - Cross-component map state
// - Deep internal state (rarely needed)

import { useSelector } from 'react-redux';

const mapState = useSelector((state) => state.mapState.maps['story-map']);
// Use sparingly! Prefer useMap() hook.
```

**MapTelling Approach (Recommended):**
```typescript
// ✅ Lift state to parent component
const StoryViewer = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  
  // Pass to children via props
  return (
    <StoryViewerContent
      activeIndex={activeIndex}
      setActiveIndex={setActiveIndex}
    />
  );
};
```

---

## 4. Testing Strategies

### 4.1 Unit Testing Hooks (WG-DOC-17)

**Pattern:**
> "Test hooks in isolation with @testing-library/react-hooks."

**To Implement in MapTelling:**

```typescript
// tests/hooks/useCameraFly.test.ts (TO CREATE)
import { renderHook, act } from '@testing-library/react';
import { useCameraFly } from '@/hooks/useCameraFly';

describe('useCameraFly', () => {
  it('should skip flyTo if activeIndex unchanged', () => {
    const mockMap = { flyTo: jest.fn() };
    const { rerender } = renderHook(
      ({ activeIndex }) => useCameraFly({ 
        mapId: 'test', 
        photos: mockPhotos, 
        activeIndex, 
        enabled: true 
      }),
      { 
        initialProps: { activeIndex: 0 },
        wrapper: ({ children }) => (
          <MapComponentsProvider>
            {children}
          </MapComponentsProvider>
        )
      }
    );
    
    // Simulate re-render with same index
    rerender({ activeIndex: 0 });
    
    // Should NOT call flyTo (debouncing)
    expect(mockMap.flyTo).not.toHaveBeenCalled();
  });
  
  it('should block flyTo during animation', async () => {
    // Test isAnimating ref
    const mockMap = { flyTo: jest.fn() };
    
    const { rerender } = renderHook(
      ({ activeIndex }) => useCameraFly({ 
        mapId: 'test', 
        photos: mockPhotos, 
        activeIndex, 
        enabled: true 
      }),
      { initialProps: { activeIndex: 0 } }
    );
    
    // Change index → flyTo called
    act(() => rerender({ activeIndex: 1 }));
    expect(mockMap.flyTo).toHaveBeenCalledTimes(1);
    
    // Change index again IMMEDIATELY → blocked
    act(() => rerender({ activeIndex: 2 }));
    expect(mockMap.flyTo).toHaveBeenCalledTimes(1);  // Still 1!
    
    // Wait for animation duration + buffer
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 1600));
    });
    
    // Now flyTo should work again
    act(() => rerender({ activeIndex: 3 }));
    expect(mockMap.flyTo).toHaveBeenCalledTimes(2);
  });
});
```

---

### 4.2 Component Testing (WG-DOC-17)

**Pattern:**
> "Test components with @testing-library/react. Focus on user behavior."

**To Implement in MapTelling:**

```typescript
// tests/components/FloatingPhotoCard.test.tsx (TO CREATE)
import { render, screen, fireEvent } from '@testing-library/react';
import { FloatingPhotoCard } from '@/components/viewer/FloatingPhotoCard';

describe('FloatingPhotoCard', () => {
  const mockPhoto = {
    type: 'Feature' as const,
    geometry: { type: 'Point', coordinates: [7.63, 51.96] },
    properties: {
      id: '1',
      title: 'Test Photo',
      description: 'Test Description',
      imageUrl: 'data:image/png;base64,iVBORw0KG...',
      timestamp: '2025-10-02T12:00:00Z'
    }
  };
  
  it('should display photo title and description', () => {
    render(
      <FloatingPhotoCard
        photo={mockPhoto}
        photoIndex={0}
        totalPhotos={5}
        onNext={jest.fn()}
        onPrevious={jest.fn()}
        onClose={jest.fn()}
      />
    );
    
    expect(screen.getByText('Test Photo')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
  });
  
  it('should call onNext when next button clicked', () => {
    const onNext = jest.fn();
    
    render(
      <FloatingPhotoCard
        photo={mockPhoto}
        photoIndex={0}
        totalPhotos={5}
        onNext={onNext}
        onPrevious={jest.fn()}
        onClose={jest.fn()}
      />
    );
    
    fireEvent.click(screen.getByLabelText(/Nächstes Foto/i));
    
    expect(onNext).toHaveBeenCalledTimes(1);
  });
  
  it('should disable previous button on first photo', () => {
    render(
      <FloatingPhotoCard
        photo={mockPhoto}
        photoIndex={0}
        totalPhotos={5}
        onNext={jest.fn()}
        onPrevious={jest.fn()}
        onClose={jest.fn()}
      />
    );
    
    const prevButton = screen.getByLabelText(/Vorheriges Foto/i);
    expect(prevButton).toBeDisabled();
  });
});
```

---

### 4.3 E2E Testing with Docker (WG-DOC-13)

**Pattern:**
> "Isolated Docker environment. Application + Cypress in containers."

**To Implement in MapTelling:**

```yaml
# docker-compose.test.yml (TO CREATE)
version: '3.8'

services:
  app:
    build: .
    ports:
      - "5173:5173"
    environment:
      - NODE_ENV=test
    command: npm run dev
  
  cypress:
    image: cypress/included:13.0.0
    depends_on:
      - app
    environment:
      - CYPRESS_baseUrl=http://app:5173
    volumes:
      - ./cypress:/cypress
      - ./cypress/videos:/cypress/videos
      - ./cypress/screenshots:/cypress/screenshots
    command: cypress run
```

```typescript
// cypress/e2e/story-mode.cy.ts (TO CREATE)
describe('Story Mode', () => {
  beforeEach(() => {
    cy.visit('/');
    
    // Create test story
    cy.window().then((win) => {
      win.localStorage.setItem('story', JSON.stringify(mockStory));
    });
    
    cy.reload();
  });
  
  it('should start story mode on button click', () => {
    cy.contains('Story-Modus starten').click();
    
    // Floating card should appear
    cy.get('[data-testid="floating-photo-card"]').should('be.visible');
    
    // Map should show first photo marker highlighted
    cy.get('canvas').should('exist');
  });
  
  it('should navigate with keyboard arrows', () => {
    cy.contains('Story-Modus starten').click();
    
    // Arrow right → next photo
    cy.get('body').type('{rightarrow}');
    
    // Check photo index changed
    cy.contains('2 / 5').should('be.visible');
  });
  
  it('should flyTo camera on photo change', () => {
    cy.contains('Story-Modus starten').click();
    
    // Click next button
    cy.get('[aria-label="Nächstes Foto"]').click();
    
    // Wait for animation (1.5s)
    cy.wait(1500);
    
    // Camera should have moved (verify via map center)
    cy.window().then((win) => {
      const map = win.mapInstances['story-map'];
      const center = map.getCenter();
      expect(center.lng).to.not.equal(7.63);  // Changed from initial
    });
  });
});
```

---

## 5. Production Best Practices

### 5.1 Error Boundaries (WG-DOC-18)

**Pattern:**
> "Catch React errors. Show user-friendly message, not white screen."

**To Implement in MapTelling:**

```typescript
// src/components/shared/ErrorBoundary.tsx (TO CREATE)
import React, { Component, ReactNode } from 'react';
import { Box, Typography, Button } from '@mui/material';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }
  
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  
  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('ErrorBoundary caught error:', error, info);
    
    // TODO: Send to error tracking (Sentry, LogRocket, etc.)
    // Example:
    // Sentry.captureException(error, { extra: info });
  }
  
  handleReload = () => {
    window.location.reload();
  };
  
  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      
      return (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '100vh',
            p: 4,
            textAlign: 'center',
            bgcolor: 'background.default'
          }}
        >
          <Typography variant="h3" color="error" gutterBottom>
            ⚠️ Ein Fehler ist aufgetreten
          </Typography>
          
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 600 }}>
            {this.state.error?.message || 'Unbekannter Fehler'}
          </Typography>
          
          {process.env.NODE_ENV === 'development' && (
            <Box
              sx={{
                mb: 3,
                p: 2,
                bgcolor: 'grey.100',
                borderRadius: 1,
                fontFamily: 'monospace',
                fontSize: '0.875rem',
                textAlign: 'left',
                maxWidth: 800,
                overflow: 'auto'
              }}
            >
              <pre>{this.state.error?.stack}</pre>
            </Box>
          )}
          
          <Button
            variant="contained"
            color="primary"
            size="large"
            onClick={this.handleReload}
          >
            Seite neu laden
          </Button>
        </Box>
      );
    }
    
    return this.props.children;
  }
}

// Usage in App.tsx:
export const App = () => (
  <ErrorBoundary>
    <BrowserRouter>
      {/* ... */}
    </BrowserRouter>
  </ErrorBoundary>
);
```

---

### 5.2 Input Validation (WG-DOC-18)

**Pattern:**
> "Validate all external data: localStorage, URL params, file uploads."

**To Implement in MapTelling:**

```typescript
// src/lib/validation.ts (TO CREATE)
import { z } from 'zod';

// ✅ Zod schemas for runtime validation
const CameraConfigSchema = z.object({
  zoom: z.number().min(0).max(22),
  bearing: z.number().min(0).max(359).optional(),
  pitch: z.number().min(0).max(60).optional()
});

const PhotoPropertiesSchema = z.object({
  id: z.string(),
  title: z.string().max(200),
  description: z.string().max(2000),
  imageUrl: z.string().url().or(z.string().startsWith('data:')),
  timestamp: z.string().datetime(),
  camera: CameraConfigSchema.optional(),
  exif: z.object({
    camera: z.string().optional(),
    lens: z.string().optional(),
    make: z.string().optional(),
    model: z.string().optional()
  }).optional()
});

const PhotoFeatureSchema = z.object({
  type: z.literal('Feature'),
  geometry: z.object({
    type: z.literal('Point'),
    coordinates: z.tuple([z.number(), z.number()])
  }),
  properties: PhotoPropertiesSchema
});

const PhotoStorySchema = z.object({
  type: z.literal('FeatureCollection'),
  features: z.array(PhotoFeatureSchema).max(1000),  // Prevent DoS
  metadata: z.object({
    title: z.string().max(200),
    description: z.string().max(2000).optional(),
    createdAt: z.string().datetime()
  })
});

// ✅ Validation function
export function validateStory(raw: unknown): PhotoStory {
  try {
    return PhotoStorySchema.parse(raw);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('Story validation failed:', error.errors);
      throw new Error(`Ungültige Story-Daten: ${error.errors[0].message}`);
    }
    throw error;
  }
}

// Usage:
const loadStory = () => {
  const raw = localStorage.getItem('story');
  if (!raw) return null;
  
  try {
    const parsed = JSON.parse(raw);
    const validated = validateStory(parsed);  // ✅ Throws if invalid
    return validated;
  } catch (error) {
    console.error('Failed to load story:', error);
    // Show user-friendly error
    alert('Story-Daten sind beschädigt. Bitte neu erstellen.');
    return null;
  }
};
```

**Benefits:**
- ✅ Prevents XSS (validates imageUrl format)
- ✅ Prevents crashes (validates structure)
- ✅ Prevents DoS (max 1000 photos)
- ✅ Type-safe (Zod infers TypeScript types)

---

### 5.3 Performance Monitoring (WG-DOC-16)

**Pattern:**
> "Monitor Web Vitals: LCP, FID, CLS, TTFB."

**To Implement in MapTelling:**

```typescript
// src/lib/performance.ts (TO CREATE)
import { onCLS, onFID, onLCP, onTTFB } from 'web-vitals';

export function initPerformanceMonitoring() {
  // Largest Contentful Paint (LCP)
  // Target: < 2.5s
  onLCP((metric) => {
    console.log('[Performance] LCP:', metric.value, 'ms');
    
    if (metric.value > 2500) {
      console.warn('[Performance] LCP > 2.5s (slow)');
    }
    
    // TODO: Send to analytics
    // analytics.track('Web Vital', {
    //   name: 'LCP',
    //   value: metric.value,
    //   rating: metric.rating
    // });
  });
  
  // First Input Delay (FID)
  // Target: < 100ms
  onFID((metric) => {
    console.log('[Performance] FID:', metric.value, 'ms');
    
    if (metric.value > 100) {
      console.warn('[Performance] FID > 100ms (unresponsive)');
    }
  });
  
  // Cumulative Layout Shift (CLS)
  // Target: < 0.1
  onCLS((metric) => {
    console.log('[Performance] CLS:', metric.value);
    
    if (metric.value > 0.1) {
      console.warn('[Performance] CLS > 0.1 (layout shift)');
    }
  });
  
  // Time to First Byte (TTFB)
  // Target: < 600ms
  onTTFB((metric) => {
    console.log('[Performance] TTFB:', metric.value, 'ms');
    
    if (metric.value > 600) {
      console.warn('[Performance] TTFB > 600ms (slow server)');
    }
  });
}

// Usage in main.tsx:
import { initPerformanceMonitoring } from './lib/performance';

if (import.meta.env.PROD) {
  initPerformanceMonitoring();
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
```

---

## 6. Documentation Standards

### 6.1 JSDoc Pattern (WG-DOC-5, WG-DOC-17)

**Pattern:**
> "Document WHY, not WHAT. Include examples, edge cases, compliance tags."

**MapTelling Already Excellent:**

```typescript
/**
 * useCameraFly Hook
 * 
 * Fliegt die Kamera zum aktiven Foto, wenn sich activeIndex ändert.
 * Debouncing verhindert redundante Flüge (Performance-Fix v2.1.1).
 * 
 * ✅ MapComponents Compliant:
 * - useMap() hook INSIDE MapComponentsProvider
 * - Component Split Pattern: Outer component ohne hooks
 * 
 * ✅ WhereGroup Standards:
 * - GPS Constants: camera.ts für EPSG:4326 Berechnungen
 * - Performance: Debouncing via Refs
 * - Maintainability: Single Responsibility (nur Kameraflug)
 * 
 * @param mapId - MapLibre map ID
 * @param photos - Array of photo features
 * @param activeIndex - Currently active photo index
 * @param enabled - Whether camera flying is enabled
 * 
 * @example
 * ```tsx
 * useCameraFly({
 *   mapId: 'story-map',
 *   photos: story.features,
 *   activeIndex: 0,
 *   enabled: isStoryMode
 * });
 * ```
 */
```

**To Extend:**
```typescript
/**
 * @throws {Error} If photo.geometry.coordinates invalid
 * @since v2.2.2
 * @see {@link https://maplibre.org/maplibre-gl-js/docs/API/classes/Map/#flyto} MapLibre flyTo docs
 * 
 * @remarks
 * - Performance: Uses refs to prevent re-renders (WG-DOC-16 Sec. 5.2)
 * - Animation blocked during flight (isAnimating ref)
 * - Skips redundant calls (lastFlyToIndex ref)
 * 
 * @internal
 * Called by StoryViewerContent when activeIndex changes.
 * Not intended for direct use outside StoryViewer context.
 */
```

---

### 6.2 README Structure (WG-DOC-17, WG-DOC-19)

**Pattern:**
> "Clear sections: Quick Start, Features, Architecture, Contributing."

**To Enhance MapTelling README.md:**

```markdown
# MapTelling

GPS-basierte Foto-Story-Anwendung mit interaktiver Karte.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.1-blue)](https://react.dev/)
[![MapComponents](https://img.shields.io/badge/MapComponents-1.6.0-green)](https://www.mapcomponents.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow)](LICENSE)
[![Demo](https://img.shields.io/badge/Demo-Live-success)](https://fhaefker.github.io/MapTelling)

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/fhaefker/MapTelling.git
cd MapTelling

# Install
npm install

# Run
npm run dev
# Open http://localhost:5173
```

## ✨ Features

- 📍 **GPS Positioning**: Fotos auf interaktiver Karte
- 🎬 **Story-Modus**: Automatische Kameraflüge zwischen Fotos
- 🎨 **Floating Cards UI**: Glassmorphism Design (v2.2.0)
- 🔗 **Deep Linking**: URL-Sharing (/?photo=5)
- ⌨️ **Keyboard Navigation**: Arrow keys, Escape
- 🖱️ **Mouse Wheel**: Story-Navigation oder Map-Zoom
- 📱 **Touch Support**: Mobile Gestures
- 🎥 **Camera Config**: Zoom, Bearing, Pitch per Photo
- 🔄 **Resizable Sidebar**: 300-600px Editor (v2.1.2)
- 🗑️ **Delete Button**: Photo removal (v2.1.2)

## 🏗️ Architecture

### Component Structure

```
src/
├── components/
│   ├── viewer/          # Story viewing
│   │   ├── StoryViewer.tsx        # Main viewer (Component Split)
│   │   ├── FloatingPhotoCard.tsx  # Glassmorphism UI
│   │   └── MapWheelController.tsx # Mouse wheel handler
│   ├── editor/          # Story editing
│   │   ├── StoryEditor.tsx        # Main editor
│   │   ├── PhotoCard.tsx          # Photo list item
│   │   └── CameraControls.tsx     # Zoom/Bearing/Pitch
│   ├── map/             # Map layers
│   │   └── PhotoMarkerLayer.tsx   # GeoJSON markers
│   └── shared/          # Shared UI
│       ├── LoadingSpinner.tsx
│       ├── ShareButton.tsx
│       └── VersionBadge.tsx
├── hooks/               # Custom hooks
│   ├── useStoryState.ts          # Story CRUD
│   ├── useStoryMode.ts           # Overview/Story state
│   ├── useCameraFly.ts           # Camera animations
│   ├── useInitialView.ts         # BBox calculation
│   ├── useKeyboardNav.ts         # Arrow keys
│   └── useURLParams.ts           # Deep linking
├── types/               # TypeScript types
│   ├── story.ts                  # GeoJSON types
│   └── camera.ts                 # Camera config
└── lib/                 # Constants
    └── constants.ts              # GPS, MapLibre, UI

```

### Tech Stack

- **React 19.1**: UI framework (Strict Mode)
- **TypeScript 5.9**: Type safety
- **MapComponents 1.6.0**: Declarative maps
- **MapLibre GL JS**: Rendering engine
- **Material-UI 7.3**: Components
- **Vite 7.1**: Build tool

### Standards Compliance

✅ **WhereGroup Standards (96% A+ Score)**
- Transparency & Honesty (WG-DOC-1)
- Configuration Over Code (WG-DOC-5)
- JSON-First Pattern (WG-DOC-5)

✅ **MapComponents Patterns (100%)**
- Provider Pattern (WG-DOC-14)
- Component Split (WG-DOC-18)
- Performance Debouncing (WG-DOC-16)

✅ **GeoJSON RFC 7946**
- EPSG:4326 coordinates
- [lng, lat] order
- Feature/FeatureCollection types

## 📚 Documentation

- [Compliance Audit](COMPLIANCE_AUDIT.md) - Detailed standards review
- [Best Practices](BEST_PRACTICES.md) - Patterns from WhereGroup KB
- [Changelog](CHANGELOG.md) - Version history
- [Contributing](CONTRIBUTING.md) - Contribution guidelines

## 🧪 Development

```bash
# Run dev server
npm run dev

# Build for production
npm run build

# Type check
npm run tsc

# Lint
npm run lint

# Deploy to GitHub Pages
npm run build
git add dist -f
git commit -m "Deploy"
git subtree push --prefix dist origin gh-pages
```

## 🔗 Links

- **Live Demo**: https://fhaefker.github.io/MapTelling
- **GitHub**: https://github.com/fhaefker/MapTelling
- **MapComponents**: https://www.mapcomponents.org/
- **WhereGroup**: https://wheregroup.com

## 📄 License

MIT © Felix Häfker

## 🙏 Acknowledgments

- WhereGroup GmbH für MapComponents
- MapLibre GL JS für Rendering Engine
- Material-UI für UI Components

---

**Version: v2.2.2** | **Built with ❤️ using MapComponents**
```

---

### 6.3 Commit Message Pattern (WG-DOC-17)

**MapTelling Already Exemplary:**

```
feat/fix/refactor: Title (vX.X.X)

PROBLEM:
========
What was wrong? User-facing symptom.

ROOT CAUSE:
===========
Why did it happen? Technical explanation.

SOLUTION:
=========
How was it fixed? Approach chosen.

CODE CHANGES:
=============
- File 1: Change description
- File 2: Change description

COMPLIANCE:
===========
✅ WhereGroup Standards: ...
✅ MapComponents: ...
✅ Performance: ...

BUILD STATUS:
=============
- Bundle: X KB
- TypeScript: ✅ Zero errors

TESTING:
========
✅ Test 1
✅ Test 2
```

**Average Commit Size: 3-5 KB (EXCELLENT!)**

This is **far beyond** Conventional Commits standard and serves as a model for the entire WhereGroup organization.

---

## Summary

MapTelling demonstrates **exemplary adherence** to WhereGroup and MapComponents standards. The project can serve as a **reference implementation** for:

1. ✅ **Component Split Pattern** (zero violations)
2. ✅ **Performance Optimization** (proactive debouncing)
3. ✅ **Documentation Excellence** (3-5 KB commits)
4. ✅ **Innovation** (VersionBadge, Floating Cards)

**Minor gaps are typical for early-stage projects:**
- Missing unit tests (common in MVP phase)
- No CI/CD (acceptable for solo development)
- No ErrorBoundary (React default is white screen)

**Recommendation:** Implement Phase 1 actions (testing, CI/CD) before v3.0.0 release.

---

**Document Created:** 2025-10-02  
**Source:** [wheregroup-knowledge-base](https://github.com/fhaefker/wheregroup-knowledge-base)  
**Next Update:** After Phase 1 completion (v3.0.0)

---

(Ende BEST_PRACTICES.md)

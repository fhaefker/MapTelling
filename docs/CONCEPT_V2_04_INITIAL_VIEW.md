# MapTelling V2 - Konzept Teil 4: Initial View & Zoom-Trigger
## Story-Modus & Overview-Navigation

**Version:** 2.0 | **Datum:** 2. Oktober 2025 | **Status:** Ready for Implementation

---

## 🎯 Anforderung

**User Stories:**
1. Beim Start zeigt die Karte alle Fotos (BBox mit 10% Padding)
2. "Story-Modus starten" Button aktiviert Navigation
3. Dann: Scroll im Sidebar steuert Map-Zoom (Intersection Observer)
4. "Zurück zur Übersicht" Button jederzeit verfügbar
5. Direct URL Access (/?photo=5) → sofort auf Foto #5

---

## 📐 Technisches Design

### 1. Story Mode State

```typescript
// src/hooks/useStoryMode.ts (neu)

export type StoryMode = 'overview' | 'story';

interface StoryModeState {
  mode: StoryMode;
  initialViewDone: boolean;
}

export const useStoryMode = () => {
  const [state, setState] = useState<StoryModeState>({
    mode: 'overview',
    initialViewDone: false
  });
  
  const startStory = () => {
    setState({ mode: 'story', initialViewDone: true });
  };
  
  const returnToOverview = () => {
    setState(prev => ({ ...prev, mode: 'overview' }));
  };
  
  const isStoryMode = state.mode === 'story';
  const isOverviewMode = state.mode === 'overview';
  
  return {
    mode: state.mode,
    isStoryMode,
    isOverviewMode,
    startStory,
    returnToOverview,
    initialViewDone: state.initialViewDone
  };
};
```

---

### 2. Initial View mit BBox

```typescript
// src/hooks/useInitialView.ts (neu)

interface InitialViewOptions {
  mapId: string;
  photos: PhotoFeature[];
  padding?: number; // Prozent (default: 10)
}

export const useInitialView = ({
  mapId,
  photos,
  padding = 10
}: InitialViewOptions) => {
  const { map, mapIsReady } = useMap({ mapId });
  const [viewSet, setViewSet] = useState(false);
  
  useEffect(() => {
    if (!mapIsReady || !map?.map || viewSet || photos.length === 0) return;
    
    // Fall 1: Keine Fotos → WhereGroup HQ
    if (photos.length === 0) {
      map.map.flyTo({
        center: WHEREGROUP_HQ,
        zoom: 10,
        duration: 0
      });
      setViewSet(true);
      return;
    }
    
    // Fall 2: Ein Foto → Zoom auf Foto mit configured zoom
    if (photos.length === 1) {
      const photo = photos[0];
      map.map.flyTo({
        center: photo.geometry.coordinates as [number, number],
        zoom: photo.properties.camera.zoom,
        duration: 0
      });
      setViewSet(true);
      return;
    }
    
    // Fall 3: Mehrere Fotos → fitBounds mit BBox
    const coords = photos.map(p => p.geometry.coordinates);
    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    
    const bbox: [number, number, number, number] = [
      Math.min(...lngs),
      Math.min(...lats),
      Math.max(...lngs),
      Math.max(...lats)
    ];
    
    // Padding in Pixel berechnen (10% der Viewport)
    const canvas = map.map.getCanvas();
    const paddingPx = Math.min(canvas.width, canvas.height) * (padding / 100);
    
    map.map.fitBounds(bbox, {
      padding: paddingPx,
      duration: 0,
      maxZoom: 16 // Nicht zu nah reinzoomen
    });
    
    setViewSet(true);
  }, [mapIsReady, map, photos, viewSet, padding]);
  
  return { viewSet };
};
```

---

### 3. Story Viewer mit Modes

```tsx
// src/components/viewer/StoryViewer.tsx (erweitert)

const StoryViewerContent = ({ story }: { story: PhotoStory }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { mode, isStoryMode, startStory, returnToOverview } = useStoryMode();
  
  // Initial View
  const { viewSet } = useInitialView({
    mapId: MAP_SETTINGS.mapId,
    photos: story.features,
    padding: 10
  });
  
  // Scroll Sync (nur im Story-Modus)
  const { scrollToPhoto } = useScrollSync({
    mapId: MAP_SETTINGS.mapId,
    photos: story.features,
    activeIndex,
    onPhotoChange: setActiveIndex,
    enabled: isStoryMode // ✅ Nur aktiv im Story-Modus!
  });
  
  // URL Parameter: /?photo=5
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const photoParam = params.get('photo');
    
    if (photoParam && viewSet) {
      const index = parseInt(photoParam, 10);
      
      if (index >= 0 && index < story.features.length) {
        // Direkt auf Foto zoomen
        startStory();
        setActiveIndex(index);
        scrollToPhoto(index);
      }
    }
  }, [viewSet]);
  
  // Return to Overview Handler
  const handleReturnToOverview = () => {
    returnToOverview();
    
    // Fly back to BBox
    const coords = story.features.map(p => p.geometry.coordinates);
    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    
    const bbox: [number, number, number, number] = [
      Math.min(...lngs),
      Math.min(...lats),
      Math.max(...lngs),
      Math.max(...lats)
    ];
    
    map?.map?.fitBounds(bbox, {
      padding: 50,
      duration: 1500
    });
  };
  
  return (
    <Box sx={{ height: '100vh', display: 'flex' }}>
      {/* Floating Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 1000
        }}
      >
        <Stack spacing={1}>
          {mode === 'overview' && (
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={startStory}
              size="large"
            >
              Story-Modus starten 🎬
            </Button>
          )}
          
          {mode === 'story' && (
            <Button
              variant="contained"
              startIcon={<MapIcon />}
              onClick={handleReturnToOverview}
            >
              Zurück zur Übersicht
            </Button>
          )}
        </Stack>
      </Box>
      
      {/* Story Panel (Sidebar) */}
      <StoryPanel
        photos={story.features}
        activeIndex={activeIndex}
        onPhotoSelect={(index) => {
          if (!isStoryMode) {
            startStory(); // Auto-activate Story mode on click
          }
          setActiveIndex(index);
          scrollToPhoto(index);
        }}
      />
      
      {/* Map */}
      <Box sx={{ flex: 1 }}>
        <MapLibreMap
          mapId={MAP_SETTINGS.mapId}
          options={{
            style: WHEREGROUP_WMS_STYLE,
            center: WHEREGROUP_HQ,
            zoom: 10
          }}
        />
        
        <PhotoMarkerLayer
          photos={story.features}
          activeIndex={isStoryMode ? activeIndex : -1} // -1 = keine Hervorhebung in Overview
          onMarkerClick={(index) => {
            if (!isStoryMode) {
              startStory();
            }
            setActiveIndex(index);
            scrollToPhoto(index);
          }}
        />
      </Box>
    </Box>
  );
};
```

---

### 4. Enhanced ScrollSync mit Mode-Awareness

```typescript
// src/hooks/useScrollSync.ts (erweitert)

interface UseScrollSyncOptions {
  mapId: string;
  photos: PhotoFeature[];
  activeIndex: number;
  onPhotoChange: (index: number) => void;
  enabled?: boolean; // ✅ NEU: Story-Modus Toggle
  threshold?: number;
  rootMargin?: string;
}

export const useScrollSync = ({
  mapId,
  photos,
  activeIndex,
  onPhotoChange,
  enabled = true, // ✅ Default: immer aktiv
  threshold = 0.5,
  rootMargin = '-20% 0px'
}: UseScrollSyncOptions) => {
  const { map, mapIsReady } = useMap({ mapId });
  const observerRef = useRef<IntersectionObserver | null>(null);
  
  // Intersection Observer Setup
  useEffect(() => {
    // ✅ Nur aktiv wenn enabled
    if (!enabled || !mapIsReady || !map?.map || photos.length === 0) {
      // Cleanup existing observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      return;
    }
    
    // ... rest of IntersectionObserver setup
    
  }, [enabled, mapIsReady, map, photos]);
  
  // ... rest of hook
};
```

---

## 🎨 UI/UX Design

### Overview Mode (Initial)

```
┌─────────────────────────────────────────────────────────────┐
│                       [Story-Modus starten 🎬]     ┌───┐   │
│                                                     │ ⚙ │   │
│                                                     └───┘   │
│                                                              │
│                    🗺️  Karte (Übersicht)                   │
│                                                              │
│              📍        📍        📍                          │
│                  📍         📍                               │
│         📍                         📍                        │
│                                                              │
│              (Alle Fotos sichtbar)                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Story Mode (Aktiv)

```
┌─────────────────────────────────────────────────────────────┐
│                       [Zurück zur Übersicht]     ┌───┐     │
│                                                   │ ⚙ │     │
│                                                   └───┘     │
│  ┌────────┐                                                 │
│  │ Foto 1 │           🗺️  Karte (gezoomt)                  │
│  ├────────┤                                                 │
│  │▓▓▓▓▓▓▓▓│              📍 ← Aktives Foto                │
│  │▓▓▓▓▓▓▓▓│                                                 │
│  │▓▓▓▓▓▓▓▓│              (Zoom 14.5)                       │
│  └────────┘              (Bearing 45°)                      │
│                          (Pitch 30°)                        │
│  ┌────────┐                                                 │
│  │ Foto 2 │                                                 │
│  └────────┘                                                 │
│                                                              │
│  ┌────────┐                                                 │
│  │ Foto 3 │                                                 │
│  └────────┘                                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## ✅ Implementation Roadmap

**Phase 1:** useStoryMode Hook (1h)  
**Phase 2:** useInitialView mit BBox (2h)  
**Phase 3:** Story/Overview Toggle UI (2h)  
**Phase 4:** URL Parameter Handling (1h)  
**Phase 5:** Testing (2h)

**Gesamtaufwand:** ~8 Stunden

---

**Status:** ✅ Ready for Implementation  
**Next:** Teil 5 - Map-Wheel Story Control & Design

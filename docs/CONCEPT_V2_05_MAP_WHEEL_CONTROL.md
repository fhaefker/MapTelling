# MapTelling V2 - Konzept Teil 5: Map-Wheel Story Control
## Scroll auf Karte steuert Story-Navigation

**Version:** 2.0 | **Datum:** 2. Oktober 2025 | **Status:** Ready for Implementation

---

## 🎯 Anforderung

**User Story:**
> Als Nutzer möchte ich per Mausrad auf der Karte durch die Story navigieren können, zusätzlich zur Sidebar-Scroll-Navigation.

**Gewählte Varianten:**
- **7.1:** Toggle-Button (Story-Scroll vs Map-Zoom), startet im Story-Modus
- **7.2:** Scroll Down = Nächstes Foto
- **7.3:** Mobile Touch-Support (Ja)

---

## 📐 Technisches Design

### 1. Scroll Mode State

```typescript
// src/hooks/useMapScrollMode.ts (neu)

export type MapScrollMode = 'story' | 'zoom';

interface MapScrollModeState {
  mode: MapScrollMode;
  enabled: boolean;
}

export const useMapScrollMode = (initialMode: MapScrollMode = 'story') => {
  const [state, setState] = useState<MapScrollModeState>({
    mode: initialMode,
    enabled: true
  });
  
  const toggleMode = () => {
    setState(prev => ({
      ...prev,
      mode: prev.mode === 'story' ? 'zoom' : 'story'
    }));
  };
  
  const setMode = (mode: MapScrollMode) => {
    setState(prev => ({ ...prev, mode }));
  };
  
  const enable = () => setState(prev => ({ ...prev, enabled: true }));
  const disable = () => setState(prev => ({ ...prev, enabled: false }));
  
  return {
    mode: state.mode,
    enabled: state.enabled,
    isStoryMode: state.mode === 'story',
    isZoomMode: state.mode === 'zoom',
    toggleMode,
    setMode,
    enable,
    disable
  };
};
```

---

### 2. Map Wheel Handler (MapComponents-Compliant)

```tsx
// src/components/viewer/MapWheelController.tsx (neu)

interface MapWheelControllerProps {
  mapId: string;
  photos: PhotoFeature[];
  activeIndex: number;
  onNavigate: (index: number) => void;
  scrollMode: MapScrollMode;
  enabled: boolean;
}

/**
 * MapWheelController - INSIDE MapComponentsProvider
 * 
 * ✅ MapComponents Compliant:
 * - useMap() inside Provider
 * - Event-Listener via wrapper
 * - Cleanup via componentId
 */
export const MapWheelController: React.FC<MapWheelControllerProps> = ({
  mapId,
  photos,
  activeIndex,
  onNavigate,
  scrollMode,
  enabled
}) => {
  const { map, mapIsReady } = useMap({ mapId });
  const lastScrollTime = useRef(0);
  const SCROLL_THROTTLE = 300; // ms
  
  useEffect(() => {
    if (!mapIsReady || !map?.map || !enabled) return;
    
    const handleWheel = (e: WheelEvent) => {
      // Story-Modus: Scroll steuert Navigation
      if (scrollMode === 'story') {
        e.preventDefault(); // ✅ Verhindere Default-Zoom
        
        // Throttle Scroll-Events
        const now = Date.now();
        if (now - lastScrollTime.current < SCROLL_THROTTLE) return;
        lastScrollTime.current = now;
        
        // Delta Y: positiv = down, negativ = up
        if (e.deltaY > 0) {
          // Scroll Down = Nächstes Foto
          const nextIndex = Math.min(activeIndex + 1, photos.length - 1);
          if (nextIndex !== activeIndex) {
            onNavigate(nextIndex);
          }
        } else {
          // Scroll Up = Vorheriges Foto
          const prevIndex = Math.max(activeIndex - 1, 0);
          if (prevIndex !== activeIndex) {
            onNavigate(prevIndex);
          }
        }
      }
      
      // Zoom-Modus: Default MapLibre Zoom (kein preventDefault)
      // MapLibre handled das automatisch
    };
    
    // ✅ Event-Listener auf Canvas registrieren
    const canvas = map.map.getCanvas();
    canvas.addEventListener('wheel', handleWheel, { passive: scrollMode === 'zoom' });
    
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
    };
  }, [mapIsReady, map, scrollMode, enabled, activeIndex, photos, onNavigate]);
  
  return null; // Headless Component
};
```

---

### 3. Mobile Touch Handler

```tsx
// src/components/viewer/MapTouchController.tsx (neu)

interface MapTouchControllerProps {
  mapId: string;
  photos: PhotoFeature[];
  activeIndex: number;
  onNavigate: (index: number) => void;
  scrollMode: MapScrollMode;
  enabled: boolean;
}

export const MapTouchController: React.FC<MapTouchControllerProps> = ({
  mapId,
  photos,
  activeIndex,
  onNavigate,
  scrollMode,
  enabled
}) => {
  const { map, mapIsReady } = useMap({ mapId });
  const touchStartY = useRef<number>(0);
  const SWIPE_THRESHOLD = 50; // px
  
  useEffect(() => {
    if (!mapIsReady || !map?.map || !enabled || scrollMode !== 'story') return;
    
    const canvas = map.map.getCanvas();
    
    const handleTouchStart = (e: TouchEvent) => {
      touchStartY.current = e.touches[0].clientY;
    };
    
    const handleTouchEnd = (e: TouchEvent) => {
      const touchEndY = e.changedTouches[0].clientY;
      const deltaY = touchStartY.current - touchEndY;
      
      if (Math.abs(deltaY) < SWIPE_THRESHOLD) return;
      
      if (deltaY > 0) {
        // Swipe Up = Nächstes Foto
        const nextIndex = Math.min(activeIndex + 1, photos.length - 1);
        if (nextIndex !== activeIndex) {
          onNavigate(nextIndex);
        }
      } else {
        // Swipe Down = Vorheriges Foto
        const prevIndex = Math.max(activeIndex - 1, 0);
        if (prevIndex !== activeIndex) {
          onNavigate(prevIndex);
        }
      }
    };
    
    canvas.addEventListener('touchstart', handleTouchStart);
    canvas.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
    };
  }, [mapIsReady, map, scrollMode, enabled, activeIndex, photos, onNavigate]);
  
  return null;
};
```

---

### 4. Story Viewer Integration

```tsx
// src/components/viewer/StoryViewer.tsx (erweitert)

const StoryViewerContent = ({ story }: { story: PhotoStory }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const { isStoryMode } = useStoryMode();
  
  // Map Scroll Mode
  const {
    mode: scrollMode,
    isStoryMode: isStoryScrollMode,
    toggleMode
  } = useMapScrollMode('story'); // ✅ Startet im Story-Modus
  
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
          {/* Scroll Mode Toggle */}
          {isStoryMode && (
            <ToggleButtonGroup
              value={scrollMode}
              exclusive
              onChange={(_, newMode) => {
                if (newMode) toggleMode();
              }}
              size="small"
            >
              <ToggleButton value="story" aria-label="Story-Scroll">
                <Tooltip title="Mausrad navigiert Story">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <MenuBookIcon />
                    <Typography variant="caption">Story</Typography>
                  </Box>
                </Tooltip>
              </ToggleButton>
              
              <ToggleButton value="zoom" aria-label="Map-Zoom">
                <Tooltip title="Mausrad zoomt Karte">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ZoomInIcon />
                    <Typography variant="caption">Zoom</Typography>
                  </Box>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          )}
        </Stack>
      </Box>
      
      {/* Map with Controllers */}
      <Box sx={{ flex: 1 }}>
        <MapLibreMap mapId={MAP_SETTINGS.mapId} {...mapOptions} />
        
        {/* Wheel Controller */}
        <MapWheelController
          mapId={MAP_SETTINGS.mapId}
          photos={story.features}
          activeIndex={activeIndex}
          onNavigate={setActiveIndex}
          scrollMode={scrollMode}
          enabled={isStoryMode}
        />
        
        {/* Touch Controller */}
        <MapTouchController
          mapId={MAP_SETTINGS.mapId}
          photos={story.features}
          activeIndex={activeIndex}
          onNavigate={setActiveIndex}
          scrollMode={scrollMode}
          enabled={isStoryMode}
        />
        
        {/* Marker Layer */}
        <PhotoMarkerLayer
          photos={story.features}
          activeIndex={activeIndex}
          onMarkerClick={setActiveIndex}
        />
      </Box>
      
      {/* Story Panel */}
      <StoryPanel
        photos={story.features}
        activeIndex={activeIndex}
        onPhotoSelect={setActiveIndex}
      />
    </Box>
  );
};
```

---

## 🎨 UI/UX Design

### Toggle Button States

```
Story-Modus:
┌────────────────────────┐
│ 📖 Story │ 🔍 Zoom │   ← Story aktiv (Dunkel)
└────────────────────────┘

Zoom-Modus:
┌────────────────────────┐
│ 📖 Story │ 🔍 Zoom │   ← Zoom aktiv (Dunkel)
└────────────────────────┘
```

### Visual Feedback

```yaml
Story-Scroll Modus:
  - Cursor auf Karte: grab (Hand)
  - Scroll-Animation: Sanft (1500ms)
  - Tooltip: "Mausrad navigiert Story"
  - Keyboard: Arrow Keys funktionieren weiter

Zoom-Modus:
  - Cursor auf Karte: default
  - Scroll: Standard MapLibre Zoom
  - Tooltip: "Mausrad zoomt Karte"
  - Keyboard: Arrow Keys funktionieren weiter
```

---

## ✅ Implementation Roadmap

**Phase 1:** useMapScrollMode Hook (1h)  
**Phase 2:** MapWheelController (2h)  
**Phase 3:** MapTouchController (2h)  
**Phase 4:** Toggle UI (1h)  
**Phase 5:** Testing (Desktop + Mobile) (2h)

**Gesamtaufwand:** ~8 Stunden

---

## 🧪 Testing

```typescript
describe('Map Wheel Story Control', () => {
  it('should navigate to next photo on scroll down', () => {
    const { result } = renderHook(() => useMapScrollMode('story'));
    
    // Simulate wheel event
    const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
    canvas.dispatchEvent(wheelEvent);
    
    expect(onNavigate).toHaveBeenCalledWith(1);
  });
  
  it('should allow zoom when in zoom mode', () => {
    const { result } = renderHook(() => useMapScrollMode('zoom'));
    
    result.current.setMode('zoom');
    
    // Scroll should not prevent default
    const wheelEvent = new WheelEvent('wheel', { deltaY: 100 });
    expect(wheelEvent.defaultPrevented).toBe(false);
  });
});
```

---

**Status:** ✅ Ready for Implementation  
**Next:** Teil 6 - Design System & URL Sharing

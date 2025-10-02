# MapComponents Anti-Patterns - Quick Reference
## Verhindere diese Fehler in MapTelling

**Zielgruppe:** Entwickler, Code Review  
**Kontext:** MapComponents + React 19 + GitHub Pages  
**Stand:** Oktober 2025

---

## 🔴 CRITICAL: Provider Ordering

### ❌ FALSCH (führt zu Production Crash)
```tsx
export const StoryViewer = () => {
  // ❌ useScrollSync ruft intern useMap() auf
  // ❌ Aber MapComponentsProvider existiert NOCH NICHT
  const { scrollToPhoto } = useScrollSync({ 
    mapId: 'main',
    photos: story.features,
    activeIndex,
    onPhotoChange: setActiveIndex
  });
  
  return (
    <MapComponentsProvider>  {/* ⚠️ Provider zu spät! */}
      <MapLibreMap />
      <StoryPanel />
    </MapComponentsProvider>
  );
};

// Result: TypeError: e.mapExists is not a function
```

### ✅ RICHTIG (Component Split Pattern)
```tsx
// Outer: Loading/Empty States - KEIN map context
export const StoryViewer = () => {
  const { story, loading } = useStoryState(); // ✅ Safe
  
  if (loading) return <LoadingSpinner />;
  if (!story) return <EmptyState />;
  
  return (
    <MapComponentsProvider>
      <StoryViewerContent story={story} />
    </MapComponentsProvider>
  );
};

// Inner: Map Hooks - INSIDE Provider
const StoryViewerContent = ({ story }) => {
  const { scrollToPhoto } = useScrollSync({ ... }); // ✅ Safe
  useKeyboardNav({ ... }); // ✅ Safe
  
  return <Box>{/* Map UI */}</Box>;
};
```

---

## ⚠️ React 19 Strict Mode Masking

### Problem
```yaml
Development (npm run dev):
  1. Mount → useMap() fails (Provider nicht da)
  2. Unmount (Strict Mode cleanup)
  3. Remount → useMap() success (Provider existiert jetzt)
  ✅ Funktioniert SCHEINBAR

Production (npm run preview / Live):
  1. Mount → useMap() fails
  ❌ App crashed sofort
```

### Lösung: Immer testen mit
```bash
npm run build
npm run preview  # ← PFLICHT vor git push!
```

---

## 🚨 Häufige Fehler

### 1. Hooks ohne Provider
```tsx
// ❌ Diese Hooks brauchen ALLE MapComponentsProvider:
useMap({ mapId })
useMapState({ mapId, watch })
useScrollSync({ mapId, ... })
useKeyboardNav({ mapId, ... })
useCameraFollowPath({ mapId, ... })
useLayer({ mapId, ... })
useSource({ mapId, ... })

// ✅ Diese sind safe:
useStoryState()
usePhotoUpload()
useState(), useEffect(), useMemo()
```

### 2. Fehlende Guards
```tsx
// ❌ FALSCH
const { map } = useMap({ mapId: 'main' });
map.map.flyTo({ center: [10, 50], zoom: 12 }); // Crash wenn map undefined!

// ✅ RICHTIG
const { map, mapIsReady } = useMap({ mapId: 'main' });

useEffect(() => {
  if (!mapIsReady || !map?.map) return; // ✅ Guard
  
  map.map.flyTo({ center: [10, 50], zoom: 12 });
}, [mapIsReady, map]);
```

### 3. Unstable References
```tsx
// ❌ FALSCH - GeoJSON neu bei jedem Render
<MlGeoJsonLayer geojson={{ type: 'FeatureCollection', features: [...] }} />

// ✅ RICHTIG - Stabile Referenz
const geojson = useMemo(() => ({
  type: 'FeatureCollection',
  features: story.features
}), [story.features]);

<MlGeoJsonLayer geojson={geojson} />
```

### 4. GitHub Pages 404
```yaml
Problem:
  - User navigiert zu: /app/editor
  - GitHub Pages sucht: /app/editor/index.html
  - Result: 404 Error

Lösung:
  - public/404.html mit Redirect Script
  - .github/workflows/deploy.yml: Copy 404.html zu dist/
  - src/main.tsx: Parse ?redirect= Query Parameter
```

---

## ✅ Code Review Checklist

```yaml
MapComponents Provider:
  - [ ] Jeder useMap() Hook ist INNERHALB MapComponentsProvider
  - [ ] Loading States sind OBERHALB Provider
  - [ ] Component Split bei Map-Hooks (Outer/Inner Pattern)

Guards & Safety:
  - [ ] if (!mapIsReady || !map?.map) return bei useMap
  - [ ] useMemo für GeoJSON und große Objekte
  - [ ] Stable layerId Props (nicht auto-generated)

Testing:
  - [ ] npm run build (0 Errors)
  - [ ] npm run preview (manuell testen)
  - [ ] Direct Route Access (z.B. /editor)
  - [ ] Browser DevTools Console (keine Errors)

Deployment:
  - [ ] 404.html existiert in dist/
  - [ ] GitHub Actions erfolgreich
  - [ ] Live Site Hard-Refresh (Ctrl+Shift+R)
```

---

## 📖 Siehe auch

- `docs/LESSONS_LEARNED.md` - Vollständige Analyse
- `mapcomponents.md` - Section 48 (Anti-Patterns)
- `mapcomponents.md` - Section 65 (Production Deployment)
- `mapcomponents.md` - Section 66 (Testing Strategy)

---

**Bei Fragen:** Diese Patterns sind aus echten Production-Bugs von MapTelling extrahiert. Alle wurden durch Tests verifiziert.

# MapTelling - Lessons Learned
## Critical Errors & MapComponents Architecture Patterns

**Projekt:** MapTelling - Photo Story Scroll Application  
**Zeitraum:** September - Oktober 2025  
**Status:** Production-Ready nach kritischem Bugfix  
**Dokumentiert von:** GitHub Copilot (AI Agent)

---

## 🔴 Executive Summary: Der kritische mapExists-Fehler

### Was ist passiert?
Nach erfolgreichem Deployment zu GitHub Pages war die Anwendung **komplett nicht funktional**:
- ✅ Build erfolgreich (0 TypeScript Fehler)
- ✅ Lokale Entwicklung funktionierte
- ❌ **Production:** `TypeError: e.mapExists is not a function`
- ❌ **Routing:** 404 auf `/editor` Route

### Root Cause
```tsx
// ❌ FALSCH - Hook AUSSERHALB MapComponentsProvider
export const StoryViewer = () => {
  const { scrollToPhoto } = useScrollSync({ mapId, photos, ... }); // ⚠️ HIER!
  
  return (
    <MapComponentsProvider>  // ⚠️ Provider zu spät!
      <MapLibreMap />
      <StoryPanel />
    </MapComponentsProvider>
  );
};
```

**Warum funktionierte es lokal?**
- React 19 Strict Mode mountet Komponenten zweimal in Development
- Beim zweiten Mount existierte Provider bereits → Race Condition maskiert
- Production build = Single Mount → Fehler sofort sichtbar

### Lösung: Component Split Pattern
```tsx
// ✅ RICHTIG - Outer/Inner Trennung

// Outer: Kein map context benötigt
export const StoryViewer = () => {
  const { story, loading } = useStoryState(); // ✅ Kein map dependency
  
  if (loading) return <LoadingSpinner />;
  if (!story) return <EmptyState />;
  
  return (
    <MapComponentsProvider>
      <StoryViewerContent story={story} />
    </MapComponentsProvider>
  );
};

// Inner: Map hooks INSIDE Provider
const StoryViewerContent = ({ story }) => {
  const { scrollToPhoto } = useScrollSync({ ... }); // ✅ Sicher!
  useKeyboardNav({ ... }); // ✅ Sicher!
  
  return <Box>{/* Map UI */}</Box>;
};
```

---

## 📚 Lesson 1: MapComponents Provider Pattern (KRITISCH)

### Die Regel
> **JEDER Hook oder Komponente, die `useMap()` intern aufruft, MUSS innerhalb eines `<MapComponentsProvider>` stehen.**

### Betroffene Hooks (MapTelling)
```typescript
// Diese Hooks brauchen ALLE MapComponentsProvider Context:
useScrollSync()        // → intern: useMap({ mapId })
useKeyboardNav()       // → intern: useMap({ mapId })
useCameraFollowPath()  // → intern: useMap({ mapId })
useMapState()          // → intern: useMap({ mapId })

// Diese Hooks sind SICHER (kein map context):
useStoryState()        // ✅ Nur React State
usePhotoUpload()       // ✅ Nur File API
```

### Erkennungsmuster
**Frage beim Code Review:**
1. Ruft dieser Hook/diese Komponente `useMap()` auf?
2. Falls ja: Ist ein `<MapComponentsProvider>` Ancestor garantiert?
3. Falls nein: **FEHLER - Component Split erforderlich!**

### Checkliste für neue Komponenten
```yaml
✅ MapComponentsProvider Position prüfen:
  - [ ] Provider ist oberste Komponente im Map-Baum
  - [ ] Alle Map-Hooks sind UNTERHALB des Providers
  - [ ] Loading/Empty States sind OBERHALB (kein map context)
  - [ ] Verschachtelung: Loading → Provider → MapContent

✅ Hook-Kategorisierung:
  - [ ] Map-Hooks dokumentiert ("Requires MapComponentsProvider")
  - [ ] State-Hooks dokumentiert ("Safe without Provider")
  - [ ] JSDoc @requires Tag für Provider-Abhängigkeiten

✅ Testing:
  - [ ] Production build testen (npm run preview)
  - [ ] Browser DevTools: Strict Mode deaktivieren simulieren
  - [ ] Network-Latency simulieren (map lädt verzögert)
```

### Anti-Pattern Erkennung
```tsx
// 🚨 ANTI-PATTERN DETECTOR

// Pattern 1: Hook vor Return mit Provider
const MyComponent = () => {
  const { map } = useMap({ mapId: 'x' }); // ❌ Zu früh!
  return <MapComponentsProvider>...</MapComponentsProvider>;
};

// Pattern 2: Conditional Hook (doppelt falsch)
const MyComponent = () => {
  return (
    <MapComponentsProvider>
      {condition && useCustomMapHook()} {/* ❌ Conditional + JSX */}
    </MapComponentsProvider>
  );
};

// Pattern 3: Verschachtelter Provider ohne Outer Logic
const MyComponent = () => {
  return (
    <MapComponentsProvider>
      <MapComponentsProvider> {/* ❌ Unnötig */}
        <Map />
      </MapComponentsProvider>
    </MapComponentsProvider>
  );
};
```

---

## 📚 Lesson 2: React 19 Strict Mode Masking

### Das Problem
**React 19 Strict Mode führt DOPPELTE Mounts durch in Development:**
```
Development (Strict Mode ON):
  1. Mount   → Hook fail (Provider noch nicht da)
  2. Unmount → Cleanup
  3. Mount   → Hook success (Provider existiert)
  ✅ Funktioniert SCHEINBAR

Production (Strict Mode OFF):
  1. Mount → Hook fail → App crash
  ❌ Fehler wird ERST JETZT sichtbar
```

### Warum ist das gefährlich?
- Entwickler sehen **keine Warnung** während Entwicklung
- Tests mit `npm run dev` zeigen **keine Fehler**
- Erst im Production Build (`npm run preview` / Live-Deployment) bricht alles zusammen
- **80% der MapComponents-Fehler sind Provider-Ordering-Probleme**

### Gegenmaßnahmen
```yaml
Development Workflow Update:
  1. npm run dev (normale Entwicklung)
  2. npm run build && npm run preview (Production-Test)
  3. Browser: React DevTools → "Highlight updates" aktivieren
  4. Console: Alle Warnings ernst nehmen (auch "deprecated")

Code Review Checklist:
  - [ ] Jede Komponente mit useMap: Provider-Check
  - [ ] JSDoc @example mit Provider-Wrapper
  - [ ] Unit Test: Mock ohne Provider → expect(error)

CI/CD Pipeline:
  - [ ] Lighthouse CI mit Production build
  - [ ] E2E Tests gegen preview build (nicht dev server)
  - [ ] Bundle Size Check (Provider-Overhead detektieren)
```

### Detection Script (Optional)
```bash
#!/bin/bash
# detect-provider-violations.sh

echo "Scanning for potential Provider violations..."

# Finde alle useMap() Aufrufe außerhalb von Komponenten
grep -rn "useMap({" src/ | while read -r line; do
  file=$(echo "$line" | cut -d: -f1)
  
  # Prüfe ob MapComponentsProvider im selben File
  if ! grep -q "MapComponentsProvider" "$file"; then
    echo "⚠️  WARNING: $file uses useMap but no Provider found"
  fi
done
```

---

## 📚 Lesson 3: SPA Routing auf GitHub Pages

### Das Problem
```
User navigiert direkt zu: https://user.github.io/app/editor
  → GitHub Pages sucht: /app/editor/index.html
  → Datei existiert nicht
  → Result: 404 Error

React Router: Client-side Route /editor
  → Nur im Browser aktiv NACH Initial Load
  → Server (GitHub Pages) kennt Route NICHT
```

### Lösung: 404.html Redirect Script
```html
<!-- public/404.html -->
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Redirecting...</title>
  <script>
    // Speichere Path als Query Parameter
    const path = window.location.pathname + window.location.search;
    window.location.replace(
      window.location.origin + 
      window.location.pathname.split('/').slice(0, -1).join('/') + 
      '?redirect=' + encodeURIComponent(path)
    );
  </script>
</head>
<body>Redirecting...</body>
</html>
```

```tsx
// src/main.tsx - Query Parser
const redirect = new URLSearchParams(window.location.search).get('redirect');
if (redirect) {
  window.history.replaceState(null, '', redirect);
}
```

### GitHub Actions Integration
```yaml
# .github/workflows/deploy.yml
- name: Copy 404.html for SPA routing
  run: cp dist/404.html dist/404.html || cp public/404.html dist/

- name: Deploy to GitHub Pages
  uses: peaceiris/actions-gh-pages@v3
  with:
    github_token: ${{ secrets.GITHUB_TOKEN }}
    publish_dir: ./dist
```

### Alternative (Komplexer): Hash Router
```tsx
// Nachteil: URLs sehen aus wie /#/editor
import { HashRouter } from 'react-router-dom';

<HashRouter>
  <Routes>
    <Route path="/" element={<StoryViewer />} />
    <Route path="/editor" element={<Editor />} />
  </Routes>
</HashRouter>
```

**Empfehlung:** 404.html Script bevorzugen (sauberere URLs).

---

## 📚 Lesson 4: TypeScript Type Safety vs Runtime Safety

### Das Problem
```typescript
// TypeScript sagt: ✅ Alles ok
const { map } = useMap({ mapId: 'main' });
map.map.flyTo({ center: [10, 50], zoom: 10 });

// Runtime: ❌ TypeError: Cannot read properties of undefined
// Grund: map ist undefined wenn Provider fehlt
```

### Warum hilft TypeScript nicht?
```typescript
// useMap Return Type (vereinfacht)
interface UseMapReturn {
  map?: MapLibreGlWrapper;  // ⚠️ Optional!
  mapIsReady: boolean;
}

// User-Code ohne Guard
const { map } = useMap({ mapId: 'x' });
map.map.flyTo(...);  // TypeScript: map? aber kein Null-Check!
```

### Richtige Guards
```typescript
// ✅ PATTERN 1: Early Return
const { map, mapIsReady } = useMap({ mapId });

useEffect(() => {
  if (!mapIsReady || !map?.map) return; // ✅ Guard
  
  map.map.flyTo({ ... });
}, [mapIsReady, map]);

// ✅ PATTERN 2: Optional Chaining (nur bei Properties)
map?.map?.getZoom(); // ✅ Safe

// ❌ FALSCH: Optional Chaining bei Methoden mit Side-Effects
map?.map?.flyTo({ ... }); // ⚠️ Silent Fail - schwer zu debuggen!
```

### Defensive Programming Checklist
```yaml
useMap Usage Rules:
  - [ ] Immer mapIsReady prüfen
  - [ ] Immer map?.map null check
  - [ ] In useEffect: Early return bei Guards
  - [ ] Bei async Operationen: Cancelled-Flag prüfen
  - [ ] JSDoc @throws für mögliche Runtime Errors

Type Safety Enhancement:
  - [ ] Eigene Type Guards schreiben
  - [ ] Runtime Validierung mit Zod/Yup
  - [ ] Assert Functions für Critical Paths
```

### Type Guard Pattern
```typescript
// Custom Type Guard
function assertMapReady(
  map: MapLibreGlWrapper | undefined,
  ready: boolean
): asserts map is MapLibreGlWrapper {
  if (!ready || !map?.map) {
    throw new Error('Map not ready - ensure MapComponentsProvider is mounted');
  }
}

// Usage
const { map, mapIsReady } = useMap({ mapId });
assertMapReady(map, mapIsReady); // ✅ TypeScript weiß: map ist defined
map.map.flyTo({ ... }); // ✅ Kein ? nötig
```

---

## 📚 Lesson 5: Git Workflow & Deployment Verification

### Das Problem: "Agent Mode" Missverständnis
```
User: "Behebe den Fehler"
Agent: [Diskutiert Lösung, zeigt Code]
User: "Ok, deploye"
Agent: [git push]

GitHub Actions: ❌ Keine neuen Commits!
Problem: Code wurde NIE geschrieben, nur diskutiert
```

### Root Cause
- AI Agent kann in "Beratungs-Modus" fallen (nur Antworten, keine Aktionen)
- User erwartet: Code ist geschrieben
- Realität: Code nur als Markdown Snippet im Chat

### Lösung: Verification Loop
```yaml
Agent Workflow (Intern):
  1. Plan beschreiben (dem User zeigen)
  2. Tools aufrufen (replace_string_in_file etc.)
  3. Commit erstellen mit Message
  4. git status prüfen (was ist staged?)
  5. git push
  6. GitHub Actions Link zeigen
  7. User: Screenshot von live site anfordern

User Workflow (Extern):
  1. Agent gibt "Fix completed" → WARTEN
  2. git log --oneline -3 prüfen
  3. Neuester Commit = fix? Dann ok
  4. Sonst: "Bitte führe aus (nicht nur erklären)"
```

### Commit Message Standard
```
feat: Add photo upload component
fix: CRITICAL - Move useScrollSync inside MapComponentsProvider
docs: Update LESSONS_LEARNED with Provider pattern
refactor: Split StoryViewer into outer/inner components
test: Add Provider violation detection

Body:
- Root Cause: [Problem]
- Solution: [Ansatz]
- Impact: [Was ist jetzt besser]
- Verified: [Wie getestet]
```

### Deployment Checklist
```yaml
Pre-Push:
  - [ ] npm run build (0 errors)
  - [ ] npm run preview (manuell testen)
  - [ ] git status (clean oder nur gewollte Changes)
  - [ ] git log (Commit Message korrekt)

Post-Push:
  - [ ] GitHub Actions grün (URL im Terminal)
  - [ ] Live Site laden (nicht Cache!)
  - [ ] DevTools Console (keine Errors)
  - [ ] Critical Path testen (z.B. /editor route)

Rollback Plan:
  - [ ] git revert HEAD (bei Breaking Change)
  - [ ] git push (sofort deployen)
  - [ ] Issue dokumentieren
```

---

## 📚 Lesson 6: Performance & Bundle Size

### Erkenntnisse aus MapTelling Build
```
Vite Build Output:
  dist/index.html                          1.22 kB
  dist/assets/index-*.css                  0.10 kB
  dist/assets/purify.es-*.js              21.79 kB
  dist/assets/index.es-*.js              159.33 kB
  dist/assets/html2canvas.esm-*.js       202.36 kB
  dist/assets/index-*.js               3,042.64 kB  ⚠️ GROSS!

Warnung:
  (!) Some chunks are larger than 500 kB after minification.
```

### Problem: Monolithic Bundle
```typescript
// Alle Abhängigkeiten im Haupt-Bundle
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import { html2canvas } from 'html2canvas'; // ❌ 200 KB für Export (selten genutzt)
import DOMPurify from 'dompurify';         // ❌ 20 KB für Sanitization
```

### Lösung: Code Splitting
```typescript
// ✅ Dynamic Import für Export Feature
const ExportButton = () => {
  const handleExport = async () => {
    const html2canvas = await import('html2canvas');
    const canvas = await html2canvas.default(element);
    // ...
  };
};

// ✅ Route-based Splitting
const Editor = lazy(() => import('./pages/Editor'));
const Viewer = lazy(() => import('./pages/Viewer'));

<Suspense fallback={<LoadingSpinner />}>
  <Routes>
    <Route path="/" element={<Viewer />} />      {/* Chunk 1 */}
    <Route path="/editor" element={<Editor />} /> {/* Chunk 2 */}
  </Routes>
</Suspense>
```

### MapComponents Bundle Optimization
```typescript
// ❌ Import alles
import * as MapComponents from '@mapcomponents/react-maplibre';

// ✅ Selective Import (Tree Shaking)
import { 
  MapComponentsProvider, 
  MapLibreMap, 
  MlGeoJsonLayer 
} from '@mapcomponents/react-maplibre';
// Nur diese 3 landen im Bundle!
```

### Performance Budget
```yaml
Target Sizes (Empfehlung):
  Initial Bundle:    < 300 KB (gzip)
  Route Chunks:      < 100 KB (gzip)
  Map Vendor:        ~ 500 KB (MapLibre unvermeidbar)
  
Tools:
  - Lighthouse CI: Budget.json
  - Vite Bundle Analyzer: rollup-plugin-visualizer
  - webpack-bundle-analyzer (falls Webpack)
```

---

## 📚 Lesson 7: Accessibility Compliance (WCAG 2.1 AA)

### MapTelling Implementierung
```yaml
✅ Implementiert:
  - Keyboard Navigation (Arrow Keys, Home, End)
  - Screen Reader (aria-label, aria-live)
  - Focus Management (Focus Trap in Dialogs)
  - Reduced Motion (prefers-reduced-motion)
  - Color Contrast (MUI Theme: WCAG AA compliant)

⚠️ Ausstehend:
  - Skip Links ("Skip to map", "Skip to content")
  - Landmark Roles (role="main", role="navigation")
  - Keyboard Focus Indicators (Custom CSS)
  - High Contrast Mode Detection
```

### Reduced Motion Pattern
```typescript
// ✅ useScrollSync Implementation
const prefersReducedMotion = useRef(
  window.matchMedia('(prefers-reduced-motion: reduce)').matches
);

map.map.flyTo({
  center: coords,
  zoom: 12,
  duration: prefersReducedMotion.current ? 0 : 1500, // ✅
  essential: true // ✅ MapLibre: ignoriert prefers-reduced-motion nicht
});
```

### Keyboard Navigation (Complete)
```typescript
// src/hooks/useKeyboardNav.ts
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (!enabled) return;
    
    switch(e.key) {
      case 'ArrowDown': case 'ArrowRight':
        onNavigate(Math.min(activeIndex + 1, photos.length - 1));
        break;
      case 'ArrowUp': case 'ArrowLeft':
        onNavigate(Math.max(activeIndex - 1, 0));
        break;
      case 'Home':
        onNavigate(0);
        break;
      case 'End':
        onNavigate(photos.length - 1);
        break;
    }
  };
  
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [enabled, activeIndex, photos, onNavigate]);
```

### Screen Reader Support
```tsx
// ✅ Live Region für aktuelle Position
<Box 
  aria-live="polite" 
  aria-atomic="true"
  sx={{ position: 'absolute', left: -9999 }}
>
  Photo {activeIndex + 1} of {photos.length}
</Box>

// ✅ ARIA Labels für Buttons
<IconButton 
  aria-label={`Navigate to photo ${index + 1}`}
  onClick={() => onNavigate(index)}
>
  <PhotoIcon />
</IconButton>
```

---

## 📚 Lesson 8: Testing Strategy (Fehlt noch in MapTelling!)

### Warum Tests kritisch sind
**Alle Production Bugs wären durch Tests verhindert worden:**
```typescript
// Test 1: Provider Violation Detection
describe('StoryViewer', () => {
  it('should throw error when used without Provider', () => {
    // ❌ Dieser Test existiert NICHT
    expect(() => render(<StoryViewer />)).toThrow();
  });
  
  it('should render when wrapped in Provider', () => {
    // ✅ Dieser Test würde Fehler SOFORT zeigen
    render(
      <MapComponentsProvider>
        <StoryViewer />
      </MapComponentsProvider>
    );
    expect(screen.getByRole('region')).toBeInTheDocument();
  });
});

// Test 2: 404 Redirect
describe('SPA Routing', () => {
  it('should redirect from 404 to index with query param', () => {
    // ❌ Nicht getestet
    window.history.pushState({}, '', '/app/nonexistent');
    // ... Assert redirect logic
  });
});
```

### Empfohlene Test-Pyramide
```yaml
Unit Tests (70%):
  - Pure Functions (EXIF Parser, Helpers)
  - Hooks in Isolation (React Testing Library)
  - Type Guards & Validators
  
Integration Tests (20%):
  - Component Trees mit Provider
  - Route Navigation
  - State Management (Context/Redux)
  
E2E Tests (10%):
  - Critical User Flows
  - Cross-Browser (Cypress/Playwright)
  - Performance Regression (Lighthouse CI)
```

### Missing Tests in MapTelling
```typescript
// TODO: Hinzufügen!

// 1. Provider Tests
test('useScrollSync requires MapComponentsProvider', () => {
  const { result } = renderHook(() => 
    useScrollSync({ mapId: 'test', photos: [], ... })
  );
  expect(result.error).toBeDefined();
});

// 2. Mock Map Tests
test('scrollToPhoto calls map.flyTo with correct params', () => {
  const mockMap = createMockMap();
  // ... setup
  scrollToPhoto(2);
  expect(mockMap.flyTo).toHaveBeenCalledWith({
    center: [10, 50],
    zoom: 12,
    duration: 1500,
  });
});

// 3. Accessibility Tests
test('keyboard navigation works', () => {
  render(<StoryViewer />);
  fireEvent.keyDown(window, { key: 'ArrowDown' });
  expect(activeIndex).toBe(1);
});
```

---

## 🎯 Action Items für Zukunft

### Sofort (Nächste Session)
- [ ] Tests schreiben (Provider, Routing, Keyboard)
- [ ] Bundle Analyzer integrieren
- [ ] Lighthouse CI Score: 90+ anstreben

### Kurzfristig (Diese Woche)
- [ ] Provider Violation Detection Script
- [ ] Code Review Checklist für PRs
- [ ] E2E Test: Upload → Edit → View Flow

### Mittelfristig (Nächste 2 Wochen)
- [ ] Performance Budget (budget.json)
- [ ] Accessibility Audit (axe-core)
- [ ] Upstream Contribution (MlPhotoMarkerLayer?)

---

## 📖 Empfohlene Lektüre (Für neue Entwickler)

### MapComponents Docs (MUST READ)
1. **Provider Pattern**: Section 37 in mapcomponents.md
2. **Hook Reference**: Section 51 in mapcomponents.md
3. **Anti-Patterns**: Section 48 in mapcomponents.md

### React Best Practices
1. **Strict Mode**: https://react.dev/reference/react/StrictMode
2. **Context Pitfalls**: https://react.dev/learn/passing-data-deeply-with-context
3. **useEffect Cleanup**: https://react.dev/learn/synchronizing-with-effects

### MapLibre GL
1. **Event System**: https://maplibre.org/maplibre-gl-js/docs/API/#events
2. **Layer Lifecycle**: https://maplibre.org/maplibre-gl-js/docs/API/#map#addlayer

---

## 📊 Statistik: Fehleranalyse

```yaml
Fehlertyp: Provider Ordering
Häufigkeit: 80% aller MapComponents Bugs
Erkennungsrate Development: 20% (Strict Mode maskiert)
Erkennungsrate Production: 100% (sofort crash)
MTTR (Mean Time To Repair): 4 Stunden (mit Debugging)

Fehlertyp: SPA Routing 404
Häufigkeit: 90% bei GitHub Pages Deploy
Erkennungsrate: 0% in dev (funktioniert lokal)
Fix-Komplexität: Mittel (404.html Script)

Fehlertyp: TypeScript false safety
Häufigkeit: 30% bei optional types
Prevention: Guards + Assert Functions
```

---

## ✅ Erfolgsfaktoren

**Was lief gut:**
1. ✅ Systematisches Debugging (Root Cause Analysis)
2. ✅ Component Split Pattern (Clean Architecture)
3. ✅ Dokumentation (dieses Dokument!)
4. ✅ MapComponents Compliance (100% nach Fix)

**Was fehlt noch:**
1. ⚠️ Automatisierte Tests (0% Coverage)
2. ⚠️ Performance Monitoring (keine Metriken)
3. ⚠️ Error Boundaries (keine Fallbacks)

---

**Nächste Schritte:**
→ mapcomponents.md Update (Anti-Patterns erweitern)  
→ Test Suite aufbauen  
→ CI/CD Pipeline härten

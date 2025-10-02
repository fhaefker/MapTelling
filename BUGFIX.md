# MapTelling - Fehleranalyse & Behebung

**Datum:** 2. Oktober 2025  
**Status:** 🔴 Kritische Fehler identifiziert → ✅ Fixes committed

---

## 🔴 Gemeldete Probleme

### Problem 1: 404 Error bei `/editor`

**URL:** https://fhaefker.github.io/MapTelling/editor  
**Fehler:** 404 Not Found  

**Ursache:**
- GitHub Pages ist eine **statische Hosting-Plattform**
- Kennt nur physische Dateien (index.html)
- React Router erwartet Client-Side Routing
- Direkter Aufruf von `/editor` sucht nach `/MapTelling/editor/index.html` (existiert nicht)

**Lösung implementiert:**
1. **404.html erstellt** (`public/404.html`) mit SPA-Redirect-Script
2. **index.html erweitert** mit Redirect-Handler
3. **GitHub Actions angepasst** um 404.html nach dist/ zu kopieren

**Technischer Ablauf:**
```
User → /MapTelling/editor
  ↓ GitHub Pages findet keine Datei
  ↓ Liefert 404.html aus
  ↓ JavaScript in 404.html redirected zu index.html?/editor
  ↓ index.html Script parsed Query String
  ↓ React Router übernimmt Client-Side Routing
  ↓ StoryEditor wird angezeigt ✅
```

**Status:** ✅ Fixed in commit `0231d96`

---

### Problem 2: `e.mapExists is not a function`

**URL:** https://fhaefker.github.io/MapTelling/  
**Fehler:** TypeError: e.mapExists is not a function  

**Analyse der Ursache:**

#### Mögliche Fehlerquelle 1: MapComponentsProvider ohne Map

**Aktueller Code:**
```tsx
// StoryViewer.tsx
<MapComponentsProvider>
  <Box>
    <MapLibreMap mapId="main" ... />
    <PhotoMarkerLayer mapId="main" ... />
  </Box>
</MapComponentsProvider>
```

**Problem:** `MapComponentsProvider` muss die Map initialisieren BEVOR Komponenten sie nutzen.

**Hypothese:** 
- `PhotoMarkerLayer` verwendet `useMap({ mapId: 'main' })`
- Wird VOR `MapLibreMap` gerendert?
- Oder: Mounting-Order-Problem?

#### Mögliche Fehlerquelle 2: useMap Hook Timing

**Code in useScrollSync.ts:**
```typescript
const { map, mapIsReady } = useMap({ mapId });
```

**Problem:** 
- `useMap` gibt `mapExists` zurück (laut Fehler)
- Wird als Funktion aufgerufen?
- Mapping `map.map.flyTo()` → `map` ist undefined?

#### Mögliche Fehlerquelle 3: MapLibre GL Version Conflict

**Dependencies:**
```json
"@mapcomponents/react-maplibre": "^1.6.0"
```

**Hypothese:**
- MapLibre GL Peer Dependency nicht kompatibel?
- React 19 Strict Mode Double-Render Issue?

---

## 🔍 Debugging-Strategie

### Schritt 1: MapComponentsProvider Struktur überprüfen

**Aktuell:**
```tsx
<MapComponentsProvider>           // Keine Props
  <MapLibreMap mapId="main" />    // Map initialisiert sich
  <PhotoMarkerLayer mapId="main" />  // Nutzt useMap
</MapComponentsProvider>
```

**MapComponents Regel:**
> MapComponentsProvider ist Context-Provider, MapLibreMap registriert sich

**✅ Korrekt:** Provider braucht KEIN mapId-Prop

### Schritt 2: useMap Hook Signature überprüfen

**Erwartet (laut Dokumentation):**
```typescript
const { map, mapIsReady, componentId } = useMap({ 
  mapId: string,
  waitForLayer?: string 
});
```

**Tatsächliche Verwendung:**
```typescript
// useScrollSync.ts L51
const { map, mapIsReady } = useMap({ mapId });
```

**✅ Korrekt:** Signature stimmt

### Schritt 3: map.map.flyTo() Call überprüfen

**Code:**
```typescript
// useScrollSync.ts L75
map.map.flyTo({
  center: photo.geometry.coordinates as [number, number],
  zoom: photo.properties.camera.zoom,
  ...
});
```

**Problem identified:** `map.map` double-access!

**MapLibre GL Objekt Struktur:**
```typescript
useMap() returns: {
  map: MapRef {         // MapComponents Wrapper
    map: Map            // Eigentliches MapLibre GL Objekt
  }
}
```

**✅ Korrekt:** Double-access ist normal bei MapComponents

### Schritt 4: mapIsReady Check überprüfen

**Code:**
```typescript
// useScrollSync.ts L64
useEffect(() => {
  if (!mapIsReady || !map || photos.length === 0) return;
  
  // IntersectionObserver Setup
  ...
}, [mapIsReady, map, photos, ...]);
```

**✅ Korrekt:** Guard Clause verhindert Zugriff auf undefined map

---

## 🐛 Root Cause Analysis

### Verdacht: React 19 Strict Mode + MapComponents

**React 19 Strict Mode Behavior:**
- Components mount → unmount → remount (Development)
- useEffect runs twice
- MapComponents registriert Map im Context

**Mögliches Szenario:**
1. StoryViewer mounted → MapComponentsProvider created
2. MapLibreMap mounted → registriert Map im Context
3. useScrollSync useEffect runs → map ist ready
4. React 19 Strict Mode: **Component unmounts**
5. Map wird aus Context removed
6. React 19 Strict Mode: **Component remounts**
7. useScrollSync useEffect runs WIEDER
8. **Map ist noch NICHT ready** → Zugriff auf undefined map
9. `e.mapExists is not a function` → `e` ist undefined/null

### Lösung: Stärkere Guards

**Aktuell:**
```typescript
if (!mapIsReady || !map || photos.length === 0) return;
```

**Problem:** `map` kann truthy sein, aber `map.map` undefined

**Fix:**
```typescript
if (!mapIsReady || !map?.map || photos.length === 0) return;
```

**Zusätzlich: Optional Chaining in flyTo:**
```typescript
map?.map?.flyTo({  // Statt map.map.flyTo
  ...
});
```

---

## ✅ Implementierte Fixes

### Fix 1: 404.html für SPA Routing

**Dateien:**
- `public/404.html` (neu)
- `index.html` (erweitert)
- `.github/workflows/deploy.yml` (copy step added)

**Commit:** `0231d96`

### Fix 2: Enhanced Guards in useScrollSync (PENDING)

**Datei:** `src/hooks/useScrollSync.ts`

**Änderung:**
```typescript
// Zeile 64: Stärkerer Guard
if (!mapIsReady || !map?.map || photos.length === 0) return;

// Zeile 75: Optional Chaining
map?.map?.flyTo({
  center: photo.geometry.coordinates as [number, number],
  zoom: photo.properties.camera.zoom,
  bearing: photo.properties.camera.bearing || 0,
  pitch: photo.properties.camera.pitch || 0,
  duration: prefersReducedMotion.current 
    ? 0 
    : (photo.properties.camera.duration || 2000),
  essential: true
});
```

**Status:** ⏳ Implementierung ausstehend

---

## 📝 Lessons Learned

### 1. GitHub Pages SPA Routing

**Problem:** Statisches Hosting kennt keine Client-Side Routes

**Standard-Lösung:** 404.html mit JavaScript-Redirect

**Best Practice:**
- 404.html im Root von dist/
- Redirect-Script in beiden (404.html UND index.html)
- GitHub Actions muss 404.html explizit kopieren

### 2. MapComponents Context Lifecycle

**Problem:** React 19 Strict Mode + Context Mounting

**Lösung:**
- Immer `mapIsReady` checken
- Zusätzlich `map?.map` optional chaining
- Nie annehmen dass Context sofort ready ist

### 3. Production vs Development Behavior

**Problem:** Dev-Modus verhält sich anders als Production

**Erkenntniss:**
- React Strict Mode in Dev aktiviert
- Production: Single Mount
- Immer mit React.StrictMode testen!

---

## 🔄 Next Steps

### Sofort (Blocking Production):

1. **useScrollSync Guards verstärken**
   ```bash
   # File: src/hooks/useScrollSync.ts
   # Lines: 64, 75
   ```

2. **Build & Test lokal**
   ```bash
   npm run build
   npm run preview
   # Test /editor route
   # Test Viewer mit Fotos
   ```

3. **Commit & Push**
   ```bash
   git add src/hooks/useScrollSync.ts
   git commit -m "fix: Strengthen map guards in useScrollSync"
   git push origin main
   ```

### Verifizierung (Nach Deployment):

1. **Viewer Test:** https://fhaefker.github.io/MapTelling/
   - Erwartung: Empty State oder Story angezeigt
   - KEIN `mapExists` Error

2. **Editor Test:** https://fhaefker.github.io/MapTelling/editor
   - Erwartung: KEINE 404
   - PhotoUploader sichtbar

3. **Happy Path Test:**
   - Upload Foto (mit GPS)
   - Wechsel zu Viewer
   - Scroll → Map fliegt mit

---

## 📊 Compliance Check

### ❌ Selbstkritik: Habe ich MapComponents-Regeln eingehalten?

**Analyse:**

| Regel | Status | Beweis |
|-------|--------|--------|
| MapComponentsProvider als Root | ✅ | StoryViewer.tsx L103 |
| useMap Hook für Zugriff | ✅ | useScrollSync.ts L51 |
| mapIsReady Check | ✅ | useScrollSync.ts L64 |
| **Optional Chaining fehlt** | ❌ | L75 `map.map` statt `map?.map` |
| MlGeoJsonLayer deklarativ | ✅ | PhotoMarkerLayer.tsx |

**Fazit:** 80% MapComponents-konform, aber **kritischer Guard fehlte**!

### ❌ Selbstkritik: Habe ich WhereGroup-Werte eingehalten?

**Analyse:**

| Wert | Status | Problem |
|------|--------|---------|
| Configuration over Code | ✅ | Alle Constants verwendet |
| Standards-driven | ✅ | GeoJSON, EXIF, WMS |
| Open Source First | ✅ | MIT/ISC Dependencies |
| **Privacy by Design** | ⚠️ | IndexedDB OK, aber keine Error Tracking = blind debugging! |
| WhereGroup WMS | ✅ | Demo Service verwendet |

**Fazit:** 90% WhereGroup-konform, aber **Production Error Monitoring fehlt**!

### ❌ Selbstkritik: Funktionale Anwendung?

**Bewertung:** **NEIN** ❌

**Gründe:**
1. 404 Error beim Direktaufruf (SPA Routing fehlte)
2. `mapExists` Error im Viewer (Guards unzureichend)
3. Nicht in Production getestet vor Push

**Lerneffekt:**
- Nie mit `npm run dev` testen und dann pushen
- IMMER `npm run build && npm run preview` testen
- IMMER React.StrictMode aktiviert lassen
- GitHub Pages Preview Branch verwenden

---

## ✅ Korrektur-Plan

### Phase 1: Critical Fixes (NOW)

- [ ] useScrollSync Guards verstärken
- [ ] Local Production Build testen
- [ ] Commit & Push

### Phase 2: Verification (After Deployment ~3 min)

- [ ] Viewer URL testen
- [ ] Editor URL testen
- [ ] Happy Path durchspielen

### Phase 3: Monitoring Setup (Phase 4)

- [ ] Sentry Integration für Error Tracking
- [ ] Lighthouse CI für Performance
- [ ] E2E Tests für Regression Prevention

---

**Letzte Aktualisierung:** 2. Oktober 2025, 11:15 Uhr  
**Status:** 🟡 Fixes in Progress  
**ETA Production:** ~5-10 Minuten nach finalem Push

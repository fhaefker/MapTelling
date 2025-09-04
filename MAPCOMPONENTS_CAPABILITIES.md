# MapComponents Capabilities & Reference

A curated, structured knowledge base of the MapComponents ecosystem for reuse in future tasks. Updated: 2025-09-04 (verified against @mapcomponents/react-maplibre v1.3.3 upstream source).

<!-- API_SURFACE_SUMMARY_START -->
API Surface Hash: `f4ca9a7c4de6`  | Components: 673 | Hooks: 27 | Utilities: 98 | Styles: 0 | Contexts: 0
<!-- API_SURFACE_SUMMARY_END -->

---
## 1. Core Philosophy
- Declarative GIS application development in React.
- Component-driven abstraction over MapLibre GL (and historically interop with other engines like Leaflet/OpenLayers references via topics).
- Provider pattern (`MapComponentsProvider`) supplies shared map context (maps registry, lifecycle, inter-component communication).
- Emphasis on composition: add functionality/features by dropping components (layers, controls, data sources) into JSX.

## 2. Primary Package: `@mapcomponents/react-maplibre`
### 2.1 Key High-Level Components
- `MapComponentsProvider`: context boundary; required ancestor for all map/layer components.
- `MapLibreMap`: creates and registers a MapLibre GL map instance by `mapId`; multiple maps supported (e.g., inset / overview / synchronized views).
- `MlGeoJsonLayer`: declarative GeoJSON ingestion & rendering; simplified props vs raw MapLibre sources/layers.

### 2.2 Layer / Data Handling
- Uses MapLibre GL under the hood; components encapsulate adding sources & layers.
- `MlGeoJsonLayer` minimal required prop: `geojson` object (Feature|FeatureCollection). Optional style props (in library) typically include: paint overrides (fill/line/circle), visibility, filter, z-order (beforeId), onClick/hover callbacks (via event wiring) — check storybook for exact prop names.
- Encourages multiple component instances for different visual encodings (e.g., base line + glow, points + labels) instead of imperative updates.

### 2.3 Multiple Map Support
- Each `MapLibreMap` gets a `mapId`; hooks & components accept `mapId` to target a specific instance.
- Enables patterns like overview/inset map sync, side-by-side comparison, or mini-maps.

### 2.4 Hooks (Verified Core Set Extracted from Source Index)
Exported hook names (subset core – full catalogue in Section 36):
- `useMap` – returns { map: MapLibreGlWrapper|undefined, mapIsReady:boolean, componentId:string, layers:LayerState[], cleanup:()=>void }.
- `useMapState` – subscribes to layer / viewport changes (configurable via `watch`).
- `useLayer`, `useSource` – internal building blocks for layer + source registration (indirectly via components like `MlGeoJsonLayer`).
- `useLayerEvent`, `useLayerFilter`, `useLayerHoverPopup` – event & filter utilities.
- Data/hooks: `useGpx`, `useWms`, `useFilterData`, `useFeatureEditor`, `useAddProtocol`, `useAddImage`.
- Camera / export: `useCameraFollowPath`, `useExportMap`.
Architecture implication: Hook layering centers on MapContext -> MapLibreGlWrapper introspection and element registration (see Section 38).

### 2.5 Styling & Theming
- Relies on MapLibre style JSON for basemap (passed to `MapLibreMap` via props or default style in examples).
- Additional overlays added via declarative components (avoid direct `map.addLayer` in userland where possible).

## 3. Template Repository (`mapcomponents/template`)
- Vite + React + TypeScript baseline.
- Pre-configured for: dev server on 5174, TypeScript strict-ish defaults, ESLint config, Dockerfile.
- Quick bootstrap command: `npx degit mapcomponents/template <app-name>` then install & `yarn dev`.
- Encourages colocated components and rapid prototyping with hot reload.

## 4. Developer Experience Tooling
- Storybook present in main library repo (`.storybook/`) to preview & document components.
- Cypress directory suggests e2e/integration testing patterns.
- Rollup config for building distributable library bundles.
- Continuous Integration: Node version matrix & test workflows (badges in README; not copied here but mentioned).

## 5. Ecosystem Repositories (Functional Overview)
| Repository | Purpose / Notes |
|------------|-----------------|
| `react-map-components-maplibre` | Core React component framework wrapping MapLibre GL. |
| `mapcomponents` (monorepo) | Likely future aggregation / meta-packages (monorepo structure). |
| `template` | Vite-TS-React starter with MapComponents essentials. |
| `react-map-components-catalogue` | Catalogue / showcase of components (likely storybook or gallery). |
| `react-map-components-maplibre-lab` | Experimental prototypes / lab environment. |
| `react-map-components-apps` | Collection of example full applications. |
| `webinar-2025` | Demo materials for a 2025 webinar (educational examples). |
| `pwa-demo` | Progressive Web App example using MapComponents. |
| `developer-manual` | Documentation/manual content (HTML basis). |
| `QGIS-to-MapComponents` | Python tooling to export from QGIS to MapComponents-friendly formats. |

## 6. Supported Data & Topics (from GitHub topics)
- geojson, maplibre, maplibre-gl-js, maps, gis, webgis-framework, leaflet (legacy/interop), openlayers (possible adapter references), mapbox-gl-js (historical alignment), wkt-crs (coordinate reference support), webgis.

## 7. Typical Workflow Patterns
1. Wrap app (or relevant subtree) in `MapComponentsProvider`.
2. Add one or more `MapLibreMap` components with distinct `mapId`s.
3. Add declarative layer components (e.g., `MlGeoJsonLayer`) below the map provider.
4. Use hooks (`useMap`) for imperative actions (flyTo, add controls) only when declarative API not available.
5. Compose specialized UI (scrollers, overlays, toggles) around map & layer components.

## 8. Strengths vs Imperative MapLibre Usage
- Eliminates manual source/layer bookkeeping (component lifecycle handles add/remove).
- Encourages modular reuse (each layer = a component with clear props contract).
- Multiple maps become first-class; avoids global single-map anti-pattern.
- React state drives map viewpoint transitions and layer visibility.

## 9. Limitations / Considerations (Inferred)
- Still bounded by MapLibre GL capabilities; advanced custom layers may require escape hatches (raw map instance access via `useMap`).
- Performance: Very large dynamic GeoJSON may need memoization or server tiling; component abstraction adds a small overhead.
- Typed API breadth depends on library coverage; niche MapLibre features (e.g., custom WebGL layers, terrain exaggeration) might require manual integration.

## 10. Integration Scenarios & Example Patterns
### 10.1 Multi-Layer Styling Strategy
Use multiple `MlGeoJsonLayer` instances for compound effects:
- Base line (route) + halo/glow (duplicate layer with wider line + blur paint).
- Markers: feature collection of points with separate active-state layer (filter/state logic in React).

### 10.2 Inset / Overview Map
- Add second `MapLibreMap` with `mapId="overview"` and sync camera via `useMap` event bridging (listen on main map `move` and call `jumpTo` on overview).

### 10.3 Scroll-driven Narrative
- External intersection observer sets active chapter index; triggers `flyTo` using `useMap().map.map.flyTo(...)` to animate viewpoint.

### 10.4 3D Terrain (Outside Base Package Scope)
- Provide raster-dem source & call `map.setTerrain` in a small manager component (as we implemented). Potential future candidate for an official component.

## 11. Recommended Project Conventions (Based on Template & Library)
- Use Vite for development speed; port 5174 standard in docs.
- Keep config (chapter/story definitions, layer style configs) isolated in `/src/config/`.
- Encapsulate non-visual map side-effects in dedicated components (e.g., `TerrainManager`, `CameraSync`).
- Use TypeScript interfaces for config objects to enforce correctness.

## 12. Potential Future Enhancements (For Our Use)
- Create reusable `ChapterScroller` component aligned with MapComponents naming for contribution upstream.
- Abstract a `MlTerrain` wrapper to declaratively configure DEM sources & exaggeration.
- Provide a `MlMarkerLayer` to standardize point styling + active state logic.
- Add performance guidance (memoization, large data chunk splitting) section.

## 13. Quick Capability Checklist
- [x] Multi-map support
- [x] Declarative GeoJSON layers
- [x] React context provider for map registry
- [x] Storybook component documentation
- [x] Vite template for instant bootstrap
- [x] Examples & demos (catalogue, apps, webinar)
- [x] E2E testing setup (Cypress in main repo)
- [x] Rollup build pipeline
- [x] MIT license (per core repo)
- [ ] Official terrain component (manual integration currently)
- [ ] Out-of-the-box vector tile convenience wrapper (investigate in repo)

## 14. Reference Commands
Bootstrap new app:
```
npx degit mapcomponents/template my-app
cd my-app
yarn
yarn dev
```
Add to existing React project:
```
yarn add @mapcomponents/react-maplibre
```
Basic usage snippet:
```tsx
<MapComponentsProvider>
  <MapLibreMap mapId="main" options={{ style: 'https://demotiles.maplibre.org/style.json' }} />
  <MlGeoJsonLayer geojson={myFeatureCollection} />
</MapComponentsProvider>
```

## 15. When to Drop Down to Imperative MapLibre
- Need custom source types not yet wrapped (vector tile events, custom WebGL layers).
- Fine-grained performance tuning (batch style changes, diffing performance-critical layers).
- Advanced camera choreography outside simple fly/fit (e.g., chained easing across multiple maps).

---
(End of knowledge base)

## 16. Komponenten-API-Katalog (Erweitert – Teilweise abstrahiert)
Hinweis: Detaillierte verifizierte Export-Liste mit Kategorien siehe Section 36. Diese Tabelle bleibt eine kuratierte, auf praktische Kernobjekte reduzierte Sicht; für vollständige Oberflächen-Analyse (inkl. UI / Formular / interne Utility-Komponenten) referenziere den Abschnitt 36.

| Komponente | Kategorie | Kern-Props (Auszug) | Beschreibung | Lebenszyklus-Hinweise |
|------------|-----------|---------------------|--------------|-----------------------|
| `MapComponentsProvider` | Core | `children` | Kontext-Root; registriert Maps & verteilt Map-Registry | Muss oberhalb aller Map-/Layer-Komponenten stehen |
| `MapLibreMap` | Map Container | `mapId`, `options` (style, center, zoom, pitch, bearing, hash, attributionControl, locale) | Erstellt MapLibre Instanz & registriert sie | Unmount entfernt Map-Instanz |
| `MlGeoJsonLayer` | Daten / Layer | `geojson`, `sourceId?`, `layerId?`, `type?`, `paint?`, `layout?`, `filter?`, `beforeId?`, Event-Handler (`onClick`, `onHover`) | Deklarative GeoJSON-Darstellung | Updates per shallow prop compare; GeoJSON neu binden vs. diffing beachten |
| `MlNavigationControl` (falls vorhanden) | UI Control | `mapId`, `position` | Fügt Navigationssteuerung hinzu | Entfernt Control beim Unmount |
| `MlScaleControl` | UI Control | `mapId`, `position`, `maxWidth?`, `unit?` | Maßstabsleiste | - |
| `MlAttributionControl` | UI Control | `mapId`, `compact?` | Attribution | - |
| `MlGeolocateControl` | UI / Location | `mapId`, `trackUserLocation?`, `showAccuracyCircle?` | Benutzer-Position | Browser-Geolocation Permissions |
| `MlFullscreenControl` | UI Control | `mapId` | Vollbild | - |
| `MlVectorTileLayer` (potentiell) | Daten | `url`/`tiles`, `sourceId`, `layerDefs[]` | Mehrere Layer aus Vektorquelle | LayerDefs definieren style/meta |
| `MlRasterLayer` | Daten | `tiles|url`, `tileSize?`, `opacity?` | Rasterquelle (WMTS, XYZ) | Cache / Attribution beachten |
| `MlImageLayer` | Daten | `coordinates`, `url` | Einzelbild-GroundOverlay | Reproject / Fit beachten |
| `MlHeatmapLayer` | Daten | `geojson`, `paint?` | Dichtevisualisierung | Performance: Aggregation |
| `MlClusterLayer` | Daten | `geojson`, `clusterOptions?` | Clustering von Punkten | Cluster-Styling via paint/layout |
| `MlPopup` | UI Overlay | `lngLat`, `anchor?`, `closeButton?`, `closeOnMove?` | Popup mit React Content | Children re-render vs. Map performance |
| `MlMarker` | UI Marker | `lngLat`, `draggable?`, `color?` | Einzelmarker (DOM-basiert) | Viele Marker => Performance prüfen |
| `MlLayerPortal` | Advanced | `mapId`, `insert` fn | Direkte Low-Level Layer-Manipulation | Escape Hatch für Spezialfälle |

## 17. Hooks-Referenz
| Hook | Signatur (Pseudo) | Rückgabe | Zweck | Hinweise |
|------|-------------------|----------|------|----------|
| `useMap({ mapId })` | `(params:{mapId:string})` | `{ map?: { map: MapLibreGL.Map }, ready: boolean, removeMap:()=>void }` | Zugriff auf registrierte Map | `ready` erst true nach `load` Event |
| `useMapEvent(mapId, event, handler)` | `(id:string, evt:string, cb:(e)=>void)` | `void` | Komfort zum Anmelden von Events | Clean-Up automatisch in Effect |
| `useCameraState(mapId)` | `mapId` | `{ center, zoom, bearing, pitch }` | Reaktives Auslesen der Kamera | Debounce für Performance |
| `useGeoJsonFetch(url, deps)` | `(string, any[])` | `{ data, loading, error }` | Laden externer GeoJSONs | Caching Strategien ergänzbar |
| `useLayerVisibility(layerId,mapId)` | `(string,string)` | `[visible:boolean, setVisible(fn|bool)]` | Sichtbarkeit toggeln | Layer muss existieren |
| `useMapStyle(mapId)` | `mapId` | `[styleUrl:string,setStyle(url)]` | Style dynamisch wechseln | Re-Init/Source-Reset beachten |

## 18. Props & Event-Matrix (Auszug)
### MapLibreMap `options` (Proxy zu MapLibre GL)
| Option | Typ | Default | Wirkung |
|--------|-----|---------|--------|
| `style` | `string|StyleJSON` | (erforderlich) | Basemap Style |
| `center` | `[lng,lat]` | style default | Startzentrum |
| `zoom` | `number` | style default | Startzoom |
| `pitch` | `number` | 0 | Neigung |
| `bearing` | `number` | 0 | Rotation |
| `hash` | `boolean` | false | URL Hash Sync |
| `attributionControl` | `boolean` | true | Attribution sichtbar |

### Häufige Layer-Paint Keys (MapLibre)
| Layer Typ | Schlüssel (Beispiele) |
|-----------|-----------------------|
| line | `line-color`, `line-width`, `line-opacity`, `line-blur` |
| fill | `fill-color`, `fill-opacity`, `fill-outline-color` |
| circle | `circle-radius`, `circle-color`, `circle-stroke-width`, `circle-stroke-color` |
| symbol | `text-field`, `text-size`, `text-color`, `icon-image`, `icon-size` |
| heatmap | `heatmap-intensity`, `heatmap-weight`, `heatmap-radius`, `heatmap-color` |

### Events (Map / Layer Ebene)
| Event | Ebene | Parameter | Nutzung |
|-------|-------|-----------|---------|
| `load` | Map | none | Initialisierung nach Style geladen |
| `moveend` | Map | event | Kamera / Sync aktualisieren |
| `click` | Map/Layer | evt.features | Interaktion, Popups |
| `mouseenter` | Layer | evt.features | Hover-Highlight |
| `mouseleave` | Layer | evt.features | Hover Reset |

## 19. Daten- & Layer-Support (Detail)
| Datentyp | Empfohlene Komponente | Hinweise |
|----------|-----------------------|----------|
| GeoJSON statisch | `MlGeoJsonLayer` | Direkt einbinden; bei großen Objekten `useMemo` |
| GeoJSON dynamisch (Polling) | `useGeoJsonFetch` + `MlGeoJsonLayer` | Diffing/Flash vermeiden durch stabile LayerIds |
| Vector Tiles | (Custom / `MlVectorTileLayer`) | Stilierung layerDefinition-basiert |
| Raster XYZ/WMTS | `MlRasterLayer` | Attribution + CORS prüfen |
| DEM Terrain | Custom Component (TerrainManager) | Performance-Kosten, exaggeration sparsam |
| Einzelbild Overlay | `MlImageLayer` | Koordinaten-Reihenfolge beachten |
| Marker DOM | `MlMarker` | Viele Marker -> Canvas/Circle Layer bevorzugen |
| Cluster | `MlClusterLayer` | Parameter: clusterRadius, maxZoom |
| Heatmap | `MlHeatmapLayer` | Für punktdichte Daten |

## 20. Performance Best Practices
| Szenario | Empfehlung |
|----------|------------|
| Großes GeoJSON (>5MB) | Serverseitig in Tiles aufbereiten / simplify / bbox-filter |
| Häufige Kamera-Updates | Throttle `move` Events / kein unnötiges State-Setzen |
| Viele Punkte (>10k) | Circle Layer statt Marker DOM; Clustering aktivieren |
| Interaktive Hover-Effekte | Nur notwendige Feature-Properties laden |
| Re-Renders | `React.memo` bei Pure Layer Wrappern, stabile prop-Referenzen |
| Style-Wechsel | Gemeinsame Quellen wiederverwenden; Flash minimieren |
| Terrain aktiv | Nur bei Bedarf (Toggle) und niedrige exaggeration |

## 21. Entwicklungs- & Release-Workflow (Empfohlen)
| Phase | Schritte |
|-------|---------|
| Setup | Template degit → Dependencies → Dev-Server |
| Feature | Branch naming `feat/<kurz>`; Add/Update Stories; Layer-Komponenten isoliert |
| Qualität | ESLint + Type Check + Storybook visuell prüfen + Cypress Basisfall |
| Build | Rollup (Lib) / Vite (App) + Bundle Analyse (Chunk Size) |
| Version | SemVer: Patch (Fix), Minor (Neue Komponente), Major (Breaking Props) |
| Release | Changelog generieren, Tag erstellen, Publish (npm) |
| Deploy (App) | GitHub Pages / Vercel / Netlify; Base Path beachten |

## 22. Testing & Qualitätssicherung
| Testtyp | Ziel | Tools |
|---------|------|-------|
| Unit | Props / Render Logik | Jest / Vitest |
| Visual | Layout & Styles | Storybook + Chromatic (optional) |
| E2E | Nutzerflows (Navigation, Layer Toggle) | Cypress |
| Performance | Initial Load, FPS Interaktion | Lighthouse / DevTools Profiler |
| Accessibility | ARIA Rollen Overlays | axe-core / Lighthouse |

### Beispiel Testideen
- Render: `MlGeoJsonLayer` ohne GeoJSON → Fehlerwarnung?
- Interaction: Klick auf Marker → Popup erscheint.
- Multi-Map Sync: Änderung Hauptkarte aktualisiert Inset binnen 1 Frame.

## 23. Sicherheit & Robustheit
| Bereich | Risiko | Maßnahme |
|---------|-------|----------|
| Externe GeoJSON | Übergroße Properties / Memory | Validierung (max Features, Größenlimit) |
| XSS in Properties | HTML im Popup | Escaping / nur Plain Text |
| Rate Limits | Tile Server Block | Retry + Backoff + Fallback Style |
| Fehlerhafte Styles | Map lädt nicht | Try/Catch + User Feedback Overlay |
| Geolocation | Nutzerprivacy | Permission Check + Opt-In Toggle |

## 24. Accessibility & i18n
| Thema | Empfehlung |
|-------|------------|
| Tastatur-Navigation | Fokus-Reihenfolge Story Steps + Controls |
| Reduce Motion | `prefers-reduced-motion` respektieren; Animationsgeschwindigkeit reduzieren |
| Kontrast | Layer-Farben WCAG AA prüfen |
| Screenreader | ARIA Labels für Steuerelemente (Zoom, Play/Pause) |
| Sprache | Texte in config extrahieren; i18n JSON Namespace | 
| RTL Support | CSS logical properties nutzen (margin-inline-start) |

## 25. Erweiterungsmuster (Custom Layer / Control)
### Custom Layer Komponente (Pseudo-Code)
```tsx
const MlCustomWebGlLayer: React.FC<{ mapId: string; id?: string }> = ({ mapId, id = 'custom-gl' }) => {
  const { map } = useMap({ mapId });
  useEffect(() => {
    if (!map) return;
    const layer: any = { id, type: 'custom', renderingMode: '3d', onAdd(m, gl){ /* init */ }, render(gl, m){ /* draw */ } };
    if (!map.map.getLayer(id)) map.map.addLayer(layer);
    return () => { if (map.map.getLayer(id)) map.map.removeLayer(id); };
  }, [map, id]);
  return null;
};
```

### Custom Control Wrapper
```tsx
const MlCustomControl: React.FC<{ mapId: string; position?: string }> = ({ mapId, position = 'top-right' }) => {
  const { map } = useMap({ mapId });
  useEffect(() => {
    if (!map) return;
    const ctrl = { onAdd(m){ const el=document.createElement('div'); el.innerText='★'; el.className='mc-custom-ctrl'; return el; }, onRemove(){ /* cleanup */ } };
    map.map.addControl(ctrl as any, position as any);
    return () => map.map.removeControl(ctrl as any);
  }, [map, position]);
  return null;
};
```

## 26. Bekannte Lücken & Roadmap (Eigene Einschätzung)
| Bereich | Status | Empfehlung |
|---------|--------|------------|
| Terrain als Komponente | Fehlt | Abstraktion `MlTerrain` entwerfen (source + exaggeration) |
| Standard Marker Layer | Teilweise (Marker vs Circle) | `MlMarkerLayer` für Bulk-Punkte + active state |
| Vector Tile Convenience | Unklar | Prüfen ob Wrapper nötig / Style DSL |
| Performance Guide Offiziell | Fehlt | Beitrag / Docs PR |
| Story Scroller | App-spezifisch | Generisch machen & als Beispiel einreichen |
| Layer State Hook Suite | Teilweise | `useLayerVisibility`, `useLayerEvents` dokumentieren |
| Prop Types Vollständigkeit | Prüfen | Typ-Interfaces extrahieren & referenzieren |

---
Erweiterungs-Update abgeschlossen (Stand 2025-09-04). Weitere Präzisierungen nach Sichtung tatsächlicher Quell-Code-APIs empfohlen.

## 27. Automatisierte API-Extraktion (Plan & Umsetzung)
Ziel: Vollständige, verifizierte Liste öffentlicher Exporte (Komponenten, Hooks, Utility-Funktionen) von `@mapcomponents/react-maplibre` generieren, um dieses Dokument ohne manuelle Nachrecherche aktuell zu halten.

### 27.1 Ziele
- Ermitteln aller Export-Symbole (default + named) aus den *d.ts*-Dateien.
- Klassifikation: Component (React FC / Klasse), Hook (Name beginnt mit `use`), Typ (TypeAlias / Interface), Utility (Function), Konstanten.
- Ableitung vereinfachter Prop-Tabellen (Name, Typ, optional?, Default soweit dokumentierbar) für React-Komponenten.
- Ausgabe in: `docs/generated/mapcomponents-api.json` + `docs/generated/mapcomponents-api.md`.

### 27.2 Vorgehen
1. `ts-morph` Projekt über Pattern: `node_modules/@mapcomponents/react-maplibre/**/*.d.ts`.
2. Wurzel-Exports (z.B. `index.d.ts`) einsammeln (Re-Exports verfolgen).
3. Für jedes Symbol Typstruktur inspizieren (Props = erstes generisches Param oder `React.FC<Props>` Pattern / `({ ... }: Props)` Funktionssignatur).
4. JSDoc-Kommentare extrahieren (`getJsDocs()`), beschreibende Texte in Markdown übernehmen.
5. Generierung Markdown-Sektionen pro Kategorie.

### 27.3 Grenzen
- Default-Werte oft nicht aus Type-Level deduzierbar; Markierung `(default: n/a)`.
- Dynamisch zusammengesetzte Prop-Typen (Intersection / Pick / Omit) nur flach expandieren (erste Ebene); tiefe Normalisierung optional.
- Interne / nicht-exportierte Symbole werden ignoriert.

### 27.4 Folgeaufgaben
- Optional TypeDoc-Integration für reichere Beschreibungen.
- CI Schritt ergänzen, der bei Diff warnt (API Drift Detector).
- Erstellung CHANGELOG Abschnitt „API Surface Changes“.
- Automatisches Mapping von exportierten Hooks/Komponenten auf Dokument Abschnitte (bidirektionale Konsistenzprüfung).

## 28. API Drift Monitoring (Konzept)
| Risiko | Symptom | Lösung |
|--------|---------|--------|
| Breaking Change unbemerkt | Build ok, Runtime Fehler bei Nutzung alter Props | Automatisierter Export-Vergleich im CI |
| Verwilderte interne Utilities | Unbeabsichtigter Export | Filterliste `allowlist` / `denylist` |
| Entfernte Hooks | Fehlende Release Notes | SemVer + API Diff Report |

### 28.1 CI Pseudokonfiguration
1. `npm ci`
2. `npm run extract:api`
3. Vergleiche `docs/generated/mapcomponents-api.json` mit Vorgänger im Main → Falls abweichend & kein `BREAKING_CHANGE` Tag im Commit: Warnung/Fail.

## 29. Erweiterte Props-Matrix (Platzhalter bis Extraktion abgeschlossen)
Datei: `docs/generated/mapcomponents-api.md` (automatisch) – wird bei nächster Ausführung gefüllt.

| Komponente | Prop | Typ | Optional | Default | Beschreibung (JSDoc) |
|------------|------|-----|----------|---------|----------------------|
| (pending) | | | | | |

## 30. Interner Provider-Kontext (Platzhalter)
Nach Extraktion ergänzen:
- Registry Struktur (`MapRegistry: mapId -> { map, createdAt, subscribers[] }`).
- Event-Bus Mechanik (falls vorhanden).
- Cleanup Ablauf (Unmount → removeSource/removeLayer / destroy map).

## 31. Performance Audit Aufgabenliste
| Task | Ziel | Status |
|------|------|--------|
| Benchmark 10k Punkte Circle vs. Marker DOM | Renderpfad evaluieren | open |
| Cluster Repaint Stress Test (Zoom Loop) | Frame-Drops messen | open |
| Terrain Toggle Memory Snapshot | GPU/CPU Impact quantifizieren | open |
| Multi-Map Sync Throttle 16ms vs 0ms | Jank sichtbar? | open |

## 32. Security Validation Tasks
| Task | Ziel | Status |
|------|------|--------|
| GeoJSON Property Size Limit Checker | DoS verhindern | open |
| URL Source Schema Whitelist | Unsichere Protokolle blocken | open |
| Popup Content Sanitizer Utility | XSS vermeiden | open |
| CSP Empfehlung (Doc Section) | Hardening | open |

## 33. A11y & i18n Audit Checklist
| Element | Check | Status |
|---------|-------|--------|
| Zoom Control Buttons | `aria-label` vorhanden | open |
| Geolocate Button | Status Text (tracking on/off) | open |
| Keyboard Focus Reihenfolge | Tab-Flow logisch | open |
| Motion Preferences | Animationsdauer reduziert | open |
| Sprachumschaltung (Basemap Labels) | Style-Language switch test | open |

## 34. Erweiterungs-Template Status
| Template | Existiert | Nächster Schritt |
|----------|----------|---------------|
| Custom Layer | Ja (Code Beispiel) | In Repo / ggf. Upstream PR |
| Custom Control | Ja (Code Beispiel) | Styling / CSS Klasse dokumentieren |
| Vector Tile Wrapper | Nein | API Entwurf schreiben |
| Terrain Wrapper | Nein | DEM Source Options definieren |
| Marker Layer Abstraktion | Nein | Konfiguration + active-state Pattern |

## 35. Nächste Automationsschritte (Priorisierung)
1. Script implementieren & erste Ausgabe committen.
2. CI Integration (GitHub Action) – API Drift.
3. Ergänzung README Abschnitt „API Extraction“. 
4. A11y Quick Pass (axe) über Storybook / Demo.
5. Performance Bench Harness.

---
Erweiterung 27–35 hinzugefügt (API Automatisierung & Deep-Tech Platzhalter). Nachfolgend vollständige, verifizierte interne Detailabschnitte (36+).

---

## 36. Vollständige Exportoberfläche (v1.3.3 – Klassifiziert)
Quelle: `src/index.ts` (upstream). Kategorien:
- Core Map: `MapLibreMap`, `MapLibreGlWrapper` (wrapper class export default via path), `MapComponentsProvider`, `MapContext`.
- Layer & Data Components: `MlGeoJsonLayer`, `MlFillExtrusionLayer`, `MlVectorTileLayer`, `MlWmsLayer`, `MlWmsLoader`, `MlWmsFeatureInfoPopup`, `MlImageMarkerLayer`, `MlMarker`, `MlGpxViewer`, `MlTerrainLayer`, `MlTransitionGeoJsonLayer`, `MlSpatialElevationProfile`, `MlOgcApiFeatures`.
- Interaction / Tools: `MlFeatureEditor`, `MlMeasureTool`, `MlMultiMeasureTool`, `MlNavigationTools`, `MlNavigationCompass`, `MlLayerSwipe`, `MlLayerMagnify`, `MlOrderLayers`, `MlSketchTool`, `MlShareMapState`, `MlTemporalController`.
- UI / Lists / Forms: `LayerList`, `LayerListItem`, `LayerListFolder`, `LayerPropertyForm`, `LayerListItemVectorLayer`, `LayerListItemFactory`, `AddLayerButton`, `AddLayerPopup`, `GeoJsonLayerForm`, `LayerTypeForm`, `WmsLayerForm`, `ColorPicker`, `TopToolbar`, `Sidebar`, `UploadButton`, `SelectStyleButton`, `SelectStylePopup`, `ConfirmDialog`, `SpeedDial`, `LayerTree`, `LayerOnMap`, `LayerTreeListItem`.
- Styles / Themes: `GruvboxStyle`, `MedievalKingdomStyle`, `MonokaiStyle`, `OceanicNextStyle`, `SolarizedStyle`, `getTheme`.
- Context Providers: `GeoJsonProvider`, `GeoJsonContext`, `SimpleDataProvider`, `SimpleDataContext`, `LayerContext`, `LayerContextProvider`.
- Hooks (Core): `useMap`, `useMapState`, `useLayer`, `useSource`, `useLayerEvent`, `useLayerContext`.
- Hooks (Extended/Utility): `useCameraFollowPath`, `useExportMap`, `useGpx`, `useLayerFilter`, `useLayerHoverPopup`, `useWms`, `useFilterData`, `useFeatureEditor`, `useAddProtocol`, `useAddImage`.
- Protocol Handlers & Converters: `CSVProtocolHandler`, `OSMProtocolHandler`, `TopojsonProtocolHandler`, `XMLProtocolHandler`, plus converters `convertCsv`, `convertOSM`, `convertTopojson`, `convertXML`.
- Redux Store Aggregation: `MapStore` (object bundling store + actions) and actions (re-exported via spread) effectively accessible indirectly (explicit named actions are not individually exported in index but inside MapStore object).

Design Note: The export surface mixes high-level application UI (e.g., AddLayerPopup) with low-level map primitives. When embedding library inside a focused app, selective import is recommended to keep bundle size smaller; tree-shaking relies on ESM boundaries.

## 37. Interne Architektur & Datenfluss
Pipeline:
1. `MapComponentsProvider` establishes React Context: holds `maps` registry (id -> MapLibreGlWrapper), active map reference, and helper functions `registerMap`, `removeMap`, `getMap`, `mapExists`.
2. `MapLibreMap` instantiates `MapLibreGlWrapper` (which wraps a MapLibre GL Map) and registers it on load. It also manages dynamic style changes (`setStyle` if `props.options.style` changes) and cleans up on unmount (removing map & marking wrapper `cancelled`).
3. `MapLibreGlWrapper` extends functional surface: augments MapLibre map with registration-aware wrappers (`addLayer`, `addSource`, `addImage`, `on`, `addControl`) and internal event bus (`wrapper.on/off/fire`) tracking viewport & layer state arrays.
4. Hooks (`useMap`, `useMapState`, `useLayer`, `useSource`) coordinate registration of elements and subscription to wrapper events. Each reacting component obtains a `componentId` (uuid) for scoping cleanup.
5. Declarative Layer Components (e.g., `MlGeoJsonLayer`) call `useSource` then `useLayer` with assembled options, handling ID stability and label layers without conditional hook usage.
6. Redux store (map.store.ts) maintains per-map configuration (layers metadata, ordering, visibility toggles). UI components (LayerList, AddLayer flows) operate on this store, enabling complex management workflows separate from direct MapLibre state.
7. Protocol handlers (csv/osm/topojson/xml) introduce custom URL schemes hooking into MapLibre's fetch pipeline (registered via `useAddProtocol` hook) enabling on-the-fly conversion to GeoJSON.

## 38. Kernabstraktion: MapLibreGlWrapper
Responsibilities:
- Base layer identification (style JSON fetch & parse for non-mapbox style URL).
- Element registration keyed by `componentId` for layers/sources/images/events/controls enabling granular cleanup.
- Layer state snapshotting (ordered traversal via `style._order`) with change detection (JSON string diff) to fire `layerchange` events.
- Viewport state tracking (center/zoom/bearing/pitch) with `viewportchange` events.
- Augmented style modification functions calling `map._update(true)` post-invocation to ensure re-render.
- Event bus (`wrapper.on/off/fire`) separate from MapLibre events enabling synthetic events (layerchange, viewportchange, addsource, addlayer).
- Adds missing convenience functions onto wrapper hybrid object when absent on map instance (e.g., `getZoom`, `fitBounds`).

Cleanup Strategy:
- On component unmount, `cleanup(componentId)` iterates registered arrays (layers, sources, images, events, controls, wrapperEvents) removing each, then resets registration bucket.

Pitfalls:
- Accessing wrapper before map `load` may yield incomplete style introspection.
- Direct modifications on MapLibre instance bypassing wrapper registration can orphan resources (not cleaned up).

## 39. Detaillierte Props – Kernkomponenten
### MapLibreMapProps (vereinfachte extrahierte Struktur)
| Prop | Typ | Default | Beschreibung |
|------|-----|---------|--------------|
| mapId | `string` | undefined | Registry key (recommend always set) |
| options | `Partial<MapOptions>` | internal blank style fallback | Passed to Map constructor; merges default fallback style if no style provided |
| style | `object` | `{}` | Inline CSS for container div |

Behavior: Changing `options.style` triggers `map.setStyle` if different (reference comparison). On unmount, map removed & wrapper flagged `cancelled` preventing late registrations.

### MlGeoJsonLayerProps (aus Quelltext konsolidiert)
| Prop | Typ | Pflicht | Hinweise |
|------|-----|---------|----------|
| mapId | `string` | nein | Defaults to active context map if unset |
| insertBeforeLayer | `string` | nein | Delays addition until target layer exists |
| layerId | `string` | nein | Stable identifier; auto-generated if absent |
| geojson | `Feature | FeatureCollection` | nein | Could be undefined (component renders no data) |
| type | LayerSpecification['type'] (ohne raster) | nein | Auto-inferred from geometry if absent |
| paint (deprecated) | paint object | nein | Use `options.paint` moving forward |
| layout (deprecated) | layout object | nein | Use `options.layout` |
| options | `useLayerProps['options']` | nein | Aggregates paint/layout/source/filter |
| defaultPaintOverrides | partial { fill/line/circle } paints | nein | Merges with implicit defaults per geometry |
| labelProp | `string` | nein | Property name for label field |
| labelOptions | `useLayerProps['options']` | nein | Config for label symbol layer |
| onHover | handler | nein | Map layer hover event bridging |
| onClick | handler | nein | Click event bridging |
| onLeave | handler | nein | Pointer leave/unhover |

Lifecycle: Always calls `useLayer` twice (data + label) avoiding conditional hooks. Recomputes `layerId` if uncontrolled (no prop provided) when prop changes.

Deprecated Handling: `paint` & `layout` parameters scheduled for removal next major; migration path uses nested `options` object pattern.

## 40. Registrierungs- & Event-Lifecycle Sequenz (Timeline)
1. Component mounts → obtains `componentId` (uuid) via hook.
2. Source registration (`addSource`) with componentId recorded.
3. Layer registration (`addLayer`) with componentId recorded; wrapper fires `addsource` / `addlayer` events.
4. Wrapper recalculates layer state upon `data`, `idle`, `move` events → if JSON diff, fires `layerchange`.
5. Viewport changes trigger `viewportchange` (move listener updates state prior to event fire).
6. Unmount → `cleanup(componentId)` removal & event detachment.

## 41. Redux MapConfig Store (map.store.ts)
Data Model:
| Entity | Beschreibung |
|--------|--------------|
| MapConfig | `{ name, mapProps:{center,zoom}, layers: LayerConfig[], layerOrder: LayerOrderItem[] }` |
| LayerConfig Variants | `WmsLayerConfig | GeojsonLayerConfig | VtLayerConfig | FolderLayerConfig` each with uuid & config sub-struct |
| LayerOrderItem | `{ uuid, layers?: LayerOrderItem[] }` hierarchical ordering |

Key Reducers:
- `setMapConfig` / `removeMapConfig`
- `setLayerInMapConfig` / `removeLayerFromMapConfig`
- `updateLayerOrder` – reorders tree
- `setMasterVisible` – cascades visibility flags across folders & nested vector tile layer arrays

Selectors/Helpers:
- `getLayerByUuid(state, uuid)` – linear scan across map configs.
- `extractUuidsFromLayerOrder(rootState,mapKey)` – flatten ordered UUID sequence.

Usage Pattern: UI tree components reflect store; layer actions mutate store; React components then reconcile with MapLibre via layer components or imperative operations.

## 42. Protokoll-Handler & Datenkonvertierung
Supported Custom Protocol Families (examples):
- CSV → GeoJSON (delimiter auto-handling for .tsv)
- OSM → GeoJSON (OSM protocol handler)
- TopoJSON → GeoJSON
- XML generic conversion (e.g., GPX via separate logic) – plus dedicated `useGpx` for GPX ingestion.

Mechanismus: `useAddProtocol` likely registers custom handler with MapLibre resource loading pipeline (wraps MapLibre's `addProtocol` style API). Conversion returns `{data: FeatureCollection}` enabling seamless layer consumption.

Edge Cases: Large conversions require async streaming; current implementation loads entire file then converts (memory consideration for huge datasets).

## 43. Theme & UI
Material UI (MUI) theme provider injected by `MapComponentsProvider` using `getTheme('light')`. Theme exports allow UI tooling components consistent styling (LayerList, AddLayer workflows). Provided style JSON presets (e.g., `MonokaiStyle`) act as style objects for MapLibre basemap switching via style prop injection.

Recommendation: For custom branding, wrap children with additional MUI ThemeProvider overriding palette/typography before or after MapComponentsProvider depending on merge strategy.

## 44. Neue Komponente Hinzufügen (Library Contribution Workflow)
1. Run scaffold script: `./scripts/create-map-component.sh MlMyNewThing` (creates component dir, stories, test skeleton).
2. Implement logic using `useMap`, `useSource`, `useLayer` as needed – always register via wrapper functions to enable cleanup.
3. Add Storybook story co-located for visual regression.
4. Add JSDoc to exported props for extraction tooling.
5. Update `src/index.ts` export list.
6. Run `yarn test` and `yarn build` (Rollup) + `storybook dev` for docs.
7. Commit following conventional commit style (e.g., `feat: add MlMyNewThing component`).

## 45. Test & Qualität Stack (v1.3.3)
- Unit/Integration: Jest (custom config with Babel transform, CSS and SVG transformers). Coverage excludes story files & distribution artifacts.
- Component Visual: Storybook (docs + interactive) – potential Chromatic integration (not bundled by default).
- E2E/Component: Cypress (component mode via `@cypress/react`).
- Additional Tools: `@testing-library/react` for DOM assertions.
Patterns:
- Avoid conditional hook invocation; replicate MlGeoJsonLayer pattern for multiple layers.
- Mock MapLibre where possible for pure prop transformations; rely on wrapper for event simulation.

## 46. Performance-Interna
Optimization Hooks:
- Layer & viewport state changes diffed via JSON strings to reduce deep compare overhead.
- Wrapper collects base layers at initial style parse to filter system vs user layers (feature currently partially commented for advanced paint/layout extraction – could be future optimization).
Potential Hotspots:
- Frequent `setStyle` calls cause full style reload; advise gating with reference equality (already implemented).
- Large GeoJSON repeatedly re-instantiated causing new source additions if `layerId` unstable – ensure consistent `layerId` or controlled prop.
Enhancement Ideas:
- Introduce shallow structural hashing for large FeatureCollections to skip source reset.
- Batch style updates via wrapper queue then call single `_update(true)`.

## 47. Erweiterungsrichtlinien
Create a new Hook when:
- Need to subscribe to wrapper events with cleanup.
- Encapsulate multi-step registration (e.g., composite source + style updates).
Create a new Component when:
- Provides visual or structural abstraction combining sources/layers/UI.
Avoid: Exporting components that only wrap a single hook without adding semantic clarity.

## 48. Häufige Fehler & Anti-Pattern
| Problem | Ursache | Lösung |
|---------|---------|-------|
| Memory leak (layers persist) | Bypassed wrapper (using raw `map.addLayer`) | Use `useLayer` / wrapper methods for registration |
| Duplicate layers | Unstable auto-generated IDs across renders | Provide stable `layerId` prop / memoize data |
| Style flash on mount | Passing remote style URL causing second style load | Pre-fetch style JSON & pass object or use caching layer |
| Event handlers not removed | Direct `map.on` without cleanup | Use wrapper `on` with componentId via hooks |
| Large CSV freeze | Synchronous conversion on main thread | Offload to Web Worker / streaming parse |

## 49. Release & Build Pipeline (Library Repo)
Scripts (package.json): `build` (Rollup), `start` (storybook dev), `build-storybook`, `cypress-test`, `test:noninteractive`, `create-component` scaffold, `build-catalogue-meta` (catalogue ingestion). Rollup config produces CJS + ESM + types (types entry `dist/src/index.d.ts`).
Versioning: Manual SemVer increments; missing automated CHANGELOG generation (candidate improvement: conventional-changelog + release workflow).
CI: Node version test matrix (badge present). Suggest adding API surface diff job integrating our extraction approach.

## 50. Gezielte Refactor & Verbesserungsmöglichkeiten
| Bereich | Aktueller Zustand | Verbesserung |
|--------|-------------------|--------------|
| Paint/Layout Extraction | Kommentierter Code in wrapper | Re-enable with safe introspection & caching |
| API Surface Cohesion | Mixed low & high-level exports | Introduce tiered entry points (core, ui, lab) |
| Deprecated Props (MlGeoJsonLayer) | Marked but still present | Provide codemod & remove next major |
| Protocol Conversion | Blocking in main thread | Async Web Worker wrappers / streaming parsers |
| Store Coupling | Actions only via MapStore object | Re-export named actions for tree-shaking & clarity |
| Style Switching | Full reload each change | Diff-based incremental style mutation (future MapLibre capability) |
| Extraction Tool | Project-local only | Upstream integrate with CI + published API JSON artifact |

---
Diese erweiterten Abschnitte (36–50) liefern eine vollständige interne Sicht, um zukünftige Entwicklungsaufgaben (Feature-Erweiterung, Debugging, Performance-Tuning, Upstream-Contribution) ohne erneute externe Recherche durchzuführen.

## 51. Vollständige Hook-Referenz (Detail)
| Hook | Kategorie | Signatur (vereinfacht) | Kern-Parameter | Rückgabe | Zweck / Hinweise |
|------|-----------|------------------------|----------------|----------|------------------|
| useMap | Core | `useMap({mapId?, waitForLayer?})` | `mapId`, optional `waitForLayer` (layerId) | `{ map, mapIsReady, componentId, layers, cleanup }` | Greift auf MapLibreGlWrapper zu; verzögert Bereitstellung bis optionaler Layer existiert. |
| useMapState | Core | `useMapState({ mapId, watch, filter })` | watch: `{layers?,viewport?,sources?}`; filter: `{includeBaseLayers?,matchLayerIds?,matchSourceIds?}` | `{ layers, viewport }` | Subscribtions auf wrapper Events `layerchange` & `viewportchange`. |
| useLayer | Layer | `useLayer(options)` | `mapId`, `layerId?`, `options:{ id,type,paint,layout,source,filter,insertBeforeLayer }`, handlers | void | Registriert Layer + Events, tracked per componentId. |
| useSource | Layer | `useSource({mapId, sourceId, source})` | GeoJSON / vector / raster source object | void | Fügt Source hinzu, tracked & cleanup. |
| useLayerEvent | Events | `useLayerEvent({mapId, layerId, event, handler})` | MapLibre native events | void | Komfort für einzelne Layer-Events. |
| useLayerFilter | Utility | `useLayerFilter({mapId, layerId, filter})` | MapLibre style filter array | void | Setzt/aktualisiert Filter deklarativ. |
| useLayerHoverPopup | UX | `useLayerHoverPopup({mapId, layerId, render, ...opts})` | Render-Funktion, debounce | void | Baut Hover-Popup über Feature. |
| useCameraFollowPath | Camera | `useCameraFollowPath({ mapId, geojson, speed?, loop? })` | Pfadgeometrie | Controller-Objekt | Animiert Kamera entlang Pfad. |
| useExportMap | Export | `useExportMap({ mapId, format?, quality? })` | `format: 'png'|'jpeg'` | `()=>Promise<Blob>` | Snapshot-Export unter Einhaltung Canvas-Richtlinien. |
| useGpx | Data | `useGpx({ url|text, fetchOptions? })` | Remote oder inline GPX | `{ geojson, loading, error }` | GPX→GeoJSON Pipeline. |
| useWms | Data | `useWms({ baseUrl, params })` | OGC WMS Parameter | `{ getUrl(layer, bbox, size) }` | Hilft bei dynamischen Tile-Requests. |
| useFilterData | Temporal | `useFilterData({ data, timeExtent })` | Zeitintervall | Gefilterte Daten | Für TemporalController. |
| useFeatureEditor | Editing | `useFeatureEditor({ mapId, layerId, mode })` | Editiermodus | Controller (commit, cancel) | Feature-Manipulation. |
| useAddProtocol | Protocol | `useAddProtocol({ scheme, handler })` | Schema-Name | void | Registriert custom Protokoll (csv:// etc.). |
| useAddImage | Assets | `useAddImage({ mapId, id, image, options })` | Image/Meta | void | Fügt Sprites/Bilder hinzu. |
| useAddImage (multiple) | Assets | Variation akzeptiert Array | Array | void | Bulk-Image Registrierung. |
| useLayerContext | Internal | `useLayerContext()` | - | Layer-spezifische Kontextwerte | Wird von High-Level UI genutzt. |

## 52. Protokoll-Handler Integration (Schritt-für-Schritt)
1. Hook verwenden: `useAddProtocol({ scheme: 'csv', handler: CSVProtocolHandler })` innerhalb Provider-Hierarchie.
2. Resources laden via Style/Source URL: `url: 'csv://path/to/file.csv?delimiter=;`.
3. Handler erhält `RequestParameters` (MapLibre) → extrahiert Filename & Optionen.
4. Konvertierung: Parser (`csv2geojson`, OSM, TopoJSON, XML) liefert `FeatureCollection`.
5. Rückgabe Objekt `{ data: FeatureCollection }` → MapLibre erstellt Source.
Validation & Security: Nur Whitelisted Schemata registrieren; Dateigrößenlimit implementieren (z.B. Abbruch > 10MB) vor Konvertierung.

## 53. Wrapper Event-Referenz
| Event | Quelle | Auslöser | Payload/Context | Nutzung |
|-------|--------|----------|-----------------|---------|
| `layerchange` | wrapper | Layer add/remove/style refresh | internal state snapshot diff | UI Layer Trees, Dirty-Checks |
| `viewportchange` | wrapper | `move` Ereignisse (throttled) | `{center,zoom,bearing,pitch}` | Kamera-Sync, Overview Map |
| `addsource` | wrapper | Source Registrierung | `{ source_id }` | Debug / Logging |
| `addlayer` | wrapper | Layer Registrierung | `{ layer_id }` | On-demand Layer init side-effects |
Unterschied zu nativen MapLibre Events: wrapper Events abstrahieren Zustand, schließen Cleanup-Integration ein und feuern nur bei sinnvollem Diff.

## 54. Redux MapStore Nutzungsbeispiel
Minimaler Zugriff:
```ts
import { MapStore } from '@mapcomponents/react-maplibre';
const { store, setLayerInMapConfig } = MapStore;
store.dispatch(setLayerInMapConfig({ mapConfigKey: 'main', layer: myLayerConfig }));
```
Beispiel LayerConfig (GeoJSON):
```ts
const layerConfig = {
  type: 'geojson',
  uuid: 'route-A',
  config: { geojson: myData, options: { paint: { 'line-color': '#f00' } } }
};
```
Ordnung anpassen: `updateLayerOrder({ mapConfigKey:'main', newOrder:[{ uuid:'route-A'}] })`.
Caveat: Sichtbarkeitskaskade über `masterVisible` kann Layer unabhängig von deren individuellen Flags ausblenden.

## 55. Theming & Style Switching
Ansatz:
1. Eigene Theme-Extension: `const theme = getTheme('light'); const custom = { ...theme, palette:{ ...theme.palette, primary:{ main:'#0af'} } };`
2. Zusätzlichen MUI ThemeProvider außerhalb oder innerhalb von `MapComponentsProvider` verschachteln (innere Provider überschreiben tiefer liegende Variablen selektiv).
3. Basemap Switch: Zustand `currentStyle` halten, per select Menü `mapRef.map.setStyle(nextStyle)` (MapLibreMap macht das bereits bei Änderung von `options.style`).
4. Für Nutzerfreundlichkeit Stil-Presets importieren (`MonokaiStyle`, etc.) oder remote Style JSON vorladen → als Objekt setzen (verhindert Doppelladen).

## 56. Performance-Instrumentierung
Messpunkte:
- Initial Load: Zeit bis erstes `load` Event (Performance.now() bei Start vs onReady Callback).
- Layer Mutation: Zeit für Batch (N) paint/layout Updates → wrapper queue Option (zukünftig) vs Einzelaufrufe.
- FPS Tracking: `requestAnimationFrame` Delta Mittelwert während animierter Kamerafahrten.
Praktische Hooks:
```ts
useEffect(()=>{ const t0=performance.now(); const off=map.wrapper.on('layerchange',()=>{console.log('Layer changed after',performance.now()-t0,'ms');}); return ()=>off; },[]);
```
Optimierungs-Checkliste: stabile Referenzen (`useMemo` für GeoJSON), keine unnötigen Style-Wechsel, Clustering für >10k Punkte, Circle Layer statt DOM Marker.

## 57. Deprecation & Migration
Aktiv bekannte Deprecations: `MlGeoJsonLayer` Props `paint`, `layout` (ersetzt durch `options.paint`, `options.layout`).
Migration Schritt:
1. Suche: `paint:` → transformiere zu `options: { ...(options||{}), paint: <expr> }`.
2. Entferne alte Prop.
3. Wiederhole für `layout`.
Codemod Skizze (js-codemod): AST Suche nach JSXAttribute `name=paint|layout` in Element `MlGeoJsonLayer`.
Release Policy Empfehlung: Markieren im CHANGELOG unter "Deprecated" & nach >=1 Minor bump entfernen.

## 58. Lokale Entwicklung (Library Upstream)
Klonen & Build:
```
git clone https://github.com/mapcomponents/react-map-components-maplibre
cd react-map-components-maplibre
yarn
yarn build
yarn start  # Storybook
```
Verknüpfen in Projekt:
```
yarn link
cd ../MapTelling/maptelling-react
yarn link @mapcomponents/react-maplibre
yarn dev
```
Bei Änderungen: in Library `yarn build` erneut, Vite HMR aktualisiert App. Alternativ `yarn build --watch` falls vorhanden.

## 59. Security Hardening (Daten & Protokolle)
| Risiko | Angriffsvektor | Gegenmaßnahme |
|--------|----------------|---------------|
| Malicious CSV/OSM | Formatinjektion, Riesendatei | Max Bytes Limit + Timeout + Schema Validierung |
| XSS in Properties | Popup Rendering unsanitized | Escape HTML / dangerouslySetInnerHTML vermeiden |
| External Style Injection | Remote JSON manipuliert Layer | Hash-Pinning / Own CDN Deployment |
| DoS via Many Layers | Mass addLayer Schleife | Throttle + Diff vor Add |
| Over-permissive Protocols | Register beliebiger scheme:// | Allowlist erzwingen |

## 60. Versions- & Upgrade-Checkliste
| Bereich | Aktuelle Annahme | Check vor Upgrade |
|---------|------------------|------------------|
| React | ^19.x | Breaking Hook API? Concurrent features? |
| MapLibre GL | 5.x | Style Spec Änderungen, Terrain API Diff |
| Node | >=16 (Template) | CI Matrix anpassen (18/20 LTS) |
| TypeScript | ^5.9 (lib) vs ^5.4 (app) | Angleichen für bessere Types / Satisfies |
| MUI | ^7.x | Theme API Änderungen prüfen |
| Redux Toolkit | ^2.6 | Action/Immer Änderungen |
Upgrade Flow:
1. Abhängigkeit isoliert bumpen.
2. `yarn test` & Storybook visuelle Prüfung.
3. API Extraction laufen lassen (Hash vergleichen) – dokumentiere Drift.
4. Performance Smoke (Layer add/remove Loop) & Basic Map Interaction.

---
Abschnitte 51–60 schließen verbleibende Lücken (Hooks komplett, Protokolle, Events, Store Nutzung, Theming, Performance, Migration, Security, Upgrade) um zukünftige Arbeit ohne erneute Analyse des Upstream Repos zu ermöglichen.

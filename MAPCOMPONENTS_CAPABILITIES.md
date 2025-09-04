# MapComponents Capabilities & Reference

A curated, structured knowledge base of the MapComponents ecosystem for reuse in future tasks. Updated: 2025-09-04.

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

### 2.4 Hooks (Inferred Common Patterns)
- `useMap({ mapId })`: access a registered map instance (returns { map, ready, removeMap }).
- Likely additional hooks in repo (not fully fetched here) for: camera sync, geolocation, search, layers state. (Check storybook & src/hooks for expansion if needed.)

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

## 16. Komponenten-API-Katalog (Erweitert)
Hinweis: Einige Namen sind anhand üblicher Patterns und Storybook-Konventionen abgeleitet. Bei Unsicherheit vor Nutzung gegen aktuelle Library-Version verifizieren.

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

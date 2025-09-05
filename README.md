# MapTelling

Zentrale Kartenanwendung – alle Entwicklungsrichtlinien gemäß `docs/mapcomponents_capabilities.md` (Abschnitte 1–72 sind verbindlich; keine externe Org-Recherche nötig).

## Setup
Bevorzugt (yarn), falls nicht installiert Fallback npm.
```bash
# npm Fallback
npm install
npm run dev
```

## Entwicklung
Lokaler Dev Server:
```bash
npm run dev
```

Production Build testen:
```bash
npm run build
npm run preview
```

## Deployment (GitHub Pages – CI Variante)
Automatisch über GitHub Actions Workflow `.github/workflows/deploy.yml` bei jedem Push auf `main`.

URL: https://fhaefker.github.io/MapTelling/

Technikdetails:
- Vite `base` Production: `/MapTelling/` (siehe `vite.config.ts`).
- Artifact Deployment (Pages Build): Kein separater `gh-pages` Branch nötig.
- Manuelles Deployment via Script wurde entfernt (Vereinfachung, Single Source of Truth CI).

Troubleshooting:
- Weißer Bildschirm / 404 auf `/src/main.tsx`: Sicherstellen, dass Pages auf "GitHub Actions" steht (Settings → Pages).
- Hard Reload (Strg+Shift+R) nach neuem Deployment wegen Caching.

## Optionale Erweiterungen (aktivierbar bei Bedarf)
- Zusätzliche Pfad-Filter im CI Workflow (nur deploy wenn relevante Files geändert)
- Code Splitting / Performance Tuning (Rollup manualChunks) – erst nötig wenn initiale Ladezeit kritisch wird
- PWA / Offline (Service Worker + Workbox; Sections 61–62, 69) – erst nach definierter offline User Story
- QGIS Project Import CLI (Section 63) – nur falls QGIS Export-Dateien vorliegen
- Data Pipeline Script (`scripts/process-data.ts`) – sobald erste externe Rohdaten ingestiert werden
- API Drift Detection Workflow – nach Einführung stabiler externer Schnittstelle

## Kernarchitektur
| Element | Zweck | Referenz Abschnitt |
|---------|-------|--------------------|
| MapComponentsProvider | Kontext & Registry | 37 |
| MapLibreMap (`mapId="main"`) | Hauptkarte | 39 |
| MlWmsLayer | OSM WMS Basemap | 19 (Daten-Layer) |

## WMS Basemap
Fester Endpoint: `https://osm-demo.wheregroup.com` Layer: `OSM-WMS` (nur diese Hintergrundkarte wird genutzt).

## Erweiterungs-Ideen
- Layer Toggle & Transparenz Slider.
- Offline Caching (Sections 61–62, 69) – später Service Worker.
- QGIS Projekt Import CLI (Section 63) für automatische Layer-Konfiguration.
- Data Pipeline Scaffold (Section 62) – `scripts/process-data.ts`.

## Qualität & Performance
- Keine Nutzung deprecated Props (`MlGeoJsonLayer.paint/layout`).
- Mehrpunktdarstellungen künftig Circle Layer (Section 20) statt DOM Marker.
- WMS Request Monitoring & optional Tile Cache Layer.

## Lizenz
Interne Nutzung; Upstream Abhängigkeiten MIT.

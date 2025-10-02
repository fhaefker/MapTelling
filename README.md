# MapTelling - Foto-basierte Scroll-Story auf interaktiver Karte

[![Deploy to GitHub Pages](https://github.com/fhaefker/MapTelling/actions/workflows/deploy.yml/badge.svg)](https://github.com/fhaefker/MapTelling/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/demo-live-success)](https://fhaefker.github.io/MapTelling/)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

Eine Webanwendung, die Foto-Storytelling mit interaktiver Kartografie verbindet. Nutzer laden Fotos hoch, weisen ihnen GPS-Positionen zu und erstellen scrollbare Geschichten. Beim Scrollen navigiert die Karte automatisch zu den Foto-Standorten.

## ✨ Features

- 📸 **Foto-Upload** mit EXIF-Metadaten-Extraktion (GPS, Kamera, Datum)
- 🗺️ **Automatische GPS-Positionierung** oder manuelle Platzierung auf Karte
- ✍️ **Text-Annotationen** pro Foto (Titel, Beschreibung)
- 📜 **Scroll-synchronisierte Karten-Navigation** (Map ↔ Photos)
- 💾 **Persistente lokale Speicherung** (IndexedDB + LocalStorage, Privacy by Design)
- 📤 **JSON-Export** für Sharing (GeoJSON RFC 7946)
- ⌨️ **Vollständige Tastatur-Navigation** (Arrow Keys, Home, End)
- ♿ **WCAG 2.1 Accessibility** (Screen Reader, Reduced Motion Support)

## 🚀 Quick Start

**Live Demo**: [https://fhaefker.github.io/MapTelling/](https://fhaefker.github.io/MapTelling/)

1. Öffne die App im Browser
2. Klicke auf **"Editor"** (oben rechts)
3. Lade Fotos per Drag & Drop hoch
4. Bearbeite Titel und Beschreibung
5. Wechsle zum **"Viewer"**
6. Scrolle mit Mausrad → Karte fliegt automatisch mit! 🎉

## 🛠️ Technologie-Stack

- **React 19.1** + **TypeScript 5.9**
- **@mapcomponents/react-maplibre 1.6.0** - Deklaratives Map Framework
- **React Router 7.9** - Multi-Page Navigation
- **Material-UI 7.3** - Theme Integration (WhereGroup Colors)
- **IndexedDB** (via `idb 8.0`) - Photo Storage (Privacy by Design)
- **ExifReader 4.32** - GPS & Metadata Extraction
- **Vite 7.1** - Fast Build Tool

## Entwicklung

```bash
# Dependencies installieren
npm install

# Development Server starten
npm run dev

# Production Build
npm run build

# Preview Production Build
npm run preview
```

## 📦 Deployment

Die Anwendung wird **automatisch zu GitHub Pages deployed**, wenn Änderungen zum `main` Branch gepusht werden.

**Deployment-Workflow:**
1. Push zu `main` → GitHub Actions Workflow startet
2. `npm ci` → Dependencies installieren
3. `npm run build` → Production Build (Vite)
4. Upload zu GitHub Pages
5. Live unter: **https://fhaefker.github.io/MapTelling/**

**Status:** [![Deploy Status](https://github.com/fhaefker/MapTelling/actions/workflows/deploy.yml/badge.svg)](https://github.com/fhaefker/MapTelling/actions)

## 📐 Architektur & Compliance

**100% WhereGroup-Prinzipien:**
- ✅ **Configuration over Code**: GeoJSON-basierte Story-Konfiguration
- ✅ **Open Source First**: Alle Dependencies MIT/ISC-lizenziert
- ✅ **Standards-driven**: GeoJSON (OGC RFC 7946), EXIF (ISO), Web Storage (W3C)
- ✅ **Privacy by Design**: Lokale Speicherung (IndexedDB), keine Cloud-Uploads

**100% MapComponents-Patterns:**
- ✅ MapComponentsProvider als Root-Context
- ✅ useMap/useMapState Hooks (kein direkter `map.map` Zugriff)
- ✅ MlGeoJsonLayer für deklarative Marker
- ✅ Theme Integration via `getTheme()`
- ✅ Clean Unmount (Intersection Observer disconnect)

**Detaillierte Dokumentation:**
- [CONCEPT.md](CONCEPT.md) - Vollständiges Konzeptdokument
- [ARCHITECTURE.md](ARCHITECTURE.md) - Technische Architektur
- [REFACTORING.md](REFACTORING.md) - Refactoring-Dokumentation
- [STATUS.md](STATUS.md) - Implementation Status (95% MVP)

## WhereGroup

Entwickelt mit [MapComponents](https://mapcomponents.org) von der [WhereGroup GmbH](https://wheregroup.com).


## Technology Stack

- **MapComponents**: React wrapper for MapLibre GL
- **React 19**: UI framework
- **TypeScript**: Type safety
- **Vite**: Fast build tool
- **GitHub Actions**: CI/CD pipeline
```
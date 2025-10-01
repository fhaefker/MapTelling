# MapTelling - Minimal MapComponents Application

Eine schlanke MapComponents-Anwendung mit Vollbild-Karte und WhereGroup OSM WMS Demo Service, zentriert auf Bonn (WhereGroup HQ).

## Features

- **Vollbild-Karte**: Nutzt den gesamten Browser-Viewport
- **WhereGroup WMS**: OSM Demo Service als Hintergrund
- **MapComponents**: Deklarative React-Architektur
- **Minimales Design**: Fokussierte, schlanke Implementierung
- **GitHub Pages**: Automatisches Deployment-Workflow

## Technologie-Stack

- **React 19** + **TypeScript**
- **MapComponents** (`@mapcomponents/react-maplibre` ^1.6.0)
- **Vite** für schnelle Entwicklung
- **Node.js** >=20

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

## Deployment

Die Anwendung wird automatisch zu GitHub Pages deployed, wenn Änderungen zum `main` Branch gepusht werden.

**Live Demo**: https://fhaefker.github.io/MapTelling

## Architektur

Die Anwendung folgt den WhereGroup-Prinzipien:
- **Configuration over Code**: Deklarative MapLibre Style JSON
- **Open Source First**: MIT-lizenzierte MapComponents
- **Standards-driven**: OGC WMS Integration
- **Minimal & Fokussiert**: Keine unnötige Komplexität

## WhereGroup

Entwickelt mit [MapComponents](https://mapcomponents.org) von der [WhereGroup GmbH](https://wheregroup.com).


## Technology Stack

- **MapComponents**: React wrapper for MapLibre GL
- **React 19**: UI framework
- **TypeScript**: Type safety
- **Vite**: Fast build tool
- **GitHub Actions**: CI/CD pipeline
```
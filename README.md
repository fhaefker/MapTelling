# MapTelling

An interactive storytelling map application showcasing the Cape Wrath Trail hiking experience in Scotland.

🌐 Live Demo (optional): coming soon

## 🚀 Features

- **Interactive Storytelling**: Scroll-based narrative with automatic map navigation
- **Dual Navigation Modes**: Toggle between story mode and free exploration
- **3D Terrain**: Enhanced map visualization with elevation data
- **Responsive Design**: Optimized for desktop and mobile devices
- **Modern Architecture**: Modular, maintainable codebase

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Mapping**: MapLibre GL via @mapcomponents/react-maplibre (React)
- **Scrolling**: react-intersection-observer, Framer Motion
- **Architecture**: React + Vite, komponentenbasiert (MapComponents)

## 📁 Project Structure

```
MapTelling/
└── maptelling-react/
    ├── index.html            # Vite entry
    ├── vite.config.ts
    ├── public/
    │   └── assets/           # Images & GeoJSON
    └── src/
        ├── index.tsx         # React entry
        ├── App.tsx           # Provider + App
        ├── MapTellingApp.tsx # Map + Scroller + Overlay + Controls
        ├── components/
        │   ├── InsetMap.tsx
        │   ├── MarkerLayer.tsx
        │   ├── ModeToggle.tsx
        │   ├── NavigationControls.tsx
        │   ├── StoryOverlay.tsx
        │   ├── StoryScroller.tsx
        │   └── TerrainManager.tsx
        ├── config/
        │   └── mapConfig.ts
        └── MapTellingApp.css
```

## 🔧 Configuration

Edit `maptelling-react/src/config/mapConfig.ts` to customize:

- **Map Settings**: MapLibre style, initial view
- **Story Content**: Chapters, titles, descriptions, images, optional markers
- **Feature Flags**: Inset map, optional 3D terrain (open DEM sources)

## 🎨 Customization

### Adding New Chapters

```javascript
{
    id: 'unique-chapter-id',
    alignment: 'left|center|right|full',
    title: 'Chapter Title',
    image: './assets/image.jpg',
    description: 'Chapter description...',
    location: {
        center: [longitude, latitude],
        zoom: 12,
        pitch: 0,
        bearing: 0
    },
    onChapterEnter: [],
    onChapterExit: []
}
```

### Styling

Modify CSS variables in `src/css/styles.css`:

```css
:root {
    --primary-color: #3FB1CE;
    --background-overlay: rgba(255, 255, 255, 0.95);
    --border-radius: 8px;
    --shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}
```

## 🚀 Development

### Local Development (Vite)

1. cd maptelling-react
2. Install dependencies (yarn / npm i / pnpm i)
3. Run dev server (yarn dev / npm run dev)
4. Open http://localhost:5174

## 🌐 Deployment (GitHub Pages)

This repository is configured to auto-deploy the Vite app to GitHub Pages on every push to `main`.

- Pages URL: https://fhaefker.github.io/MapTelling/
- Vite `base` is set to `/MapTelling/` in `maptelling-react/vite.config.ts`.
- Assets are loaded using `import.meta.env.BASE_URL` to work under the subpath.

## 📱 Browser Support

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🔗 Dependencies

- [@mapcomponents/react-maplibre](https://github.com/mapcomponents/react-map-components-maplibre)
- [MapLibre GL](https://maplibre.org/)
- [Framer Motion](https://www.framer.com/motion/)
- [react-intersection-observer](https://github.com/thebuilder/react-intersection-observer)

## 🏞️ About the Story

This application tells the story of a 17-day hiking adventure on the Cape Wrath Trail in Scotland, covering 433km with 11,857m of elevation gain. The trail is known for its challenging terrain, particularly the infamous mud sections.

**Photos by Frederik Häfker**

## 📄 License

Built with MapComponents and MapLibre

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 🐛 Issues

Report bugs and feature requests on the [GitHub Issues](https://github.com/fhaefker/MapTelling/issues) page.

## 🐞 Debug & Instrumentation Namespace

Experimental development utilities are exposed via a debug namespace (not for production bundles):

```
import { DevMetricsOverlay, useLayerChangeLog, useMapFrameRate } from './src/debug';

// Example conditional render (development only)
{process.env.NODE_ENV !== 'production' && (
    <DevMetricsOverlay mapId="maptelling-map" />
)}
```

These exports aggregate instrumentation hooks and the metrics overlay for quick performance inspection. They rely on MapComponents wrapper events; cost is negligible when not rendered / sampling.

## Architektur & Performance (Ergänzt)

Optimierungen aus dem Refactor Backlog (Auszug):

- Prefetch MapLibre Style JSON zur Vermeidung von Style Flash
- Lazy Loading der UI/Narrative Komponenten (Overlay, Scroller, Controls) reduziert Initial Bundle
- Hash-basierter GeoJSON Diff-Skip (kein redundantes setData)
- Abort + Timeout beim Track Fetch (Resilienz)
- Terrain optional (Toggle) via deklarativer `MlTerrain` Komponente
- `useFpsSample` & FrameRate Instrumentierung für Debug (`?debug`)
- Error Boundary (`MapErrorBoundary`) fängt Runtime-Fehler ab
- Logger Utility (`utils/logger.ts`) mit Level-Steuerung via `?debug`
- Accessibility: Skip-Link, aria Roles/Labels, Test (`a11yNavigation.test.tsx`)
- Multi-Map Sync Prototyp Hook (`useMapSync`) für zukünftige Erweiterung

Bundle Size Report: `npm run build:size` erstellt `dist-size.json` mit Byte/KiB Angaben.

## Security & CSP

Sanitizing: Kapitelbeschreibungen werden via `safeHtmlLineBreaks` gereinigt (Basis XSS Schutz für Zeilenumbrüche).

Empfohlene Minimal Content-Security-Policy (anpassen je nach Tile Provider):

```
Content-Security-Policy: \
    default-src 'self'; \
    img-src 'self' data: https:; \
    script-src 'self'; \
    style-src 'self' 'unsafe-inline'; \
    connect-src 'self' https://api.maptiler.com https://demotiles.maplibre.org; \
    worker-src 'self';
```

Weitere Schritte offen: Protocol Allowlist, Größenlimit für GeoJSON (<2MB) Validierung, Service Worker Offline Cache.

## Offline & Protocol (Step 6)

- Minimaler Service Worker (`service-worker.js`) precachet den Track (GeoJSON) für wiederholte Aufrufe.
- Protocol Allowlist Scaffold (`utils/protocols.ts`): http / https / data registriert; Erweiterung für custom Schemes möglich.
- Geplanter Ausbau: Workbox Integration (Runtime Caching für Style & Tiles, Versionierung, Offline Fallback).


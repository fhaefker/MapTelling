# MapTelling Application

MapTelling ist eine Storytelling-Demonstration auf Basis von `@mapcomponents/react-maplibre` mit Fokus auf:
- Scroll-/Kapitel-basierte Kamerafahrten (Chapter Navigation Hook)
- Deklarative Layer (Route, Marker) und optionalem Terrain
- Performance-orientierter Composite Line Layer (Glow + Main)

Siehe `MAPCOMPONENTS_CAPABILITIES.md` für vollständige Architektur-Referenz.

## Aktuelle Architektur (vereinfachte Version)
```
ChaptersProvider
  └─ MapTellingApp
	  └─ MapShell
		  ├─ MapLibreMap
		  ├─ InteractionController
		  ├─ MlTerrain (optional DEM)
		  ├─ CompositeGeoJsonLine (Route)
		  ├─ MarkerLayer
		  ├─ InsetMap (optional)
		  ├─ StoryScroller (weiße Karten, Inline Edit + Create)
		  ├─ UnifiedControls (Freie Navigation / DEM)
		  ├─ NavigationControls
		  ├─ ProgressBar
		  └─ DebugOverlay (optional)
```

## Performance Quick Wins (implementiert)
| Maßnahme | Beschreibung |
|----------|--------------|
| Prefetch Style | Remote Style wird vor Nutzung geladen -> weniger Flash |
| Abort Controller Track Fetch | Verhindert Zombie Requests |
| Memo Chapter Start | Weniger wiederholte Zugriffskosten |
| Stabile Layer IDs | Verhindert Duplikat-Layer |
| Terrain Toggle | Terrain optional (Performance Ersparnis) |
| Sanitizer | Verhindert XSS im Overlay |

Aufräumarbeiten:
- Entfernte Legacy Overlays & Editor-Komponenten
- Konsolidierte Steuerung (UnifiedControls)
- Responsives Story-Panel + Karten-Offset
- Automatische Marker-Übernahme beim Kapitel-Erstellen

Unbenutzte-Dateien-Check:
```
npm run lint:unused
```
Bundle-Größe Analyse:
```
npm run analyze
```

# Getting Started (CRA Basis)

Dieses Projekt wurde initial mit [Create React App](https://github.com/facebook/create-react-app) erstellt.

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can’t go back!**

If you aren’t satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you’re on your own.

You don’t have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn’t feel obligated to use this feature. However we understand that this tool wouldn’t be useful if you couldn’t customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).

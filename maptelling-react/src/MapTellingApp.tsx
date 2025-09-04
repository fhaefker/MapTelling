import React, { useState, useEffect, useCallback, useMemo, Suspense, lazy } from 'react';
import { I18nProvider, useT } from './i18n/I18nProvider';
import MapErrorBoundary from './components/MapErrorBoundary';
import { log } from './utils';
import { MapLibreMap, MlGeoJsonLayer, useMap } from '@mapcomponents/react-maplibre';
import { motion } from 'framer-motion';
import type { FeatureCollection, LineString } from 'geojson';
import { config } from './config/mapConfig';
import { fetchWmsCapabilities, chooseOsmLayer } from './utils/wms';
import { ChaptersProvider, useChapters } from './context/ChaptersContext';
// Lazy loaded UI/Story components (ST-09)
const StoryOverlay = lazy(() => import('./components/StoryOverlay'));
const NavigationControls = lazy(() => import('./components/NavigationControls'));
const ModeToggle = lazy(() => import('./components/ModeToggle'));
const MarkerLayer = lazy(() => import('./components/MarkerLayer'));
const StoryScroller = lazy(() => import('./components/StoryScroller'));
const StoryCreator = lazy(() => import('./components/StoryCreator'));
const InsetMap = lazy(() => import('./components/InsetMap'));
const MlTerrain = lazy(() => import('./components/MlTerrain'));
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapTellingApp.css';
const InteractionController = lazy(() => import('./components/InteractionController'));
const CompositeGeoJsonLine = lazy(() => import('./components/CompositeGeoJsonLine'));
import { useChapterNavigation } from './hooks/useChapterNavigation';
import { useViewportSync } from './hooks/useViewportSync';
import { useFpsSample } from './hooks/useFpsSample';

const InnerApp: React.FC = () => {
  /* QW-01: zentraler Chapters Context (verhindert Mehrfach-Hook Aufrufe) */
  const chaptersCtx = useChapters();
  const chapters = chaptersCtx.chapters;
  const totalChapters = chaptersCtx.total;

  const [interactive, setInteractive] = useState<boolean>(false);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [trackData, setTrackData] = useState<FeatureCollection<LineString> | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null); // QW-02 Fehlerzustand
  const [styleObject, setStyleObject] = useState<any | null>(null); // WMS raster style object only
  const [terrainEnabled, setTerrainEnabled] = useState<boolean>(!!config.terrain?.enabled); // QW-08 Toggle Terrain
  const t = useT();
  const debugEnabled = typeof window !== 'undefined' && window.location.search.includes('debug');
  const { fps } = useFpsSample({ enabled: debugEnabled }); // ST-02 FPS Hook

  // Map Hook
  const mapHook = useMap({ mapId: 'maptelling-map' });

  // QW-04 start chapter memo
  const startChapter = useMemo(() => chapters[0], [chapters]);

  // Map load flag
  useEffect(() => { if (mapHook.map) setIsMapLoaded(true); }, [mapHook.map]);

  // Build WMS-only raster style once with dynamic capabilities layer resolution.
  useEffect(() => {
    let cancelled = false;
    const wms = (config as any).wms as { baseUrl: string; version: '1.1.1'|'1.3.0'; layers: string; format?: string; attribution?: string };
    const preferred = [wms.layers, 'OSM-WMS', 'openstreetmap'];
    (async () => {
      let layer = wms.layers;
      try {
        // Skip in test env to avoid network
        if (!(typeof process !== 'undefined' && process.env.JEST_WORKER_ID)) {
          const caps = await fetchWmsCapabilities(wms.baseUrl, wms.version);
          if (caps && caps.layers.length) layer = chooseOsmLayer(caps, preferred);
        }
      } catch { /* ignore */ }
      if (cancelled) return;
      const format = wms.format || 'image/png';
      const tileUrl = `${wms.baseUrl}service=WMS&request=GetMap&version=${wms.version}`+
        `&layers=${encodeURIComponent(layer)}&styles=&format=${encodeURIComponent(format)}`+
        `&transparent=false&crs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}&TILED=TRUE`;
      const rasterStyle = {
        version: 8,
        name: 'WhereGroup OSM Demo WMS',
        sources: {
          wms: {
            type: 'raster',
            tiles: [tileUrl],
            tileSize: 256,
            attribution: wms.attribution || '© OSM / WhereGroup'
          }
        },
        layers: [ { id: 'wms-base', type: 'raster', source: 'wms' } ]
      } as any;
      setStyleObject(rasterStyle);
    })();
    return () => { cancelled = true; };
  }, []);

  // Helper to get base url without relying on import.meta (avoids Jest parsing issues)
  const getBaseUrl = () => {
    if (typeof document !== 'undefined') {
      const base = document.querySelector('base')?.getAttribute('href');
      if (base) return base;
    }
    return '/';
  };
  // QW-02: Load track data with AbortController + Timeout
  useEffect(() => {
    // Skip network in test environment to avoid fetch ReferenceError
    if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID) return;
    const url = `${getBaseUrl()}assets/track_day01-03.geojson`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000); // 8s Timeout
    if (typeof fetch === 'function') {
      fetch(url, { signal: controller.signal })
        .then((res) => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
        .then((json) => {
          if (json && json.type === 'FeatureCollection') {
            setTrackData(json as FeatureCollection<LineString>);
            setTrackError(null);
          } else {
            setTrackError('Track data: invalid format');
          }
        })
        .catch((e) => { if (!controller.signal.aborted) setTrackError(e.message || 'Track load failed'); })
        .finally(() => clearTimeout(timeout));
    }
    return () => { controller.abort(); clearTimeout(timeout); };
  }, []);

  // removed instrumentation hook (cleanup)

  // Optional underlying inset map sync (story mode only)
  useViewportSync({
    sourceMapId: 'maptelling-map',
    targetMapId: 'inset-map',
    shouldSync: () => !interactive,
  });

  // Chapter navigation hook (centralised)
  const { currentChapter, isPlaying, goToChapter: navigateToChapter, next: handleNext, previous: handlePrevious, togglePlay: togglePlayPause } = useChapterNavigation({ mapId: 'maptelling-map', chapters });

  // Scroll-driven Story integration moved below in JSX

  const toggleInteractive = useCallback(() => setInteractive(p => !p), []);
  const toggleTerrain = useCallback(() => setTerrainEnabled(t => !t), []); // QW-08

  useEffect(()=>{ log.info('MapTellingApp mount'); },[]);
  return (
    <MapErrorBoundary>
  <div className="map-telling-app" id="story-main" role="main" aria-label="Story">
    <a href="#story-main" className="skip-link">{t('skip.toContent')}</a>
    {/* MapLibre Map with MapComponents */}
  <MapLibreMap 
        mapId="maptelling-map"
        options={{
  style: styleObject || config.style, // generated WMS raster style (vector removed)
      center: startChapter.location.center,
      zoom: startChapter.location.zoom,
      bearing: startChapter.location.bearing || 0,
      pitch: startChapter.location.pitch || 0,
      interactive: interactive,
          attributionControl: false,
        }}
        style={{ width: '100%', height: '100vh' }}
      />

    {/* Centralised interaction toggle */}
  <Suspense fallback={null}>
    <InteractionController mapId="maptelling-map" enabled={interactive} />
  </Suspense>

  {/* Optional 3D Terrain */}
  <Suspense fallback={null}>
    <MlTerrain
      mapId="maptelling-map"
      enabled={terrainEnabled && !!config.terrain?.enabled}
      exaggeration={config.terrain?.exaggeration}
      url={config.terrain?.url as any}
      tiles={config.terrain?.tiles as any}
      tileSize={config.terrain?.tileSize as any}
    />
  </Suspense>

  {/* Mode Toggle repositioned (top-right under terrain button) */}
  <Suspense fallback={null}>
    <ModeToggle isInteractive={interactive} onToggle={toggleInteractive} />
  </Suspense>
  <button
    style={{ position: 'absolute', top: 8, right: 8, zIndex: 5 }}
    onClick={toggleTerrain}
  >{terrainEnabled ? t('terrain.disable') : t('terrain.enable')}</button>
      
      {/* GeoJSON Track Layer with MapComponents */}
      {isMapLoaded && trackData && (
        <Suspense fallback={null}>
          {/* QW-03: stabile IDs über idBase="route" */}
          <CompositeGeoJsonLine mapId="maptelling-map" data={trackData} idBase="route" color="#ff6b6b" />
        </Suspense>
      )}
      {trackError && (
        <div style={{ position:'absolute', top:40, right:8, background:'#ff6b6b', color:'#fff', padding:'4px 8px', borderRadius:4, zIndex:5 }}>
          {trackError}
        </div>
      )}
  {/* No styleError state anymore (vector logic removed) */}

      {/* Inset Map (Overview) */}
  {config.showInset && (
    <Suspense fallback={null}>
      <InsetMap mainMapId="maptelling-map" />
    </Suspense>
  )}
      
      {/* Scroll-driven chapters */}
  <Suspense fallback={null}>
  <StoryScroller
        currentChapter={currentChapter}
        onEnterChapter={(idx) => {
          if (!interactive) navigateToChapter(idx);
        }}
      />
  </Suspense>

      {/* Markers for chapters */}
  <Suspense fallback={null}>
    <MarkerLayer mapId="maptelling-map" activeChapterId={chapters[currentChapter].id} />
  </Suspense>

      {/* Story Overlay */}
  <Suspense fallback={null}>
  <StoryOverlay 
        chapter={chapters[currentChapter]}
        chapterIndex={currentChapter}
        totalChapters={totalChapters}
      />
  </Suspense>

      {/* Navigation Controls */}
  <Suspense fallback={null}>
  <NavigationControls
  currentChapter={currentChapter}
  totalChapters={totalChapters}
        isPlaying={isPlaying}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onPlayPause={togglePlayPause}
        onChapterSelect={navigateToChapter}
      />
  </Suspense>

  {/* metrics overlay removed */}

      {/* Progress Bar */}
      <motion.div 
  className="progress-bar"
  initial={{ scaleX: 0 }}
  animate={{ scaleX: (currentChapter + 1) / totalChapters }}
        transition={{ duration: 0.5 }}
      />
      {debugEnabled && (
        <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.55)', color:'#fff', padding:'4px 8px', fontSize:12, borderRadius:4 }}>
          FPS: {fps}
        </div>
      )}
      {/* Story Creator Panel */}
      <Suspense fallback={null}>
        <StoryCreator />
      </Suspense>
  {/* DevMetricsOverlay removed */}
  </div>
  </MapErrorBoundary>
  );
};

const MapTellingApp: React.FC = () => (
  <I18nProvider>
    <ChaptersProvider chapters={config.chapters}>
      <InnerApp />
    </ChaptersProvider>
  </I18nProvider>
);

export default MapTellingApp;

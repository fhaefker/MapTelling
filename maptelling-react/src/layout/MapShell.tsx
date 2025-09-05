import React, { Suspense, useState, useEffect } from 'react';
import { MapLibreMap, useMap } from '@mapcomponents/react-maplibre';
import { config } from '../config/mapConfig';
import { useChapters } from '../context/ChaptersContext';
import useWmsStyle from '../hooks/useWmsStyle';
import useTrackData from '../hooks/useTrackData';
import GeoJsonLine from '../components/GeoJsonLine';
import InsetMap from '../components/InsetMap';
import MlTerrain from '../components/MlTerrain';
import InteractionController from '../components/InteractionController';
import WmsOverlay from '../components/WmsOverlay';
import ProgressBar from '../components/ProgressBar';
import DebugOverlay from '../components/DebugOverlay';
import ViewportMetricsOverlay from '../components/ViewportMetricsOverlay';
import FreeNavHint from '../components/FreeNavHint';
import MarkerLayer from '../components/MarkerLayer';
import StoryMenu from '../components/StoryMenu';
import { useChapterNavigation } from '../hooks/useChapterNavigation';
import { useViewportSync } from '../hooks/useViewportSync';
import { useFpsSample } from '../hooks/useFpsSample';
import useHillshadeBackground from '../hooks/useHillshadeBackground';
import UnifiedControls from '../components/UnifiedControls';
import NavigationControls from '../components/NavigationControls';
import StoryScroller from '../components/StoryScroller';
import { useT } from '../i18n/I18nProvider';
import MapErrorBoundary from '../components/MapErrorBoundary';

// Container for map + all layered UI. Keeps state mgmt external (passed via props)
export interface MapShellProps {
  interactive: boolean;
  onToggleInteractive(): void;
  terrainEnabled: boolean;
  toggleTerrain(): void;
  terrainExag: number;
  setTerrainExag(v: number): void;
  transitionSpeed: number;
  setTransitionSpeed(v: number): void;
  showPerf: boolean;
  togglePerf(): void;
  wmsCacheEnabled: boolean;
  setWmsCacheEnabled(v: boolean): void;
}

const MapShell: React.FC<MapShellProps> = (props) => {
  const { interactive, onToggleInteractive, terrainEnabled, toggleTerrain, terrainExag, setTerrainExag, transitionSpeed, setTransitionSpeed, showPerf, togglePerf, wmsCacheEnabled, setWmsCacheEnabled } = props;
  const { chapters, total } = useChapters();
  const startChapter = chapters[0];
  const { styleObject, wmsLayerName } = useWmsStyle();
  const { trackData, trackError } = useTrackData();
  const [creatorOpen, setCreatorOpen] = useState(false);
  const { currentChapter, isPlaying, goToChapter, next, previous, togglePlay } = useChapterNavigation({ mapId: 'maptelling-map', chapters, offsetPxLeft: !interactive ? 180 : 0 });
  useViewportSync({ sourceMapId: 'maptelling-map', targetMapId: 'inset-map', shouldSync: () => !interactive });
  const debugEnabled = typeof window !== 'undefined' && window.location.search.includes('debug');
  const { fps } = useFpsSample({ enabled: debugEnabled });
  const t = useT();
  // Access primary map instance for hillshade hook
  const mapHook = useMap({ mapId: 'maptelling-map' });
  useHillshadeBackground({ map: mapHook.map, enabled: terrainEnabled, exaggeration: terrainExag });
  const [leftPad, setLeftPad] = useState(420);
  useEffect(()=>{
    const calc = () => {
      const w = window.innerWidth;
      let panel = 400;
      if (w < 480) panel = Math.max(260, w - 32);
      else if (w < 768) panel = 320;
      else if (w < 1024) panel = 360;
      else panel = 400;
      setLeftPad(panel + 20); // panel width + margin
    };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);
  // Fallback raster tiles (public OSM tile server) if WMS not loading
  const fallbackRaster = {
    version: 8,
    sources: { 'osm-fallback': { type:'raster', tiles:['https://tile.openstreetmap.org/{z}/{x}/{y}.png'], tileSize:256, attribution:'© OSM contributors' }},
    layers: [ { id:'background', type:'background', paint:{'background-color':'#fff'} }, { id:'osm-fallback', type:'raster', source:'osm-fallback' } ]
  } as any;

  const effectiveStyle = styleObject || (wmsLayerName ? config.style : fallbackRaster);

  return (
    <MapErrorBoundary>
      <div className="map-telling-app" id="story-main" role="main" aria-label="Story">
        <a href="#story-main" className="skip-link">{t('skip.toContent')}</a>
        <MapLibreMap
          mapId="maptelling-map"
          options={{
            style: effectiveStyle,
            center: startChapter.location.center,
            zoom: startChapter.location.zoom,
            bearing: startChapter.location.bearing || 0,
            pitch: startChapter.location.pitch || 0,
            interactive: true,
            attributionControl: false,
          }}
          style={{ width: '100%', height: '100vh', paddingLeft: !interactive ? leftPad : 0, transition:'padding-left 300ms ease' }}
        />
        <Suspense fallback={null}><InteractionController mapId="maptelling-map" enabled={interactive} /></Suspense>
        <Suspense fallback={null}>{config.terrain?.tiles && (
          <MlTerrain mapId="maptelling-map" enabled={terrainEnabled} exaggeration={terrainExag} url={config.terrain?.url as any} tiles={config.terrain?.tiles as any} tileSize={config.terrain?.tileSize as any} encoding={'terrarium' as any} />
        )}</Suspense>
        <Suspense fallback={null}><UnifiedControls
          interactive={interactive}
          onToggleInteractive={onToggleInteractive}
          terrainEnabled={terrainEnabled}
          toggleTerrain={toggleTerrain}
          terrainExag={terrainExag}
          setTerrainExag={setTerrainExag}
          transitionSpeed={transitionSpeed}
          setTransitionSpeed={setTransitionSpeed}
        /></Suspense>
        {trackData && (
          <Suspense fallback={null}>
            <GeoJsonLine mapId="maptelling-map" id="route-main" data={trackData} paint={{ 'line-color':'#ff6b6b', 'line-width':3, 'line-opacity':0.85 }} />
          </Suspense>
        )}
        {trackError && <div style={{ position:'absolute', top:40, right:8, background:'#ff6b6b', color:'#fff', padding:'4px 8px', borderRadius:4, zIndex:5 }}>{trackError}</div>}
        {config.showInset && <Suspense fallback={null}><InsetMap mainMapId="maptelling-map" /></Suspense>}
  <Suspense fallback={null}><StoryScroller creatorOpen={creatorOpen} onToggleCreator={()=>setCreatorOpen(o=>!o)} currentChapter={currentChapter} disabled={interactive} passThrough={interactive} onEnterChapter={idx => { if (!interactive) goToChapter(idx); }} /></Suspense>
        <Suspense fallback={null}><MarkerLayer mapId="maptelling-map" activeChapterId={chapters[currentChapter].id} /></Suspense>
        <Suspense fallback={null}><NavigationControls currentChapter={currentChapter} totalChapters={total} isPlaying={isPlaying} onPrevious={previous} onNext={next} onPlayPause={togglePlay} onChapterSelect={goToChapter} /></Suspense>
        <ProgressBar current={currentChapter} total={total} />
  {debugEnabled && <DebugOverlay fps={fps} />}
  {debugEnabled && <ViewportMetricsOverlay mapId="maptelling-map" />}
        {interactive && <FreeNavHint />}
  <Suspense fallback={null}><StoryMenu creatorOpen={creatorOpen} toggleCreator={()=>setCreatorOpen(o=>!o)} /></Suspense>
        {terrainEnabled && !config.terrain?.tiles && (
          <div style={{ position:'fixed', top:40, left:8, background:'rgba(0,0,0,0.55)', color:'#fff', padding:'4px 8px', fontSize:11, borderRadius:4 }}>Terrain (Pitch) Fallback aktiv – keine DEM Tiles konfiguriert</div>
        )}
        <Suspense fallback={null}><WmsOverlay mapId="maptelling-map" layer={wmsLayerName} attribution={(config as any).wms?.attribution} baseUrl={(config as any).wms?.baseUrl} cacheEnabled={wmsCacheEnabled} /></Suspense>
      </div>
    </MapErrorBoundary>
  );
};

export default MapShell;
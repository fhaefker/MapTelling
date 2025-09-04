import React, { Suspense } from 'react';
import { MapLibreMap, useMap } from '@mapcomponents/react-maplibre';
import { config } from '../config/mapConfig';
import { useChapters } from '../context/ChaptersContext';
import useWmsStyle from '../hooks/useWmsStyle';
import useTrackData from '../hooks/useTrackData';
import CompositeGeoJsonLine from '../components/CompositeGeoJsonLine';
import InsetMap from '../components/InsetMap';
import MlTerrain from '../components/MlTerrain';
import InteractionController from '../components/InteractionController';
import WmsOverlay from '../components/WmsOverlay';
import SettingsPanel from '../components/SettingsPanel';
import ProgressBar from '../components/ProgressBar';
import DebugOverlay from '../components/DebugOverlay';
import FreeNavHint from '../components/FreeNavHint';
import MarkerLayer from '../components/MarkerLayer';
import StoryMenu from '../components/StoryMenu';
import { useChapterNavigation } from '../hooks/useChapterNavigation';
import { useViewportSync } from '../hooks/useViewportSync';
import { useFpsSample } from '../hooks/useFpsSample';
import useHillshadeBackground from '../hooks/useHillshadeBackground';
import ModeToggle from '../components/ModeToggle';
import StoryOverlay from '../components/StoryOverlay';
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
  const { currentChapter, isPlaying, goToChapter, next, previous, togglePlay } = useChapterNavigation({ mapId: 'maptelling-map', chapters });
  useViewportSync({ sourceMapId: 'maptelling-map', targetMapId: 'inset-map', shouldSync: () => !interactive });
  const debugEnabled = typeof window !== 'undefined' && window.location.search.includes('debug');
  const { fps } = useFpsSample({ enabled: debugEnabled });
  const t = useT();
  // Access primary map instance for hillshade hook
  const mapHook = useMap({ mapId: 'maptelling-map' });
  useHillshadeBackground({ map: mapHook.map, enabled: terrainEnabled, exaggeration: terrainExag });
  return (
    <MapErrorBoundary>
      <div className="map-telling-app" id="story-main" role="main" aria-label="Story">
        <a href="#story-main" className="skip-link">{t('skip.toContent')}</a>
        <MapLibreMap
          mapId="maptelling-map"
          options={{
            style: styleObject || config.style,
            center: startChapter.location.center,
            zoom: startChapter.location.zoom,
            bearing: startChapter.location.bearing || 0,
            pitch: startChapter.location.pitch || 0,
            interactive,
            attributionControl: false,
          }}
          style={{ width: '100%', height: '100vh' }}
        />
        <Suspense fallback={null}><InteractionController mapId="maptelling-map" enabled={interactive} /></Suspense>
        <Suspense fallback={null}>{config.terrain?.tiles && (
          <MlTerrain mapId="maptelling-map" enabled={terrainEnabled} exaggeration={terrainExag} url={config.terrain?.url as any} tiles={config.terrain?.tiles as any} tileSize={config.terrain?.tileSize as any} encoding={'terrarium' as any} />
        )}</Suspense>
        <Suspense fallback={null}><ModeToggle isInteractive={interactive} onToggle={onToggleInteractive} /></Suspense>
        {trackData && (
          <Suspense fallback={null}>
            <CompositeGeoJsonLine mapId="maptelling-map" data={trackData} idBase="route" color="#ff6b6b" />
          </Suspense>
        )}
        {trackError && <div style={{ position:'absolute', top:40, right:8, background:'#ff6b6b', color:'#fff', padding:'4px 8px', borderRadius:4, zIndex:5 }}>{trackError}</div>}
        {config.showInset && <Suspense fallback={null}><InsetMap mainMapId="maptelling-map" /></Suspense>}
        <Suspense fallback={null}><StoryScroller currentChapter={currentChapter} disabled={interactive} passThrough={interactive} onEnterChapter={idx => { if (!interactive) goToChapter(idx); }} /></Suspense>
        <Suspense fallback={null}><MarkerLayer mapId="maptelling-map" activeChapterId={chapters[currentChapter].id} /></Suspense>
        <Suspense fallback={null}><StoryOverlay chapter={chapters[currentChapter]} chapterIndex={currentChapter} totalChapters={total} /></Suspense>
        <Suspense fallback={null}><NavigationControls currentChapter={currentChapter} totalChapters={total} isPlaying={isPlaying} onPrevious={previous} onNext={next} onPlayPause={togglePlay} onChapterSelect={goToChapter} /></Suspense>
        <ProgressBar current={currentChapter} total={total} />
        {debugEnabled && <DebugOverlay fps={fps} />}
        {interactive && <FreeNavHint />}
        <SettingsPanel
          terrainEnabled={terrainEnabled}
          onToggleTerrain={toggleTerrain}
          terrainExag={terrainExag}
          setTerrainExag={setTerrainExag}
          transitionSpeed={transitionSpeed}
          setTransitionSpeed={setTransitionSpeed}
          showPerf={showPerf}
          togglePerf={togglePerf}
          wmsCacheEnabled={wmsCacheEnabled}
          setWmsCacheEnabled={(fn:any) => {
            // Accept functional update signature expected by panel
            if (typeof fn === 'function') {
              setWmsCacheEnabled(fn(wmsCacheEnabled));
            } else {
              setWmsCacheEnabled(fn);
            }
          }}
        />
        <Suspense fallback={null}><StoryMenu /></Suspense>
        {terrainEnabled && !config.terrain?.tiles && (
          <div style={{ position:'fixed', top:40, left:8, background:'rgba(0,0,0,0.55)', color:'#fff', padding:'4px 8px', fontSize:11, borderRadius:4 }}>Terrain (Pitch) Fallback aktiv – keine DEM Tiles konfiguriert</div>
        )}
        <Suspense fallback={null}><WmsOverlay mapId="maptelling-map" layer={wmsLayerName} attribution={(config as any).wms?.attribution} baseUrl={(config as any).wms?.baseUrl} cacheEnabled={wmsCacheEnabled} /></Suspense>
      </div>
    </MapErrorBoundary>
  );
};

export default MapShell;
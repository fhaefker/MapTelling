import React, { useState, useEffect } from 'react';
import { MapLibreMap, MlGeoJsonLayer, useMap } from '@mapcomponents/react-maplibre';
import { motion } from 'framer-motion';
import type { FeatureCollection, LineString } from 'geojson';
import { config } from './config/mapConfig';
import StoryOverlay from './components/StoryOverlay';
import NavigationControls from './components/NavigationControls';
import ModeToggle from './components/ModeToggle';
import MarkerLayer from './components/MarkerLayer';
import StoryScroller from './components/StoryScroller';
import InsetMap from './components/InsetMap';
import TerrainManager from './components/TerrainManager';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapTellingApp.css';
import InteractionController from './components/InteractionController';
import TrackCompositeLayer from './components/TrackCompositeLayer';
import { useChapterNavigation } from './hooks/useChapterNavigation';

const MapTellingApp: React.FC = () => {
  const [interactive, setInteractive] = useState<boolean>(false);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [trackData, setTrackData] = useState<FeatureCollection<LineString> | null>(null);
  
  const mapHook = useMap({
    mapId: 'maptelling-map',
  });

  // Map load flag
  useEffect(() => {
    if (mapHook.map) setIsMapLoaded(true);
  }, [mapHook.map]);

  // Load track data from public assets (no Mapbox dependency)
  useEffect(() => {
    const url = `${import.meta.env.BASE_URL}assets/track_day01-03.geojson`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : null))
      .then((json) => {
        if (json && json.type === 'FeatureCollection') {
          setTrackData(json as FeatureCollection<LineString>);
        }
      })
      .catch(() => {
        // optional: log or ignore
      });
  }, []);

  // Chapter navigation hook (centralised)
  const {
    currentChapter,
    isPlaying,
    goToChapter: navigateToChapter,
    next: handleNext,
    previous: handlePrevious,
    togglePlay: togglePlayPause,
  } = useChapterNavigation({ mapId: 'maptelling-map', chapters: config.chapters });

  // Scroll-driven Story integration moved below in JSX

  const toggleInteractive = () => setInteractive(p => !p);

  return (
    <div className="map-telling-app">
    {/* MapLibre Map with MapComponents */}
      <MapLibreMap 
        mapId="maptelling-map"
        options={{
          style: config.style,
          center: config.chapters[0].location.center,
          zoom: config.chapters[0].location.zoom,
          bearing: config.chapters[0].location.bearing || 0,
          pitch: config.chapters[0].location.pitch || 0,
      interactive: interactive,
          attributionControl: false,
        }}
        style={{ width: '100%', height: '100vh' }}
      />

    {/* Centralised interaction toggle */}
    <InteractionController mapId="maptelling-map" interactive={interactive} />

  {/* Optional 3D Terrain */}
  <TerrainManager mapId="maptelling-map" config={config.terrain} />

    {/* Mode Toggle (Story vs Free Navigation) */}
    <ModeToggle isInteractive={interactive} onToggle={toggleInteractive} />
      
      {/* GeoJSON Track Layer with MapComponents */}
      {isMapLoaded && trackData && (
        <TrackCompositeLayer mapId="maptelling-map" data={trackData} />
      )}

      {/* Inset Map (Overview) */}
  {config.showInset && <InsetMap mainMapId="maptelling-map" />}
      
      {/* Scroll-driven chapters */}
      <StoryScroller
        currentChapter={currentChapter}
        onEnterChapter={(idx) => {
          if (!interactive) navigateToChapter(idx);
        }}
      />

      {/* Markers for chapters */}
      <MarkerLayer mapId="maptelling-map" activeChapterId={config.chapters[currentChapter].id} />

      {/* Story Overlay */}
      <StoryOverlay 
        chapter={config.chapters[currentChapter]}
        chapterIndex={currentChapter}
        totalChapters={config.chapters.length}
      />

      {/* Navigation Controls */}
      <NavigationControls
        currentChapter={currentChapter}
        totalChapters={config.chapters.length}
        isPlaying={isPlaying}
        onPrevious={handlePrevious}
        onNext={handleNext}
        onPlayPause={togglePlayPause}
        onChapterSelect={navigateToChapter}
      />

      {/* Progress Bar */}
      <motion.div 
        className="progress-bar"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: (currentChapter + 1) / config.chapters.length }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
};

export default MapTellingApp;

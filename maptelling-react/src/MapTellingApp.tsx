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
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapTellingApp.css';

const MapTellingApp: React.FC = () => {
  const [currentChapter, setCurrentChapter] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  const [interactive, setInteractive] = useState<boolean>(false);
  const [trackData, setTrackData] = useState<FeatureCollection<LineString> | null>(null);
  
  const mapHook = useMap({
    mapId: 'maptelling-map',
  });

  // Initialize map with first chapter
  useEffect(() => {
    if (!mapHook.map) return;
    
    setIsMapLoaded(true);
    
    // Set initial camera position
    const firstChapter = config.chapters[0];
    mapHook.map.map.jumpTo({
      center: firstChapter.location.center,
      zoom: firstChapter.location.zoom,
      bearing: firstChapter.location.bearing || 0,
      pitch: firstChapter.location.pitch || 0,
    });

    // ensure interactivity matches state
    if (interactive) {
      mapHook.map.map.scrollZoom.enable();
      mapHook.map.map.dragPan.enable();
      mapHook.map.map.keyboard.enable();
      mapHook.map.map.doubleClickZoom.enable();
      mapHook.map.map.touchZoomRotate.enable();
    } else {
      mapHook.map.map.scrollZoom.disable();
      mapHook.map.map.dragPan.disable();
      mapHook.map.map.keyboard.disable();
      mapHook.map.map.doubleClickZoom.disable();
      mapHook.map.map.touchZoomRotate.disable();
    }
  }, [mapHook.map]);

  // Load track data from public assets (no Mapbox dependency)
  useEffect(() => {
    const url = `${process.env.PUBLIC_URL || ''}/assets/track_day01-03.geojson`;
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

  // Handle chapter navigation
  const navigateToChapter = (chapterIndex: number) => {
    if (!mapHook.map || chapterIndex < 0 || chapterIndex >= config.chapters.length) return;

    const chapter = config.chapters[chapterIndex];
    setCurrentChapter(chapterIndex);

    mapHook.map.map.flyTo({
      center: chapter.location.center,
      zoom: chapter.location.zoom,
      bearing: chapter.location.bearing || 0,
      pitch: chapter.location.pitch || 0,
      speed: 0.8,
      curve: 1.42,
      essential: true,
    });
  };

  // Auto-play functionality
      {/* Scroll-driven chapters */}
      <StoryScroller
        currentChapter={currentChapter}
        onEnterChapter={(idx) => {
          if (!interactive) {
            navigateToChapter(idx);
          }
        }}
      />

      {/* Markers for chapters */}
      <MarkerLayer mapId="maptelling-map" activeChapterId={config.chapters[currentChapter].id} />

  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentChapter((current) => {
        const next = current + 1;
        if (next >= config.chapters.length) {
          setIsPlaying(false);
          return current;
        }
        navigateToChapter(next);
        return next;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const handlePrevious = () => {
    const prevIndex = Math.max(0, currentChapter - 1);
    navigateToChapter(prevIndex);
  };

  const handleNext = () => {
    const nextIndex = Math.min(config.chapters.length - 1, currentChapter + 1);
    navigateToChapter(nextIndex);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const toggleInteractive = () => {
    const next = !interactive;
    setInteractive(next);
    if (!mapHook.map) return;
    if (next) {
      mapHook.map.map.scrollZoom.enable();
      mapHook.map.map.dragPan.enable();
      mapHook.map.map.keyboard.enable();
      mapHook.map.map.doubleClickZoom.enable();
      mapHook.map.map.touchZoomRotate.enable();
    } else {
      mapHook.map.map.scrollZoom.disable();
      mapHook.map.map.dragPan.disable();
      mapHook.map.map.keyboard.disable();
      mapHook.map.map.doubleClickZoom.disable();
      mapHook.map.map.touchZoomRotate.disable();
    }
  };

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

    {/* Mode Toggle (Story vs Free Navigation) */}
    <ModeToggle isInteractive={interactive} onToggle={toggleInteractive} />
      
      {/* GeoJSON Track Layer with MapComponents */}
    {isMapLoaded && trackData && (
        <MlGeoJsonLayer
          mapId="maptelling-map"
      geojson={trackData}
          type="line"
          defaultPaintOverrides={{
            line: {
              'line-color': '#ff6b6b',
              'line-width': 4,
              'line-opacity': 0.8,
            },
          }}
          layerId="track-line"
        />
      )}

      {/* Track Glow Effect */}
    {isMapLoaded && trackData && (
        <MlGeoJsonLayer
          mapId="maptelling-map"
      geojson={trackData}
          type="line"
          defaultPaintOverrides={{
            line: {
              'line-color': '#ff6b6b',
              'line-width': 8,
              'line-opacity': 0.3,
              'line-blur': 2,
            },
          }}
          layerId="track-glow"
          insertBeforeLayer="track-line"
        />
      )}

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

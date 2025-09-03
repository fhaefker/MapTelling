import React, { useState, useEffect } from 'react';
import { MapLibreMap, MlGeoJsonLayer, useMap } from '@mapcomponents/react-maplibre';
import { motion } from 'framer-motion';
import { config } from './config/mapConfig';
import StoryOverlay from './components/StoryOverlay';
import NavigationControls from './components/NavigationControls';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapTellingApp.css';

const MapTellingApp: React.FC = () => {
  const [currentChapter, setCurrentChapter] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);
  
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
  }, [mapHook.map]);

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
          interactive: false,
          attributionControl: false,
        }}
        style={{ width: '100%', height: '100vh' }}
      />
      
      {/* GeoJSON Track Layer with MapComponents */}
      {isMapLoaded && (
        <MlGeoJsonLayer
          mapId="maptelling-map"
          geojson={config.trackData}
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
      {isMapLoaded && (
        <MlGeoJsonLayer
          mapId="maptelling-map"
          geojson={config.trackData}
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

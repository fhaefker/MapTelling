import React, { useEffect, useRef, useState } from 'react';
import { Map, NavigationControl, ScaleControl } from 'maplibre-gl';
import { motion } from 'framer-motion';
import { mapConfig } from './config/mapConfig';
import StoryOverlay from './components/StoryOverlay';
import NavigationControls from './components/NavigationControls';
import TrackLayer from './components/TrackLayer';
import 'maplibre-gl/dist/maplibre-gl.css';
import './MapTellingApp.css';

const MapTellingApp: React.FC = () => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const [currentChapter, setCurrentChapter] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new Map({
      container: mapContainer.current,
      style: mapConfig.style,
      center: mapConfig.chapters[0].center,
      zoom: mapConfig.chapters[0].zoom,
      bearing: mapConfig.chapters[0].bearing || 0,
      pitch: mapConfig.chapters[0].pitch || 0,
      interactive: false,
      attributionControl: false,
    });

    // Add controls
    map.current.addControl(new NavigationControl({ showCompass: false }), 'top-right');
    map.current.addControl(new ScaleControl({ unit: 'metric' }), 'bottom-left');

    map.current.on('load', () => {
      setIsMapLoaded(true);
    });

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Handle chapter navigation
  const navigateToChapter = (chapterIndex: number) => {
    if (!map.current || chapterIndex < 0 || chapterIndex >= mapConfig.chapters.length) return;

    const chapter = mapConfig.chapters[chapterIndex];
    setCurrentChapter(chapterIndex);

    map.current.flyTo({
      center: chapter.center,
      zoom: chapter.zoom,
      bearing: chapter.bearing || 0,
      pitch: chapter.pitch || 0,
      speed: chapter.speed || 0.8,
      curve: chapter.curve || 1.42,
      essential: true,
    });
  };

  // Auto-play functionality
  useEffect(() => {
    if (!isPlaying) return;

    const interval = setInterval(() => {
      setCurrentChapter((current) => {
        const next = current + 1;
        if (next >= mapConfig.chapters.length) {
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
    const nextIndex = Math.min(mapConfig.chapters.length - 1, currentChapter + 1);
    navigateToChapter(nextIndex);
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="map-telling-app">
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="map-container"
        style={{ width: '100%', height: '100vh' }}
      />
      
      {/* Track Layer */}
      {isMapLoaded && map.current && (
        <TrackLayer map={map.current} trackData={mapConfig.track} />
      )}

      {/* Story Overlay */}
      <StoryOverlay 
        chapter={mapConfig.chapters[currentChapter]}
        chapterIndex={currentChapter}
        totalChapters={mapConfig.chapters.length}
      />

      {/* Navigation Controls */}
      <NavigationControls
        currentChapter={currentChapter}
        totalChapters={mapConfig.chapters.length}
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
        animate={{ scaleX: (currentChapter + 1) / mapConfig.chapters.length }}
        transition={{ duration: 0.5 }}
      />
    </div>
  );
};

export default MapTellingApp;

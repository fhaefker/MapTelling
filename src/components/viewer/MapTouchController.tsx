/**
 * MapTouchController Component
 * 
 * Behandelt Touch/Swipe-Events auf der Karte für Story-Navigation (Mobile).
 * 
 * ⚠️ CRITICAL: Muss INSIDE MapComponentsProvider sein!
 * 
 * ✅ WhereGroup Principles:
 * - Transparency: Klare Swipe-Logik mit Threshold
 * - Maintainability: Wiederverwendbares Touch-Pattern
 * - Standards: Touch Events (Mobile-First)
 * 
 * ✅ MapComponents Compliance:
 * - useMap() nur INSIDE Provider
 * - Event-Listener via canvas
 * - Cleanup in useEffect Return
 * 
 * Gestures:
 * - Swipe Up = Nächstes Foto
 * - Swipe Down = Vorheriges Foto
 * - Horizontal Swipe = Karte Pan (MapLibre)
 * 
 * @module components/viewer/MapTouchController
 * @see CONCEPT_V2_05_MAP_WHEEL_CONTROL.md
 */

import { useEffect, useRef } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';
import type { PhotoFeature } from '../../types/story';
import type { MapScrollMode } from '../../hooks/useMapScrollMode';
import { log } from '../../utils/logger';

// ========================================
// TYPES
// ========================================

export interface MapTouchControllerProps {
  /** Map ID */
  mapId: string;
  
  /** Fotos für Navigation */
  photos: PhotoFeature[];
  
  /** Aktueller Index */
  activeIndex: number;
  
  /** Callback für Navigation */
  onNavigate: (index: number) => void;
  
  /** Scroll-Modus */
  scrollMode: MapScrollMode;
  
  /** Ist aktiviert? */
  enabled: boolean;
}

// ========================================
// CONSTANTS
// ========================================

const SWIPE_THRESHOLD = 50; // px - Minimale Swipe-Distanz

// ========================================
// COMPONENT
// ========================================

/**
 * MapTouchController Component
 * 
 * ⚠️ MUSS INSIDE MapComponentsProvider sein!
 * 
 * Headless Component - rendert nichts, nur Touch-Event-Handling.
 * 
 * Verhalten:
 * - Story-Modus: Swipe Up = Nächstes, Swipe Down = Vorheriges
 * - Zoom-Modus: Deaktiviert (MapLibre default Touch)
 * - Horizontal Swipe: Immer MapLibre Pan
 */
export const MapTouchController: React.FC<MapTouchControllerProps> = ({
  mapId,
  photos,
  activeIndex,
  onNavigate,
  scrollMode,
  enabled
}) => {
  // ✅ useMap() INSIDE Provider
  const { map, mapIsReady } = useMap({ mapId });
  
  // Touch State
  const touchStartY = useRef<number>(0);
  const touchStartX = useRef<number>(0);
  
  useEffect(() => {
    // Guards: Nur im Story-Modus aktiv
    if (!mapIsReady || !map?.map || !enabled || scrollMode !== 'story') {
      log.debug('MapTouchController', 'Nicht bereit oder deaktiviert', {
        mapIsReady,
        hasMap: !!map?.map,
        enabled,
        scrollMode
      });
      return;
    }
    
    log.info('MapTouchController', 'Touch-Handler aktiviert', {
      mapId,
      photoCount: photos.length
    });
    
    /**
     * Touch Start Handler
     */
    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length !== 1) return; // Nur Single-Touch
      
      touchStartY.current = e.touches[0].clientY;
      touchStartX.current = e.touches[0].clientX;
      
      log.debug('MapTouchController', 'Touch Start', {
        y: touchStartY.current,
        x: touchStartX.current
      });
    };
    
    /**
     * Touch End Handler
     */
    const handleTouchEnd = (e: TouchEvent) => {
      if (e.changedTouches.length !== 1) return;
      
      const touchEndY = e.changedTouches[0].clientY;
      const touchEndX = e.changedTouches[0].clientX;
      
      const deltaY = touchStartY.current - touchEndY;
      const deltaX = touchStartX.current - touchEndX;
      
      log.debug('MapTouchController', 'Touch End', {
        deltaY,
        deltaX,
        threshold: SWIPE_THRESHOLD
      });
      
      // Horizontaler Swipe dominiert? → MapLibre Pan (kein Action)
      if (Math.abs(deltaX) > Math.abs(deltaY)) {
        log.debug('MapTouchController', 'Horizontal Swipe → MapLibre Pan');
        return;
      }
      
      // Vertikaler Swipe unter Threshold? → Kein Action
      if (Math.abs(deltaY) < SWIPE_THRESHOLD) {
        log.debug('MapTouchController', 'Swipe unter Threshold');
        return;
      }
      
      // Vertikaler Swipe: Navigation
      if (deltaY > 0) {
        // Swipe Up = Nächstes Foto
        const nextIndex = Math.min(activeIndex + 1, photos.length - 1);
        
        if (nextIndex !== activeIndex) {
          log.info('MapTouchController', 'Swipe Up: Nächstes Foto', {
            from: activeIndex,
            to: nextIndex
          });
          onNavigate(nextIndex);
        } else {
          log.debug('MapTouchController', 'Bereits am letzten Foto');
        }
      } else {
        // Swipe Down = Vorheriges Foto
        const prevIndex = Math.max(activeIndex - 1, 0);
        
        if (prevIndex !== activeIndex) {
          log.info('MapTouchController', 'Swipe Down: Vorheriges Foto', {
            from: activeIndex,
            to: prevIndex
          });
          onNavigate(prevIndex);
        } else {
          log.debug('MapTouchController', 'Bereits am ersten Foto');
        }
      }
    };
    
    // ✅ Event-Listener auf Canvas registrieren
    const canvas = map.map.getCanvas();
    
    canvas.addEventListener('touchstart', handleTouchStart, { passive: true });
    canvas.addEventListener('touchend', handleTouchEnd, { passive: true });
    
    log.debug('MapTouchController', 'Touch-Listener registriert');
    
    // ✅ Cleanup
    return () => {
      canvas.removeEventListener('touchstart', handleTouchStart);
      canvas.removeEventListener('touchend', handleTouchEnd);
      log.debug('MapTouchController', 'Touch-Listener entfernt');
    };
  }, [mapIsReady, map, scrollMode, enabled, activeIndex, photos, onNavigate, mapId]);
  
  // Headless Component
  return null;
};

/**
 * MapWheelController Component
 * 
 * Behandelt Mausrad-Events auf der Karte für Story-Navigation.
 * 
 * ⚠️ CRITICAL: Muss INSIDE MapComponentsProvider sein!
 * 
 * ✅ WhereGroup Principles:
 * - Transparency: Klare Event-Handling Logik
 * - Maintainability: Throttle gegen Scroll-Jitter
 * - Standards: MapLibre Event Patterns
 * 
 * ✅ MapComponents Compliance:
 * - useMap() nur INSIDE Provider
 * - Event-Listener via canvas (MapLibre Pattern)
 * - Cleanup in useEffect Return
 * 
 * Modes:
 * - story: preventDefault + Navigation
 * - zoom: Kein preventDefault (MapLibre default)
 * 
 * @module components/viewer/MapWheelController
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

export interface MapWheelControllerProps {
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

const SCROLL_THROTTLE = 300; // ms - Verhindert Scroll-Jitter

// ========================================
// COMPONENT
// ========================================

/**
 * MapWheelController Component
 * 
 * ⚠️ MUSS INSIDE MapComponentsProvider sein!
 * 
 * Headless Component - rendert nichts, nur Event-Handling.
 * 
 * Verhalten:
 * - Story-Modus: Scroll Down = Nächstes Foto, Scroll Up = Vorheriges Foto
 * - Zoom-Modus: MapLibre Default Zoom (kein preventDefault)
 */
export const MapWheelController: React.FC<MapWheelControllerProps> = ({
  mapId,
  photos,
  activeIndex,
  onNavigate,
  scrollMode,
  enabled
}) => {
  // ✅ useMap() INSIDE Provider
  const { map, mapIsReady } = useMap({ mapId });
  
  // Throttle State
  const lastScrollTime = useRef(0);
  
  useEffect(() => {
    // Guards
    if (!mapIsReady || !map?.map || !enabled) {
      log.debug('MapWheelController', 'Nicht bereit oder deaktiviert', {
        mapIsReady,
        hasMap: !!map?.map,
        enabled
      });
      return;
    }
    
    log.info('MapWheelController', 'Wheel-Handler aktiviert', {
      mapId,
      scrollMode,
      photoCount: photos.length
    });
    
    /**
     * Wheel Event Handler
     */
    const handleWheel = (e: WheelEvent) => {
      // Story-Modus: Scroll steuert Navigation
      if (scrollMode === 'story') {
        e.preventDefault(); // ✅ Verhindere Default-Zoom
        
        // Throttle Scroll-Events (verhindert Jitter)
        const now = Date.now();
        if (now - lastScrollTime.current < SCROLL_THROTTLE) {
          log.debug('MapWheelController', 'Scroll throttled');
          return;
        }
        lastScrollTime.current = now;
        
        // Delta Y: positiv = down, negativ = up
        if (e.deltaY > 0) {
          // Scroll Down = Nächstes Foto
          const nextIndex = Math.min(activeIndex + 1, photos.length - 1);
          
          if (nextIndex !== activeIndex) {
            log.info('MapWheelController', 'Navigate: Nächstes Foto', {
              from: activeIndex,
              to: nextIndex
            });
            onNavigate(nextIndex);
          } else {
            log.debug('MapWheelController', 'Bereits am letzten Foto');
          }
        } else {
          // Scroll Up = Vorheriges Foto
          const prevIndex = Math.max(activeIndex - 1, 0);
          
          if (prevIndex !== activeIndex) {
            log.info('MapWheelController', 'Navigate: Vorheriges Foto', {
              from: activeIndex,
              to: prevIndex
            });
            onNavigate(prevIndex);
          } else {
            log.debug('MapWheelController', 'Bereits am ersten Foto');
          }
        }
      }
      
      // Zoom-Modus: Kein preventDefault → MapLibre handled Zoom automatisch
      // (Kein Code nötig, MapLibre default behavior)
    };
    
    // ✅ Event-Listener auf Canvas registrieren
    const canvas = map.map.getCanvas();
    
    // passive: false wenn Story-Modus (für preventDefault)
    // passive: true wenn Zoom-Modus (bessere Performance)
    const options = { passive: scrollMode === 'zoom' };
    
    canvas.addEventListener('wheel', handleWheel, options);
    
    log.debug('MapWheelController', 'Wheel-Listener registriert', {
      canvas: canvas.tagName,
      passive: options.passive
    });
    
    // ✅ Cleanup
    return () => {
      canvas.removeEventListener('wheel', handleWheel);
      log.debug('MapWheelController', 'Wheel-Listener entfernt');
    };
  }, [mapIsReady, map, scrollMode, enabled, activeIndex, photos, onNavigate, mapId]);
  
  // Headless Component
  return null;
};

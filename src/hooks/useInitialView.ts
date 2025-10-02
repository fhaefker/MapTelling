/**
 * useInitialView Hook
 * 
 * Setzt Initial View der Karte basierend auf Foto-Verteilung.
 * 
 * ✅ WhereGroup Principles:
 * - Transparency: Klare Logik für verschiedene Fälle
 * - Standards: GeoJSON BBox, MapLibre fitBounds
 * - Maintainability: Configurable padding
 * 
 * Fälle:
 * 1. Keine Fotos → WhereGroup HQ Bonn (50.73, 7.1)
 * 2. Ein Foto → Zoom auf Foto mit configured zoom
 * 3. Mehrere Fotos → fitBounds mit BBox + padding
 * 
 * ✅ MapComponents Compliance:
 * - useMap() Hook für Map-Zugriff
 * - mapIsReady Guard
 * - fitBounds via map.map (Wrapper Pattern)
 * 
 * @module hooks/useInitialView
 * @see CONCEPT_V2_04_INITIAL_VIEW.md
 */

import { useState, useEffect } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';
import type { PhotoFeature } from '../types/story';
import { SPECIAL_COORDS } from '../utils/gpsConstants';
import { log } from '../utils/logger';

// ========================================
// TYPES
// ========================================

interface InitialViewOptions {
  /** Map ID */
  mapId: string;
  
  /** Fotos für BBox Berechnung */
  photos: PhotoFeature[];
  
  /** Padding in Prozent (default: 10%) */
  padding?: number;
  
  /** Max Zoom bei fitBounds (default: 16) */
  maxZoom?: number;
}

// ========================================
// CONSTANTS
// ========================================

const DEFAULT_PADDING = 10; // 10%
const DEFAULT_MAX_ZOOM = 16;
const SINGLE_PHOTO_ZOOM = 14;
const NO_PHOTOS_ZOOM = 10;

// ========================================
// HOOK
// ========================================

/**
 * useInitialView Hook
 * 
 * Setzt Initial View beim ersten Laden.
 * 
 * @param options - Configuration
 * @returns viewSet flag
 * 
 * @example
 * const { viewSet } = useInitialView({
 *   mapId: 'story-map',
 *   photos: story.features,
 *   padding: 10
 * });
 */
export const useInitialView = ({
  mapId,
  photos,
  padding = DEFAULT_PADDING,
  maxZoom = DEFAULT_MAX_ZOOM
}: InitialViewOptions) => {
  const { map, mapIsReady } = useMap({ mapId });
  const [viewSet, setViewSet] = useState(false);
  
  useEffect(() => {
    // Guards
    if (!mapIsReady || !map?.map) {
      log.debug('useInitialView', 'Map noch nicht bereit', { mapId });
      return;
    }
    
    if (viewSet) {
      log.debug('useInitialView', 'View bereits gesetzt');
      return;
    }
    
    // Fall 1: Keine Fotos → WhereGroup HQ Bonn
    if (photos.length === 0) {
      log.info('useInitialView', 'Keine Fotos: Fliege zu WhereGroup HQ', {
        center: SPECIAL_COORDS.WHEREGROUP_HQ
      });
      
      map.map.flyTo({
        center: [
          SPECIAL_COORDS.WHEREGROUP_HQ.lng,
          SPECIAL_COORDS.WHEREGROUP_HQ.lat
        ] as [number, number],
        zoom: NO_PHOTOS_ZOOM,
        duration: 0
      });
      
      setViewSet(true);
      return;
    }
    
    // Fall 2: Ein Foto → Zoom auf Foto mit configured zoom
    if (photos.length === 1) {
      const photo = photos[0];
      const cameraZoom = photo.properties.camera?.zoom || SINGLE_PHOTO_ZOOM;
      
      log.info('useInitialView', 'Ein Foto: Zoom auf Foto', {
        coordinates: photo.geometry.coordinates,
        zoom: cameraZoom
      });
      
      map.map.flyTo({
        center: photo.geometry.coordinates as [number, number],
        zoom: cameraZoom,
        bearing: photo.properties.camera?.bearing || 0,
        pitch: photo.properties.camera?.pitch || 0,
        duration: 0
      });
      
      setViewSet(true);
      return;
    }
    
    // Fall 3: Mehrere Fotos → fitBounds mit BBox
    const coords = photos.map(p => p.geometry.coordinates);
    const lngs = coords.map(c => c[0]);
    const lats = coords.map(c => c[1]);
    
    const bbox: [number, number, number, number] = [
      Math.min(...lngs), // minLng
      Math.min(...lats), // minLat
      Math.max(...lngs), // maxLng
      Math.max(...lats)  // maxLat
    ];
    
    log.info('useInitialView', 'Mehrere Fotos: fitBounds', {
      photoCount: photos.length,
      bbox,
      padding: `${padding}%`
    });
    
    // Padding in Pixel berechnen (Prozent der Viewport)
    const canvas = map.map.getCanvas();
    const viewportMin = Math.min(canvas.width, canvas.height);
    const paddingPx = viewportMin * (padding / 100);
    
    map.map.fitBounds(bbox, {
      padding: paddingPx,
      duration: 0,
      maxZoom: maxZoom // Nicht zu nah reinzoomen
    });
    
    setViewSet(true);
  }, [mapIsReady, map, photos, viewSet, padding, maxZoom, mapId]);
  
  return {
    /** Wurde Initial View gesetzt? */
    viewSet
  };
};

/**
 * MapClickHandler Component
 * 
 * Behandelt Klicks auf die Karte für manuelle Foto-Positionierung.
 * 
 * ⚠️ CRITICAL: Muss INSIDE MapComponentsProvider sein!
 * 
 * ✅ WhereGroup Principles:
 * - Transparency: Vollständig dokumentierter Event-Flow
 * - Maintainability: Clean Event-Listener Pattern
 * - Standards: GeoJSON [lng, lat] Koordinaten
 * 
 * ✅ MapComponents Compliance:
 * - useMap() Hook INSIDE MapComponentsProvider
 * - Event-Listener via map.map.on()
 * - Cleanup in useEffect Return
 * - mapIsReady Guard überall
 * 
 * @module components/map/MapClickHandler
 * @see CONCEPT_V2_02_DRAG_DROP_POSITIONING.md
 * @see docs/LESSONS_LEARNED.md (Provider Pattern)
 */

import { useEffect } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';
import { log } from '../../utils/logger';

// ========================================
// TYPES
// ========================================

export interface MapClickHandlerProps {
  /** Map ID (z.B. 'editor-map') */
  mapId: string;
  
  /** Ist Position-Set Modus aktiv? */
  isActive: boolean;
  
  /** ID des zu positionierenden Fotos */
  activePhotoId: string | null;
  
  /** Callback wenn Karte geklickt wurde */
  onMapClick: (coordinates: [number, number]) => void;
}

// ========================================
// COMPONENT
// ========================================

/**
 * MapClickHandler Component
 * 
 * ⚠️ MUSS INSIDE MapComponentsProvider sein!
 * 
 * Pattern:
 * - FALSCH: MapClickHandler außerhalb Provider (wie alter mapExists Bug)
 * - RICHTIG: MapClickHandler INSIDE MapComponentsProvider
 * 
 * Siehe StoryViewer.tsx für korrektes Pattern
 */
export const MapClickHandler: React.FC<MapClickHandlerProps> = ({
  mapId,
  isActive,
  activePhotoId,
  onMapClick
}) => {
  // ✅ CRITICAL: useMap() INSIDE MapComponentsProvider
  const { map, mapIsReady } = useMap({ mapId });
  
  useEffect(() => {
    // Guards
    if (!mapIsReady || !map?.map) {
      log.debug('MapClickHandler', 'Map noch nicht bereit', { mapId });
      return;
    }
    
    if (!isActive || !activePhotoId) {
      log.debug('MapClickHandler', 'Modus nicht aktiv', { isActive, activePhotoId });
      return;
    }
    
    // Cursor ändern wenn Modus aktiv
    const canvas = map.map.getCanvas();
    const originalCursor = canvas.style.cursor;
    canvas.style.cursor = 'crosshair';
    
    log.info('MapClickHandler', 'Click-Handler aktiviert', {
      mapId,
      photoId: activePhotoId
    });
    
    // Click Handler
    const handleClick = (e: maplibregl.MapMouseEvent) => {
      const { lng, lat } = e.lngLat;
      const coordinates: [number, number] = [lng, lat]; // ✅ GeoJSON [lng, lat]
      
      log.info('MapClickHandler', 'Karte geklickt', {
        coordinates,
        photoId: activePhotoId
      });
      
      onMapClick(coordinates);
    };
    
    // Event-Listener registrieren
    map.map.on('click', handleClick);
    
    // ✅ CRITICAL: Cleanup in Return
    return () => {
      // Cursor zurücksetzen
      canvas.style.cursor = originalCursor;
      
      // Event-Listener entfernen
      map.map.off('click', handleClick);
      
      log.info('MapClickHandler', 'Click-Handler deaktiviert', { mapId });
    };
  }, [mapIsReady, map, isActive, activePhotoId, mapId, onMapClick]);
  
  // Kein visuelles Rendering
  return null;
};

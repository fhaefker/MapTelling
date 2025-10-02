import { useEffect, useRef } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';
import type { PhotoFeature } from '../types/story';

/**
 * useCameraFly Hook
 * 
 * Fliegt die Kamera zum aktiven Foto, wenn sich activeIndex ändert.
 * Debouncing verhindert redundante Flüge (Performance-Fix v2.1.1).
 * 
 * ✅ MapComponents Compliant:
 * - useMap() hook INSIDE MapComponentsProvider
 * - Component Split Pattern: Outer component ohne hooks
 * 
 * ✅ WhereGroup Standards:
 * - GPS Constants: camera.ts für EPSG:4326 Berechnungen
 * - Performance: Debouncing via Refs
 * - Maintainability: Single Responsibility (nur Kameraflug)
 * 
 * @param mapId - MapLibre map ID
 * @param photos - Array of photo features
 * @param activeIndex - Currently active photo index
 * @param enabled - Whether camera flying is enabled
 * 
 * @example
 * ```tsx
 * useCameraFly({
 *   mapId: 'story-map',
 *   photos: story.features,
 *   activeIndex: 0,
 *   enabled: isStoryMode
 * });
 * ```
 */
interface UseCameraFlyProps {
  mapId: string;
  photos: PhotoFeature[];
  activeIndex: number;
  enabled: boolean;
}

export const useCameraFly = ({
  mapId,
  photos,
  activeIndex,
  enabled
}: UseCameraFlyProps) => {
  const mapHook = useMap({ mapId });
  
  // ✅ Performance: Debouncing Refs (v2.1.1 Fix)
  const lastFlyToIndex = useRef<number>(-1);
  const isAnimating = useRef<boolean>(false);
  
  useEffect(() => {
    // ✅ Guard: Hook disabled
    if (!enabled) return;
    
    // ✅ Guard: No map instance
    if (!mapHook.mapIsReady || !mapHook.map) return;
    
    // ✅ Guard: No photos
    if (photos.length === 0) return;
    
    // ✅ Guard: Invalid index
    if (activeIndex < 0 || activeIndex >= photos.length) return;
    
    // ✅ Performance: Skip if same index (prevents redundant flyTo)
    if (activeIndex === lastFlyToIndex.current) return;
    
    // ✅ Performance: Skip if animation in progress
    if (isAnimating.current) return;
    
    const photo = photos[activeIndex];
    const [lng, lat] = photo.geometry.coordinates;
    
    // ✅ GPS Constants: Extract camera config from photo properties
    const cameraConfig = photo.properties.camera;
    
    // ✅ Use photo's camera settings or defaults
    const zoom = cameraConfig?.zoom || 14;
    const bearing = cameraConfig?.bearing || 0;
    const pitch = cameraConfig?.pitch || 0;
    
    // ✅ Animation Duration
    const duration = 1500; // 1.5 Sekunden
    
    // ✅ Block weitere Flüge während Animation
    isAnimating.current = true;
    lastFlyToIndex.current = activeIndex;
    
    console.log(`[useCameraFly] Flying to photo ${activeIndex}:`, {
      lng,
      lat,
      zoom,
      bearing,
      pitch,
      duration
    });
    
    // ✅ Kameraflug
    mapHook.map.flyTo({
      center: [lng, lat],
      zoom,
      bearing,
      pitch,
      duration,
      essential: true, // Animation nicht überspringbar
      curve: 1.42, // Smooth curve (1.42 = default, natürliche Bewegung)
      easing: (t: number) => t // Linear easing für konstante Geschwindigkeit
    });
    
    // ✅ Reset Animation Lock nach Dauer + Buffer
    setTimeout(() => {
      isAnimating.current = false;
    }, duration + 100);
    
  }, [mapHook.mapIsReady, mapHook.map, photos, activeIndex, enabled]);
};

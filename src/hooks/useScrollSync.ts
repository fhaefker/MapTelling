import { useEffect, useRef, useCallback } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';
import type { PhotoFeature } from '../types/story';

interface UseScrollSyncOptions {
  mapId: string;
  photos: PhotoFeature[];
  activeIndex: number;
  onPhotoChange: (index: number) => void;
  threshold?: number;              // Default: 0.5
  rootMargin?: string;             // Default: '-20% 0px'
  enabled?: boolean;               // Default: true (✅ NEW: Story-Modus Toggle)
}

/**
 * useScrollSync Hook
 * 
 * Synchronizes scroll position with map camera position.
 * Uses IntersectionObserver to detect visible photos and animates map accordingly.
 * 
 * ✅ PERFORMANCE OPTIMIZATION:
 * - Debouncing: flyTo nur wenn Index sich ändert (nicht bei jedem Scroll-Event)
 * - lastFlyToIndex: Verhindert redundante flyTo-Calls
 * - isAnimating Flag: Blockiert während laufender Animation
 * 
 * ✅ MapComponents Compliant:
 * - Uses useMap hook (not direct map access)
 * - Respects prefers-reduced-motion
 * - Clean unmount via observer disconnect
 * 
 * ✅ Accessibility:
 * - Sets duration: 0 when prefers-reduced-motion
 * - Uses essential: true for MapLibre flyTo
 * 
 * @param {UseScrollSyncOptions} options - Configuration
 * @returns {Object} Sync functions
 * @returns {Function} scrollToPhoto - Programmatically scroll to photo
 * 
 * @example
 * const { scrollToPhoto } = useScrollSync({
 *   mapId: 'main',
 *   photos: story.features,
 *   activeIndex,
 *   onPhotoChange: setActiveIndex
 * });
 * 
 * // Scroll to photo from map click
 * scrollToPhoto(2);
 */
export const useScrollSync = ({
  mapId,
  photos,
  onPhotoChange,
  threshold = 0.5,
  rootMargin = '-20% 0px',
  enabled = true // ✅ Default: immer aktiv
}: UseScrollSyncOptions) => {
  const { map, mapIsReady } = useMap({ mapId });
  const observerRef = useRef<IntersectionObserver | null>(null);
  const isManualScroll = useRef(false);
  const lastFlyToIndex = useRef<number>(-1); // ✅ CRITICAL: Verhindert redundante flyTo
  const isAnimating = useRef(false); // ✅ Blockiert während Animation
  
  // ✅ Check prefers-reduced-motion EINMAL beim Setup
  const prefersReducedMotion = useRef(
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  
  // Intersection Observer Setup
  useEffect(() => {
    // ✅ Nur aktiv wenn enabled
    if (!enabled || !mapIsReady || !map?.map || photos.length === 0) {
      // Cleanup existing observer
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      lastFlyToIndex.current = -1; // Reset
      return;
    }
    
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !isManualScroll.current && !isAnimating.current) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0', 10);
            
            // ✅ CRITICAL: Skip wenn gleicher Index wie letzte flyTo
            if (index === lastFlyToIndex.current) {
              return;
            }
            
            const photo = photos[index];
            
            if (!photo || !map?.map) return;
            
            // ✅ Set animation flag
            isAnimating.current = true;
            lastFlyToIndex.current = index;
            
            const duration = prefersReducedMotion.current 
              ? 0 
              : (photo.properties.camera.duration || 2000);
            
            // ✅ MapLibre flyTo mit Accessibility-Support
            map.map.flyTo({
              center: photo.geometry.coordinates as [number, number],
              zoom: photo.properties.camera.zoom,
              bearing: photo.properties.camera.bearing || 0,
              pitch: photo.properties.camera.pitch || 0,
              duration,
              essential: true
            });
            
            // ✅ Reset animation flag nach duration
            setTimeout(() => {
              isAnimating.current = false;
            }, duration + 100); // +100ms Puffer
            
            onPhotoChange(index);
          }
        });
      },
      { threshold, rootMargin }
    );
    
    // Alle Photo Cards beobachten
    const cards = document.querySelectorAll('[data-photo-card]');
    cards.forEach(card => observerRef.current?.observe(card));
    
    // ✅ Cleanup: Observer disconnect
    return () => {
      observerRef.current?.disconnect();
    };
  }, [enabled, mapIsReady, map, photos, onPhotoChange, threshold, rootMargin]);
  
  // Programmatisches Scrollen (von Map-Click)
  const scrollToPhoto = useCallback((index: number) => {
    const card = document.querySelector(`[data-index="${index}"]`);
    if (card) {
      isManualScroll.current = true;
      card.scrollIntoView({ 
        behavior: prefersReducedMotion.current ? 'auto' : 'smooth',
        block: 'center' 
      });
      
      // Reset flag nach Animation
      setTimeout(() => { 
        isManualScroll.current = false; 
      }, 1000);
    }
  }, []);
  
  return { scrollToPhoto };
};

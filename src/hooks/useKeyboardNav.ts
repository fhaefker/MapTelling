import { useEffect, useCallback } from 'react';
import type { PhotoFeature } from '../types/story';

interface UseKeyboardNavOptions {
  photos: PhotoFeature[];
  activeIndex: number;
  onNavigate: (index: number) => void;
  enabled?: boolean;               // Default: true
}

/**
 * useKeyboardNav Hook
 * 
 * Provides keyboard navigation for photo stories.
 * 
 * ✅ Accessibility (WCAG 2.1):
 * - Arrow Up/Down: Navigate between photos
 * - Home: Jump to first photo
 * - End: Jump to last photo
 * - Escape: Close/deactivate (optional)
 * 
 * @param {UseKeyboardNavOptions} options - Configuration
 * @returns {Object} Navigation functions
 * @returns {Function} goToNext - Navigate to next photo
 * @returns {Function} goToPrevious - Navigate to previous photo
 * @returns {Function} goToFirst - Navigate to first photo
 * @returns {Function} goToLast - Navigate to last photo
 * 
 * @example
 * const { goToNext, goToPrevious } = useKeyboardNav({
 *   photos: story.features,
 *   activeIndex,
 *   onNavigate: setActiveIndex,
 *   enabled: !isEditing  // Disable während Editing
 * });
 */
export const useKeyboardNav = ({
  photos,
  activeIndex,
  onNavigate,
  enabled = true
}: UseKeyboardNavOptions) => {
  
  // Navigation functions
  const goToNext = useCallback(() => {
    if (activeIndex < photos.length - 1) {
      onNavigate(activeIndex + 1);
    }
  }, [activeIndex, photos.length, onNavigate]);
  
  const goToPrevious = useCallback(() => {
    if (activeIndex > 0) {
      onNavigate(activeIndex - 1);
    }
  }, [activeIndex, onNavigate]);
  
  const goToFirst = useCallback(() => {
    if (photos.length > 0) {
      onNavigate(0);
    }
  }, [photos.length, onNavigate]);
  
  const goToLast = useCallback(() => {
    if (photos.length > 0) {
      onNavigate(photos.length - 1);
    }
  }, [photos.length, onNavigate]);
  
  // Keyboard event handler
  useEffect(() => {
    if (!enabled || photos.length === 0) return;
    
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore wenn in Input/Textarea
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' || 
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }
      
      switch (event.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          goToNext();
          break;
          
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          goToPrevious();
          break;
          
        case 'Home':
          event.preventDefault();
          goToFirst();
          break;
          
        case 'End':
          event.preventDefault();
          goToLast();
          break;
          
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    // ✅ Cleanup
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [enabled, photos.length, goToNext, goToPrevious, goToFirst, goToLast]);
  
  return {
    goToNext,
    goToPrevious,
    goToFirst,
    goToLast
  };
};

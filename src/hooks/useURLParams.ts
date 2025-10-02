/**
 * useURLParams Hook
 * 
 * Handles URL parameters for deep linking (/?photo=5).
 * 
 * ✅ WhereGroup Principles:
 * - Transparency: Clear URL structure
 * - Maintainability: Centralized URL management
 * - Privacy: No external dependencies
 * 
 * URL Format:
 * - /?photo=5 → Opens story at photo index 5
 * - /?story=123 → Opens specific story (future)
 * 
 * @module hooks/useURLParams
 * @see CONCEPT_V2_06_DESIGN_SHARING.md
 */

import { useEffect, useCallback } from 'react';
import { log } from '../utils/logger';

// ========================================
// TYPES
// ========================================

export interface URLParams {
  /** Photo index from URL (0-based) */
  photoIndex: number | null;
  
  /** Story ID from URL (future) */
  storyId: string | null;
}

// ========================================
// HOOK
// ========================================

/**
 * useURLParams Hook
 * 
 * Parses and manages URL parameters for deep linking.
 * 
 * @returns URL params and update function
 * 
 * @example
 * const { params, updatePhotoIndex } = useURLParams();
 * 
 * // URL: /?photo=5
 * // params.photoIndex === 5
 * 
 * // Update URL without reload
 * updatePhotoIndex(10);
 * // URL becomes: /?photo=10
 */
export const useURLParams = () => {
  /**
   * Parse URL params
   */
  const parseParams = useCallback((): URLParams => {
    const searchParams = new URLSearchParams(window.location.search);
    
    const photoParam = searchParams.get('photo');
    const storyParam = searchParams.get('story');
    
    const photoIndex = photoParam ? parseInt(photoParam, 10) : null;
    const storyId = storyParam || null;
    
    log.debug('useURLParams', 'Parsed URL params', {
      photoIndex,
      storyId,
      search: window.location.search
    });
    
    return {
      photoIndex: photoIndex !== null && !isNaN(photoIndex) ? photoIndex : null,
      storyId
    };
  }, []);
  
  /**
   * Update photo index in URL
   */
  const updatePhotoIndex = useCallback((index: number) => {
    const searchParams = new URLSearchParams(window.location.search);
    
    if (index >= 0) {
      searchParams.set('photo', index.toString());
    } else {
      searchParams.delete('photo');
    }
    
    const newURL = `${window.location.pathname}?${searchParams.toString()}`;
    
    // Update URL without reload
    window.history.replaceState({}, '', newURL);
    
    log.info('useURLParams', 'Updated photo index in URL', {
      index,
      newURL
    });
  }, []);
  
  /**
   * Clear all params
   */
  const clearParams = useCallback(() => {
    window.history.replaceState({}, '', window.location.pathname);
    
    log.info('useURLParams', 'Cleared URL params');
  }, []);
  
  /**
   * Get shareable URL
   */
  const getShareURL = useCallback((photoIndex?: number): string => {
    const baseURL = window.location.origin + window.location.pathname;
    
    if (photoIndex !== undefined && photoIndex >= 0) {
      return `${baseURL}?photo=${photoIndex}`;
    }
    
    return baseURL;
  }, []);
  
  return {
    /** Parsed URL params */
    params: parseParams(),
    
    /** Update photo index in URL */
    updatePhotoIndex,
    
    /** Clear all params */
    clearParams,
    
    /** Get shareable URL */
    getShareURL
  };
};

/**
 * useURLSync Hook
 * 
 * Synchronizes activeIndex with URL parameter.
 * 
 * @param activeIndex - Current active photo index
 * @param onIndexChange - Callback when URL param changes
 * @param photoCount - Total photo count for validation
 * 
 * @example
 * useURLSync(activeIndex, setActiveIndex, story.features.length);
 */
export const useURLSync = (
  activeIndex: number,
  onIndexChange: (index: number) => void,
  photoCount: number
) => {
  const { params, updatePhotoIndex } = useURLParams();
  
  // Initial load: Read from URL
  useEffect(() => {
    if (params.photoIndex !== null) {
      // Validate index
      if (params.photoIndex >= 0 && params.photoIndex < photoCount) {
        log.info('useURLSync', 'Initial load from URL', {
          photoIndex: params.photoIndex
        });
        
        onIndexChange(params.photoIndex);
      } else {
        log.warn('useURLSync', 'Invalid photo index in URL', {
          photoIndex: params.photoIndex,
          photoCount
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount
  
  // Sync changes: Update URL when activeIndex changes
  useEffect(() => {
    if (activeIndex !== params.photoIndex) {
      updatePhotoIndex(activeIndex);
    }
  }, [activeIndex, params.photoIndex, updatePhotoIndex]);
};

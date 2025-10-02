import { useState, useCallback, useEffect, useMemo } from 'react';
import { StoryStorage } from '../lib/storage';
import type { PhotoStory, PhotoFeature, StoryMetadata } from '../types/story';

/**
 * useStoryState Hook
 * 
 * Manages story state with automatic persistence to LocalStorage.
 * 
 * Features:
 * - CRUD operations for photos
 * - Automatic save on changes
 * - Metadata management
 * - Reordering support
 * 
 * @returns {Object} Story state and manipulation functions
 * 
 * @example
 * const { 
 *   story, 
 *   activeIndex, 
 *   setActiveIndex,
 *   addPhoto, 
 *   updatePhoto 
 * } = useStoryState();
 * 
 * // Add new photo
 * const newPhoto: PhotoFeature = { ... };
 * addPhoto(newPhoto);
 * 
 * // Update existing photo
 * updatePhoto('photo-id', { properties: { title: 'New Title' } });
 */
export const useStoryState = () => {
  const [story, setStory] = useState<PhotoStory | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Load Story from LocalStorage on mount
  useEffect(() => {
    const loadStory = async () => {
      try {
        const saved = await StoryStorage.load();
        if (saved) {
          setStory(saved);
        } else {
          // Initialize empty story
          const emptyStory: PhotoStory = {
            type: "FeatureCollection",
            features: [],
            metadata: {
              id: crypto.randomUUID(),
              title: "Neue Story",
              created: new Date().toISOString(),
              updated: new Date().toISOString(),
              version: "1.0"
            }
          };
          setStory(emptyStory);
        }
      } catch (error) {
        console.error('Failed to load story:', error);
        // Create empty story on error
        const emptyStory: PhotoStory = {
          type: "FeatureCollection",
          features: [],
          metadata: {
            id: crypto.randomUUID(),
            title: "Neue Story",
            created: new Date().toISOString(),
            updated: new Date().toISOString(),
            version: "1.0"
          }
        };
        setStory(emptyStory);
      } finally {
        setLoading(false);
      }
    };
    
    loadStory();
  }, []);
  
  // Auto-save on change (debounced via effect)
  useEffect(() => {
    if (story && !loading) {
      // Save asynchronously without blocking
      StoryStorage.save(story).catch(err => {
        console.error('Auto-save failed:', err);
      });
    }
  }, [story, loading]);
  
  // Add new photo to story
  const addPhoto = useCallback((photo: PhotoFeature) => {
    setStory(prev => {
      if (!prev) return null;
      
      // Assign order based on current length
      const photoWithOrder = {
        ...photo,
        properties: {
          ...photo.properties,
          order: prev.features.length
        }
      };
      
      return {
        ...prev,
        features: [...prev.features, photoWithOrder],
        metadata: {
          ...prev.metadata,
          updated: new Date().toISOString()
        }
      };
    });
  }, []);
  
  // Update existing photo
  const updatePhoto = useCallback((id: string, updates: Partial<PhotoFeature>) => {
    setStory(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        features: prev.features.map(f => 
          f.properties.id === id 
            ? { 
                ...f, 
                ...updates,
                properties: {
                  ...f.properties,
                  ...(updates.properties || {})
                }
              }
            : f
        ),
        metadata: {
          ...prev.metadata,
          updated: new Date().toISOString()
        }
      };
    });
  }, []);
  
  // Remove photo from story
  const removePhoto = useCallback((id: string) => {
    setStory(prev => {
      if (!prev) return null;
      
      const filtered = prev.features.filter(f => f.properties.id !== id);
      
      // Reindex order
      const reindexed = filtered.map((f, index) => ({
        ...f,
        properties: {
          ...f.properties,
          order: index
        }
      }));
      
      return {
        ...prev,
        features: reindexed,
        metadata: {
          ...prev.metadata,
          updated: new Date().toISOString()
        }
      };
    });
  }, []);
  
  // Reorder photos (drag & drop)
  const reorderPhotos = useCallback((startIndex: number, endIndex: number) => {
    setStory(prev => {
      if (!prev) return null;
      
      const result = Array.from(prev.features);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      
      // Update order property
      const reordered = result.map((feature, index) => ({
        ...feature,
        properties: {
          ...feature.properties,
          order: index
        }
      }));
      
      return {
        ...prev,
        features: reordered,
        metadata: {
          ...prev.metadata,
          updated: new Date().toISOString()
        }
      };
    });
  }, []);
  
  // Update story metadata
  const updateMetadata = useCallback((updates: Partial<StoryMetadata>) => {
    setStory(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        metadata: {
          ...prev.metadata,
          ...updates,
          updated: new Date().toISOString()
        }
      };
    });
  }, []);
  
  // Clear entire story (with confirmation)
  const clearStory = useCallback(() => {
    const emptyStory: PhotoStory = {
      type: "FeatureCollection",
      features: [],
      metadata: {
        id: crypto.randomUUID(),
        title: "Neue Story",
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        version: "1.0"
      }
    };
    
    setStory(emptyStory);
    setActiveIndex(0);
  }, []);
  
  // Export story as JSON string
  const exportStory = useCallback(() => {
    if (!story) return '{}';
    return JSON.stringify(story, null, 2);
  }, [story]);
  
  // Memoized GeoJSON for MapComponents (stable reference)
  const geojson = useMemo(() => {
    if (!story) return null;
    
    return {
      type: "FeatureCollection" as const,
      features: story.features
    };
  }, [story]);
  
  return {
    story,
    geojson,
    activeIndex,
    setActiveIndex,
    loading,
    addPhoto,
    updatePhoto,
    removePhoto,
    reorderPhotos,
    updateMetadata,
    clearStory,
    exportStory
  };
};

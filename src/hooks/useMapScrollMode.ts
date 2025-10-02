/**
 * useMapScrollMode Hook
 * 
 * State Management für Map Scroll Mode (Story vs Zoom).
 * 
 * ✅ WhereGroup Principles:
 * - Transparency: Klare State Machine (story | zoom)
 * - Maintainability: Zentralisierter Scroll Mode State
 * 
 * Modes:
 * - story: Mausrad navigiert durch Story (preventDefault)
 * - zoom: Mausrad zoomt Karte (MapLibre default)
 * 
 * @module hooks/useMapScrollMode
 * @see CONCEPT_V2_05_MAP_WHEEL_CONTROL.md
 */

import { useState, useCallback } from 'react';
import { log } from '../utils/logger';

// ========================================
// TYPES
// ========================================

export type MapScrollMode = 'story' | 'zoom';

interface MapScrollModeState {
  /** Aktueller Modus */
  mode: MapScrollMode;
  
  /** Ist Scroll-Kontrolle aktiviert? */
  enabled: boolean;
}

// ========================================
// HOOK
// ========================================

/**
 * useMapScrollMode Hook
 * 
 * State Management für Map Scroll Verhalten.
 * 
 * @param initialMode - Start-Modus (default: 'story')
 * @returns Map Scroll Mode State & Actions
 * 
 * @example
 * const { mode, isStoryMode, toggleMode } = useMapScrollMode('story');
 * 
 * // Im Story-Modus: Wheel-Events steuern Navigation
 * // Im Zoom-Modus: Wheel-Events zoomen Karte (MapLibre default)
 */
export const useMapScrollMode = (initialMode: MapScrollMode = 'story') => {
  const [state, setState] = useState<MapScrollModeState>({
    mode: initialMode,
    enabled: true
  });
  
  /**
   * Toggle zwischen Story und Zoom Modus
   */
  const toggleMode = useCallback(() => {
    setState(prev => {
      const newMode = prev.mode === 'story' ? 'zoom' : 'story';
      
      log.info('useMapScrollMode', 'Modus gewechselt', {
        from: prev.mode,
        to: newMode
      });
      
      return {
        ...prev,
        mode: newMode
      };
    });
  }, []);
  
  /**
   * Setzt Modus explizit
   */
  const setMode = useCallback((mode: MapScrollMode) => {
    log.info('useMapScrollMode', 'Modus gesetzt', { mode });
    
    setState(prev => ({ ...prev, mode }));
  }, []);
  
  /**
   * Aktiviert Scroll-Kontrolle
   */
  const enable = useCallback(() => {
    log.debug('useMapScrollMode', 'Scroll-Kontrolle aktiviert');
    
    setState(prev => ({ ...prev, enabled: true }));
  }, []);
  
  /**
   * Deaktiviert Scroll-Kontrolle
   */
  const disable = useCallback(() => {
    log.debug('useMapScrollMode', 'Scroll-Kontrolle deaktiviert');
    
    setState(prev => ({ ...prev, enabled: false }));
  }, []);
  
  // Computed Properties
  const isStoryMode = state.mode === 'story';
  const isZoomMode = state.mode === 'zoom';
  
  return {
    /** Aktueller Modus */
    mode: state.mode,
    
    /** Ist aktiviert? */
    enabled: state.enabled,
    
    /** Ist Story-Modus? */
    isStoryMode,
    
    /** Ist Zoom-Modus? */
    isZoomMode,
    
    /** Toggle Modus */
    toggleMode,
    
    /** Setze Modus */
    setMode,
    
    /** Aktiviere */
    enable,
    
    /** Deaktiviere */
    disable
  };
};

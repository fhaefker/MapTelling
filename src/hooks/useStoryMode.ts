/**
 * useStoryMode Hook
 * 
 * State Management für Story-Modus vs Overview-Modus.
 * 
 * ✅ WhereGroup Principles:
 * - Transparency: Klare State Machine (overview | story)
 * - Maintainability: Zentralisierter Mode State
 * 
 * State Machine:
 * - INITIAL: overview (alle Fotos sichtbar, BBox)
 * - USER ACTION: "Story starten" → story (Scroll-Navigation aktiv)
 * - USER ACTION: "Zurück zur Übersicht" → overview (BBox zurück)
 * 
 * @module hooks/useStoryMode
 * @see CONCEPT_V2_04_INITIAL_VIEW.md
 */

import { useState, useCallback } from 'react';
import { log } from '../utils/logger';

// ========================================
// TYPES
// ========================================

export type StoryMode = 'overview' | 'story';

interface StoryModeState {
  /** Aktueller Modus */
  mode: StoryMode;
  
  /** Hat Initial View (BBox) stattgefunden? */
  initialViewDone: boolean;
}

// ========================================
// HOOK
// ========================================

/**
 * useStoryMode Hook
 * 
 * State Management für Story vs Overview Modus.
 * 
 * @returns Story Mode State & Actions
 * 
 * @example
 * const { mode, isStoryMode, startStory, returnToOverview } = useStoryMode();
 * 
 * // Beim Start: mode = 'overview'
 * // Nach "Story starten": mode = 'story'
 * // Nach "Zurück zur Übersicht": mode = 'overview'
 */
export const useStoryMode = () => {
  const [state, setState] = useState<StoryModeState>({
    mode: 'overview',
    initialViewDone: false
  });
  
  /**
   * Aktiviert Story-Modus
   * 
   * Effekte:
   * - Scroll-Navigation wird aktiv
   * - Map zoomt auf aktives Foto
   * - "Zurück zur Übersicht" Button wird angezeigt
   */
  const startStory = useCallback(() => {
    log.info('useStoryMode', 'Story-Modus aktiviert');
    
    setState({
      mode: 'story',
      initialViewDone: true
    });
  }, []);
  
  /**
   * Kehrt zur Übersicht zurück
   * 
   * Effekte:
   * - Scroll-Navigation wird deaktiviert
   * - Map zoomt auf BBox aller Fotos
   * - "Story starten" Button wird angezeigt
   */
  const returnToOverview = useCallback(() => {
    log.info('useStoryMode', 'Zurück zur Übersicht');
    
    setState(prev => ({
      ...prev,
      mode: 'overview'
    }));
  }, []);
  
  // Computed Properties
  const isStoryMode = state.mode === 'story';
  const isOverviewMode = state.mode === 'overview';
  
  return {
    /** Aktueller Modus */
    mode: state.mode,
    
    /** Ist Story-Modus aktiv? */
    isStoryMode,
    
    /** Ist Overview-Modus aktiv? */
    isOverviewMode,
    
    /** Aktiviert Story-Modus */
    startStory,
    
    /** Kehrt zur Übersicht zurück */
    returnToOverview,
    
    /** Hat Initial View stattgefunden? */
    initialViewDone: state.initialViewDone
  };
};

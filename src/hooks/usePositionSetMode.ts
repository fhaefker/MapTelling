/**
 * usePositionSetMode Hook
 * 
 * State Management für manuelles Positionieren von Fotos mit Undo/Redo.
 * 
 * ✅ WhereGroup Principles:
 * - Transparency: Vollständig dokumentierte State-Machine
 * - Maintainability: Command Pattern für History
 * - Standards: GeoJSON [lng, lat] Koordinaten
 * 
 * ✅ MapComponents Compliance:
 * - Keine map-Hooks hier (Pure State Management)
 * - Kann außerhalb MapComponentsProvider verwendet werden
 * - Koordinaten-Format: [lng, lat] für GeoJSON
 * 
 * @module hooks/usePositionSetMode
 * @see CONCEPT_V2_02_DRAG_DROP_POSITIONING.md
 */

import { useState, useEffect, useCallback } from 'react';
import { log } from '../utils/logger';

// ========================================
// TYPES
// ========================================

/**
 * History-Eintrag für Position-Änderungen
 * Ermöglicht Undo/Redo Funktionalität
 */
export interface PositionHistoryEntry {
  /** UUID des betroffenen Fotos */
  photoId: string;
  
  /** Alte Position [lng, lat] */
  oldPosition: [number, number];
  
  /** Neue Position [lng, lat] */
  newPosition: [number, number];
  
  /** Zeitstempel der Änderung */
  timestamp: number;
}

/**
 * State des Position-Set Modus
 */
interface PositionSetState {
  /** Ist der Modus aktiv? */
  isActive: boolean;
  
  /** ID des aktuell zu positionierenden Fotos */
  activePhotoId: string | null;
  
  /** History aller Position-Änderungen */
  history: PositionHistoryEntry[];
  
  /** Aktueller Index in History (für Undo/Redo) */
  historyIndex: number;
}

// ========================================
// HOOK
// ========================================

/**
 * Hook für Position-Set Modus mit Undo/Redo
 * 
 * @returns Position-Set State & Actions
 * 
 * @example
 * const {
 *   isActive,
 *   activePhotoId,
 *   canUndo,
 *   canRedo,
 *   activateMode,
 *   deactivateMode,
 *   setPosition,
 *   undo,
 *   redo
 * } = usePositionSetMode();
 * 
 * // Modus aktivieren
 * activateMode('photo-123');
 * 
 * // Position setzen
 * setPosition('photo-123', [7.1, 50.73], [7.2, 50.74]);
 * 
 * // Undo
 * const entry = undo();
 * if (entry) {
 *   updatePhotoPosition(entry.photoId, entry.oldPosition);
 * }
 */
export const usePositionSetMode = () => {
  const [state, setState] = useState<PositionSetState>({
    isActive: false,
    activePhotoId: null,
    history: [],
    historyIndex: -1
  });
  
  // ========================================
  // ACTIONS
  // ========================================
  
  /**
   * Modus aktivieren für bestimmtes Foto
   */
  const activateMode = useCallback((photoId: string) => {
    setState(prev => ({
      ...prev,
      isActive: true,
      activePhotoId: photoId
    }));
    
    log.info('usePositionSetMode', 'Modus aktiviert', { photoId });
  }, []);
  
  /**
   * Modus deaktivieren
   */
  const deactivateMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      isActive: false,
      activePhotoId: null
    }));
    
    log.info('usePositionSetMode', 'Modus deaktiviert');
  }, []);
  
  /**
   * Position setzen und in History speichern
   * 
   * @param photoId - UUID des Fotos
   * @param oldPosition - Alte Position [lng, lat]
   * @param newPosition - Neue Position [lng, lat]
   */
  const setPosition = useCallback((
    photoId: string,
    oldPosition: [number, number],
    newPosition: [number, number]
  ) => {
    setState(prev => {
      // Schneide History ab wenn wir in der Mitte sind
      // (d.h. User hat Undo gemacht und setzt jetzt neue Position)
      const newHistory = prev.history.slice(0, prev.historyIndex + 1);
      
      const entry: PositionHistoryEntry = {
        photoId,
        oldPosition,
        newPosition,
        timestamp: Date.now()
      };
      
      log.info('usePositionSetMode', 'Position gesetzt', {
        photoId,
        from: oldPosition,
        to: newPosition
      });
      
      return {
        ...prev,
        history: [...newHistory, entry],
        historyIndex: newHistory.length // Index zeigt auf neues Element
      };
    });
  }, []);
  
  /**
   * Undo letzte Aktion
   * 
   * @returns History-Eintrag der rückgängig gemacht wird, oder null
   */
  const undo = useCallback((): PositionHistoryEntry | null => {
    if (state.historyIndex < 0) {
      log.debug('usePositionSetMode', 'Undo nicht möglich (keine History)');
      return null;
    }
    
    const entry = state.history[state.historyIndex];
    
    setState(prev => ({
      ...prev,
      historyIndex: prev.historyIndex - 1
    }));
    
    log.info('usePositionSetMode', 'Undo durchgeführt', {
      photoId: entry.photoId,
      restoredPosition: entry.oldPosition
    });
    
    return entry;
  }, [state.historyIndex, state.history]);
  
  /**
   * Redo letzte rückgängig gemachte Aktion
   * 
   * @returns History-Eintrag der wiederhergestellt wird, oder null
   */
  const redo = useCallback((): PositionHistoryEntry | null => {
    if (state.historyIndex >= state.history.length - 1) {
      log.debug('usePositionSetMode', 'Redo nicht möglich (am Ende der History)');
      return null;
    }
    
    const nextIndex = state.historyIndex + 1;
    const entry = state.history[nextIndex];
    
    setState(prev => ({
      ...prev,
      historyIndex: nextIndex
    }));
    
    log.info('usePositionSetMode', 'Redo durchgeführt', {
      photoId: entry.photoId,
      restoredPosition: entry.newPosition
    });
    
    return entry;
  }, [state.historyIndex, state.history]);
  
  // ========================================
  // KEYBOARD SHORTCUTS
  // ========================================
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Nur wenn Modus aktiv
      if (!state.isActive) return;
      
      // ESC: Modus abbrechen
      if (e.key === 'Escape') {
        e.preventDefault();
        deactivateMode();
        return;
      }
      
      // Ctrl/Cmd + Z: Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        const entry = undo();
        
        if (entry) {
          // Emit Custom Event für Story Update
          window.dispatchEvent(
            new CustomEvent('position-undo', { detail: entry })
          );
        }
        return;
      }
      
      // Ctrl/Cmd + Shift + Z oder Ctrl/Cmd + Y: Redo
      if ((e.ctrlKey || e.metaKey) && (
        (e.key === 'z' && e.shiftKey) || e.key === 'y'
      )) {
        e.preventDefault();
        const entry = redo();
        
        if (entry) {
          // Emit Custom Event für Story Update
          window.dispatchEvent(
            new CustomEvent('position-redo', { detail: entry })
          );
        }
        return;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [state.isActive, undo, redo, deactivateMode]);
  
  // ========================================
  // COMPUTED VALUES
  // ========================================
  
  const canUndo = state.historyIndex >= 0;
  const canRedo = state.historyIndex < state.history.length - 1;
  
  // ========================================
  // RETURN
  // ========================================
  
  return {
    // State
    isActive: state.isActive,
    activePhotoId: state.activePhotoId,
    canUndo,
    canRedo,
    
    // Actions
    activateMode,
    deactivateMode,
    setPosition,
    undo,
    redo
  };
};

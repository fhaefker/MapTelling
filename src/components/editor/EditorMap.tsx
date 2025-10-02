/**
 * EditorMap Component
 * 
 * Map für den Story Editor mit manueller Positionierung.
 * 
 * ✅ CRITICAL: Component Split Pattern (Provider Pattern)
 * - Outer: EditorMap (NO useMap hook)
 * - Inner: EditorMapContent (WITH useMap hook)
 * 
 * ✅ WhereGroup Principles:
 * - Transparency: Klare Separation of Concerns
 * - Maintainability: Provider Pattern wie StoryViewer.tsx
 * - Standards: WGS84/EPSG:4326 Koordinaten
 * 
 * ✅ MapComponents Compliance:
 * - Component Split Pattern (avoid mapExists bug)
 * - MapComponentsProvider wraps map consumers
 * - useMap() only INSIDE Provider
 * 
 * @module components/editor/EditorMap
 * @see src/components/viewer/StoryViewer.tsx (Reference Pattern)
 */

import { useEffect } from 'react';
import { Box } from '@mui/material';
import { MapComponentsProvider, MapLibreMap } from '@mapcomponents/react-maplibre';
import { MapClickHandler } from '../map/MapClickHandler';
import { usePositionSetMode } from '../../hooks/usePositionSetMode';
import { log } from '../../utils/logger';
import { 
  WHEREGROUP_WMS_URL, 
  WHEREGROUP_HQ, 
  LAYER_IDS, 
  MAP_SETTINGS 
} from '../../lib/constants';

// ========================================
// TYPES
// ========================================

export interface EditorMapProps {
  /** Initial center [lng, lat] */
  center?: [number, number];
  /** Initial zoom level */
  zoom?: number;
  /** Callback when position set */
  onPositionSet?: (photoId: string, coordinates: [number, number]) => void;
}

// ========================================
// CONSTANTS
// ========================================

const EDITOR_MAP_ID = 'editor-map';

// ========================================
// OUTER COMPONENT (NO useMap!)
// ========================================

/**
 * EditorMap - Outer Component
 * 
 * ✅ NO useMap() hook here!
 * ✅ Wraps content in MapComponentsProvider
 * 
 * Pattern from StoryViewer.tsx
 */
export const EditorMap: React.FC<EditorMapProps> = ({
  center = WHEREGROUP_HQ,
  zoom = MAP_SETTINGS.defaultZoom,
  onPositionSet
}) => {
  return (
    <MapComponentsProvider>
      <EditorMapContent 
        center={center}
        zoom={zoom}
        onPositionSet={onPositionSet}
      />
    </MapComponentsProvider>
  );
};

// ========================================
// INNER COMPONENT (WITH useMap!)
// ========================================

/**
 * EditorMapContent - Inner Component
 * 
 * ✅ useMap() hook SAFE here (INSIDE Provider)
 * ✅ Uses MapClickHandler component
 * 
 * Pattern from StoryViewerContent
 */
const EditorMapContent: React.FC<EditorMapProps> = ({
  center = WHEREGROUP_HQ,
  zoom = MAP_SETTINGS.defaultZoom,
  onPositionSet
}) => {
  // ✅ Position Set Mode Hook
  const {
    isActive,
    activePhotoId,
    canUndo,
    canRedo,
    activateMode,
    deactivateMode,
    setPosition
  } = usePositionSetMode();

  // Handle map click
  const handleMapClick = (coordinates: [number, number]) => {
    if (!activePhotoId) {
      log.warn('EditorMap', 'Map geklickt aber keine activePhotoId', { coordinates });
      return;
    }

    log.info('EditorMap', 'Position gesetzt', {
      photoId: activePhotoId,
      coordinates
    });

    // Record in history (old position unknown in this context)
    // We use [0, 0] as placeholder - PhotoList will handle actual update
    setPosition(activePhotoId, [0, 0], coordinates);

    // Callback to parent
    if (onPositionSet) {
      onPositionSet(activePhotoId, coordinates);
    }

    // Deactivate mode
    deactivateMode();
  };

  // Listen to position-set-mode events
  useEffect(() => {
    const handleActivate = (e: CustomEvent<{ photoId: string }>) => {
      log.info('EditorMap', 'Position-Set Modus aktiviert', { photoId: e.detail.photoId });
      activateMode(e.detail.photoId);
    };

    const handleDeactivate = () => {
      log.info('EditorMap', 'Position-Set Modus deaktiviert');
      deactivateMode();
    };

    window.addEventListener('position-set-mode-activate', handleActivate as EventListener);
    window.addEventListener('position-set-mode-deactivate', handleDeactivate as EventListener);

    return () => {
      window.removeEventListener('position-set-mode-activate', handleActivate as EventListener);
      window.removeEventListener('position-set-mode-deactivate', handleDeactivate as EventListener);
    };
  }, [activateMode, deactivateMode]);

  return (
    <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
      {/* Map */}
      <MapLibreMap
        mapId={EDITOR_MAP_ID}
        options={{
          style: {
            version: 8,
            sources: {
              [LAYER_IDS.wmsSource]: {
                type: 'raster',
                tiles: [WHEREGROUP_WMS_URL],
                tileSize: 256
              }
            },
            layers: [{
              id: LAYER_IDS.wmsLayer,
              type: 'raster',
              source: LAYER_IDS.wmsSource
            }]
          },
          center,
          zoom,
          minZoom: MAP_SETTINGS.minZoom,
          maxZoom: MAP_SETTINGS.maxZoom
        }}
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          width: '100%',
          height: '100%'
        }}
      />

      {/* Map Click Handler (INSIDE Provider!) */}
      <MapClickHandler
        mapId={EDITOR_MAP_ID}
        isActive={isActive}
        activePhotoId={activePhotoId}
        onMapClick={handleMapClick}
      />

      {/* Status Overlay */}
      {isActive && (
        <Box
          sx={{
            position: 'absolute',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            bgcolor: 'rgba(0, 0, 0, 0.75)',
            color: 'white',
            px: 3,
            py: 1,
            borderRadius: 2,
            fontSize: '0.9rem',
            fontWeight: 'bold',
            pointerEvents: 'none',
            zIndex: 1000
          }}
        >
          📍 Klicke auf die Karte, um Position zu setzen • ESC zum Abbrechen
        </Box>
      )}

      {/* Undo/Redo Status */}
      {(canUndo || canRedo) && (
        <Box
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            bgcolor: 'rgba(255, 255, 255, 0.9)',
            px: 2,
            py: 1,
            borderRadius: 1,
            fontSize: '0.75rem',
            color: 'text.secondary',
            zIndex: 1000
          }}
        >
          {canUndo && 'Ctrl+Z: Rückgängig'}
          {canUndo && canRedo && ' • '}
          {canRedo && 'Ctrl+Y: Wiederholen'}
        </Box>
      )}
    </Box>
  );
};

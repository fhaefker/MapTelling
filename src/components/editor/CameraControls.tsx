/**
 * CameraControls Component
 * 
 * UI für Kamera-Konfiguration (Zoom, Bearing, Pitch) pro Foto.
 * 
 * ⚠️ CRITICAL: Muss INSIDE MapComponentsProvider sein!
 * 
 * ✅ WhereGroup Principles:
 * - Transparency: Visuelle Feedback für alle Änderungen
 * - Maintainability: Wiederverwendbare Slider-Komponente
 * - Standards: MapLibre CameraOptions kompatibel
 * 
 * ✅ MapComponents Compliance:
 * - useMap() nur INSIDE Provider
 * - flyTo() via map.map (Wrapper Pattern)
 * - mapIsReady Guard überall
 * 
 * @module components/editor/CameraControls
 * @see CONCEPT_V2_03_CAMERA_CONFIG.md
 */

import { useState } from 'react';
import { Box, Typography, Slider, Button, Stack, Alert } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useMap } from '@mapcomponents/react-maplibre';
import type { PhotoFeature } from '../../types/story';
import type { CameraConfig } from '../../types/camera';
import { calculateOptimalZoom, DEFAULT_AUTO_ZOOM, DEFAULT_CAMERA } from '../../types/camera';
import { log } from '../../utils/logger';
import { WHEREGROUP_COLORS } from '../../lib/constants';

// ========================================
// TYPES
// ========================================

export interface CameraControlsProps {
  /** Aktuelles Foto */
  photo: PhotoFeature;
  
  /** Map ID */
  mapId: string;
  
  /** Callback wenn Kamera geändert wird */
  onUpdate: (camera: CameraConfig) => void;
}

// ========================================
// COMPONENT
// ========================================

/**
 * CameraControls Component
 * 
 * ⚠️ MUSS INSIDE MapComponentsProvider sein!
 * 
 * Features:
 * - Zoom Slider (8-18)
 * - Bearing Slider (0-359°)
 * - Pitch Slider (0-60°)
 * - "Aktuellen Zoom übernehmen" Button
 * - "Vorschau" Button
 * - "Automatisch berechnen" Button
 */
export const CameraControls: React.FC<CameraControlsProps> = ({
  photo,
  mapId,
  onUpdate
}) => {
  // ✅ useMap() INSIDE Provider
  const { map, mapIsReady } = useMap({ mapId });
  
  // Local State für sofortiges UI-Feedback
  const [localCamera, setLocalCamera] = useState<CameraConfig>(
    photo.properties.camera || DEFAULT_CAMERA
  );
  
  // Handler: Slider Änderung
  const handleSliderChange = (field: keyof CameraConfig, value: number) => {
    const newCamera = { ...localCamera, [field]: value };
    setLocalCamera(newCamera);
    onUpdate(newCamera);
    
    log.debug('CameraControls', 'Slider geändert', { field, value });
  };
  
  // Handler: Aktuellen Zoom übernehmen
  const captureCurrentCamera = () => {
    if (!mapIsReady || !map?.map) {
      log.warn('CameraControls', 'Map noch nicht bereit');
      return;
    }
    
    const camera: CameraConfig = {
      zoom: map.map.getZoom(),
      bearing: map.map.getBearing(),
      pitch: map.map.getPitch()
    };
    
    setLocalCamera(camera);
    onUpdate(camera);
    
    log.info('CameraControls', 'Kamera-Position übernommen', camera);
  };
  
  // Handler: Vorschau
  const previewCamera = () => {
    if (!mapIsReady || !map?.map) {
      log.warn('CameraControls', 'Map noch nicht bereit');
      return;
    }
    
    log.info('CameraControls', 'Vorschau', { localCamera });
    
    map.map.flyTo({
      center: photo.geometry.coordinates as [number, number],
      zoom: localCamera.zoom,
      bearing: localCamera.bearing,
      pitch: localCamera.pitch,
      duration: 1000
    });
  };
  
  // Handler: Automatisch berechnen
  const resetToAuto = () => {
    const autoZoom = calculateOptimalZoom([photo], DEFAULT_AUTO_ZOOM);
    
    const camera: CameraConfig = {
      zoom: autoZoom,
      bearing: 0,
      pitch: 0
    };
    
    setLocalCamera(camera);
    onUpdate(camera);
    
    log.info('CameraControls', 'Auto-Zoom berechnet', { autoZoom });
  };
  
  return (
    <Box sx={{ p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom sx={{ color: WHEREGROUP_COLORS.blue.primary }}>
        🎥 Kamera-Einstellungen
      </Typography>
      
      {/* Zoom Slider */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Zoom: <strong>{localCamera.zoom.toFixed(1)}</strong>
        </Typography>
        <Slider
          value={localCamera.zoom}
          min={8}
          max={18}
          step={0.1}
          onChange={(_, value) => handleSliderChange('zoom', value as number)}
          marks={[
            { value: 8, label: '8' },
            { value: 12, label: '12' },
            { value: 16, label: '16' },
            { value: 18, label: '18' }
          ]}
          sx={{
            '& .MuiSlider-thumb': {
              bgcolor: WHEREGROUP_COLORS.orange
            },
            '& .MuiSlider-track': {
              bgcolor: WHEREGROUP_COLORS.orange
            },
            '& .MuiSlider-markLabel': {
              fontSize: '0.7rem'
            }
          }}
        />
      </Box>
      
      {/* Bearing Slider */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Rotation: <strong>{localCamera.bearing.toFixed(0)}°</strong>
        </Typography>
        <Slider
          value={localCamera.bearing}
          min={0}
          max={359}
          step={1}
          onChange={(_, value) => handleSliderChange('bearing', value as number)}
          marks={[
            { value: 0, label: 'N' },
            { value: 90, label: 'O' },
            { value: 180, label: 'S' },
            { value: 270, label: 'W' }
          ]}
          sx={{
            '& .MuiSlider-thumb': {
              bgcolor: WHEREGROUP_COLORS.blue.primary
            },
            '& .MuiSlider-track': {
              bgcolor: WHEREGROUP_COLORS.blue.primary
            }
          }}
        />
      </Box>
      
      {/* Pitch Slider */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="body2" gutterBottom>
          Neigung: <strong>{localCamera.pitch.toFixed(0)}°</strong>
        </Typography>
        <Slider
          value={localCamera.pitch}
          min={0}
          max={60}
          step={1}
          onChange={(_, value) => handleSliderChange('pitch', value as number)}
          marks={[
            { value: 0, label: '0°' },
            { value: 30, label: '30°' },
            { value: 60, label: '60°' }
          ]}
          sx={{
            '& .MuiSlider-thumb': {
              bgcolor: WHEREGROUP_COLORS.blue.primary
            },
            '& .MuiSlider-track': {
              bgcolor: WHEREGROUP_COLORS.blue.primary
            }
          }}
        />
      </Box>
      
      {/* Action Buttons */}
      <Stack spacing={1}>
        <Button
          variant="contained"
          startIcon={<CameraAltIcon />}
          onClick={captureCurrentCamera}
          disabled={!mapIsReady}
          fullWidth
          sx={{
            bgcolor: WHEREGROUP_COLORS.orange,
            '&:hover': {
              bgcolor: WHEREGROUP_COLORS.yellow
            }
          }}
        >
          Aktuellen Zoom übernehmen
        </Button>
        
        <Button
          variant="outlined"
          startIcon={<VisibilityIcon />}
          onClick={previewCamera}
          disabled={!mapIsReady}
          fullWidth
          sx={{
            borderColor: WHEREGROUP_COLORS.blue.primary,
            color: WHEREGROUP_COLORS.blue.primary
          }}
        >
          Vorschau
        </Button>
        
        <Button
          variant="text"
          startIcon={<RefreshIcon />}
          onClick={resetToAuto}
          fullWidth
          sx={{
            color: WHEREGROUP_COLORS.blue.primary
          }}
        >
          Automatisch berechnen
        </Button>
      </Stack>
      
      {/* Info */}
      <Alert severity="info" sx={{ mt: 2, fontSize: '0.75rem' }}>
        Diese Einstellungen werden verwendet wenn das Foto in der Story angezeigt wird.
      </Alert>
    </Box>
  );
};

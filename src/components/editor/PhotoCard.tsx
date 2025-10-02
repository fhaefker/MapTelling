/**
 * PhotoCard Component
 * 
 * Single photo card mit Kamera-Controls (collapsible).
 * 
 * ✅ WhereGroup Principles:
 * - Transparency: Alle Einstellungen sichtbar und editierbar
 * - Maintainability: Wiederverwendbare Komponente
 * 
 * @module components/editor/PhotoCard
 */

import { useState } from 'react';
import {
  Box,
  Card,
  CardMedia,
  CardContent,
  TextField,
  IconButton,
  Typography,
  Stack,
  Chip,
  Collapse
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RoomIcon from '@mui/icons-material/Room';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CameraControls } from './CameraControls';
import type { PhotoFeature } from '../../types/story';
import type { CameraConfig } from '../../types/camera';
import { WHEREGROUP_COLORS } from '../../lib/constants';

// ========================================
// TYPES
// ========================================

export interface PhotoCardProps {
  photo: PhotoFeature;
  index: number;
  totalPhotos: number;
  mapId: string;
  onUpdate: (updates: Partial<PhotoFeature>) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onSetPosition?: () => void;
}

// ========================================
// COMPONENT
// ========================================

export const PhotoCard: React.FC<PhotoCardProps> = ({
  photo,
  index,
  totalPhotos,
  mapId,
  onUpdate,
  onRemove,
  onMoveUp,
  onMoveDown,
  onSetPosition
}) => {
  const [cameraExpanded, setCameraExpanded] = useState(false);
  
  // Handler: Kamera-Update
  const handleCameraUpdate = (camera: CameraConfig) => {
    onUpdate({
      properties: {
        ...photo.properties,
        camera
      }
    });
  };
  
  return (
    <Card
      sx={{
        display: 'flex',
        flexDirection: 'column',
        border: `1px solid ${WHEREGROUP_COLORS.gray.light}`,
        '&:hover': {
          boxShadow: 3
        }
      }}
    >
      {/* Main Card Content */}
      <Box sx={{ display: 'flex' }}>
        <CardMedia
          component="img"
          sx={{ width: 150, objectFit: 'cover' }}
          image={photo.properties.thumbnailUrl}
          alt={photo.properties.title}
        />
        
        <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <CardContent sx={{ flex: '1 0 auto' }}>
            <Stack spacing={1}>
              {/* Status Chips */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip 
                  label={`#${index + 1}`} 
                  size="small" 
                  sx={{ bgcolor: WHEREGROUP_COLORS.blue.primary, color: 'white' }}
                />
                {photo.properties.positionSource === 'exif' ? (
                  <Chip 
                    label="✅ GPS" 
                    size="small" 
                    color="success"
                    variant="outlined"
                  />
                ) : (
                  <Chip 
                    label="⚠️ Manuell" 
                    size="small" 
                    color="warning"
                    variant="outlined"
                    title="Position wurde manuell gesetzt"
                  />
                )}
                {photo.properties.exif?.camera && (
                  <Chip 
                    label={`📷 ${photo.properties.exif.camera}`} 
                    size="small" 
                    variant="outlined"
                    sx={{ fontSize: '0.7rem' }}
                  />
                )}
              </Box>

              {/* Title & Description */}
              <TextField
                label="Titel"
                size="small"
                fullWidth
                value={photo.properties.title}
                onChange={(e) => onUpdate({
                  properties: {
                    ...photo.properties,
                    title: e.target.value
                  }
                })}
              />

              <TextField
                label="Beschreibung"
                size="small"
                fullWidth
                multiline
                rows={2}
                value={photo.properties.description}
                onChange={(e) => onUpdate({
                  properties: {
                    ...photo.properties,
                    description: e.target.value
                  }
                })}
              />

              <Typography variant="caption" color="text.secondary">
                Koordinaten: {photo.geometry.coordinates[1].toFixed(4)}, {photo.geometry.coordinates[0].toFixed(4)}
              </Typography>
            </Stack>
          </CardContent>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pb: 1, gap: 1 }}>
            <IconButton
              size="small"
              onClick={onMoveUp}
              disabled={index === 0}
              aria-label="Nach oben"
            >
              <ArrowUpwardIcon />
            </IconButton>
            
            <IconButton
              size="small"
              onClick={onMoveDown}
              disabled={index === totalPhotos - 1}
              aria-label="Nach unten"
            >
              <ArrowDownwardIcon />
            </IconButton>

            {/* Position setzen Button */}
            {onSetPosition && (
              <IconButton
                size="small"
                onClick={onSetPosition}
                sx={{ 
                  color: WHEREGROUP_COLORS.orange,
                  '&:hover': {
                    bgcolor: 'rgba(255, 152, 0, 0.08)'
                  }
                }}
                aria-label="Position auf Karte setzen"
                title="Position auf Karte setzen"
              >
                <RoomIcon />
              </IconButton>
            )}

            {/* Kamera-Einstellungen Toggle */}
            <IconButton
              size="small"
              onClick={() => setCameraExpanded(!cameraExpanded)}
              sx={{
                color: WHEREGROUP_COLORS.blue.primary,
                transform: cameraExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.3s'
              }}
              aria-label="Kamera-Einstellungen"
              title="Kamera-Einstellungen"
            >
              <CameraAltIcon />
              <ExpandMoreIcon sx={{ fontSize: '1rem' }} />
            </IconButton>

            <Box sx={{ flex: 1 }} />

            <IconButton
              size="small"
              onClick={() => {
                if (window.confirm('Foto wirklich löschen?')) {
                  onRemove();
                }
              }}
              sx={{ color: 'error.main' }}
              aria-label="Löschen"
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Collapsible Camera Controls */}
      <Collapse in={cameraExpanded} timeout="auto" unmountOnExit>
        <Box sx={{ borderTop: `1px solid ${WHEREGROUP_COLORS.gray.light}` }}>
          <CameraControls
            photo={photo}
            mapId={mapId}
            onUpdate={handleCameraUpdate}
          />
        </Box>
      </Collapse>
    </Card>
  );
};

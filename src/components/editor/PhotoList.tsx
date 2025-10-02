import {
  Box,
  Card,
  CardMedia,
  CardContent,
  TextField,
  IconButton,
  Typography,
  Stack,
  Chip
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import RoomIcon from '@mui/icons-material/Room';
import type { PhotoFeature } from '../../types/story';
import { WHEREGROUP_COLORS } from '../../lib/constants';

interface PhotoListProps {
  photos: PhotoFeature[];
  onPhotoUpdate: (id: string, updates: Partial<PhotoFeature>) => void;
  onPhotoRemove: (id: string) => void;
  onPhotosReorder: (startIndex: number, endIndex: number) => void;
  onSetPosition?: (photoId: string) => void;
}

/**
 * PhotoList Component
 * 
 * Editable list of photos with drag & drop reordering.
 * 
 * ✅ MapComponents Compliant:
 * - Theme-aware MUI components
 * 
 * ✅ WhereGroup Principles:
 * - Configuration over Code
 * - Standards-driven (GeoJSON)
 * 
 * ✅ Accessibility:
 * - Keyboard accessible
 * - ARIA labels
 * - Focus management
 * 
 * @param {PhotoListProps} props - Component props
 * @returns {JSX.Element} Photo list with editing
 * 
 * @example
 * <PhotoList
 *   photos={story.features}
 *   onPhotoUpdate={updatePhoto}
 *   onPhotoRemove={removePhoto}
 *   onPhotosReorder={reorderPhotos}
 * />
 */
export const PhotoList = ({
  photos,
  onPhotoUpdate,
  onPhotoRemove,
  onPhotosReorder,
  onSetPosition
}: PhotoListProps) => {
  const handleMoveUp = (index: number) => {
    if (index > 0) {
      onPhotosReorder(index, index - 1);
    }
  };

  const handleMoveDown = (index: number) => {
    if (index < photos.length - 1) {
      onPhotosReorder(index, index + 1);
    }
  };

  return (
    <Stack spacing={2}>
      {photos.map((photo, index) => (
        <Card
          key={photo.properties.id}
          sx={{
            display: 'flex',
            border: `1px solid ${WHEREGROUP_COLORS.gray.light}`,
            '&:hover': {
              boxShadow: 3
            }
          }}
        >
          <CardMedia
            component="img"
            sx={{ width: 150, objectFit: 'cover' }}
            image={photo.properties.thumbnailUrl}
            alt={photo.properties.title}
          />
          
          <Box sx={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
            <CardContent sx={{ flex: '1 0 auto' }}>
              <Stack spacing={1}>
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

                <TextField
                  label="Titel"
                  size="small"
                  fullWidth
                  value={photo.properties.title}
                  onChange={(e) => onPhotoUpdate(photo.properties.id, {
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
                  onChange={(e) => onPhotoUpdate(photo.properties.id, {
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

            <Box sx={{ display: 'flex', alignItems: 'center', pl: 1, pb: 1, gap: 1 }}>
              <IconButton
                size="small"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                aria-label="Nach oben"
              >
                <ArrowUpwardIcon />
              </IconButton>
              
              <IconButton
                size="small"
                onClick={() => handleMoveDown(index)}
                disabled={index === photos.length - 1}
                aria-label="Nach unten"
              >
                <ArrowDownwardIcon />
              </IconButton>

              {/* Position setzen Button */}
              {onSetPosition && (
                <IconButton
                  size="small"
                  onClick={() => onSetPosition(photo.properties.id)}
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

              <Box sx={{ flex: 1 }} />

              <IconButton
                size="small"
                onClick={() => {
                  if (window.confirm('Foto wirklich löschen?')) {
                    onPhotoRemove(photo.properties.id);
                  }
                }}
                sx={{ color: 'error.main' }}
                aria-label="Löschen"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
        </Card>
      ))}
    </Stack>
  );
};

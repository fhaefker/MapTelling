/**
 * FloatingPhotoCard Component
 * 
 * Floating card design für Story Viewer (über Karte).
 * 
 * ✅ Design System (CONCEPT_V2_06):
 * - Transparent backdrop-filter blur
 * - Floating over map (right: 32px, centered vertically)
 * - Elevation: 8 (prominent shadow)
 * - Max height: 80vh
 * 
 * ✅ WhereGroup Principles:
 * - Visual Hierarchy: Card über Karte
 * - User Experience: Smooth animations
 * - Accessibility: Keyboard navigation
 * 
 * @module components/viewer/FloatingPhotoCard
 */

import { Box, Card, CardContent, CardMedia, Typography, IconButton, Chip, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CloseIcon from '@mui/icons-material/Close';
import type { PhotoFeature } from '../../types/story';
import { WHEREGROUP_COLORS } from '../../lib/constants';

// ========================================
// TYPES
// ========================================

export interface FloatingPhotoCardProps {
  photo: PhotoFeature;
  photoIndex: number;
  totalPhotos: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
}

// ========================================
// COMPONENT
// ========================================

/**
 * FloatingPhotoCard - Schwebende Foto-Karte
 * 
 * Design Pattern:
 * - backdrop-filter: blur(20px) für Glassmorphism
 * - rgba(255,255,255,0.95) für Semi-Transparenz
 * - Elevation 8 für Schatten
 * - Absolute positioning (right, centered)
 * 
 * @example
 * <FloatingPhotoCard
 *   photo={activePhoto}
 *   photoIndex={2}
 *   totalPhotos={10}
 *   onNext={() => setIndex(3)}
 *   onPrevious={() => setIndex(1)}
 *   onClose={() => returnToOverview()}
 * />
 */
export const FloatingPhotoCard: React.FC<FloatingPhotoCardProps> = ({
  photo,
  photoIndex,
  totalPhotos,
  onNext,
  onPrevious,
  onClose
}) => {
  return (
    <Box
      sx={{
        position: 'absolute',
        right: 32,
        top: '50%',
        transform: 'translateY(-50%)',
        width: 420,
        maxHeight: '85vh',
        zIndex: 2000,
        pointerEvents: 'none' // Map bleibt interaktiv
      }}
    >
      <Card
        elevation={8}
        sx={{
          pointerEvents: 'auto',
          backdropFilter: 'blur(20px)',
          bgcolor: 'rgba(255, 255, 255, 0.95)',
          borderRadius: 3,
          overflow: 'hidden',
          transition: 'transform 0.3s ease-in-out',
          '&:hover': {
            transform: 'scale(1.02)'
          }
        }}
      >
        {/* Photo */}
        <Box
          sx={{
            width: '100%',
            height: 320,
            overflow: 'hidden',
            position: 'relative'
          }}
        >
          <CardMedia
            component="img"
            image={photo.properties.thumbnailUrl || photo.properties.photoUrl}
            alt={photo.properties.title}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover'
            }}
          />
          
          {/* Counter Overlay */}
          <Chip
            label={`${photoIndex + 1} / ${totalPhotos}`}
            size="small"
            sx={{
              position: 'absolute',
              top: 16,
              right: 16,
              bgcolor: 'rgba(0, 0, 0, 0.7)',
              color: 'white',
              fontWeight: 'bold'
            }}
          />
          
          {/* Close Button */}
          <IconButton
            onClick={onClose}
            size="small"
            sx={{
              position: 'absolute',
              top: 16,
              left: 16,
              bgcolor: 'rgba(0, 0, 0, 0.5)',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(0, 0, 0, 0.7)'
              }
            }}
            aria-label="Zurück zur Übersicht"
          >
            <CloseIcon />
          </IconButton>
        </Box>
        
        {/* Content */}
        <CardContent sx={{ p: 3, maxHeight: 'calc(85vh - 320px - 64px)', overflowY: 'auto' }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
            {photo.properties.title}
          </Typography>
          
          {photo.properties.timestamp && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
              📅 {new Date(photo.properties.timestamp).toLocaleDateString('de-DE', {
                day: '2-digit',
                month: '2-digit',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </Typography>
          )}
          
          {photo.properties.description && (
            <Typography variant="body1" paragraph sx={{ lineHeight: 1.7 }}>
              {photo.properties.description}
            </Typography>
          )}
          
          {/* Camera Info */}
          {photo.properties.exif?.camera && (
            <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="text.secondary">
                  📷 {photo.properties.exif.camera}
                </Typography>
                {photo.properties.exif.lens && (
                  <Typography variant="caption" color="text.secondary">
                    | {photo.properties.exif.lens}
                  </Typography>
                )}
              </Stack>
            </Box>
          )}
          
          {/* GPS Chip */}
          {photo.properties.positionSource === 'exif' && (
            <Chip
              label="✅ GPS aus EXIF"
              size="small"
              color="success"
              variant="outlined"
              sx={{ mt: 1 }}
            />
          )}
        </CardContent>
        
        {/* Navigation */}
        <Box
          sx={{
            p: 2,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: 1,
            borderColor: 'divider',
            bgcolor: 'rgba(255, 255, 255, 0.8)'
          }}
        >
          <IconButton
            onClick={onPrevious}
            disabled={photoIndex === 0}
            sx={{
              bgcolor: WHEREGROUP_COLORS.blue.primary,
              color: 'white',
              '&:hover': {
                bgcolor: WHEREGROUP_COLORS.blue.light
              },
              '&:disabled': {
                bgcolor: WHEREGROUP_COLORS.gray.light,
                color: WHEREGROUP_COLORS.gray.medium
              }
            }}
            aria-label="Vorheriges Foto"
          >
            <ArrowBackIcon />
          </IconButton>
          
          <Typography variant="body2" color="text.secondary">
            Navigation: ← → oder Mausrad
          </Typography>
          
          <IconButton
            onClick={onNext}
            disabled={photoIndex === totalPhotos - 1}
            sx={{
              bgcolor: WHEREGROUP_COLORS.blue.primary,
              color: 'white',
              '&:hover': {
                bgcolor: WHEREGROUP_COLORS.blue.light
              },
              '&:disabled': {
                bgcolor: WHEREGROUP_COLORS.gray.light,
                color: WHEREGROUP_COLORS.gray.medium
              }
            }}
            aria-label="Nächstes Foto"
          >
            <ArrowForwardIcon />
          </IconButton>
        </Box>
      </Card>
    </Box>
  );
};

import { Box, Card, CardMedia, CardContent, Typography, Chip } from '@mui/material';
import { PhotoFeature } from '../../types/story';
import { WHEREGROUP_COLORS } from '../../lib/constants';

interface PhotoCardProps {
  photo: PhotoFeature;
  index: number;
  isActive: boolean;
  onClick?: () => void;
}

/**
 * PhotoCard Component
 * 
 * Displays a single photo in the story panel.
 * 
 * ✅ MapComponents Theme Integration (MUI)
 * ✅ Accessibility:
 *   - data-photo-card attribute for IntersectionObserver
 *   - data-index for scroll sync
 *   - Keyboard accessible (Card is button)
 * 
 * @param {PhotoCardProps} props - Component props
 * @returns {JSX.Element} Photo card with thumbnail and metadata
 * 
 * @example
 * <PhotoCard
 *   photo={feature}
 *   index={0}
 *   isActive={activeIndex === 0}
 *   onClick={() => flyToPhoto(0)}
 * />
 */
export const PhotoCard = ({
  photo,
  index,
  isActive,
  onClick
}: PhotoCardProps) => {
  const { properties } = photo;
  
  return (
    <Card
      data-photo-card
      data-index={index}
      onClick={onClick}
      sx={{
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        border: isActive ? `3px solid ${WHEREGROUP_COLORS.orange}` : '1px solid #e0e0e0',
        boxShadow: isActive ? 4 : 1,
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)'
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Foto ${index + 1}: ${properties.title}`}
      aria-current={isActive ? 'true' : 'false'}
    >
      <CardMedia
        component="img"
        height="200"
        image={properties.thumbnailUrl}
        alt={properties.title}
        sx={{
          objectFit: 'cover'
        }}
      />
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
          <Typography variant="h6" component="h3" sx={{ flexGrow: 1 }}>
            {properties.title}
          </Typography>
          {isActive && (
            <Chip
              label="Aktiv"
              size="small"
              sx={{
                bgcolor: WHEREGROUP_COLORS.orange,
                color: 'white'
              }}
            />
          )}
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          {properties.description}
        </Typography>
        
        {properties.exif?.dateTime && (
          <Typography variant="caption" color="text.secondary">
            📅 {new Date(properties.exif.dateTime).toLocaleDateString('de-DE')}
          </Typography>
        )}
        
        {properties.exif?.camera && (
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
            📷 {properties.exif.camera}
          </Typography>
        )}
        
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
          📍 Position: {properties.positionSource === 'exif' ? 'GPS (EXIF)' : 'Manuell'}
        </Typography>
      </CardContent>
    </Card>
  );
};

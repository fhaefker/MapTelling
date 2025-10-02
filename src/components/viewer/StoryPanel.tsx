import { Box, Stack, Typography } from '@mui/material';
import { PhotoCard } from './PhotoCard';
import { PhotoFeature } from '../../types/story';

interface StoryPanelProps {
  photos: PhotoFeature[];
  activeIndex: number;
  onPhotoClick: (index: number) => void;
}

/**
 * StoryPanel Component
 * 
 * Scrollable sidebar with photo cards.
 * 
 * ✅ MapComponents Theme Integration (MUI)
 * ✅ Accessibility:
 *   - Keyboard scrollable
 *   - Screen reader friendly
 *   - Focus management
 * 
 * @param {StoryPanelProps} props - Component props
 * @returns {JSX.Element} Scrollable panel with photo cards
 * 
 * @example
 * <StoryPanel
 *   photos={story.features}
 *   activeIndex={2}
 *   onPhotoClick={setActiveIndex}
 * />
 */
export const StoryPanel = ({
  photos,
  activeIndex,
  onPhotoClick
}: StoryPanelProps) => {
  if (photos.length === 0) {
    return (
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          p: 3
        }}
      >
        <Typography variant="body1" color="text.secondary" align="center">
          Noch keine Fotos vorhanden.<br />
          Lade Fotos hoch, um deine Story zu erstellen.
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box
      sx={{
        height: '100%',
        overflowY: 'auto',
        overflowX: 'hidden',
        p: 2,
        // Custom scrollbar
        '&::-webkit-scrollbar': {
          width: '8px'
        },
        '&::-webkit-scrollbar-track': {
          bgcolor: '#f1f1f1'
        },
        '&::-webkit-scrollbar-thumb': {
          bgcolor: '#888',
          borderRadius: '4px',
          '&:hover': {
            bgcolor: '#555'
          }
        }
      }}
      role="region"
      aria-label="Photo Story Panel"
    >
      <Stack spacing={2}>
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.properties.id}
            photo={photo}
            index={index}
            isActive={index === activeIndex}
            onClick={() => onPhotoClick(index)}
          />
        ))}
      </Stack>
    </Box>
  );
};

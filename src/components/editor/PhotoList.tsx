import {
  Stack
} from '@mui/material';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import { PhotoCard } from './PhotoCard';
import type { PhotoFeature } from '../../types/story';

interface PhotoListProps {
  photos: PhotoFeature[];
  mapId: string;
  onPhotoUpdate: (id: string, updates: Partial<PhotoFeature>) => void;
  onPhotoRemove: (id: string) => void;
  onPhotosReorder: (startIndex: number, endIndex: number) => void;
  onSetPosition?: (photoId: string) => void;
}

/**
 * PhotoList Component
 * 
 * Editable list of photos with camera controls.
 * 
 * ✅ CRITICAL: Wraps PhotoCards in MapComponentsProvider
 * ✅ CameraControls (in PhotoCard) use useMap() INSIDE Provider
 * 
 * ✅ MapComponents Compliant:
 * - Provider Pattern for CameraControls
 * - Theme-aware MUI components
 * 
 * ✅ WhereGroup Principles:
 * - Configuration over Code
 * - Standards-driven (GeoJSON)
 * 
 * @param {PhotoListProps} props - Component props
 * @returns {JSX.Element} Photo list with editing
 */
export const PhotoList = ({
  photos,
  mapId,
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
    <MapComponentsProvider>
      <Stack spacing={2}>
        {photos.map((photo, index) => (
          <PhotoCard
            key={photo.properties.id}
            photo={photo}
            index={index}
            totalPhotos={photos.length}
            mapId={mapId}
            onUpdate={(updates) => onPhotoUpdate(photo.properties.id, updates)}
            onRemove={() => onPhotoRemove(photo.properties.id)}
            onMoveUp={() => handleMoveUp(index)}
            onMoveDown={() => handleMoveDown(index)}
            onSetPosition={onSetPosition ? () => onSetPosition(photo.properties.id) : undefined}
          />
        ))}
      </Stack>
    </MapComponentsProvider>
  );
};

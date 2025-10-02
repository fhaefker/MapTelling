import { useState, useCallback } from 'react';
import { 
  Box, 
  Button, 
  LinearProgress, 
  Typography, 
  Alert,
  Paper,
  Stack
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';
import type { PhotoUploadResult } from '../../types/photo';
import type { PhotoFeature } from '../../types/story';
import { WHEREGROUP_COLORS } from '../../lib/constants';

interface PhotoUploaderProps {
  onPhotoUploaded: (feature: PhotoFeature) => void;
  maxSizeMB?: number;
}

/**
 * PhotoUploader Component
 * 
 * Drag & Drop interface for photo upload with EXIF extraction.
 * 
 * ✅ MapComponents Compliant:
 * - usePhotoUpload hook integration
 * - Theme-aware MUI components
 * 
 * ✅ WhereGroup Principles:
 * - Privacy by Design (local storage)
 * - Configuration over Code (maxSizeMB prop)
 * 
 * ✅ Accessibility:
 * - Keyboard accessible file input
 * - Progress announcements
 * - Error messages
 * 
 * @param {PhotoUploaderProps} props - Component props
 * @returns {JSX.Element} Upload interface
 * 
 * @example
 * <PhotoUploader
 *   onPhotoUploaded={(feature) => addPhotoToStory(feature)}
 *   maxSizeMB={10}
 * />
 */
export const PhotoUploader = ({ 
  onPhotoUploaded, 
  maxSizeMB = 10 
}: PhotoUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadResult, setUploadResult] = useState<PhotoUploadResult | null>(null);

  const { uploadPhoto, uploading, progress } = usePhotoUpload({
    maxSizeMB,
    onSuccess: (result) => {
      setUploadResult(result);
      setError(null);
      
      // Create PhotoFeature from upload result
      const feature: PhotoFeature = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: result.coordinates || [7.1, 50.73] // Default: WhereGroup HQ
        },
        properties: {
          id: result.id,
          photoId: result.id,
          title: `Foto ${new Date().toLocaleDateString('de-DE')}`,
          description: '',
          thumbnailUrl: result.thumbnailUrl,
          timestamp: new Date().toISOString(),
          order: 0, // Will be updated by parent
          positionSource: result.coordinates ? 'exif' : 'manual',
          camera: {
            zoom: 14,
            bearing: 0,
            pitch: 0,
            duration: 2000
          },
          exif: result.exif || undefined
        }
      };
      
      onPhotoUploaded(feature);
    },
    onError: (err) => {
      setError(err.message);
      setUploadResult(null);
    }
  });

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      uploadPhoto(file);
    }
  }, [uploadPhoto]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      uploadPhoto(file);
    }
  }, [uploadPhoto]);

  return (
    <Paper
      elevation={dragActive ? 6 : 2}
      sx={{
        p: 3,
        border: dragActive 
          ? `2px dashed ${WHEREGROUP_COLORS.orange}` 
          : '2px dashed #ccc',
        backgroundColor: dragActive ? '#f0f8ff' : 'transparent',
        transition: 'all 0.3s ease',
        cursor: uploading ? 'wait' : 'pointer'
      }}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <Stack spacing={2} alignItems="center">
        <CloudUploadIcon 
          sx={{ 
            fontSize: 64, 
            color: dragActive ? WHEREGROUP_COLORS.orange : WHEREGROUP_COLORS.blue.primary 
          }} 
        />
        
        <Typography variant="h6" align="center">
          {uploading ? 'Upload läuft...' : 'Foto hochladen'}
        </Typography>
        
        <Typography variant="body2" color="text.secondary" align="center">
          Drag & Drop oder klicken zum Auswählen<br />
          Max. {maxSizeMB}MB, JPEG/PNG mit GPS-Daten (optional)
        </Typography>

        <Button
          variant="contained"
          component="label"
          disabled={uploading}
          sx={{
            bgcolor: WHEREGROUP_COLORS.blue.primary,
            '&:hover': {
              bgcolor: WHEREGROUP_COLORS.blue.light
            }
          }}
        >
          Datei auswählen
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={handleFileInput}
            disabled={uploading}
          />
        </Button>

        {uploading && (
          <Box sx={{ width: '100%' }}>
            <LinearProgress 
              variant="determinate" 
              value={progress} 
              sx={{
                '& .MuiLinearProgress-bar': {
                  bgcolor: WHEREGROUP_COLORS.orange
                }
              }}
            />
            <Typography variant="caption" color="text.secondary" align="center" display="block" mt={1}>
              {progress}% abgeschlossen
            </Typography>
          </Box>
        )}

        {error && (
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        )}

        {uploadResult && !uploading && (
          <Alert severity="success" sx={{ width: '100%' }}>
            ✅ Foto erfolgreich hochgeladen!
            {uploadResult.coordinates && (
              <Typography variant="caption" display="block" mt={1}>
                📍 GPS-Koordinaten gefunden: {uploadResult.coordinates[1].toFixed(4)}, {uploadResult.coordinates[0].toFixed(4)}
              </Typography>
            )}
            {uploadResult.exif?.camera && (
              <Typography variant="caption" display="block">
                📷 Kamera: {uploadResult.exif.camera}
              </Typography>
            )}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
};

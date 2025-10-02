import { Box, Button, TextField, Typography, Paper, Stack, Divider } from '@mui/material';
import { useState, useRef, useEffect } from 'react';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import { PhotoUploader } from './PhotoUploader';
import { PhotoList } from './PhotoList';
import { EditorMap } from './EditorMap';
import { VersionBadge } from '../shared/VersionBadge';
import { useStoryState } from '../../hooks/useStoryState';
import type { PhotoFeature } from '../../types/story';
import { WHEREGROUP_COLORS } from '../../lib/constants';
import { log } from '../../utils/logger';

/**
 * StoryEditor Component
 * 
 * Story creation and editing interface.
 * 
 * ✅ MapComponents Compliant:
 * - useStoryState hook integration
 * - Theme-aware MUI components
 * 
 * ✅ WhereGroup Principles:
 * - Configuration over Code
 * - Privacy by Design (local storage auto-save)
 * - Standards-driven (GeoJSON export)
 * 
 * ✅ Accessibility:
 * - Form labels
 * - Keyboard navigation
 * - Screen reader announcements
 * 
 * @returns {JSX.Element} Story editor interface
 * 
 * @example
 * <Route path="/editor" element={<StoryEditor />} />
 */
export const StoryEditor = () => {
  const {
    story,
    addPhoto,
    updatePhoto,
    removePhoto,
    reorderPhotos,
    updateMetadata,
    exportStory
  } = useStoryState();
  
  // ✅ Resizable Sidebar State
  const [sidebarWidth, setSidebarWidth] = useState(400); // px
  const isResizing = useRef(false);
  
  // Mouse handlers for resize
  const handleMouseDown = () => {
    isResizing.current = true;
    document.body.style.cursor = 'ew-resize';
    document.body.style.userSelect = 'none';
  };
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      
      // Min: 300px, Max: 600px
      const newWidth = Math.max(300, Math.min(600, e.clientX));
      setSidebarWidth(newWidth);
    };
    
    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      }
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, []);

  const handlePhotoUploaded = (feature: PhotoFeature) => {
    // Set correct order (last position)
    const updatedFeature = {
      ...feature,
      properties: {
        ...feature.properties,
        order: story?.features.length || 0
      }
    };
    addPhoto(updatedFeature);
  };

  const handleSetPosition = (photoId: string) => {
    log.info('StoryEditor', 'Position setzen Button geklickt', { photoId });
    
    // Dispatch custom event to activate position-set mode
    const event = new CustomEvent('position-set-mode-activate', {
      detail: { photoId }
    });
    window.dispatchEvent(event);
  };

  const handlePositionSet = (photoId: string, coordinates: [number, number]) => {
    log.info('StoryEditor', 'Position gesetzt von Karte', { photoId, coordinates });
    
    // Find photo to get current properties
    const photo = story?.features.find(f => f.properties.id === photoId);
    if (!photo) {
      log.error('StoryEditor', 'Photo nicht gefunden', { photoId });
      return;
    }
    
    // Update photo with new coordinates
    updatePhoto(photoId, {
      geometry: {
        type: 'Point',
        coordinates
      },
      properties: {
        ...photo.properties,
        positionSource: 'manual'
      }
    });
  };

  const handleExport = () => {
    if (!story) return;
    
    const json = exportStory();
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${story.metadata.title.replace(/\s+/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
      {/* Left Panel - Editor */}
      <Box sx={{ width: `${sidebarWidth}px`, overflow: 'auto', p: 3, bgcolor: '#f5f5f5', borderRight: '1px solid #ddd' }}>
        <Stack spacing={3}>
          {/* Header */}
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h4" gutterBottom sx={{ color: WHEREGROUP_COLORS.blue.primary }}>
              Story Editor
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Erstelle deine interaktive Foto-Story mit GPS-Daten und EXIF-Metadaten
            </Typography>
          </Paper>

        {/* Story Metadata */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Story-Informationen
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Titel"
              fullWidth
              value={story?.metadata.title || ''}
              onChange={(e) => updateMetadata({ title: e.target.value })}
              variant="outlined"
            />
            <TextField
              label="Beschreibung"
              fullWidth
              multiline
              rows={3}
              value={story?.metadata.description || ''}
              onChange={(e) => updateMetadata({ description: e.target.value })}
              variant="outlined"
            />
            <TextField
              label="Autor"
              fullWidth
              value={story?.metadata.author || ''}
              onChange={(e) => updateMetadata({ author: e.target.value })}
              variant="outlined"
            />
          </Stack>
        </Paper>

        {/* Photo Uploader */}
        <PhotoUploader 
          onPhotoUploaded={handlePhotoUploaded}
          maxSizeMB={10}
        />

        {/* Photo List */}
        {story && story.features.length > 0 && (
          <>
            <Divider />
            <Paper elevation={2} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Fotos ({story.features.length})
              </Typography>
              <PhotoList
                photos={story.features}
                mapId="editor-map"
                onPhotoUpdate={updatePhoto}
                onPhotoRemove={removePhoto}
                onPhotosReorder={reorderPhotos}
                onSetPosition={handleSetPosition}
              />
            </Paper>
          </>
        )}

        {/* Actions */}
        <Paper elevation={2} sx={{ p: 3 }}>
          <Stack direction="row" spacing={2} justifyContent="flex-end">
            <Button
              variant="outlined"
              startIcon={<SaveIcon />}
              onClick={() => {
                // Auto-save is already happening in useStoryState
                alert('Story automatisch gespeichert!');
              }}
            >
              Speichern
            </Button>
            <Button
              variant="contained"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={!story || story.features.length === 0}
              sx={{
                bgcolor: WHEREGROUP_COLORS.orange,
                '&:hover': {
                  bgcolor: WHEREGROUP_COLORS.yellow
                }
              }}
            >
              Als JSON exportieren
            </Button>
          </Stack>
        </Paper>

        {/* Info */}
        <Paper elevation={1} sx={{ p: 2, bgcolor: '#e3f2fd' }}>
          <Typography variant="caption" color="text.secondary">
            💡 Tipp: Deine Story wird automatisch lokal gespeichert (IndexedDB + LocalStorage).<br />
            Keine Daten werden an einen Server übertragen. Privacy by Design! 🔒
          </Typography>
        </Paper>
        </Stack>
      </Box>
      
      {/* Resize Handle */}
      <Box
        onMouseDown={handleMouseDown}
        sx={{
          width: '6px',
          cursor: 'ew-resize',
          bgcolor: '#ddd',
          '&:hover': {
            bgcolor: WHEREGROUP_COLORS.orange,
            transition: 'background-color 0.2s'
          },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          zIndex: 10
        }}
      >
        <DragIndicatorIcon 
          sx={{ 
            color: 'white', 
            fontSize: 20,
            transform: 'rotate(90deg)'
          }} 
        />
      </Box>

      {/* Right Panel - Map */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <EditorMap 
          onPositionSet={handlePositionSet}
        />
        <VersionBadge position="bottom-right" label="Editor" />
      </Box>
    </Box>
  );
};

import { Box, Typography, Paper } from '@mui/material';
import { MapComponentsProvider, MapLibreMap } from '@mapcomponents/react-maplibre';
import { PhotoMarkerLayer } from '../map/PhotoMarkerLayer';
import { StoryPanel } from './StoryPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { useStoryState } from '../../hooks/useStoryState';
import { useScrollSync } from '../../hooks/useScrollSync';
import { useKeyboardNav } from '../../hooks/useKeyboardNav';
import type { PhotoStory } from '../../types/story';
import { 
  WHEREGROUP_WMS_URL, 
  WHEREGROUP_HQ, 
  LAYER_IDS, 
  MAP_SETTINGS 
} from '../../lib/constants';

/**
 * StoryViewerContent Component (Inner)
 * 
 * Content inside MapComponentsProvider - uses hooks that need map context.
 * 
 * ✅ MapComponents Compliant:
 * - useScrollSync and useKeyboardNav INSIDE MapComponentsProvider
 * - Hooks can safely access map context
 */
interface StoryViewerContentProps {
  story: PhotoStory;
  activeIndex: number;
  setActiveIndex: (index: number) => void;
}

const StoryViewerContent = ({ 
  story,
  activeIndex, 
  setActiveIndex 
}: StoryViewerContentProps) => {
  // ✅ CRITICAL: These hooks are NOW inside MapComponentsProvider
  const { scrollToPhoto } = useScrollSync({
    mapId: MAP_SETTINGS.mapId,
    photos: story.features,
    activeIndex,
    onPhotoChange: setActiveIndex
  });
  
  useKeyboardNav({
    photos: story.features,
    activeIndex,
    onNavigate: setActiveIndex,
    enabled: true
  });

  return (
    <Box sx={{ height: '100vh', width: '100vw', display: 'flex' }}>
      {/* Story Panel (Left Sidebar) */}
      <Paper
        elevation={3}
        sx={{
          width: 400,
          height: '100%',
          flexShrink: 0,
          zIndex: 1000
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h5" component="h1">
            {story.metadata.title}
          </Typography>
          {story.metadata.description && (
            <Typography variant="body2" color="text.secondary">
              {story.metadata.description}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            {story.features.length} Foto{story.features.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
        
        <StoryPanel
          photos={story.features}
          activeIndex={activeIndex}
          onPhotoClick={(index) => {
            setActiveIndex(index);
            scrollToPhoto(index);
          }}
        />
      </Paper>
      
      {/* Map (Right) */}
      <Box sx={{ flex: 1, position: 'relative' }}>
        <MapLibreMap
          mapId={MAP_SETTINGS.mapId}
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
            center: story.features.length > 0
              ? story.features[0].geometry.coordinates as [number, number]
              : WHEREGROUP_HQ,
            zoom: MAP_SETTINGS.defaultZoom,
            minZoom: MAP_SETTINGS.minZoom,
            maxZoom: MAP_SETTINGS.maxZoom
          }}
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: 0,
            right: 0
          }}
        />
        
        {/* Photo Markers */}
        {story.features.length > 0 && (
          <PhotoMarkerLayer
            mapId={MAP_SETTINGS.mapId}
            photos={story.features}
            activeIndex={activeIndex}
            onPhotoClick={(index) => {
              setActiveIndex(index);
              scrollToPhoto(index);
            }}
          />
        )}
      </Box>
    </Box>
  );
};

/**
 * StoryViewer Component (Outer)
 * 
 * Main viewer layout with map and story panel.
 * 
 * ✅ MapComponents Compliant:
 * - Single MapComponentsProvider (root)
 * - Uses MapLibreMap declaratively
 * - Theme integration via parent ThemeProvider
 * - All map-dependent hooks INSIDE provider
 * 
 * ✅ WhereGroup Principles:
 * - WhereGroup WMS as basemap
 * - Configuration over Code (all constants)
 * - Standards-driven (GeoJSON)
 * 
 * ✅ Accessibility (WCAG 2.1):
 * - Keyboard navigation (useKeyboardNav)
 * - prefers-reduced-motion support (useScrollSync)
 * - ARIA labels
 * - Focus management
 * 
 * @returns {JSX.Element} Full story viewer UI
 * 
 * @example
 * <ThemeProvider theme={getTheme('light')}>
 *   <StoryViewer />
 * </ThemeProvider>
 */
export const StoryViewer = () => {
  // ✅ State management (no map hooks here!)
  const { story, activeIndex, setActiveIndex, loading } = useStoryState();
  
  // Loading state
  if (loading) {
    return (
      <Box sx={{ height: '100vh', width: '100vw' }}>
        <LoadingSpinner message="Lädt Story..." />
      </Box>
    );
  }
  
  // Empty state
  if (!story || story.features.length === 0) {
    return (
      <Box
        sx={{
          height: '100vh',
          width: '100vw',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          p: 3
        }}
      >
        <Typography variant="h4" gutterBottom>
          MapTelling
        </Typography>
        <Typography variant="body1" color="text.secondary" align="center">
          Willkommen! Lade Fotos hoch, um deine interaktive Story zu erstellen.
        </Typography>
      </Box>
    );
  }
  
  // ✅ CRITICAL FIX: MapComponentsProvider now wraps component with map hooks
  return (
    <MapComponentsProvider>
      <StoryViewerContent
        story={story}
        activeIndex={activeIndex}
        setActiveIndex={setActiveIndex}
      />
    </MapComponentsProvider>
  );
};

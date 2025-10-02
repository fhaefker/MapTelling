import { Box, Typography, Paper } from '@mui/material';
import { MapComponentsProvider, MapLibreMap } from '@mapcomponents/react-maplibre';
import { PhotoMarkerLayer } from '../map/PhotoMarkerLayer';
import { StoryPanel } from './StoryPanel';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { useStoryState } from '../../hooks/useStoryState';
import { useScrollSync } from '../../hooks/useScrollSync';
import { useKeyboardNav } from '../../hooks/useKeyboardNav';
import { 
  WHEREGROUP_WMS_URL, 
  WHEREGROUP_HQ, 
  LAYER_IDS, 
  MAP_SETTINGS 
} from '../../lib/constants';

/**
 * StoryViewer Component
 * 
 * Main viewer layout with map and story panel.
 * 
 * ✅ MapComponents Compliant:
 * - Single MapComponentsProvider (root)
 * - Uses MapLibreMap declaratively
 * - Theme integration via parent ThemeProvider
 * - All hooks follow MapComponents patterns
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
  // ✅ Custom Hooks (Phase 2)
  const {
    story,
    geojson,
    activeIndex,
    setActiveIndex,
    loading
  } = useStoryState();
  
  const { scrollToPhoto } = useScrollSync({
    mapId: MAP_SETTINGS.mapId,
    photos: story?.features || [],
    activeIndex,
    onPhotoChange: setActiveIndex
  });
  
  useKeyboardNav({
    photos: story?.features || [],
    activeIndex,
    onNavigate: setActiveIndex,
    enabled: true
  });
  
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
  
  return (
    <MapComponentsProvider>
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
              center: geojson && geojson.features.length > 0
                ? geojson.features[0].geometry.coordinates as [number, number]
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
          {geojson && geojson.features.length > 0 && (
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
    </MapComponentsProvider>
  );
};

import { Box, Typography, Button, Stack, ToggleButtonGroup, ToggleButton, Tooltip } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import MapIcon from '@mui/icons-material/Map';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import { MapComponentsProvider, MapLibreMap } from '@mapcomponents/react-maplibre';
import { PhotoMarkerLayer } from '../map/PhotoMarkerLayer';
import { FloatingPhotoCard } from './FloatingPhotoCard';
import { LoadingSpinner } from '../shared/LoadingSpinner';
import { ShareButton } from '../shared/ShareButton';
import { VersionBadge } from '../shared/VersionBadge';
import { MapWheelController } from './MapWheelController';
import { MapTouchController } from './MapTouchController';
import { useStoryState } from '../../hooks/useStoryState';
import { useKeyboardNav } from '../../hooks/useKeyboardNav';
import { useStoryMode } from '../../hooks/useStoryMode';
import { useInitialView } from '../../hooks/useInitialView';
import { useMapScrollMode } from '../../hooks/useMapScrollMode';
import { useURLSync } from '../../hooks/useURLParams';
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
  // ✅ Story Mode State
  const { isStoryMode, isOverviewMode, startStory, returnToOverview } = useStoryMode();
  
  // ✅ Map Scroll Mode State
  const { mode: scrollMode, toggleMode } = useMapScrollMode('story');
  
  // ✅ URL Sync (Deep Links)
  useURLSync(activeIndex, setActiveIndex, story.features.length);
  
  // ✅ Initial View (BBox on load)
  useInitialView({
    mapId: MAP_SETTINGS.mapId,
    photos: story.features,
    padding: 10
  });
  
  // ✅ Keyboard Navigation (nur im Story-Modus)
  useKeyboardNav({
    photos: story.features,
    activeIndex,
    onNavigate: setActiveIndex,
    enabled: isStoryMode // ✅ Nur aktiv im Story-Modus!
  });

  return (
    <Box sx={{ height: '100%', width: '100%', display: 'flex', position: 'relative' }}>
      {/* Floating Controls */}
      <Box
        sx={{
          position: 'absolute',
          top: 16,
          right: 16,
          zIndex: 2000
        }}
      >
        <Stack spacing={1}>
          {/* Scroll Mode Toggle (nur im Story-Modus) */}
          {isStoryMode && (
            <ToggleButtonGroup
              value={scrollMode}
              exclusive
              onChange={(_, newMode) => {
                if (newMode) toggleMode();
              }}
              size="small"
              sx={{
                bgcolor: 'background.paper',
                boxShadow: 2
              }}
            >
              <ToggleButton value="story" aria-label="Story-Scroll">
                <Tooltip title="Mausrad navigiert Story" placement="left">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <MenuBookIcon fontSize="small" />
                    <Typography variant="caption">Story</Typography>
                  </Box>
                </Tooltip>
              </ToggleButton>
              
              <ToggleButton value="zoom" aria-label="Map-Zoom">
                <Tooltip title="Mausrad zoomt Karte" placement="left">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <ZoomInIcon fontSize="small" />
                    <Typography variant="caption">Zoom</Typography>
                  </Box>
                </Tooltip>
              </ToggleButton>
            </ToggleButtonGroup>
          )}

          {/* Share Button (nur im Story-Modus) */}
          {isStoryMode && (
            <ShareButton
              photoIndex={activeIndex}
              title={story.metadata.title}
              variant="contained"
              size="medium"
              fullWidth
            />
          )}
        
          {isOverviewMode && (
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={startStory}
              size="large"
              sx={{
                bgcolor: 'primary.main',
                '&:hover': {
                  bgcolor: 'primary.dark'
                }
              }}
            >
              Story-Modus starten 🎬
            </Button>
          )}
          
          {isStoryMode && (
            <Button
              variant="contained"
              startIcon={<MapIcon />}
              onClick={returnToOverview}
              size="large"
              sx={{
                bgcolor: 'secondary.main',
                '&:hover': {
                  bgcolor: 'secondary.dark'
                }
              }}
            >
              Zurück zur Übersicht
            </Button>
          )}
        </Stack>
      </Box>
    
      {/* Map (Fullscreen) */}
      <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
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
        
        {/* Map Wheel Controller */}
        <MapWheelController
          mapId={MAP_SETTINGS.mapId}
          photos={story.features}
          activeIndex={activeIndex}
          onNavigate={setActiveIndex}
          scrollMode={scrollMode}
          enabled={isStoryMode}
        />
        
        {/* Map Touch Controller (Mobile) */}
        <MapTouchController
          mapId={MAP_SETTINGS.mapId}
          photos={story.features}
          activeIndex={activeIndex}
          onNavigate={setActiveIndex}
          scrollMode={scrollMode}
          enabled={isStoryMode}
        />
        
        {/* Photo Markers */}
        {story.features.length > 0 && (
          <PhotoMarkerLayer
            mapId={MAP_SETTINGS.mapId}
            photos={story.features}
            activeIndex={isStoryMode ? activeIndex : -1} // -1 = keine Hervorhebung in Overview
            onPhotoClick={(index) => {
              // Auto-activate Story mode on marker click
              if (isOverviewMode) {
                startStory();
              }
              setActiveIndex(index);
            }}
          />
        )}
        
        {/* Floating Photo Card (nur im Story-Modus) */}
        {isStoryMode && story.features.length > 0 && (
          <FloatingPhotoCard
            photo={story.features[activeIndex]}
            photoIndex={activeIndex}
            totalPhotos={story.features.length}
            onNext={() => setActiveIndex(Math.min(activeIndex + 1, story.features.length - 1))}
            onPrevious={() => setActiveIndex(Math.max(activeIndex - 1, 0))}
            onClose={returnToOverview}
          />
        )}
        
        <VersionBadge position="bottom-left" label="Viewer" />
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

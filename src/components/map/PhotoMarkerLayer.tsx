import { useMemo } from 'react';
import { MlGeoJsonLayer } from '@mapcomponents/react-maplibre';
import type { PhotoFeature } from '../../types/story';
import { LAYER_IDS, WHEREGROUP_COLORS } from '../../lib/constants';

interface PhotoMarkerLayerProps {
  mapId: string;
  photos: PhotoFeature[];
  activeIndex: number;
  onPhotoClick?: (index: number) => void;
}

/**
 * PhotoMarkerLayer Component
 * 
 * Displays photo markers on the map with active state styling.
 * 
 * ✅ MapComponents Compliant:
 * - Uses MlGeoJsonLayer (declarative, not map.addLayer)
 * - Stable GeoJSON reference via useMemo
 * - Namespaced layerIds (LAYER_IDS.photoMarkersLayer)
 * - No conditional hooks
 * 
 * ✅ WhereGroup Principles:
 * - Configuration over Code (colors from constants)
 * - Standards-driven (GeoJSON RFC 7946)
 * 
 * ✅ Upstream-ready:
 * - Generalized pattern (not app-specific)
 * - Can be contributed to @mapcomponents/react-maplibre
 * 
 * @param {PhotoMarkerLayerProps} props - Component props
 * @returns {JSX.Element} Two MlGeoJsonLayer components (markers + glow)
 * 
 * @example
 * <PhotoMarkerLayer
 *   mapId="main"
 *   photos={story.features}
 *   activeIndex={2}
 *   onPhotoClick={(index) => scrollToPhoto(index)}
 * />
 */
export const PhotoMarkerLayer = ({
  mapId,
  photos,
  activeIndex,
  onPhotoClick
}: PhotoMarkerLayerProps) => {
  // ✅ CRITICAL: Stable GeoJSON reference via useMemo
  const geojson = useMemo(() => ({
    type: 'FeatureCollection' as const,
    features: photos
  }), [photos]);
  
  // ✅ Stable paint options via useMemo (type-safe MapLibre expressions)
  const markerPaint = useMemo(() => ({
    'circle-radius': [
      'case',
      ['==', ['get', 'order'], activeIndex],
      12,  // Active marker größer
      8    // Inactive marker
    ] as any,
    'circle-color': [
      'case',
      ['==', ['get', 'order'], activeIndex],
      WHEREGROUP_COLORS.orange,  // Active: Orange
      WHEREGROUP_COLORS.blue.primary  // Inactive: Blue
    ] as any,
    'circle-stroke-width': 2,
    'circle-stroke-color': WHEREGROUP_COLORS.white,
    'circle-opacity': 1
  }), [activeIndex]);
  
  // ✅ Glow effect for active marker (type-safe MapLibre expressions)
  const glowPaint = useMemo(() => ({
    'circle-radius': [
      'case',
      ['==', ['get', 'order'], activeIndex],
      20,  // Glow radius
      0    // No glow for inactive
    ] as any,
    'circle-color': WHEREGROUP_COLORS.orange,
    'circle-opacity': 0.3,
    'circle-blur': 1
  }), [activeIndex]);
  
  // Click handler
  const handleClick = (event: any) => {
    if (!onPhotoClick) return;
    
    const features = event.features;
    if (features && features.length > 0) {
      const clickedIndex = features[0].properties.order;
      onPhotoClick(clickedIndex);
    }
  };
  
  return (
    <>
      {/* Glow Layer (beneath markers) */}
      <MlGeoJsonLayer
        mapId={mapId}
        layerId={LAYER_IDS.photoMarkersGlowLayer}
        geojson={geojson}
        options={{
          type: 'circle',
          paint: glowPaint
        }}
      />
      
      {/* Marker Layer */}
      <MlGeoJsonLayer
        mapId={mapId}
        layerId={LAYER_IDS.photoMarkersLayer}
        geojson={geojson}
        options={{
          type: 'circle',
          paint: markerPaint
        }}
        onClick={handleClick}
      />
    </>
  );
};

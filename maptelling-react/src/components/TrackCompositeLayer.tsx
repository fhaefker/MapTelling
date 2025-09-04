import { useEffect } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';
import type { FeatureCollection, LineString } from 'geojson';

interface TrackCompositeLayerProps {
  mapId: string;
  data: FeatureCollection<LineString> | null;
  sourceId?: string;
  mainLayerId?: string;
  glowLayerId?: string;
  color?: string;
}

// Combines source + two style layers (main + glow) to avoid duplicate sources (optimisation vs two MlGeoJsonLayer instances)
export const TrackCompositeLayer = ({
  mapId,
  data,
  sourceId = 'track-source',
  mainLayerId = 'track-main',
  glowLayerId = 'track-glow',
  color = '#ff6b6b',
}: TrackCompositeLayerProps) => {
  const { map } = useMap({ mapId });

  useEffect(() => {
    if (!map?.map || !data) return;
    const m = map.map;

    // Add / update source
    if (m.getSource(sourceId)) {
      const s: any = m.getSource(sourceId);
      try { s.setData(data as any); } catch { /* ignore */ }
    } else {
      m.addSource(sourceId, { type: 'geojson', data });
    }

    // Helper ensure layer
    const ensureLayer = (layerId: string, paint: any, beforeId?: string) => {
      if (!m.getLayer(layerId)) {
        m.addLayer({
          id: layerId,
            type: 'line',
          source: sourceId,
          paint,
        }, beforeId);
      } else {
        Object.entries(paint).forEach(([k,v]) => {
          try { m.setPaintProperty(layerId, k, v as any); } catch { /* ignore */ }
        });
      }
    };

    ensureLayer(glowLayerId, {
      'line-color': color,
      'line-width': 8,
      'line-opacity': 0.3,
      'line-blur': 2,
    });
    ensureLayer(mainLayerId, {
      'line-color': color,
      'line-width': 4,
      'line-opacity': 0.8,
    }, glowLayerId);

    return () => {
      // Cleanup only if map still valid
      try {
        if (m.getLayer(mainLayerId)) m.removeLayer(mainLayerId);
        if (m.getLayer(glowLayerId)) m.removeLayer(glowLayerId);
        if (m.getSource(sourceId)) m.removeSource(sourceId);
      } catch { /* ignore */ }
    };
  }, [map?.map, data, sourceId, mainLayerId, glowLayerId, color]);

  return null;
};

export default TrackCompositeLayer;

import React, { useMemo } from 'react';
import { MlGeoJsonLayer } from '@mapcomponents/react-maplibre';
import type { FeatureCollection, Point } from 'geojson';
import { useChapters } from '../context/ChaptersContext';

interface MarkerLayerProps {
  mapId: string;
  activeChapterId?: string;
}

const MarkerLayer: React.FC<MarkerLayerProps> = ({ mapId, activeChapterId }) => {
  const { chapters } = useChapters();
  const { baseData, activeData } = useMemo(() => {
    const features = chapters
      .filter((c) => c.marker)
      .map((c) => ({
        type: 'Feature' as const,
        id: c.id,
        properties: { id: c.id },
        geometry: {
          type: 'Point' as const,
          coordinates: c.marker!.coordinates,
        },
      }));
    const baseData: FeatureCollection<Point> = { type: 'FeatureCollection', features };
    const activeFeature = features.find((f) => f.id === activeChapterId);
    const activeData: FeatureCollection<Point> = {
      type: 'FeatureCollection',
      features: activeFeature ? [activeFeature] : [],
    };
    return { baseData, activeData };
  }, [activeChapterId, chapters]);

  if (baseData.features.length === 0) return null;

  return (
    <>
      <MlGeoJsonLayer
        mapId={mapId}
        geojson={baseData}
        type="circle"
        layerId="markers-base"
        defaultPaintOverrides={{
          circle: {
            'circle-color': '#1e90ff',
            'circle-radius': 6,
            'circle-opacity': 0.6,
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 1,
          },
        }}
      />
      <MlGeoJsonLayer
        mapId={mapId}
        geojson={activeData}
        type="circle"
        layerId="markers-active"
        insertBeforeLayer="markers-base"
        defaultPaintOverrides={{
          circle: {
            'circle-color': '#ff6b6b',
            'circle-radius': 9,
            'circle-opacity': 0.9,
            'circle-stroke-color': '#fff',
            'circle-stroke-width': 2,
          },
        }}
      />
    </>
  );
};

export default MarkerLayer;

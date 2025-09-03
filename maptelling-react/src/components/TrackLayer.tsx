import React, { useEffect } from 'react';
import { Map } from 'maplibre-gl';
import { FeatureCollection, LineString } from 'geojson';

interface TrackLayerProps {
  map: Map;
  trackData: FeatureCollection<LineString>;
}

const TrackLayer: React.FC<TrackLayerProps> = ({ map, trackData }) => {
  useEffect(() => {
    if (!map || !trackData) return;

    // Add track source
    if (!map.getSource('track')) {
      map.addSource('track', {
        type: 'geojson',
        data: trackData,
      });
    }

    // Add track line layer
    if (!map.getLayer('track-line')) {
      map.addLayer({
        id: 'track-line',
        type: 'line',
        source: 'track',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ff6b6b',
          'line-width': 4,
          'line-opacity': 0.8,
        },
      });
    }

    // Add track line glow
    if (!map.getLayer('track-glow')) {
      map.addLayer({
        id: 'track-glow',
        type: 'line',
        source: 'track',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': '#ff6b6b',
          'line-width': 8,
          'line-opacity': 0.3,
          'line-blur': 2,
        },
      }, 'track-line');
    }

    return () => {
      // Cleanup layers on unmount
      if (map.getLayer('track-line')) {
        map.removeLayer('track-line');
      }
      if (map.getLayer('track-glow')) {
        map.removeLayer('track-glow');
      }
      if (map.getSource('track')) {
        map.removeSource('track');
      }
    };
  }, [map, trackData]);

  return null; // This component doesn't render anything visible
};

export default TrackLayer;

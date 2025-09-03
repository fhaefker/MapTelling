import React, { useEffect } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';

export interface TerrainConfig {
  enabled?: boolean;
  // Either provide a tiles template array or a URL to a style/source
  tiles?: string[]; // e.g. ["https://api.maptiler.com/tiles/terrain-rgb-v2/{z}/{x}/{y}.png?key=YOUR_KEY"]
  url?: string; // e.g. "https://demotiles.maplibre.org/terrain.json" (only if compatible)
  tileSize?: 256 | 512;
  exaggeration?: number; // default ~1.5
}

interface TerrainManagerProps {
  mapId: string;
  config?: TerrainConfig;
}

const TerrainManager: React.FC<TerrainManagerProps> = ({ mapId, config }) => {
  const { map } = useMap({ mapId });

  useEffect(() => {
    if (!map?.map || !config?.enabled) return;

    const m = map.map;
    const sourceId = 'terrain-dem';
    const exaggeration = config.exaggeration ?? 1.5;

    const onLoad = () => {
      if (!m.getSource(sourceId)) {
        if (config.url) {
          m.addSource(sourceId, {
            type: 'raster-dem',
            url: config.url,
            tileSize: config.tileSize ?? 512,
            maxzoom: 14,
          } as any);
        } else if (config.tiles) {
          m.addSource(sourceId, {
            type: 'raster-dem',
            tiles: config.tiles,
            tileSize: config.tileSize ?? 512,
            maxzoom: 14,
          } as any);
        } else {
          // No valid source provided
          return;
        }
      }
      try {
        m.setTerrain({ source: sourceId, exaggeration });
      } catch (_) {
        // ignore if terrain fails
      }
    };

    if (m.loaded()) onLoad();
    else m.once('load', onLoad);

    return () => {
      try {
        m.setTerrain(null as any);
        if (m.getSource(sourceId)) {
          m.removeSource(sourceId);
        }
      } catch (_) {
        // ignore cleanup errors
      }
    };
  }, [map?.map, config?.enabled]);

  return null;
};

export default TerrainManager;

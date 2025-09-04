import React, { useEffect } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';

export interface MlTerrainProps {
  mapId: string;
  enabled?: boolean;
  exaggeration?: number;
  url?: string; // style/source URL with raster-dem source
  tiles?: string[]; // template tiles array
  tileSize?: 256 | 512;
  sourceId?: string;
  maxzoom?: number;
  encoding?: 'terrarium' | 'mapbox';
}

// Declarative terrain toggle component (candidate upstream: RFC_07)
export const MlTerrain: React.FC<MlTerrainProps> = ({
  mapId,
  enabled = true,
  exaggeration = 1.5,
  url,
  tiles,
  tileSize = 512,
  sourceId = 'terrain-dem',
  maxzoom = 14,
  encoding,
}) => {
  const { map } = useMap({ mapId });

  useEffect(() => {
    if (!map?.map) return;
    const m = map.map;
    if (!enabled) {
      try { m.setTerrain(null as any); } catch(_){}
      return;
    }
    const onLoad = () => {
      // Some Jest/jsdom mocks might not implement full MapLibre API; guard defensively
      const hasGetSource = typeof (m as any).getSource === 'function';
      const hasAddSource = typeof (m as any).addSource === 'function';
      const hasSetTerrain = typeof (m as any).setTerrain === 'function';
      if (!hasGetSource || !hasAddSource || !hasSetTerrain) {
        // In tests we just silently skip; real app will have full API
        return;
      }
      if (!(m as any).getSource(sourceId)) {
        if (url) {
          (m as any).addSource(sourceId, { type: 'raster-dem', url, tileSize, maxzoom, encoding } as any);
        } else if (tiles) {
          (m as any).addSource(sourceId, { type: 'raster-dem', tiles, tileSize, maxzoom, encoding } as any);
        } else {
          return; // nothing to enable
        }
      }
      try { (m as any).setTerrain({ source: sourceId, exaggeration }); } catch(_){ }
    };
    if (m.loaded()) onLoad(); else m.once('load', onLoad);
    return () => {
      try { m.setTerrain(null as any); } catch(_){}
      // keep source in map to allow quick re-enable; do not remove automatically
    };
  }, [map?.map, enabled, url, tiles, exaggeration, tileSize, sourceId, maxzoom]);

  return null;
};

export default MlTerrain;
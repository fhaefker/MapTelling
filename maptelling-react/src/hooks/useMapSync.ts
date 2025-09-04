import { useEffect } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';

export interface UseMapSyncOptions {
  sources: string[];           // mapIds to sync (first is primary reference)
  mode?: 'broadcast' | 'ring'; // strategy (currently only broadcast implemented)
  predicate?: () => boolean;   // optional guard
}

// Minimal multi-map sync (LT-09 prototype)
export const useMapSync = ({ sources, mode = 'broadcast', predicate }: UseMapSyncOptions) => {
  // fetch maps
  const maps = sources.map(id => useMap({ mapId: id }));

  useEffect(() => {
    const mapObjs = maps.map(m => m.map?.map).filter(Boolean) as any[];
    if (mapObjs.length < 2) return; // need at least two
    let scheduling = false;
    const applyToAll = (origin: any) => {
      if (predicate && !predicate()) return;
      const center = origin.getCenter();
      const zoom = origin.getZoom();
      const bearing = origin.getBearing();
      const pitch = origin.getPitch();
      mapObjs.forEach(m => { if (m !== origin) m.jumpTo({ center, zoom, bearing, pitch }); });
    };
    const handler = (origin: any) => () => {
      if (scheduling) return; // rudimentary throttle
      scheduling = true;
      requestAnimationFrame(() => { scheduling = false; applyToAll(origin); });
    };
    const listeners: Array<{m:any; fn: () => void}> = [];
    mapObjs.forEach(m => {
      const fn = handler(m);
      m.on && m.on('move', fn);
      listeners.push({ m, fn });
    });
    return () => {
      listeners.forEach(({m, fn}) => { m.off && m.off('move', fn); });
    };
  }, [sources.map(s=>s).join('|'), predicate]);
};

export default useMapSync;

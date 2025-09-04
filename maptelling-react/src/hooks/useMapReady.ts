import { useEffect, useState } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';

export interface UseMapReadyOptions { mapId: string; }

/**
 * useMapReady
 * Lightweight convenience hook wrapping MapComponents `useMap` to expose a `ready` boolean
 * once the underlying MapLibre style has loaded. Intended as an upstream candidate.
 * - Returns the original map context plus `ready`.
 * - Subscribes to `load` event; if already loaded, sets `ready` immediately.
 */
export function useMapReady({ mapId }: UseMapReadyOptions) {
  const mapCtx: any = useMap({ mapId });
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const core = mapCtx.map?.map; // MapLibre instance
    if (!core) return;
    // Heuristic: MapLibre sets _loaded true after style load
    if ((core as any)._loaded) {
      setReady(true);
      return;
    }
    const onLoad = () => setReady(true);
    core.on && core.on('load', onLoad);
    return () => { core.off && core.off('load', onLoad); };
  }, [mapCtx.map]);

  return { ...mapCtx, ready };
}

export default useMapReady;

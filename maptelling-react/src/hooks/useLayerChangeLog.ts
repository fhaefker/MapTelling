import { useEffect, useRef, useState } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';

export interface LayerChangeEntry {
  ts: number;
  action: 'add' | 'remove' | 'update';
  id: string;
  type?: string;
}

export interface UseLayerChangeLogOptions {
  mapId: string;
  limit?: number;
}

export const useLayerChangeLog = ({ mapId, limit = 200 }: UseLayerChangeLogOptions) => {
  const { map } = useMap({ mapId });
  const [log, setLog] = useState<LayerChangeEntry[]>([]);
  const logRef = useRef<LayerChangeEntry[]>([]);

  useEffect(() => {
    if (!map) return;
    const wrapper: any = map;
    const push = (entry: LayerChangeEntry) => {
      logRef.current = [...logRef.current, entry].slice(-limit);
      setLog(logRef.current);
    };
    const onAddLayer = (payload: any) => push({ ts: performance.now(), action: 'add', id: payload?.layer_id || 'unknown' });
    const onLayerChange = () => push({ ts: performance.now(), action: 'update', id: '*' });
    wrapper.on?.('addlayer', onAddLayer);
    wrapper.on?.('layerchange', onLayerChange);
    return () => {
      wrapper.off?.('addlayer', onAddLayer);
      wrapper.off?.('layerchange', onLayerChange);
    };
  }, [map, limit]);

  return { log };
};

export default useLayerChangeLog;

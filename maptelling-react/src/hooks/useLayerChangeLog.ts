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
  const layerTypesRef = useRef<Record<string, string | undefined>>({});

  useEffect(() => {
    if (!map) return;
    const wrapper: any = map;
    const push = (entry: LayerChangeEntry) => {
      logRef.current = [...logRef.current, entry].slice(-limit);
      setLog(logRef.current);
    };
    const onAddLayer = (payload: any) => {
      const id = payload?.layer_id || payload?.id || 'unknown';
      const type = payload?.layer_type || payload?.type;
      if (id && type) layerTypesRef.current[id] = type;
      push({ ts: performance.now(), action: 'add', id, type });
    };
    const onRemoveLayer = (payload: any) => {
      const id = payload?.layer_id || payload?.id || 'unknown';
      const type = layerTypesRef.current[id];
      push({ ts: performance.now(), action: 'remove', id, type });
      delete layerTypesRef.current[id];
    };
    const onLayerChange = (payload: any) => {
      const id = payload?.layer_id || payload?.id || '*';
      const type = layerTypesRef.current[id];
      push({ ts: performance.now(), action: 'update', id, type });
    };
    wrapper.on?.('addlayer', onAddLayer);
    wrapper.on?.('removelayer', onRemoveLayer);
    wrapper.on?.('layerchange', onLayerChange);
    return () => {
      wrapper.off?.('addlayer', onAddLayer);
      wrapper.off?.('removelayer', onRemoveLayer);
      wrapper.off?.('layerchange', onLayerChange);
    };
  }, [map, limit]);

  return { log };
};

export default useLayerChangeLog;

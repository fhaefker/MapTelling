import { useEffect, useRef, useState } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';

export interface ViewportMetricsOptions { mapId: string; sampleIntervalMs?: number; }
export interface ViewportSample { t:number; center:[number,number]; zoom:number; bearing:number; pitch:number; }

export const useViewportMetrics = ({ mapId, sampleIntervalMs = 1000 }: ViewportMetricsOptions) => {
  const { map } = useMap({ mapId });
  const [samples, setSamples] = useState<ViewportSample[]>([]);
  const timerRef = useRef<any>(null);
  useEffect(()=>{
    if(!map?.map) return;
    const collect = () => {
      try {
        const c = map.map.getCenter();
        setSamples(s => [...s.slice(-29), { t: Date.now(), center:[c.lng,c.lat], zoom: map.map.getZoom(), bearing: map.map.getBearing(), pitch: map.map.getPitch() }]);
      } catch {}
    };
    collect();
    timerRef.current = setInterval(collect, sampleIntervalMs);
    return () => { clearInterval(timerRef.current); };
  }, [map?.map, sampleIntervalMs]);
  return { samples };
};

export default useViewportMetrics;
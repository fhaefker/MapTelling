import { useEffect, useRef } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';

/**
 * usePerformanceInstrumentation
 * Lightweight instrumentation hook aligned with capabilities section 56.
 * Measures:
 *  - Time from mount to first map load event.
 *  - Layer mutation intervals (wrapper 'layerchange').
 *  - Optional FPS sampling window during camera animation.
 */
export interface UsePerformanceInstrumentationOptions {
  mapId: string;
  onMetrics?: (m: Record<string, number>) => void;
  sampleFpsDuringMs?: number; // if set, sample rAF deltas for the given ms after load
}

export const usePerformanceInstrumentation = ({ mapId, onMetrics, sampleFpsDuringMs = 0 }: UsePerformanceInstrumentationOptions) => {
  const { map } = useMap({ mapId });
  const t0Ref = useRef<number>(performance.now());
  const metricsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!map) return;
    const wrapper: any = map; // wrapper event bus
  const underlying = map.map as any; // MapLibre Map
    const onLoad = () => {
      metricsRef.current['time_to_load_ms'] = performance.now() - t0Ref.current;
      if (sampleFpsDuringMs > 0) {
        const start = performance.now();
        let frames = 0; let last = start;
        const loop = () => {
          frames++; const now = performance.now();
          if (now - start < sampleFpsDuringMs) {
            last = now; requestAnimationFrame(loop);
          } else {
            metricsRef.current['avg_fps_window'] = frames / ((now - start)/1000);
            onMetrics?.({ ...metricsRef.current });
          }
        };
        requestAnimationFrame(loop);
      } else {
        onMetrics?.({ ...metricsRef.current });
      }
    };
    const onLayerChange = () => {
      // naive count of layer changes
      metricsRef.current['layerchange_events'] = (metricsRef.current['layerchange_events'] || 0) + 1;
    };
    if (underlying && typeof underlying.loaded === 'function') {
      if (underlying.loaded()) onLoad(); else underlying.once?.('load', onLoad);
    } else {
      // test/mock environment fallback
      onLoad();
    }
    // wrapper event bus layerchange
    wrapper.on?.('layerchange', onLayerChange);
    return () => { wrapper.off?.('layerchange', onLayerChange); };
  }, [map, onMetrics, sampleFpsDuringMs]);
};

export default usePerformanceInstrumentation;

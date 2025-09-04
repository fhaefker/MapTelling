import { useEffect, useRef } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';

/**
 * useViewportSync
 * One-way or bi-directional viewport synchronization between two maps.
 * - Throttles updates via requestAnimationFrame.
 * - Idempotent: ignores self-originated updates with a token.
 */
export interface UseViewportSyncOptions {
  sourceMapId: string;
  targetMapId: string;
  bidirectional?: boolean;
  /** Optional predicate to decide if sync should occur (e.g., only when not interacting). */
  shouldSync?: () => boolean;
}
export const useViewportSync = ({ sourceMapId, targetMapId, bidirectional = false, shouldSync }: UseViewportSyncOptions) => {
  const source = useMap({ mapId: sourceMapId });
  const target = useMap({ mapId: targetMapId });
  const frameRef = useRef<number | null>(null);
  const lockRef = useRef<string | null>(null);

  useEffect(() => {
  const sm = source.map?.map as any; const tm = target.map?.map as any;
  if (!sm || !tm || typeof sm.on !== 'function') return; // mock environment guard

    const apply = (origin: 'source'|'target') => {
      if (shouldSync && !shouldSync()) return;
      const from = origin === 'source' ? sm : tm;
      const to = origin === 'source' ? tm : sm;
      if (!from || !to) return;
      // Prevent feedback loop
      if (lockRef.current === origin) return;
      lockRef.current = origin;
      const c = from.getCenter();
      to.jumpTo({ center: c, zoom: from.getZoom(), bearing: from.getBearing(), pitch: from.getPitch() });
      // release after a frame
      requestAnimationFrame(() => { if (lockRef.current === origin) lockRef.current = null; });
    };

    const schedule = (origin: 'source'|'target') => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      frameRef.current = requestAnimationFrame(() => apply(origin));
    };

    const onSourceMove = () => schedule('source');
    const onTargetMove = () => schedule('target');

  sm.on && sm.on('move', onSourceMove);
  if (bidirectional && tm.on) tm.on('move', onTargetMove);

    // initial sync source->target
    apply('source');

    return () => {
  sm.off && sm.off('move', onSourceMove);
  if (bidirectional && tm.off) tm.off('move', onTargetMove);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [source.map, target.map, bidirectional, shouldSync]);
};

export default useViewportSync;

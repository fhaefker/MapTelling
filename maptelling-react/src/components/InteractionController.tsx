import { useEffect, useRef } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';

/**
 * InteractionController (Proposal #2 implementation)
 * Unified, idempotent enabling/disabling of map interaction handlers.
 * Responsibilities:
 *  - Toggle a defined set (or subset) of interaction handlers based on `enabled`.
 *  - Support partial mode selection with per-mode desired state when enabled.
 *  - Avoid redundant enable/disable calls (checks current state via handler.isEnabled()).
 *  - Optional `temporary` restoration of original handler states on unmount.
 *
 * Modes covered: scrollZoom, dragPan, keyboard, doubleClickZoom, touchZoomRotate.
 */
export interface InteractionControllerProps {
  mapId: string;
  /** Master enable/disable flag */
  enabled: boolean;
  /** Optional subset + desired state mapping when enabled (true=>should be enabled, false=>forced disabled). Unspecified handlers are ignored (left unchanged). */
  modes?: {
    scrollZoom?: boolean;
    dragPan?: boolean;
    keyboard?: boolean;
    doubleClickZoom?: boolean;
    touchZoomRotate?: boolean;
  };
  /** If true, restore original handler states on unmount */
  temporary?: boolean;
}

type HandlerName = 'scrollZoom' | 'dragPan' | 'keyboard' | 'doubleClickZoom' | 'touchZoomRotate';
const ALL_HANDLERS: HandlerName[] = ['scrollZoom', 'dragPan', 'keyboard', 'doubleClickZoom', 'touchZoomRotate'];

export const InteractionController = ({ mapId, enabled, modes, temporary = false }: InteractionControllerProps) => {
  const { map } = useMap({ mapId });
  const originalStatesRef = useRef<Record<HandlerName, boolean> | null>(null);

  useEffect(() => {
    if (!map?.map) return;
    const m = map.map as any;

    const targetHandlers: HandlerName[] = modes
      ? (ALL_HANDLERS.filter(h => Object.prototype.hasOwnProperty.call(modes, h)) as HandlerName[])
      : ALL_HANDLERS;

    if (!originalStatesRef.current) {
      // Capture initial states only once for targeted handlers
      originalStatesRef.current = ALL_HANDLERS.reduce((acc, h) => {
        const handler = m[h];
        if (handler && typeof handler.isEnabled === 'function') {
          acc[h] = handler.isEnabled();
        } else {
          acc[h] = true; // assume enabled if introspection unavailable
        }
        return acc;
      }, {} as Record<HandlerName, boolean>);
    }

    // For each targeted handler decide desired state now
    targetHandlers.forEach(h => {
      const handler = m[h];
      if (!handler) return;
      const current = typeof handler.isEnabled === 'function' ? handler.isEnabled() : undefined;
      const desiredWhenEnabled = modes && Object.prototype.hasOwnProperty.call(modes, h) ? modes[h as HandlerName] !== false : true;
      const desired = enabled ? desiredWhenEnabled : false;
      if (current === desired) return; // idempotent guard
      if (desired) handler.enable(); else handler.disable();
    });

    return () => {
      if (!temporary || !map?.map || !originalStatesRef.current) return;
      // Restore original states for handlers we touched (targetHandlers)
      targetHandlers.forEach(h => {
        const handler = m[h];
        if (!handler) return;
        const original = originalStatesRef.current![h];
        const current = typeof handler.isEnabled === 'function' ? handler.isEnabled() : undefined;
        if (current === original) return;
        if (original) handler.enable(); else handler.disable();
      });
    };
  }, [map?.map, enabled, modes, temporary]);

  return null;
};

export default InteractionController;

import { useLayoutEffect, useRef, useState } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';

export interface ViewportEventLogEntry { t:number; type:string; zoom:number; }
export const useViewportEventLog = ({ mapId, limit=100 }: { mapId:string; limit?:number }) => {
  const { map } = useMap({ mapId });
  const [events, setEvents] = useState<ViewportEventLogEntry[]>([]);
  const ref = useRef<ViewportEventLogEntry[]>([]);
  // useLayoutEffect so the listener is attached synchronously after commit,
  // ensuring tests (which call jumpTo/flyTo right after render) don't miss early events.
  useLayoutEffect(()=>{
    if(!map) return;
    const handler = (e:any) => {
      const zoom = map.map?.getZoom?.() ?? 0;
      const entry:ViewportEventLogEntry = { t: Date.now(), type: e?.type || 'viewportchange', zoom };
      ref.current = [...ref.current, entry].slice(-limit);
      setEvents(ref.current);
    };
    map.on?.('viewportchange', handler);
    return () => { map.off?.('viewportchange', handler); };
  }, [map, limit]);
  return { events };
};
export default useViewportEventLog;

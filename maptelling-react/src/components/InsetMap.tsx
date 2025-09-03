import React, { useEffect } from 'react';
import { MapLibreMap, useMap } from '@mapcomponents/react-maplibre';
import { config } from '../config/mapConfig';

interface InsetMapProps {
  mainMapId: string;
  insetMapId?: string;
}

const InsetMap: React.FC<InsetMapProps> = ({ mainMapId, insetMapId = 'inset-map' }) => {
  const mainHook = useMap({ mapId: mainMapId });
  const insetHook = useMap({ mapId: insetMapId });

  useEffect(() => {
    if (!mainHook.map || !insetHook.map) return;
    const main = mainHook.map.map;
    const inset = insetHook.map.map;

    const sync = () => {
      const center = main.getCenter();
      const zoom = Math.max((main.getZoom() ?? 5) - 3.5, 2); // inset zoomed out
      inset.jumpTo({ center, zoom, bearing: 0, pitch: 0 });
    };

    const debounced = () => {
      // simple debounce via requestAnimationFrame
      requestAnimationFrame(sync);
    };

    main.on('move', debounced);
    sync();

    return () => {
      main.off('move', debounced);
    };
  }, [mainHook.map, insetHook.map]);

  return (
    <div
      style={{
        position: 'fixed',
        right: 24,
        bottom: 24,
        width: 260,
        height: 180,
        borderRadius: 8,
        overflow: 'hidden',
        boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
        zIndex: 6,
      }}
    >
      <MapLibreMap
        mapId={insetMapId}
        options={{
          style: config.style,
          center: config.chapters[0].location.center,
          zoom: Math.max(config.chapters[0].location.zoom - 4, 2),
          interactive: false,
          attributionControl: false,
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
};

export default InsetMap;

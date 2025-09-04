import React, { useEffect, useState } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';

interface WmsOverlayProps {
  mapId: string;
  layer: string | null;
  attribution: string | undefined;
  baseUrl: string;
}

// Lightweight overlay showing WMS layer + attribution + rudimentary tile error count.
// No caching (explicitly avoided per user request).
const WmsOverlay: React.FC<WmsOverlayProps> = ({ mapId, layer, attribution, baseUrl }) => {
  const { map } = useMap({ mapId });
  const [errors, setErrors] = useState<number>(0);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    if (!map) return;
    const handler = (e: any) => {
      // MapLibre error events are broad; filter to WMS tile fetch hints
      const msg = e?.error?.message || '';
      if (msg && msg.includes('GetMap')) {
        setErrors(c => c + 1);
        setLastError(msg.slice(0, 160));
      }
    };
    map.on('error', handler);
    return () => { map.off('error', handler); };
  }, [map]);

  return (
    <div style={{ position:'fixed', bottom:4, right:4, zIndex:30, fontSize:11, fontFamily:'system-ui, sans-serif', color:'#fff' }}>
      <div style={{ background:'rgba(0,0,0,0.55)', padding:'4px 8px', borderRadius:4, lineHeight:1.3, maxWidth:260 }}>
        <div><strong>WMS</strong> {layer || '…'}</div>
        {attribution && <div style={{ opacity:0.85 }}>{attribution}</div>}
        <div style={{ opacity:0.7 }}>Host: {new URL(baseUrl).host}</div>
        {errors > 0 && (
          <div style={{ marginTop:4, color:'#ffb347' }}>Tile Errors: {errors}{lastError && <details style={{ marginTop:2 }}><summary style={{ cursor:'pointer' }}>Details</summary><code style={{ whiteSpace:'pre-wrap' }}>{lastError}</code></details>}</div>
        )}
      </div>
    </div>
  );
};

export default WmsOverlay;

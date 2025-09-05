import { useEffect } from 'react';
import { config } from '../config/mapConfig';

interface UseHillshadeBackgroundParams {
  map: any | undefined;
  enabled: boolean;
  exaggeration: number; // hillshade-exaggeration value (linked to terrain slider)
}

/**
 * useHillshadeBackground
 * Handles switching between WMS raster base and DEM hillshade overlay.
 * Safe against partially mocked map objects (unit test compatibility).
 */
export const useHillshadeBackground = ({ map, enabled, exaggeration }: UseHillshadeBackgroundParams) => {
  useEffect(() => {
    const m: any = map?.map || map; // support raw maplibre instance or wrapper
  if (!m) return;
  if (!config.terrain?.tiles) return; // no DEM configured
  const wmsLayerId = 'wms-base';
  const hillshadeId = 'dem-hillshade';
  // Add hillshade only after raster-dem source exists; keep WMS visible until hillshade ready.
    const safeLayerApis = typeof m.getLayer === 'function' && typeof m.setLayoutProperty === 'function';
  const safePaintApi = typeof m.setPaintProperty === 'function';

  const apply = () => {
  const haveSource = m.getSource && m.getSource('terrain-dem');
  // (debug logging removed for production cleanliness)
  if (haveSource && safeLayerApis && !m.getLayer(hillshadeId) && typeof m.addLayer === 'function') {
  // (debug logging removed)
        try { m.addLayer({ id: hillshadeId, type: 'hillshade', source: 'terrain-dem', paint: { 'hillshade-exaggeration': exaggeration }, layout:{ visibility: enabled ? 'visible':'none' } }); } catch {/* ignore */}
      }
      if (enabled) {
        if (haveSource && safeLayerApis) {
          try {
            // Only hide WMS when hillshade layer exists
            if (m.getLayer(hillshadeId)) {
              if (m.getLayer(wmsLayerId)) m.setLayoutProperty(wmsLayerId, 'visibility', 'none');
              m.setLayoutProperty(hillshadeId, 'visibility', 'visible');
              if (safePaintApi) {
                try { m.setPaintProperty(hillshadeId, 'hillshade-exaggeration', exaggeration); } catch {/* ignore */}
              }
            } else {
              if (m.getLayer(wmsLayerId)) m.setLayoutProperty(wmsLayerId, 'visibility', 'visible');
            }
          } catch {/* ignore */}
        } else if (typeof m.on === 'function') {
          const onData = () => {
            if (m.getSource && m.getSource('terrain-dem')) { apply(); }
          };
            m.on('sourcedata', onData);
          return () => { m.off && m.off('sourcedata', onData); };
        }
      } else if (safeLayerApis) {
        try {
          if (m.getLayer(wmsLayerId)) m.setLayoutProperty(wmsLayerId, 'visibility', 'visible');
          if (m.getLayer(hillshadeId)) m.setLayoutProperty(hillshadeId, 'visibility', 'none');
        } catch {/* ignore */}
      }
    };
    const cleanup = apply();
    // If source not yet there, poll a few times (lightweight) then stop.
  if(!m.getSource('terrain-dem') && enabled){
      let attempts = 0;
      const iv = setInterval(()=>{
        attempts++;
  // (debug logging removed)
  if(m.getSource('terrain-dem')) { apply(); clearInterval(iv); }
        if(attempts>20) clearInterval(iv);
      }, 250);
      return () => { clearInterval(iv); typeof cleanup === 'function' && cleanup(); };
    }
    return () => { typeof cleanup === 'function' && cleanup(); };
  }, [map, enabled, exaggeration]);
};

export default useHillshadeBackground;

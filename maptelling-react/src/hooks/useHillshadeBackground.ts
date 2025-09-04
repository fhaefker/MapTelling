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
    if (!config.terrain?.tiles) return; // no real DEM configured
    const wmsLayerId = 'wms-base';
    const hillshadeId = 'dem-hillshade';
    const safeLayerApis = typeof m.getLayer === 'function' && typeof m.setLayoutProperty === 'function';
  const safePaintApi = typeof m.setPaintProperty === 'function';

    const apply = () => {
      const haveSource = m.getSource && m.getSource('terrain-dem');
      if (haveSource && safeLayerApis && !m.getLayer(hillshadeId) && typeof m.addLayer === 'function') {
        try { m.addLayer({ id: hillshadeId, type: 'hillshade', source: 'terrain-dem', paint: { 'hillshade-exaggeration': exaggeration } }, wmsLayerId); } catch {/* ignore */}
      }
      if (enabled) {
        if (haveSource && safeLayerApis) {
          try {
            if (m.getLayer(wmsLayerId)) m.setLayoutProperty(wmsLayerId, 'visibility', 'none');
            if (m.getLayer(hillshadeId)) m.setLayoutProperty(hillshadeId, 'visibility', 'visible');
            if (m.getLayer(hillshadeId) && safePaintApi) {
              try { m.setPaintProperty(hillshadeId, 'hillshade-exaggeration', exaggeration); } catch {/* ignore */}
            }
          } catch {/* ignore */}
        } else if (typeof m.on === 'function') {
          const onData = () => {
            if (m.getSource && m.getSource('terrain-dem')) { apply(); m.off && m.off('sourcedata', onData); }
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
    return () => { typeof cleanup === 'function' && cleanup(); };
  }, [map, enabled, exaggeration]);
};

export default useHillshadeBackground;

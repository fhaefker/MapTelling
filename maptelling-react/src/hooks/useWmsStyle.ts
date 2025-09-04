import { useEffect, useState } from 'react';
import { config } from '../config/mapConfig';
import { fetchWmsCapabilities, chooseOsmLayer } from '../utils/wms';

interface WmsStyleResult {
  styleObject: any | null;
  wmsLayerName: string | null;
}

/**
 * useWmsStyle
 * Builds a minimal raster style for the configured WMS endpoint (vector tiles removed in refactor).
 * Encapsulates async capability negotiation + cancellation handling.
 */
export const useWmsStyle = (): WmsStyleResult => {
  const [styleObject, setStyleObject] = useState<any | null>(null);
  const [wmsLayerName, setWmsLayerName] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const wms = (config as any).wms as { baseUrl: string; version: '1.1.1'|'1.3.0'; layers: string; format?: string; attribution?: string };
    const preferred = [wms.layers, 'OSM-WMS', 'openstreetmap'];
    (async () => {
      let layer = wms.layers;
      try {
        if (!(typeof process !== 'undefined' && process.env.JEST_WORKER_ID)) {
          const caps = await fetchWmsCapabilities(wms.baseUrl, wms.version);
          if (caps && caps.layers.length) layer = chooseOsmLayer(caps, preferred);
        }
      } catch {/* ignore network issues */}
      if (cancelled) return;
      const format = wms.format || 'image/png';
      const tileUrl = `${wms.baseUrl}service=WMS&request=GetMap&version=${wms.version}`+
        `&layers=${encodeURIComponent(layer)}&styles=&format=${encodeURIComponent(format)}`+
        `&transparent=false&crs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}&TILED=TRUE`;
      const rasterStyle = {
        version: 8,
        name: 'WhereGroup OSM Demo WMS',
        sources: {
          wms: { type: 'raster', tiles: [tileUrl], tileSize: 256, attribution: wms.attribution || '© OSM / WhereGroup' }
        },
        layers: [ { id: 'wms-base', type: 'raster', source: 'wms' } ]
      } as any;
      setStyleObject(rasterStyle);
      setWmsLayerName(layer);
    })();
    return () => { cancelled = true; };
  }, []);

  return { styleObject, wmsLayerName };
};

export default useWmsStyle;

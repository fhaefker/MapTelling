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

    const buildStyle = (layer: string) => {
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
        layers: [
          { id: 'background', type: 'background', paint: { 'background-color': '#ffffff' } },
          { id: 'wms-base', type: 'raster', source: 'wms' }
        ]
      } as any;
      setStyleObject(rasterStyle);
      setWmsLayerName(layer);
    };

    // Immediate style to avoid white flash
    buildStyle(wms.layers);

    // Optional refinement via capabilities (skip in tests to keep deterministic)
    (async () => {
      if ((typeof process !== 'undefined' && process.env.JEST_WORKER_ID)) return;
      try {
        const caps = await fetchWmsCapabilities(wms.baseUrl, wms.version);
        if (cancelled) return;
        if (caps && caps.layers.length) {
          const chosen = chooseOsmLayer(caps, preferred);
            if (chosen && chosen !== wmsLayerName) buildStyle(chosen);
        }
      } catch {/* ignore network issues */}
    })();

    return () => { cancelled = true; };
  }, [wmsLayerName]);

  return { styleObject, wmsLayerName };
};

export default useWmsStyle;

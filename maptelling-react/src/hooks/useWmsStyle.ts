import { useEffect, useRef, useState } from 'react';
import { config } from '../config/mapConfig';
import { fetchWmsCapabilities, chooseOsmLayer } from '../utils/wms';

interface WmsStyleResult {
  styleObject: any | null;
  wmsLayerName: string | null;
  availableLayers: string[];
  selectLayer: (name: string) => void;
  loading: boolean;
  error: string | null;
}

/**
 * useWmsStyle
 * Builds a minimal raster style for the configured WMS endpoint (vector tiles removed in refactor).
 * Encapsulates async capability negotiation + cancellation handling.
 */
export const useWmsStyle = (): WmsStyleResult => {
  const [styleObject, setStyleObject] = useState<any | null>(null);
  const [wmsLayerName, setWmsLayerName] = useState<string | null>(null);
  const [availableLayers, setAvailableLayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lastStyleKeyRef = useRef<string>('');
  const buildCountRef = useRef(0);

  const buildStyleRef = useRef<(layer:string)=>void>(()=>{});
  useEffect(() => {
    let cancelled = false;
    const wms = (config as any).wms as { baseUrl: string; version: '1.1.1'|'1.3.0'; layers: string; format?: string; attribution?: string };
    const preferred = [wms.layers, 'OSM-WMS', 'openstreetmap'];

  const build = (layer: string) => {
      const format = wms.format || 'image/png';
      const tileUrl = `${wms.baseUrl}service=WMS&request=GetMap&version=${wms.version}`+
        `&layers=${encodeURIComponent(layer)}&styles=&format=${encodeURIComponent(format)}`+
        `&transparent=false&crs=EPSG:3857&width=256&height=256&bbox={bbox-epsg-3857}&TILED=TRUE`;
      const key = tileUrl;
      if (lastStyleKeyRef.current === key) return; // prevent unnecessary state churn
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
      lastStyleKeyRef.current = key;
      buildCountRef.current++;
      if (buildCountRef.current > 5) {
        // excessive rebuilds indicate loop; log once
        if (buildCountRef.current === 6) console.warn('[useWmsStyle] excessive style rebuilds detected; throttling');
      }
    };
    // expose for selector
    (buildStyleRef as any).current = build;

  // Immediate style to avoid white flash (only once on initial mount)
  if (!wmsLayerName) build(wms.layers);

    // Optional refinement via capabilities (skip in tests to keep deterministic)
    (async () => {
      if ((typeof process !== 'undefined' && process.env.JEST_WORKER_ID)) return;
      try {
        setLoading(true); setError(null);
        const caps = await fetchWmsCapabilities(wms.baseUrl, wms.version);
        if (cancelled) return;
        if (caps && caps.layers.length) {
          setAvailableLayers(caps.layers);
          const chosen = chooseOsmLayer(caps, preferred);
            if (chosen && chosen !== wmsLayerName) build(chosen);
          if (!caps.layers.includes(wms.layers)) {
            console.warn('[useWmsStyle] configured layer not present in capabilities:', wms.layers);
          }
        }
        setLoading(false);
      } catch {/* ignore network issues */}
        setLoading(false); setError('capabilities failed');
    })();

    return () => { cancelled = true; };
  }, [wmsLayerName]);

  const selectLayer = (name: string) => { if (!name) return; buildStyleRef.current(name); };
  return { styleObject, wmsLayerName, availableLayers, selectLayer, loading, error };
};

export default useWmsStyle;

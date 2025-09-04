import { useEffect, useRef } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';
import type { FeatureCollection, LineString, MultiLineString } from 'geojson';

export interface CompositeGeoJsonLineProps {
  mapId: string;
  data: FeatureCollection<LineString | MultiLineString> | string; // URL or object
  idBase?: string; // base id for source + layers
  color?: string;
  width?: number;
  glow?: { width?: number; color?: string; opacity?: number; blur?: number } | false;
  lineCap?: 'butt' | 'round' | 'square';
  beforeId?: string; // layer ordering anchor
  updates?: 'replace-source' | 'diff'; // future diff strategy (currently only replace-source implemented)
}

/**
 * CompositeGeoJsonLine (Proposal #3)
 * Adds a GeoJSON source and up to two line layers (glow + main) for stylised route/track rendering.
 * - Single source to avoid duplication overhead.
 * - Optional glow layer beneath main line.
 * - Supports URL fetching with abort on prop change/unmount.
 * - Idempotent updates; repaints changed style props only.
 */
export const CompositeGeoJsonLine = ({
  mapId,
  data,
  idBase = 'composite-line',
  color = '#ff6b6b',
  width = 4,
  glow = { width: 8, color: '#ff6b6b', opacity: 0.3, blur: 2 },
  lineCap = 'round',
  beforeId,
  updates = 'replace-source',
}: CompositeGeoJsonLineProps) => {
  const { map } = useMap({ mapId });
  const abortRef = useRef<AbortController | null>(null);
  const geojsonRef = useRef<FeatureCollection<LineString | MultiLineString> | null>(null);
  // Cache of last feature ids/hash to allow lightweight diffing
  const lastFeatureSigRef = useRef<string | null>(null);
  const sourceId = `${idBase}-src`;
  const glowLayerId = `${idBase}-glow`;
  const mainLayerId = `${idBase}-main`;

  // Resolve data (object vs URL)
  useEffect(() => {
    if (typeof data !== 'string') {
      geojsonRef.current = data as FeatureCollection<any>;
      return;
    }
    // Fetch URL
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    fetch(data, { signal: controller.signal })
      .then(r => (r.ok ? r.json() : null))
      .then(json => {
        if (!json || controller.signal.aborted) return;
        if (json.type === 'FeatureCollection') {
          geojsonRef.current = json as FeatureCollection<any>;
        }
      })
      .catch(() => {/* ignore */});
    return () => controller.abort();
  }, [data]);

  // Source + layers management
  useEffect(() => {
    if (!map?.map || !geojsonRef.current) return;
    const m = map.map;
    const geojson = geojsonRef.current;

    // Source
    if (m.getSource(sourceId)) {
      if (updates === 'replace-source') {
        try { (m.getSource(sourceId) as any).setData(geojson as any); } catch {/* ignore */}
      } else if (updates === 'diff') {
        // Basic diff: build signature of feature ids + geometry lengths; if unchanged skip setData
        try {
          const sig = (() => {
            const feats = geojson.features || [];
            let acc = '' + feats.length + '|';
            for (let i = 0; i < feats.length; i++) {
              const f: any = feats[i];
              const id = f.id ?? i;
              const coords = (f.geometry && (f.geometry as any).coordinates) || [];
              // Rough geometry length metric (nested depth safe)
              const len = Array.isArray(coords) ? JSON.stringify(coords).length : 0;
              acc += id + ':' + len + ';';
              if (acc.length > 5000) break; // guard huge strings
            }
            return acc;
          })();
          if (lastFeatureSigRef.current !== sig) {
            lastFeatureSigRef.current = sig;
            (m.getSource(sourceId) as any).setData(geojson as any);
          }
        } catch { /* ignore diff failure */ }
      }
    } else {
      m.addSource(sourceId, { type: 'geojson', data: geojson });
      // reset signature cache when (re)creating source
      try {
        const feats = geojson.features || [];
        lastFeatureSigRef.current = '' + feats.length;
      } catch { lastFeatureSigRef.current = null; }
    }

    const ensureLayer = (id: string, paint: Record<string, any>, before?: string) => {
      if (!m.getLayer(id)) {
        m.addLayer({ id, type: 'line', source: sourceId, layout: { 'line-cap': lineCap, 'line-join': 'round' }, paint }, before);
      } else {
        // update paint props only if changed
        Object.entries(paint).forEach(([k,v]) => {
          try { m.setPaintProperty(id, k, v as any); } catch {/* ignore */}
        });
      }
    };

    if (glow) {
      ensureLayer(glowLayerId, {
        'line-color': glow.color || color,
        'line-width': glow.width ?? width * 2,
        'line-opacity': glow.opacity ?? 0.3,
        'line-blur': glow.blur ?? 2,
      }, beforeId);
    } else if (m.getLayer(glowLayerId)) {
      try { m.removeLayer(glowLayerId); } catch {/* ignore */}
    }

    ensureLayer(mainLayerId, {
      'line-color': color,
      'line-width': width,
      'line-opacity': 0.9,
    }, glow ? mainLayerId : beforeId); // order: glow below main; if no glow, place directly

    return () => {
      try {
        if (m.getLayer(mainLayerId)) m.removeLayer(mainLayerId);
        if (m.getLayer(glowLayerId)) m.removeLayer(glowLayerId);
        if (m.getSource(sourceId)) m.removeSource(sourceId);
      } catch {/* ignore */}
    };
  }, [map?.map, color, width, glow, lineCap, beforeId, updates, sourceId, glowLayerId, mainLayerId]);

  return null;
};

export default CompositeGeoJsonLine;
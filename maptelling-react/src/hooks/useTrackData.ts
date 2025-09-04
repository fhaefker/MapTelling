import { useEffect, useState } from 'react';
import type { FeatureCollection, LineString } from 'geojson';

interface TrackDataResult {
  trackData: FeatureCollection<LineString> | null;
  trackError: string | null;
}

const getBaseUrl = () => {
  if (typeof document !== 'undefined') {
    const base = document.querySelector('base')?.getAttribute('href');
    if (base) return base;
  }
  return '/';
};

/**
 * useTrackData - loads the static route GeoJSON with timeout + abort handling.
 */
export const useTrackData = (): TrackDataResult => {
  const [trackData, setTrackData] = useState<FeatureCollection<LineString> | null>(null);
  const [trackError, setTrackError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof process !== 'undefined' && process.env.JEST_WORKER_ID) return; // skip network in tests
    const url = `${getBaseUrl()}assets/track_day01-03.geojson`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    if (typeof fetch === 'function') {
      fetch(url, { signal: controller.signal })
        .then(res => (res.ok ? res.json() : Promise.reject(new Error(res.statusText))))
        .then(json => {
          if (json && json.type === 'FeatureCollection') {
            setTrackData(json as FeatureCollection<LineString>);
            setTrackError(null);
          } else setTrackError('Track data: invalid format');
        })
        .catch(e => { if (!controller.signal.aborted) setTrackError(e.message || 'Track load failed'); })
        .finally(() => clearTimeout(timeout));
    }
    return () => { controller.abort(); clearTimeout(timeout); };
  }, []);

  return { trackData, trackError };
};

export default useTrackData;

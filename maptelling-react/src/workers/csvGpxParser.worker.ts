// Worker prototype (LT-02) for parsing CSV / GPX into GeoJSON FeatureCollections.
// Not streaming yet; placeholder for future incremental / streaming parsing.
import { parseCsvToFeatureCollection, parseGpxToFeatureCollection } from '../utils/geoParsers';

export interface ParseRequest {
  type: 'parse';
  format: 'csv' | 'gpx';
  content: string;
  id?: string;
}

export interface ParseResponse {
  id?: string;
  ok: boolean;
  format: 'csv' | 'gpx';
  data?: GeoJSON.FeatureCollection;
  error?: string;
}

self.onmessage = (e: MessageEvent<ParseRequest>) => {
  const msg = e.data;
  if (msg.type !== 'parse') return;
  try {
    const data = msg.format === 'csv'
      ? parseCsvToFeatureCollection(msg.content)
      : parseGpxToFeatureCollection(msg.content);
    const resp: ParseResponse = { ok: true, format: msg.format, data, id: msg.id };
    (self as any).postMessage(resp);
  } catch (err: any) {
    const resp: ParseResponse = { ok: false, format: msg.format, error: err?.message || String(err), id: msg.id };
    (self as any).postMessage(resp);
  }
};

export {}; // keep module scope

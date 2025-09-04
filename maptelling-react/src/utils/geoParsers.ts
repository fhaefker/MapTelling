// Geo parsers used by worker & direct fallback (LT-02 prototype)
import type { FeatureCollection, Feature, Point } from 'geojson';

export function parseCsvToFeatureCollection(csv: string): FeatureCollection<Point> {
  // Simple heuristic: split lines, detect delimiter (comma / semicolon / tab)
  const lines = csv.trim().split(/\r?\n/).filter(l => l.trim().length);
  if (!lines.length) throw new Error('Empty CSV');
  const header = lines[0];
  const delim = header.includes('\t') ? '\t' : header.includes(';') ? ';' : ',';
  const cols = header.split(new RegExp(delim));
  const lower = cols.map(c => c.trim().toLowerCase());
  const latIdx = lower.indexOf('lat');
  const lonIdx = lower.indexOf('lon') >= 0 ? lower.indexOf('lon') : lower.indexOf('lng');
  if (latIdx === -1 || lonIdx === -1) throw new Error('CSV must contain lat & lon columns');
  const features: Feature<Point>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const parts = lines[i].split(new RegExp(delim));
    if (parts.length !== cols.length) continue;
    const lat = parseFloat(parts[latIdx]);
    const lon = parseFloat(parts[lonIdx]);
    if (Number.isFinite(lat) && Number.isFinite(lon)) {
      const props: Record<string, any> = {};
      cols.forEach((c, idx) => { if (idx !== latIdx && idx !== lonIdx) props[c.trim()] = parts[idx]; });
      features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: props });
    }
  }
  return { type: 'FeatureCollection', features };
}

export function parseGpxToFeatureCollection(gpx: string): FeatureCollection<Point> {
  // Naive minimal XML parsing (no DOMParser dependency for Jest simplicity)
  // Extract <trkpt lat="" lon=""> optionally with <name> inside a <trk> or <rte>
  const features: Feature<Point>[] = [];
  // Match either <trkpt .../> self-closing OR <trkpt ...>...</trkpt>
  const trkptRegex = /<trkpt[^>]*lat="([0-9+\-.]+)"[^>]*lon="([0-9+\-.]+)"[^>]*(?:>([\s\S]*?)<\/trkpt>|\/>)/gim;
  let match: RegExpExecArray | null;
  while ((match = trkptRegex.exec(gpx))) {
    const lat = parseFloat(match[1]);
    const lon = parseFloat(match[2]);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const inner = match[3] || '';
    const nameMatch = /<name>([\s\S]*?)<\/name>/i.exec(inner);
    const props: Record<string, any> = {};
    if (nameMatch) props.name = nameMatch[1].trim();
    features.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [lon, lat] }, properties: props });
  }
  return { type: 'FeatureCollection', features };
}

export async function parseWithWorker(format: 'csv' | 'gpx', content: string): Promise<FeatureCollection> {
  if (typeof Worker === 'undefined') {
    return format === 'csv' ? parseCsvToFeatureCollection(content) : parseGpxToFeatureCollection(content);
  }
  return await new Promise((resolve, reject) => {
    // dynamic import keeps worker out of initial bundle
    import('../workers/csvGpxParser.worker?worker').then(mod => {
      const WorkerCtor: any = mod.default;
      const w: Worker = new WorkerCtor();
      const id = Math.random().toString(36).slice(2);
      const onMsg = (e: MessageEvent<any>) => {
        if (e.data?.id !== id) return;
        w.terminate();
        if (e.data.ok) resolve(e.data.data); else reject(new Error(e.data.error || 'Parse failed'));
      };
      w.addEventListener('message', onMsg);
      w.postMessage({ type: 'parse', format, content, id });
    }).catch(err => {
      // Fallback to sync parse on import error
      try { resolve(format === 'csv' ? parseCsvToFeatureCollection(content) : parseGpxToFeatureCollection(content)); }
      catch (e) { reject(err || e); }
    });
  });
}

import type { FeatureCollection, Geometry, Feature } from 'geojson';

// Lightweight stable hash (order-sensitive) for GeoJSON FeatureCollections.
// Not cryptographic; aims to detect meaningful geometry/property changes quickly.
export function hashFeatureCollection(fc: FeatureCollection<Geometry>): string {
  if (!fc || fc.type !== 'FeatureCollection') return '0';
  let hash = 0;
  const features = fc.features || [];
  for (let i = 0; i < features.length; i++) {
    const f: Feature = features[i] as any;
    const idStr = String(f.id ?? i);
    const geom = f.geometry as any;
    const geomType = geom?.type || 'null';
    let coordSig = 'x';
    if (geom) {
      if (geom.type === 'GeometryCollection' && Array.isArray(geom.geometries)) {
        coordSig = 'gc' + geom.geometries.length + ':' + geom.geometries.map((g: any) => coordSignature(g.coordinates || [])).join(';');
      } else if ('coordinates' in geom) {
        coordSig = coordSignature(geom.coordinates);
      }
    }
    const propKeys = f.properties ? Object.keys(f.properties).sort().join(',') : '';
    const local = idStr + '|' + geomType + '|' + coordSig + '|' + propKeys;
    hash = mix(hash, local);
  }
  return hash.toString(16);
}

function coordSignature(coords: any): string {
  if (!Array.isArray(coords)) return 'n';
  // For performance, don't serialize full JSON; sample structure depth & lengths
  if (typeof coords[0] === 'number') {
    return 'p' + coords.map((n: number) => Math.round(n * 1e5)).join(',');
  }
  // Nested: take first + last sub length and total items
  const len = coords.length;
  const first = coordSignature(coords[0]);
  const last = coordSignature(coords[len - 1]);
  return 'a' + len + '[' + first + '|' + last + ']';
}

function mix(prev: number, str: string): number {
  let h = prev | 0;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 2654435761) >>> 0;
  }
  return h;
}

export default hashFeatureCollection;
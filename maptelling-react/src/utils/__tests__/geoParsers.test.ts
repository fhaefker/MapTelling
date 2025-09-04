import { parseCsvToFeatureCollection, parseGpxToFeatureCollection } from '../../utils/geoParsers';
import { validateDsl, dslToStyle } from '../../dsl/vectorTileDsl';

describe('geoParsers prototype', () => {
  test('parses simple CSV (lat/lon)', () => {
    const csv = 'lat,lon,name\n52.5,13.4,Berlin\n48.1,11.5,Munich';
    const fc = parseCsvToFeatureCollection(csv);
    expect(fc.features.length).toBe(2);
    expect(fc.features[0].geometry.type).toBe('Point');
  });
  test('parses minimal GPX track points', () => {
    const gpx = `<?xml version="1.0"?><gpx><trk><trkseg><trkpt lat="50.1" lon="8.6"><name>A</name></trkpt><trkpt lat="51.2" lon="9.1" /></trkseg></trk></gpx>`;
    const fc = parseGpxToFeatureCollection(gpx);
    expect(fc.features.length).toBe(2);
    expect(fc.features[0].properties?.name).toBe('A');
  });
});

describe('vector tile DSL prototype', () => {
  test('validates minimal spec', () => {
    const spec = {
      version: 1,
      sources: { osm: { type: 'vector', url: 'mbtiles://osm' } },
      layers: [
        { id: 'roads', type: 'line', source: 'osm', sourceLayer: 'transportation', paint: { 'line-color': '#f00' } }
      ]
    } as const;
    const res = validateDsl(spec);
    expect(res.ok).toBe(true);
    const styleFrag = dslToStyle(spec as any);
    expect(styleFrag.layers[0].id).toBe('roads');
  });
  test('detects duplicate id', () => {
    const spec = { version: 1, sources: {}, layers: [{ id: 'a', type: 'line', source: 's' }, { id: 'a', type: 'line', source: 's' }] } as any;
    const res = validateDsl(spec);
    expect(res.ok).toBe(false);
  });
});

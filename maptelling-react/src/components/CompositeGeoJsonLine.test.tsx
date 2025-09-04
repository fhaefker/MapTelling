import React from 'react';
import { render, cleanup } from '@testing-library/react';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import CompositeGeoJsonLine from './CompositeGeoJsonLine';

// Extend the mocked useMap to hold state we can introspect for layers & sources.

describe('CompositeGeoJsonLine', () => {
  const makeMap = () => {
    const sources: Record<string, any> = {};
    const layers: Record<string, any> = {};
    return {
      getSource: (id: string) => sources[id],
      addSource: (id: string, src: any) => { sources[id] = { ...src, setData: (d: any) => { sources[id].data = d; } }; },
      removeSource: (id: string) => { delete sources[id]; },
      getLayer: (id: string) => layers[id],
      addLayer: (lyr: any) => { layers[lyr.id] = { ...lyr }; },
      removeLayer: (id: string) => { delete layers[id]; },
      setPaintProperty: (id: string, k: string, v: any) => { if (layers[id]) { layers[id].paint = { ...layers[id].paint, [k]: v }; } },
      _debug: { sources, layers }
    };
  };

  beforeEach(() => {
    const testMap = makeMap();
    (require('@mapcomponents/react-maplibre') as any).useMap = () => ({ map: { map: testMap } });
  });
  afterEach(() => cleanup());

  const sample = {
    type: 'FeatureCollection',
    features: [
      { type: 'Feature', geometry: { type: 'LineString', coordinates: [[0,0],[1,1]] }, properties: {} }
    ]
  } as any;

  test('creates source and layers', () => {
    render(<MapComponentsProvider><CompositeGeoJsonLine mapId="m" data={sample} idBase="t" /></MapComponentsProvider>);
    const { map } = (require('@mapcomponents/react-maplibre') as any).useMap();
    const dbg = map.map._debug;
    expect(dbg.sources['t-src']).toBeTruthy();
    expect(dbg.layers['t-main']).toBeTruthy();
  });

  test('applies glow when configured', () => {
    render(<MapComponentsProvider><CompositeGeoJsonLine mapId="m" data={sample} idBase="g" glow={{ width: 12, color: '#00f', opacity: 0.5, blur: 1 }} /></MapComponentsProvider>);
    const { map } = (require('@mapcomponents/react-maplibre') as any).useMap();
    const dbg = map.map._debug;
    expect(dbg.layers['g-glow']).toBeTruthy();
    expect(dbg.layers['g-glow'].paint['line-width']).toBe(12);
  });
});

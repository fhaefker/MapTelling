import React from 'react';
import { render } from '@testing-library/react';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import GeoJsonLine from '../GeoJsonLine';

const fc = { type:'FeatureCollection', features: [] } as any;

describe('GeoJsonLine', () => {
  test('adds source and layer', () => {
    render(<MapComponentsProvider><GeoJsonLine mapId="maptelling-map" id="test-line" data={fc} paint={{ 'line-color':'#123456' }} /></MapComponentsProvider>);
    const dbg = (global as any).__TEST_MAP_WRAPPER__.map._debug;
    expect(dbg.sources['test-line']).toBeTruthy();
    expect(dbg.layers['test-line']).toBeTruthy();
  });
});

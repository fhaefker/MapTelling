import React from 'react';
import { render } from '@testing-library/react';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import GeoJsonLineGlow from '../GeoJsonLineGlow';

const sample = { type:'FeatureCollection', features:[{ type:'Feature', geometry:{ type:'LineString', coordinates:[[0,0],[1,1]] }, properties:{} }] } as any;

describe('GeoJsonLineGlow', () => {
  it('renders glow and main layers', () => {
    render(<MapComponentsProvider><GeoJsonLineGlow mapId="m" data={sample} idBase="track" /></MapComponentsProvider>);
    const wrapper:any = (global as any).__TEST_MAP_WRAPPER__;
    expect(wrapper.map.getLayer('track-glow')).toBeTruthy();
    expect(wrapper.map.getLayer('track-main')).toBeTruthy();
  });
  it('respects disabling glow', () => {
    render(<MapComponentsProvider><GeoJsonLineGlow mapId="m" data={sample} idBase="plain" glow={false} /></MapComponentsProvider>);
    const wrapper:any = (global as any).__TEST_MAP_WRAPPER__;
    expect(wrapper.map.getLayer('plain-glow')).toBeFalsy();
    expect(wrapper.map.getLayer('plain-main')).toBeTruthy();
  });
});

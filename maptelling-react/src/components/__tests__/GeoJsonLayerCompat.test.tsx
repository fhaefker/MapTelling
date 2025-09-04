import React from 'react';
import { render } from '@testing-library/react';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import GeoJsonLayerCompat from '../GeoJsonLayerCompat';

const sample = { type: 'FeatureCollection', features: [] };

describe('GeoJsonLayerCompat', () => {
  it('renders without crash and maps deprecated props', () => {
    const { rerender } = render(<MapComponentsProvider><GeoJsonLayerCompat geojson={sample} paint={{ 'line-color': '#f00' }} /></MapComponentsProvider>);
    rerender(<MapComponentsProvider><GeoJsonLayerCompat geojson={sample} layout={{ visibility: 'none' }} /></MapComponentsProvider>);
  });
});

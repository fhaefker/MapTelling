import React from 'react';
import { render } from '@testing-library/react';
import { MapComponentsProvider, MlGeoJsonLayer } from '@mapcomponents/react-maplibre';

import type { FeatureCollection, Geometry } from 'geojson';
const sample: FeatureCollection<Geometry> = { type: 'FeatureCollection', features: [] };

describe('MlGeoJsonLayer (direct)', () => {
  it('renders without crash using options API', () => {
    const { rerender } = render(
      <MapComponentsProvider>
        <MlGeoJsonLayer geojson={sample} options={{ paint: { 'line-color': '#f00' } }} />
      </MapComponentsProvider>
    );
    rerender(
      <MapComponentsProvider>
        <MlGeoJsonLayer geojson={sample} options={{ layout: { visibility: 'none' } }} />
      </MapComponentsProvider>
    );
  });
});

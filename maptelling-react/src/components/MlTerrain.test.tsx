import React from 'react';
import { render } from '@testing-library/react';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import MlTerrain from './MlTerrain';

describe('MlTerrain', () => {
  it('mounts without crashing (no source until map load simulated)', () => {
    render(<MapComponentsProvider><MlTerrain mapId="maptelling-map" enabled={false} /></MapComponentsProvider>);
  });
});
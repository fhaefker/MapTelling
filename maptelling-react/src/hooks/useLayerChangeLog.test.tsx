import React from 'react';
import { render } from '@testing-library/react';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import { useLayerChangeLog } from './useLayerChangeLog';

const Harness: React.FC = () => { useLayerChangeLog({ mapId: 'maptelling-map', limit: 5 }); return null; };

describe('useLayerChangeLog', () => {
  it('mounts and prepares log', () => {
    render(<MapComponentsProvider><Harness /></MapComponentsProvider>);
    // We rely on mock events; no assertions needed beyond no crash
  });
});

import React from 'react';
import { render } from '@testing-library/react';
import { useViewportSync } from './useViewportSync';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';

// NOTE: MapComponents is mocked in setupTests.

const HookHarness: React.FC<{cb:()=>void}> = ({ cb }) => { cb(); return null; };

describe('useViewportSync', () => {
  it('mounts without crashing (no real maps in mock)', () => {
    render(
      <MapComponentsProvider>
        <HookHarness cb={() => useViewportSync({ sourceMapId: 'a', targetMapId: 'b' })} />
      </MapComponentsProvider>
    );
  });
});

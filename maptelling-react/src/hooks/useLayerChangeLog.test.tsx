import React, { useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MapComponentsProvider, useMap } from '@mapcomponents/react-maplibre';
import { useLayerChangeLog } from './useLayerChangeLog';

const FireEvents: React.FC = () => {
  const { map } = useMap({ mapId: 'maptelling-map' });
  useEffect(() => {
    const m: any = map;
    if (!m?.fire) return;
    // defer firing to next tick to ensure hook listeners attached
    setTimeout(() => {
      m.fire('addlayer', { layer_id: 'L1', layer_type: 'line' });
      m.fire('layerchange', { layer_id: 'L1' });
      m.fire('removelayer', { layer_id: 'L1' });
    }, 0);
  }, [map]);
  return null;
};

const Harness: React.FC = () => { const { log } = useLayerChangeLog({ mapId: 'maptelling-map', limit: 5 }); return (<><FireEvents /><div data-testid="log-len">{log.length}</div></>); };

describe('useLayerChangeLog', () => {
  it('captures add/update/remove events', async () => {
    render(<MapComponentsProvider><Harness /></MapComponentsProvider>);
    const lenEl = screen.getByTestId('log-len');
    await waitFor(() => {
      expect(Number(lenEl.textContent)).toBeGreaterThanOrEqual(3);
    });
  });
});

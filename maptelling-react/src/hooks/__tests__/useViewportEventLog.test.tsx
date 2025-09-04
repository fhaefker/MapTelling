import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import { useViewportEventLog } from '../useViewportEventLog';

const Harness:React.FC = () => { const { events } = useViewportEventLog({ mapId:'maptelling-map' }); return <div data-testid="cnt">{events.length}</div>; };

describe('useViewportEventLog', () => {
  test('captures viewportchange events from jumpTo/flyTo', async () => {
    const { getByTestId } = render(<MapComponentsProvider><Harness /></MapComponentsProvider>);
    const wrapper:any = (global as any).__TEST_MAP_WRAPPER__;
    act(()=>{ wrapper.map.jumpTo({ center:[1,2], zoom:5 }); });
    act(()=>{ wrapper.map.flyTo({ center:[2,3], zoom:6 }); });
    await waitFor(()=>{
      expect(parseInt(getByTestId('cnt').textContent||'0',10)).toBeGreaterThanOrEqual(2);
    });
  });
});

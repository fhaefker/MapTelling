import React from 'react';
import { render } from '@testing-library/react';
import MapTellingApp from '../../MapTellingApp';

describe('WMS style immediate load', () => {
  test('style contains background and wms-base layers immediately', () => {
    render(<MapTellingApp />);
    const dbg = (global as any).__TEST_MAP_WRAPPER__.map._debug;
    // After initial render style builder should have run
    expect(dbg.layers['background']).toBeTruthy();
    expect(dbg.layers['wms-base']).toBeTruthy();
  });
});

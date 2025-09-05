import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import MapTellingApp from '../../MapTellingApp';

// This test asserts real DEM flow: enabling terrain creates raster-dem source + hillshade layer and hides wms-base.
// Relies on enhanced map mock in setupTests exposing _debug.

describe('DEM integration', () => {
  test('enabling DEM adds terrain-dem source, hillshade layer and hides wms-base', async () => {
    const { getByText, getByLabelText } = render(<MapTellingApp />);
    // Open panel
    fireEvent.click(getByText(/DEM & Optionen/));
    const checkbox = getByLabelText(/DEM aktivieren/);
    fireEvent.click(checkbox);
    const testMapWrapper: any = (global as any).__TEST_MAP_WRAPPER__;
    await waitFor(()=>{
      const dbgWait = testMapWrapper.map._debug;
      expect(dbgWait.layers['dem-hillshade']).toBeTruthy();
    });
    const dbg = testMapWrapper.map._debug;
    // Source present
    expect(dbg.sources['terrain-dem']).toBeTruthy();
    // Hillshade layer present
    expect(dbg.layers['dem-hillshade']).toBeTruthy();
    // wms-base hidden
    expect(dbg.layers['wms-base'].layout.visibility).toBe('none');
    // terrain set
    expect(dbg.terrain).toEqual(expect.objectContaining({ source: 'terrain-dem' }));
  });

  test('disabling DEM restores wms-base visibility and hides hillshade', async () => {
    const { getByText, getByLabelText } = render(<MapTellingApp />);
    fireEvent.click(getByText(/DEM & Optionen/));
    const checkbox = getByLabelText(/DEM aktivieren/);
    // enable
    fireEvent.click(checkbox);
    await waitFor(() => {
      const dbg = (global as any).__TEST_MAP_WRAPPER__.map._debug;
      expect(dbg.layers['dem-hillshade']).toBeTruthy();
    });
    // disable
    fireEvent.click(checkbox);
    const dbg = (global as any).__TEST_MAP_WRAPPER__.map._debug;
    expect(dbg.layers['wms-base'].layout.visibility).toBe('visible');
    expect(dbg.layers['dem-hillshade']?.layout.visibility).toBe('none');
  });
});

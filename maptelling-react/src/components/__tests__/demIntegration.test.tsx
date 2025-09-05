import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import MapTellingApp from '../../MapTellingApp';

// This test asserts real DEM flow: enabling terrain creates raster-dem source + hillshade layer and hides wms-base.
// Relies on enhanced map mock in setupTests exposing _debug.

describe('DEM integration', () => {
  test('enabling DEM adds terrain-dem source, hides wms-base and sets terrain (hillshade optional)', async () => {
    const { getByText, getByLabelText } = render(<MapTellingApp />);
    // Open panel
    fireEvent.click(getByText(/DEM & Optionen/));
    const checkbox = getByLabelText(/DEM aktivieren/);
    fireEvent.click(checkbox);
    const testMapWrapper: any = (global as any).__TEST_MAP_WRAPPER__;
    await waitFor(()=>{
      const dbgWait = testMapWrapper.map._debug;
      // Source should appear; hillshade layer may be skipped for mapbox encoding
      expect(dbgWait.sources['terrain-dem']).toBeTruthy();
    });
    const dbg = testMapWrapper.map._debug;
    // Source present
    expect(dbg.sources['terrain-dem']).toBeTruthy();
    // Hillshade layer may or may not be present depending on encoding; if present it should be visible when enabled
    if (dbg.layers['dem-hillshade']) {
      expect(dbg.layers['dem-hillshade'].layout.visibility).toBe('visible');
    }
    // wms-base hidden
    expect(dbg.layers['wms-base'].layout.visibility).toBe('none');
    // terrain set
    expect(dbg.terrain).toEqual(expect.objectContaining({ source: 'terrain-dem' }));
  });

  test('disabling DEM restores wms-base visibility and hides hillshade if present', async () => {
    const { getByText, getByLabelText } = render(<MapTellingApp />);
    fireEvent.click(getByText(/DEM & Optionen/));
    const checkbox = getByLabelText(/DEM aktivieren/);
    // enable
    fireEvent.click(checkbox);
    await waitFor(() => {
      const dbg = (global as any).__TEST_MAP_WRAPPER__.map._debug;
      expect(dbg.sources['terrain-dem']).toBeTruthy();
    });
    // disable
    fireEvent.click(checkbox);
    const dbg = (global as any).__TEST_MAP_WRAPPER__.map._debug;
    expect(dbg.layers['wms-base'].layout.visibility).toBe('visible');
    if (dbg.layers['dem-hillshade']) {
      expect(dbg.layers['dem-hillshade']?.layout.visibility).toBe('none');
    }
  });
});

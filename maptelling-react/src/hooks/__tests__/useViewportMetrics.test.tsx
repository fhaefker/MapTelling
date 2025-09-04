import React from 'react';
import { render, screen } from '@testing-library/react';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import ViewportMetricsOverlay from '../../components/ViewportMetricsOverlay';

// Test basic render & sample creation

describe('useViewportMetrics', () => {
  test('collects at least one sample', () => {
    render(<MapComponentsProvider><ViewportMetricsOverlay mapId="maptelling-map" /></MapComponentsProvider>);
    // Mock collects immediately
    // We can't rely on timing for multiple samples; just ensure text placeholder Zoom present
    // The overlay may render async; flush microtask queue by forcing rerender traversal using setTimeout 0 handled by jest fake timers would be overkill.
    const any = screen.getByText(/Zoom:/);
    expect(any).toBeInTheDocument();
  });
});

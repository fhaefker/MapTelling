import React from 'react';
import { render, act } from '@testing-library/react';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import { useMapFrameRate } from './useMapFrameRate';

const Harness: React.FC = () => { useMapFrameRate({ mapId: 'maptelling-map', sampleMs: 10, autoStart: true }); return null; };

describe('useMapFrameRate', () => {
  it('collects frames and sets avgFps', () => {
    jest.useFakeTimers();
    render(<MapComponentsProvider><Harness /></MapComponentsProvider>);
    act(() => { jest.advanceTimersByTime(25); });
    jest.useRealTimers();
  });
});

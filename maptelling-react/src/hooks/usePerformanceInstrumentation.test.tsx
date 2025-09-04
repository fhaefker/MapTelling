import React from 'react';
import { render } from '@testing-library/react';
import { usePerformanceInstrumentation } from './usePerformanceInstrumentation';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';

const Harness: React.FC = () => { usePerformanceInstrumentation({ mapId: 'maptelling-map' }); return null; };

describe('usePerformanceInstrumentation', () => {
  it('mounts and initializes without errors', () => {
    render(<MapComponentsProvider><Harness /></MapComponentsProvider>);
  });
});

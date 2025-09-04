import React from 'react';
import { render } from '@testing-library/react';
import { useMapSync } from './useMapSync';

// Light smoke test (ensures hook mounts without crashing with insufficient maps)
const Harness: React.FC = () => { useMapSync({ sources: ['a'] }); return null; };

describe('useMapSync', () => {
  test('does nothing with <2 maps', () => {
    render(<Harness />);
    // No assertions; just ensuring no throw
  });
});

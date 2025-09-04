import React from 'react';
import { render } from '@testing-library/react';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import { useRegisterProtocol, createTextProtocolHandler } from '../../utils/protocolTemplate';

const Harness: React.FC = () => {
  useRegisterProtocol({ scheme: 'csv', handler: createTextProtocolHandler() });
  return null;
};

describe('protocolTemplate', () => {
  it('registers protocol via hook', () => {
    render(<MapComponentsProvider><Harness /></MapComponentsProvider>);
    expect((global as any).__TEST_PROTOCOLS__['csv']).toBeDefined();
  });
});

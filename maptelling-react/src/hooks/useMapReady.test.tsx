import React from 'react';
import { render, screen, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useMapReady } from './useMapReady';

// Mock MapComponents to provide a controllable map instance & event emitter
const listeners: Record<string, Function[]> = {};
const fakeMapLibre = {
  on: (ev: string, fn: any) => { (listeners[ev] ||= []).push(fn); },
  off: (ev: string, fn: any) => { listeners[ev] = (listeners[ev]||[]).filter(f => f !== fn); },
  trigger: (ev: string) => { (listeners[ev] || []).forEach(fn => fn()); },
};

jest.mock('@mapcomponents/react-maplibre', () => ({
  useMap: () => ({ map: { map: fakeMapLibre } }),
  MapComponentsProvider: ({ children }: any) => children,
}));

const Harness: React.FC = () => {
  const { ready } = useMapReady({ mapId: 'm1' });
  return <div data-testid="state">{ready ? 'ready' : 'pending'}</div>;
};

describe('useMapReady', () => {
  test('sets ready after load event', () => {
    render(<Harness />);
    const el = screen.getByTestId('state');
    expect(el).toHaveTextContent('pending');
    act(() => { fakeMapLibre.trigger('load'); });
    expect(el).toHaveTextContent('ready');
  });
});

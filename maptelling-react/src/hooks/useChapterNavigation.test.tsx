import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { MapComponentsProvider, MapLibreMap } from '@mapcomponents/react-maplibre';
import { useChapterNavigation } from './useChapterNavigation';

// Minimal chapters stub
const chapters = [
  { id: 'c1', title: 'C1', description: '', location: { center: [0,0] as [number,number], zoom: 3 } },
  { id: 'c2', title: 'C2', description: '', location: { center: [1,1] as [number,number], zoom: 4 } },
];

// Wrapper providing map context
const wrapper: React.FC<{children: React.ReactNode}> = ({ children }) => (
  <MapComponentsProvider>
    <MapLibreMap mapId="test-map" options={{ style: 'https://demotiles.maplibre.org/style.json', center:[0,0], zoom:2 }} style={{width:0,height:0}} />
    {children}
  </MapComponentsProvider>
);

describe('useChapterNavigation', () => {
  test('initial state and navigation', async () => {
    const { result } = renderHook(() => useChapterNavigation({ mapId: 'test-map', chapters }), { wrapper });
    expect(result.current.currentChapter).toBe(0);
    act(() => result.current.next());
    expect(result.current.currentChapter).toBe(1);
    act(() => result.current.previous());
    expect(result.current.currentChapter).toBe(0);
  });
});

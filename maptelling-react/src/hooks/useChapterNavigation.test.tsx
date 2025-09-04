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

  test('bounds are respected (previous at first, next at last)', () => {
    const { result } = renderHook(() => useChapterNavigation({ mapId: 'test-map', chapters }), { wrapper });
    // at first chapter
    act(() => result.current.previous());
    expect(result.current.currentChapter).toBe(0);
    // move to last
    act(() => result.current.next());
    expect(result.current.currentChapter).toBe(1);
    // attempt beyond last
    act(() => result.current.next());
    expect(result.current.currentChapter).toBe(1);
  });

  test('autoplay stops at end', () => {
    jest.useFakeTimers();
    const { result } = renderHook(() => useChapterNavigation({ mapId: 'test-map', chapters, autoplay: true, autoplayIntervalMs: 10 }), { wrapper });
    expect(result.current.isPlaying).toBe(true);
    act(() => { jest.advanceTimersByTime(25); }); // enough to iterate chapters
    expect(result.current.currentChapter).toBe(1);
    expect(result.current.isPlaying).toBe(false);
    jest.useRealTimers();
  });
});

import React from 'react';
import { renderHook, act } from '@testing-library/react';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import { useChapterNavigation } from '../useChapterNavigation';

const wrapper: React.FC<{children:any}> = ({ children }) => <MapComponentsProvider>{children}</MapComponentsProvider>;

describe('useChapterNavigation events', () => {
  test('fires chapterchange event on navigation', () => {
    const chapters:any = [
      { location: { center:[0,0], zoom:5 } },
      { location: { center:[1,1], zoom:6 } }
    ];
    const received:number[] = [];
    const mapWrapper:any = (global as any).__TEST_MAP_WRAPPER__;
    mapWrapper.on('chapterchange', (e:any)=>{ received.push(e.index); });
    const { result } = renderHook(()=>useChapterNavigation({ mapId:'maptelling-map', chapters }), { wrapper });
    act(()=>{ result.current.next(); });
    act(()=>{ result.current.previous(); });
  // Initial applyChapter on mount emits index 0, then next() -> 1, previous() -> 0
  expect(received).toEqual([0,1,0]);
  });
});

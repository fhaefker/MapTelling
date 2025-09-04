import React, { useEffect } from 'react';
import { render, act } from '@testing-library/react';
import { ChaptersProvider, useChapters } from './ChaptersContext';
import type { Chapter } from '../types/story';

const base: Chapter[] = [
  { id:'c1', title:'T1', description:'D1', location:{ center:[0,0], zoom:5 } },
  { id:'c2', title:'T2', description:'D2', location:{ center:[1,1], zoom:6 } }
];

let ctxRef: any;
const Harness: React.FC = () => {
  const ctx = useChapters();
  useEffect(()=>{ ctxRef = ctx; }, [ctx]);
  return null;
};

test('export and import chapters roundtrip', () => {
  render(<ChaptersProvider chapters={base}><Harness /></ChaptersProvider>);
  act(() => { ctxRef.addChapter({ title:'T3', description:'D3', location:{ center:[2,2], zoom:7 } }); });
  const exported = ctxRef.exportChapters();
  expect(exported.length).toBe(3);
  const incoming: Chapter[] = [
    { id:'c1', title:'T1x', description:'D1x', location:{ center:[0,0], zoom:5 } },
    { id:'newX', title:'NX', description:'DX', location:{ center:[3,3], zoom:4 } }
  ];
  act(() => { ctxRef.importChapters(incoming); });
  const after = ctxRef.exportChapters();
  const overridden = after.find((c:Chapter)=>c.id==='c1');
  expect(overridden?.title).toBe('T1x');
  expect(after.some((c:Chapter)=>c.id==='newX')).toBe(true);
});

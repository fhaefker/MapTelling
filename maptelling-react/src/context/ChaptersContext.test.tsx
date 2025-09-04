import React from 'react';
import { render, screen } from '@testing-library/react';
import { ChaptersProvider, useChapters } from './ChaptersContext';

const chapters = [
  { id: 'c1', title: 'One', description: 'Desc1', location: { center: [0,0] as [number, number], zoom: 5, pitch: 0, bearing: 0 }, onChapterEnter: [], onChapterExit: [] },
  { id: 'c2', title: 'Two', description: 'Desc2', location: { center: [1,1] as [number, number], zoom: 6, pitch: 0, bearing: 0 }, onChapterEnter: [], onChapterExit: [] }
];

const Probe: React.FC = () => {
  const { total, getByIndex } = useChapters();
  return <div data-testid="probe" data-total={total} data-first={getByIndex(-10).id} data-last={getByIndex(999).id} />;
};

describe('ChaptersContext', () => {
  it('provides bounds-safe accessors', () => {
    render(<ChaptersProvider chapters={chapters}><Probe /></ChaptersProvider>);
    const el = screen.getByTestId('probe');
    expect(el.getAttribute('data-total')).toBe('2');
    expect(el.getAttribute('data-first')).toBe('c1');
    expect(el.getAttribute('data-last')).toBe('c2');
  });
  it('throws when hook used outside provider', () => {
    const OrigError = console.error; console.error = () => {}; // suppress react error boundary noise
    let caught = false;
  try { render(<Probe />); } catch { caught = true; }
    console.error = OrigError;
    expect(caught).toBe(true);
  });
});

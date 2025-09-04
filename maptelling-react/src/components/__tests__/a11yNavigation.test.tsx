import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import NavigationControls from '../NavigationControls';
import { I18nProvider } from '../../i18n/I18nProvider';

// Polyfill matchMedia for framer-motion reduced motion queries
if (!window.matchMedia) {
  (window as any).matchMedia = (query: string) => {
    let listeners: Array<(e: any)=>void> = [];
    const mql = {
      matches: false,
      media: query,
      addEventListener: (_: string, cb: (e:any)=>void) => { listeners.push(cb); },
      removeEventListener: (_: string, cb: (e:any)=>void) => { listeners = listeners.filter(l=>l!==cb); },
      addListener: (cb: (e:any)=>void) => { listeners.push(cb); }, // legacy
      removeListener: (cb: (e:any)=>void) => { listeners = listeners.filter(l=>l!==cb); },
      dispatchEvent: (ev: any) => { listeners.forEach(l=>l(ev)); return true; }
    } as any;
    return mql;
  };
} else {
  // Ensure addEventListener exists for returned MQL objects
  const orig = window.matchMedia;
  (window as any).matchMedia = (q: string) => {
    const mql: any = orig(q);
    if (!mql.addEventListener) {
      mql.addEventListener = (_: string, cb: any) => mql.addListener(cb);
      mql.removeEventListener = (_: string, cb: any) => mql.removeListener(cb);
    }
    return mql;
  };
}

describe('NavigationControls A11y', () => {
  test('has aria roles and labels', () => {
    render(
      <I18nProvider>
        <NavigationControls
          currentChapter={0}
          totalChapters={3}
          isPlaying={false}
          onPrevious={()=>{}}
          onNext={()=>{}}
          onPlayPause={()=>{}}
          onChapterSelect={()=>{}}
        />
      </I18nProvider>
    );
  // Accept either de or en labels depending on auto locale detection
  expect(screen.getByRole('group', { name: /Kapitel Navigation|Chapter Navigation/i })).toBeInTheDocument();
  expect(screen.getByRole('tablist', { name: /Kapitel Auswahl|Chapter Selection/i })).toBeInTheDocument();
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBe(3);
    expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
  });
});

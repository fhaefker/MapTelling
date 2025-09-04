import React from 'react';
import { render } from '@testing-library/react';
import { MapComponentsProvider } from '@mapcomponents/react-maplibre';
import InteractionController from './InteractionController';

// Using the jest mock from setupTests which supplies flyTo/jumpTo only. We'll extend minimal handler stubs.

describe('InteractionController', () => {
  function setup(handlers: Record<string, any>) {
    // Override provider value with handler stubs
    (require('@mapcomponents/react-maplibre') as any).useMap = () => ({ map: { map: handlers } });
  }

  test('enables handlers when enabled=true', () => {
    const enabledFlags: Record<string, boolean> = {};
    const makeHandler = (initial: boolean) => ({
      _enabled: initial,
      enable() { this._enabled = true; },
      disable() { this._enabled = false; },
      isEnabled() { return this._enabled; },
    });
    const handlers = {
      scrollZoom: makeHandler(false),
      dragPan: makeHandler(false),
      keyboard: makeHandler(false),
      doubleClickZoom: makeHandler(false),
      touchZoomRotate: makeHandler(false),
    };
    setup(handlers);
    render(<MapComponentsProvider><InteractionController mapId="x" enabled={true} /></MapComponentsProvider>);
    Object.entries(handlers).forEach(([k,h]) => { enabledFlags[k] = h.isEnabled(); });
    expect(Object.values(enabledFlags).every(v => v)).toBe(true);
  });

  test('disables subset with modes mapping', () => {
    const makeHandler = (initial: boolean) => ({
      _enabled: initial,
      enable() { this._enabled = true; },
      disable() { this._enabled = false; },
      isEnabled() { return this._enabled; },
    });
    const handlers = {
      scrollZoom: makeHandler(true),
      dragPan: makeHandler(true),
      keyboard: makeHandler(true),
      doubleClickZoom: makeHandler(true),
      touchZoomRotate: makeHandler(true),
    };
    setup(handlers);
    render(<MapComponentsProvider><InteractionController mapId="x" enabled={true} modes={{ dragPan: false, keyboard: true }} /></MapComponentsProvider>);
    expect(handlers.dragPan.isEnabled()).toBe(false);
    expect(handlers.keyboard.isEnabled()).toBe(true);
    // untouched handler should remain original
    expect(handlers.scrollZoom.isEnabled()).toBe(true);
  });
});

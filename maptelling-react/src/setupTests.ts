// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';
// Minimal act import no longer needed globally (kept if future utils require)
import { act } from '@testing-library/react';

// Lightweight mock for map components to avoid invoking WebGL / CSS parsing during unit tests.
// We only need minimal context provider shape plus a MapLibreMap placeholder with map property.
jest.mock('@mapcomponents/react-maplibre', () => {
	const React = require('react');
	const handlers: Record<string, Function[]> = {};
	const fire = (evt: string, payload?: any) => {
		(handlers[evt] || []).forEach(h => h(payload));
	};
	const on = (evt: string, cb: Function) => {
		handlers[evt] = handlers[evt] || [];
		handlers[evt].push(cb);
		return () => off(evt, cb);
	};
	const off = (evt: string, cb: Function) => {
		handlers[evt] = (handlers[evt] || []).filter(h => h !== cb);
	};
	const mockMap = {
		map: {
			flyTo: jest.fn(),
			jumpTo: jest.fn(),
			getCenter: () => ({ lng: 0, lat: 0 }),
			getZoom: () => 5,
			getBearing: () => 0,
			getPitch: () => 0,
			loaded: () => true,
			once: (e: string, cb: Function) => { cb(); },
			on: (e: string, cb: Function) => on(e, cb),
			off: (e: string, cb: Function) => off(e, cb),
			// style placeholder
			getStyle: () => ({ layers: [] })
		},
		on,
		off,
		fire
	};
	;(global as any).__TEST_MAP_WRAPPER__ = mockMap; // expose for tests
	const ctx = React.createContext({ map: mockMap });
		const protocolRegistry: Record<string, Function> = {};
		const useAddProtocol = (opts: { scheme: string; handler: any }) => {
			protocolRegistry[opts.scheme] = opts.handler;
			(global as any).__TEST_PROTOCOLS__ = protocolRegistry;
		};
			// Filter out non-DOM props to avoid React unknown prop warnings in tests
			const MlGeoJsonLayer = (props: any) => {
				const { mapId, layerId, defaultPaintOverrides, insertBeforeLayer, geojson, type, ...rest } = props || {};
				return React.createElement('div', {
					'data-testid': 'geojson-layer',
					// expose some info for assertions if needed
					'data-layer-id': layerId,
					'data-type': type,
					...rest
				});
			};
			return {
				MapComponentsProvider: ({ children }: any) => React.createElement(ctx.Provider, { value: { map: mockMap } }, children),
				MapLibreMap: () => null,
				MlGeoJsonLayer,
				useMap: () => ({ map: mockMap }),
				useAddProtocol,
			};
});

// Polyfills for maplibre in jsdom test environment
if (!(window as any).URL.createObjectURL) {
	(window as any).URL.createObjectURL = () => 'blob:mock';
}

// Basic matchMedia stub (some animation libs expect it)
if (!window.matchMedia) {
	(window as any).matchMedia = () => ({ matches: false, addListener: () => {}, removeListener: () => {} });
}

// Central framer-motion mock to keep animations inert & deterministic
jest.mock('framer-motion', () => ({ motion: { div: 'div', h2: 'h2', p: 'p', img: 'img' } }));

// IntersectionObserver polyfill for react-intersection-observer used in StoryScroller
if (typeof (global as any).IntersectionObserver === 'undefined') {
	class IO {
		constructor(public cb: any, _opts?: any) {}
		observe() {}
		unobserve() {}
		disconnect() {}
		takeRecords() { return []; }
	}
	(global as any).IntersectionObserver = IO;
}

// Targeted suppression of known Suspense act warning noise while keeping real errors
const originalConsoleError = console.error;
console.error = (...args: any[]) => {
	const msg = args[0];
	if (typeof msg === 'string') {
		if (msg.includes('A suspended resource finished loading inside a test')) return;
		// Unknown prop warnings for our mocked map layer props
		if (/React does not recognize the `(mapId|layerId|defaultPaintOverrides|insertBeforeLayer)` prop/.test(msg)) return;
	}
	originalConsoleError(...args);
};

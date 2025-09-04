// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

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
		return {
			MapComponentsProvider: ({ children }: any) => React.createElement(ctx.Provider, { value: { map: mockMap } }, children),
			MapLibreMap: () => null,
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

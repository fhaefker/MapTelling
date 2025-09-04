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
			_debug: {
				sources: { wms: { type: 'raster' } },
				layers: { 'wms-base': { id: 'wms-base', type: 'raster', layout: { visibility: 'visible' }, paint: {} } },
				terrain: null as any,
				layoutChanges: [] as any[],
				paintChanges: [] as any[],
				camera: { center: [0,0] as [number, number], zoom: 5, bearing: 0, pitch: 0 },
			},
			flyTo: jest.fn().mockImplementation((opts: any) => { if (opts?.center) (mockMap.map as any)._debug.camera.center = opts.center; if (opts?.zoom!=null) (mockMap.map as any)._debug.camera.zoom = opts.zoom; if (opts?.bearing!=null) (mockMap.map as any)._debug.camera.bearing = opts.bearing; if (opts?.pitch!=null) (mockMap.map as any)._debug.camera.pitch = opts.pitch; }),
			jumpTo: jest.fn().mockImplementation((opts: any) => { if (opts?.center) (mockMap.map as any)._debug.camera.center = opts.center; if (opts?.zoom!=null) (mockMap.map as any)._debug.camera.zoom = opts.zoom; if (opts?.bearing!=null) (mockMap.map as any)._debug.camera.bearing = opts.bearing; if (opts?.pitch!=null) (mockMap.map as any)._debug.camera.pitch = opts.pitch; }),
			getCenter: () => { const c = (mockMap.map as any)._debug.camera.center; return { lng: c[0], lat: c[1] }; },
			getZoom: () => (mockMap.map as any)._debug.camera.zoom,
			getBearing: () => (mockMap.map as any)._debug.camera.bearing,
			getPitch: () => (mockMap.map as any)._debug.camera.pitch,
			loaded: () => true,
			once: (e: string, cb: Function) => { cb(); },
			on: (e: string, cb: Function) => on(e, cb),
			off: (e: string, cb: Function) => off(e, cb),
			getStyle: () => ({ layers: Object.values((mockMap.map as any)._debug.layers) }),
			setStyle: (style: any) => { /* naive assignment for tests */ if (style?.layers) { (mockMap.map as any)._debug.layers = {}; style.layers.forEach((l:any)=>{ (mockMap.map as any)._debug.layers[l.id] = { ...l, layout: l.layout || { visibility: 'visible' }, paint: l.paint || {} }; }); } if (style?.sources) { Object.keys(style.sources).forEach(k=>{ (mockMap.map as any)._debug.sources[k]=style.sources[k]; }); } },
			addSource: (id: string, src: any) => { (mockMap.map as any)._debug.sources[id] = src; fire('sourcedata', { sourceId: id }); },
			getSource: (id: string) => (mockMap.map as any)._debug.sources[id],
			addLayer: (layer: any, beforeId?: string) => { (mockMap.map as any)._debug.layers[layer.id] = { ...layer, layout: layer.layout || { visibility: 'visible' }, paint: layer.paint || {} }; fire('layeradded', { id: layer.id, before: beforeId }); },
			getLayer: (id: string) => (mockMap.map as any)._debug.layers[id],
			setLayoutProperty: (id: string, prop: string, value: any) => { const lyr = (mockMap.map as any)._debug.layers[id]; if (lyr) { lyr.layout = lyr.layout || {}; lyr.layout[prop] = value; (mockMap.map as any)._debug.layoutChanges.push({ id, prop, value }); } },
			setPaintProperty: (id: string, prop: string, value: any) => { const lyr = (mockMap.map as any)._debug.layers[id]; if (lyr) { lyr.paint = lyr.paint || {}; lyr.paint[prop] = value; (mockMap.map as any)._debug.paintChanges.push({ id, prop, value }); } },
			setTerrain: (opts: any) => { (mockMap.map as any)._debug.terrain = opts; },
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
				MapLibreMap: (props: any) => { if (props?.options?.style) { try { (mockMap.map as any).setStyle(props.options.style); } catch {} } return null; },
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

// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

// Lightweight mock for map components to avoid invoking WebGL / CSS parsing during unit tests.
// We only need minimal context provider shape plus a MapLibreMap placeholder with map property.
jest.mock('@mapcomponents/react-maplibre', () => {
	const React = require('react');
	const ctx = React.createContext({ map: { map: { flyTo: jest.fn(), jumpTo: jest.fn() } } });
	return {
		MapComponentsProvider: ({ children }: any) => React.createElement(ctx.Provider, { value: { map: { map: { flyTo: jest.fn(), jumpTo: jest.fn() } } } }, children),
		MapLibreMap: () => null,
		useMap: () => ({ map: { map: { flyTo: jest.fn(), jumpTo: jest.fn() } } })
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

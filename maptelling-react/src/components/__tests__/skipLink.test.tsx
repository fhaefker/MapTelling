import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import MapTellingApp from '../../MapTellingApp';
// Mock framer-motion to avoid prefers-reduced-motion media query issues in JSDOM
jest.mock('framer-motion', () => ({ motion: { div: 'div' } }));

// Basic smoke test ensuring skip link renders with translation
describe('Skip Link', () => {
  test('renders and points to story-main', () => {
    render(<MapTellingApp />);
    const link = screen.getByText(/Zum Inhalt springen|Skip to content/);
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#story-main');
  });
});

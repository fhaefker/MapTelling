import React from 'react';
import { screen } from '@testing-library/react';
import { renderWithSuspense } from '../../test-utils/renderWithSuspense';
import '@testing-library/jest-dom';
import MapTellingApp from '../../MapTellingApp';

// Basic smoke test ensuring skip link renders with translation
describe('Skip Link', () => {
  test('renders and points to story-main', async () => {
    await renderWithSuspense(<MapTellingApp />);
    const link = screen.getByText(/Zum Inhalt springen|Skip to content/);
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '#story-main');
  });
});

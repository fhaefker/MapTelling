import React from 'react';
import { render, screen } from '@testing-library/react';

// Mock MapTellingApp to avoid executing Vite-specific import.meta code in tests
jest.mock('./MapTellingApp', () => () => <div>MapTellingApp Mock</div>);
import App from './App';

test('renders mocked app container', () => {
  render(<App />);
  expect(screen.getByText(/MapTellingApp Mock/)).toBeInTheDocument();
});

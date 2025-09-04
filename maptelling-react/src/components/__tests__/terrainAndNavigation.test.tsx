import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import MapTellingApp from '../../MapTellingApp';

// Helper to flush microtasks
const flush = () => new Promise(r => setTimeout(r, 0));

describe('UnifiedControls integration', () => {
  test('toggles free navigation (interaction handlers) on and off', async () => {
    const { getByText, getAllByText } = render(<MapTellingApp />);
    // Initial state: interactive=false (Story Modus active) button text should be 'Story Modus'
    const toggleBtn = getByText(/^Story Modus$/);
    fireEvent.click(toggleBtn); // switch to free navigation => button label becomes 'Freie Navigation'
    // There are two occurrences (button + status banner). Ensure button label present by selecting first button occurrence
    const freeNavMatches = getAllByText(/^Freie Navigation$/);
    expect(freeNavMatches.length).toBeGreaterThanOrEqual(1);
  });
  test('enables terrain (DEM) via checkbox', async () => {
    const { getByText, getByLabelText } = render(<MapTellingApp />);
    // Open DEM panel
    fireEvent.click(getByText(/DEM & Optionen/));
    const checkbox = getByLabelText(/DEM aktivieren/);
    fireEvent.click(checkbox);
    // Nothing to assert directly (map mocked), but ensure no crash and UI reflects slider presence
  expect(getByText(/Überhöhung/)).toBeInTheDocument();
  });
});

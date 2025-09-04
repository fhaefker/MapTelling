import React, { Suspense } from 'react';
import { render, act } from '@testing-library/react';

/**
 * Renders a component wrapped in a Suspense boundary and ensures all microtasks flush.
 * Helps reduce act() warnings from lazy loaded components firing after assertions.
 */
export async function renderWithSuspense(ui: React.ReactElement) {
  let result: ReturnType<typeof render> | undefined;
  await act(async () => {
    result = render(<Suspense fallback={null}>{ui}</Suspense>);
  });
  await act(async () => { await Promise.resolve(); });
  return result!;
}

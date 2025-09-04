import { useRef } from 'react';

/**
 * useRenderLog - simple hook to log component render counts in development.
 */
export function useRenderLog(name: string) {
  const countRef = useRef(0);
  countRef.current += 1;
  if (process.env.NODE_ENV !== 'production') {
    // eslint-disable-next-line no-console
    console.debug(`[render] ${name} #${countRef.current}`);
  }
}

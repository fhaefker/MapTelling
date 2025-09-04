import { renderHook, act } from '@testing-library/react';
import { useFpsSample } from './useFpsSample';

describe('useFpsSample', () => {
  beforeAll(() => {
    jest.useFakeTimers();
  });
  afterAll(() => {
    jest.useRealTimers();
  });

  test('reports fps > 0 when enabled', () => {
    let ts = 0;
    const scheduler = (cb: FrameRequestCallback) => {
      return setTimeout(() => {
        ts += 16;
        cb(ts);
      }, 0) as unknown as number;
    };
    const cancelScheduler = (id: number) => clearTimeout(id as unknown as NodeJS.Timeout);
    const { result } = renderHook(() => useFpsSample({ enabled: true, intervalMs: 10, sampleWindowMs: 100, scheduler, cancelScheduler }));
    // advance several frames
    act(() => {
      jest.advanceTimersByTime(80); // ~5 frames
    });
    expect(result.current.fps).toBeGreaterThan(0);
  });
});

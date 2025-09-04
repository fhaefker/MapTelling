import { useEffect, useRef, useState } from 'react';

export interface UseFpsSampleOptions {
  enabled?: boolean;        // toggle measurement
  sampleWindowMs?: number;  // window length for moving average
  intervalMs?: number;      // reporting cadence
  scheduler?: (cb: FrameRequestCallback) => number; // test injection (defaults to rAF)
  cancelScheduler?: (id: number) => void;           // test injection cancel
}

export const useFpsSample = (opts: UseFpsSampleOptions = {}) => {
  const { enabled = false, sampleWindowMs = 2000, intervalMs = 500, scheduler, cancelScheduler } = opts;
  const frameTimes = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const [fps, setFps] = useState<number>(0);
  const startRef = useRef<number>(performance.now());
  const lastReport = useRef<number>(performance.now());

  useEffect(() => {
    if (!enabled) return;
    const loop = (ts: number) => {
      frameTimes.current.push(ts);
      const cutoff = ts - sampleWindowMs;
      while (frameTimes.current.length && frameTimes.current[0] < cutoff) {
        frameTimes.current.shift();
      }
      if (ts - lastReport.current >= intervalMs) {
        if (frameTimes.current.length > 1) {
          const span = frameTimes.current[frameTimes.current.length - 1] - frameTimes.current[0];
          const frames = frameTimes.current.length - 1;
          setFps(Math.round((frames / span) * 1000));
        }
        lastReport.current = ts;
      }
      const schedule = scheduler || requestAnimationFrame;
      rafRef.current = schedule(loop);
    };
    const schedule = scheduler || requestAnimationFrame;
    const cancel = cancelScheduler || cancelAnimationFrame;
    rafRef.current = schedule(loop);
    return () => { if (rafRef.current != null) cancel(rafRef.current); };
  }, [enabled, sampleWindowMs, intervalMs, scheduler, cancelScheduler]);

  return { fps, since: startRef.current };
};

export default useFpsSample;

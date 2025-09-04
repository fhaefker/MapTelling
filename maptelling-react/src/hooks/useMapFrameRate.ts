import { useEffect, useRef, useState } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';

export interface UseMapFrameRateOptions {
  mapId: string;
  sampleMs?: number; // total sampling window
  windowSize?: number; // retained last N frame intervals for moving avg
  autoStart?: boolean;
  onComplete?: (stats: { avgFps: number; frames: number; durationMs: number }) => void;
}

export interface MapFrameRateApi {
  avgFps: number | null;
  frames: number;
  start: () => void;
  stop: () => void;
  running: boolean;
}

export const useMapFrameRate = ({ mapId, sampleMs = 2000, windowSize = 120, autoStart = true, onComplete }: UseMapFrameRateOptions): MapFrameRateApi => {
  const { map } = useMap({ mapId });
  const [avgFps, setAvgFps] = useState<number | null>(null);
  const [frames, setFrames] = useState(0);
  const runningRef = useRef(false);
  const startRef = useRef(0);
  const rafRef = useRef<number | null>(null);
  const samplesRef = useRef<number[]>([]);

  const sample = () => {
    if (!runningRef.current) return;
    const now = performance.now();
    const last = samplesRef.current.length ? samplesRef.current[samplesRef.current.length - 1] : now;
    samplesRef.current.push(now);
    if (samplesRef.current.length > windowSize) samplesRef.current.shift();
    setFrames(f => f + 1);
    if (now - startRef.current >= sampleMs) {
      stop();
      const duration = now - startRef.current;
      const totalFrames = framesRef.current;
      const avg = totalFrames / (duration / 1000);
      setAvgFps(avg);
      onComplete?.({ avgFps: avg, frames: totalFrames, durationMs: duration });
      return;
    }
    rafRef.current = requestAnimationFrame(sample);
  };

  const framesRef = useRef(0);
  useEffect(() => { framesRef.current = frames; }, [frames]);

  const start = () => {
    if (runningRef.current) return;
    runningRef.current = true;
    setFrames(0); setAvgFps(null); samplesRef.current = []; startRef.current = performance.now();
    rafRef.current = requestAnimationFrame(sample);
  };
  const stop = () => {
    runningRef.current = false;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  };

  useEffect(() => { if (autoStart) start(); return stop; }, [map?.map, autoStart, sampleMs]);

  return { avgFps, frames, start, stop, running: runningRef.current };
};

export default useMapFrameRate;

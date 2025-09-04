import React, { useState } from 'react';
import { usePerformanceInstrumentation } from '../hooks/usePerformanceInstrumentation';
import { useMapFrameRate } from '../hooks/useMapFrameRate';
import { useLayerChangeLog } from '../hooks/useLayerChangeLog';

interface DevMetricsOverlayProps { mapId: string; }

/**
 * DevMetricsOverlay
 * Lightweight developer HUD displaying load time, layer change count and on-demand FPS sampling.
 * Not intended for production; gated by consumer (e.g. NODE_ENV check in parent).
 */
export const DevMetricsOverlay: React.FC<DevMetricsOverlayProps> = ({ mapId }) => {
  const [metrics, setMetrics] = useState<Record<string, number>>({});
  const { log } = useLayerChangeLog({ mapId, limit: 50 });
  const [fpsActive, setFpsActive] = useState(false);
  const { avgFps, start, stop, running } = useMapFrameRate({ mapId, sampleMs: 1500, autoStart: false });

  usePerformanceInstrumentation({ mapId, sampleFpsDuringMs: 0, onMetrics: m => setMetrics(m) });

  const toggleFps = () => {
    if (running) { stop(); setFpsActive(false); }
    else { start(); setFpsActive(true); }
  };

  return (
    <div style={{ position: 'fixed', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', padding: 8, fontSize: 11, fontFamily: 'monospace', borderRadius: 4, zIndex: 9999, maxWidth: 240 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>Dev Metrics</div>
      <div>Load: {metrics.time_to_load_ms ? Math.round(metrics.time_to_load_ms) + 'ms' : '…'}</div>
      <div>Layer events: {metrics.layerchange_events || 0}</div>
      <div>Recent adds/updates: {log.length}</div>
      <div>FPS: {avgFps ? Math.round(avgFps) : (running ? 'sampling…' : 'idle')}</div>
      <button onClick={toggleFps} style={{ marginTop: 4, width: '100%', padding: '2px 4px', fontSize: 11 }}>
        {running ? 'Stop FPS Sample' : 'Sample FPS'}
      </button>
    </div>
  );
};

export default DevMetricsOverlay;
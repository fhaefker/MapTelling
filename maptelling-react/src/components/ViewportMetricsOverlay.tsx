import React from 'react';
import useViewportMetrics from '../hooks/useViewportMetrics';

interface Props { mapId: string; }

const ViewportMetricsOverlay: React.FC<Props> = ({ mapId }) => {
  const { samples } = useViewportMetrics({ mapId, sampleIntervalMs: 1500 });
  if(!samples.length) return null;
  const last = samples[samples.length - 1];
  return (
    <div style={{ position:'fixed', bottom:4, left:4, background:'rgba(0,0,0,0.55)', color:'#fff', padding:'6px 10px', borderRadius:6, fontSize:11, fontFamily:'system-ui, sans-serif', zIndex:30 }}>
      <div style={{ fontWeight:600, marginBottom:4 }}>Viewport</div>
      <div>Zoom: {last.zoom.toFixed(2)}</div>
      <div>Center: {last.center.map(v=>v.toFixed(3)).join(', ')}</div>
      <div>Brg/Pitch: {last.bearing.toFixed(0)}/{last.pitch.toFixed(0)}</div>
      <div style={{ opacity:0.7 }}>Samples: {samples.length}</div>
    </div>
  );
};

export default ViewportMetricsOverlay;
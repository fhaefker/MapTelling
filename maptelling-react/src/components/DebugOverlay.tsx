import React from 'react';

interface DebugOverlayProps { fps: number; }
const DebugOverlay: React.FC<DebugOverlayProps> = ({ fps }) => (
  <div style={{ position:'absolute', bottom:8, right:8, background:'rgba(0,0,0,0.55)', color:'#fff', padding:'4px 8px', fontSize:12, borderRadius:4 }}>
    FPS: {fps}
  </div>
);
export default React.memo(DebugOverlay);

import React from 'react';

const FreeNavHint: React.FC = () => (
  <div style={{ position:'fixed', top:8, left:8, background:'rgba(0,0,0,0.55)', color:'#fff', padding:'6px 10px', fontSize:12, borderRadius:4, zIndex:30 }}>
    Freie Navigation aktiv – Scroll wechselt Kapitel nicht
  </div>
);
export default React.memo(FreeNavHint);

import React, { useState } from 'react';

interface UnifiedControlsProps {
  interactive: boolean;
  onToggleInteractive: () => void;
}

// Single compact floating control panel (top-right) merging previous ModeToggle + SettingsPanel DEM section.
const UnifiedControls: React.FC<UnifiedControlsProps> = ({ interactive, onToggleInteractive }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position:'fixed', top:8, right:8, zIndex:50, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
      <div style={{ display:'flex', gap:8 }}>
  <button onClick={onToggleInteractive} style={{ padding:'8px 14px', borderRadius:20, border:'1px solid #888', background: interactive ? '#3FB1CE' : '#222', color:'#fff', cursor:'pointer', fontSize:13, minWidth:150 }}>{interactive ? 'Freie Navigation' : 'Story Modus'}</button>
        <button onClick={()=>setOpen(o=>!o)} style={{ padding:'8px 14px', borderRadius:20, border:'1px solid #888', background:'#444', color:'#fff', cursor:'pointer', fontSize:13 }}>{open ? 'Schließen' : 'Optionen'}</button>
      </div>
      {open && (
        <div style={{ background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)', padding:14, borderRadius:12, width:280, color:'#fff', fontSize:12, boxShadow:'0 6px 18px rgba(0,0,0,0.35)' }}>
          <div style={{ opacity:0.6, fontSize:11 }}>Hotkeys: F frei, P Perf</div>
        </div>
      )}
    </div>
  );
};

export default UnifiedControls;
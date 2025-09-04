import React, { useState } from 'react';

interface UnifiedControlsProps {
  interactive: boolean;
  onToggleInteractive: () => void;
  terrainEnabled: boolean;
  toggleTerrain: () => void;
  terrainExag: number;
  setTerrainExag: (v:number)=>void;
  transitionSpeed: number;
  setTransitionSpeed: (v:number)=>void;
}

// Single compact floating control panel (top-right) merging previous ModeToggle + SettingsPanel DEM section.
const UnifiedControls: React.FC<UnifiedControlsProps> = ({ interactive, onToggleInteractive, terrainEnabled, toggleTerrain, terrainExag, setTerrainExag, transitionSpeed, setTransitionSpeed }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ position:'fixed', top:8, right:8, zIndex:50, display:'flex', flexDirection:'column', alignItems:'flex-end', gap:8 }}>
      <div style={{ display:'flex', gap:8 }}>
        <button onClick={onToggleInteractive} style={{ padding:'8px 14px', borderRadius:20, border:'1px solid #888', background: interactive ? '#222' : '#3FB1CE', color:'#fff', cursor:'pointer', fontSize:13, minWidth:150 }}>{interactive ? 'Story Modus' : 'Freie Navigation'}</button>
        <button onClick={()=>setOpen(o=>!o)} style={{ padding:'8px 14px', borderRadius:20, border:'1px solid #888', background:'#444', color:'#fff', cursor:'pointer', fontSize:13 }}>{open ? 'Schließen' : 'DEM & Optionen'}</button>
      </div>
      {open && (
        <div style={{ background:'rgba(0,0,0,0.65)', backdropFilter:'blur(6px)', padding:14, borderRadius:12, width:280, color:'#fff', fontSize:12, boxShadow:'0 6px 18px rgba(0,0,0,0.35)' }}>
          <label style={{ display:'flex', alignItems:'center', gap:8, marginBottom:10 }}>
            <input type="checkbox" checked={terrainEnabled} onChange={toggleTerrain} /> DEM aktivieren
          </label>
          {terrainEnabled && (
            <>
              <label style={{ display:'block', marginBottom:10 }}>Überhöhung: {terrainExag.toFixed(2)}
                <input type="range" min={0.5} max={3} step={0.1} value={terrainExag} onChange={e=>setTerrainExag(parseFloat(e.target.value))} style={{ width:'100%' }} />
              </label>
              <label style={{ display:'block', marginBottom:10 }}>Transition Speed: {transitionSpeed.toFixed(2)}
                <input type="range" min={0.2} max={2} step={0.1} value={transitionSpeed} onChange={e=>setTransitionSpeed(parseFloat(e.target.value))} style={{ width:'100%' }} />
              </label>
            </>
          )}
          {!terrainEnabled && (
            <div style={{ opacity:0.75, fontSize:11, marginBottom:8 }}>Aktiviere DEM um Überhöhung & Geschwindigkeit zu steuern.</div>
          )}
          <div style={{ opacity:0.6, fontSize:11 }}>Hotkeys: F frei, T DEM, P Perf</div>
        </div>
      )}
    </div>
  );
};

export default UnifiedControls;
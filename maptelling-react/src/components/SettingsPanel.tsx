import React from 'react';

interface SettingsPanelProps {
  terrainEnabled: boolean;
  onToggleTerrain: () => void;
  terrainExag: number;
  setTerrainExag: (v: number) => void;
  transitionSpeed: number;
  setTransitionSpeed: (v: number) => void;
  showPerf: boolean;
  togglePerf: () => void;
  wmsCacheEnabled: boolean;
  setWmsCacheEnabled: (fn: (v: boolean) => boolean) => void | void;
}

const SettingsPanel: React.FC<SettingsPanelProps> = ({
  terrainEnabled,
  onToggleTerrain,
  terrainExag,
  setTerrainExag,
  transitionSpeed,
  setTransitionSpeed,
  showPerf,
  togglePerf,
  wmsCacheEnabled,
  setWmsCacheEnabled,
}) => {
  return (
    <div style={{ position:'fixed', bottom:8, right:8, zIndex:35, background:'rgba(0,0,0,0.55)', padding:12, borderRadius:6, color:'#fff', width:260, fontSize:12 }}>
      <div style={{ fontWeight:600, marginBottom:6 }}>Einstellungen</div>
      <label style={{ display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
        <input type="checkbox" checked={terrainEnabled} onChange={onToggleTerrain} /> DEM / Terrain aktiv
      </label>
      {terrainEnabled && (
        <label style={{ display:'block', marginBottom:6 }}>Terrain Exaggeration: {terrainExag.toFixed(2)}
          <input type="range" min={0.5} max={3} step={0.1} value={terrainExag} onChange={e=>setTerrainExag(parseFloat(e.target.value))} style={{ width:'100%' }} />
        </label>
      )}
      <label style={{ display:'block', marginBottom:6 }}>Transition Speed: {transitionSpeed.toFixed(2)}
        <input type="range" min={0.2} max={2} step={0.1} value={transitionSpeed} onChange={e=>setTransitionSpeed(parseFloat(e.target.value))} style={{ width:'100%' }} />
      </label>
      <label style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
        <input type="checkbox" checked={showPerf} onChange={togglePerf} /> Performance
      </label>
      <label style={{ display:'flex', alignItems:'center', gap:6, marginBottom:4 }}>
        <input type="checkbox" checked={wmsCacheEnabled} onChange={()=>setWmsCacheEnabled(v=>!v as any)} /> WMS Cache
      </label>
      <div style={{ opacity:0.7, fontSize:11 }}>Hotkeys: F freie Navi, T Terrain, P Perf</div>
    </div>
  );
};

export default SettingsPanel;

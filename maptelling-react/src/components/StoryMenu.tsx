import React, { useState, useRef } from 'react';
import { resetStoredChapters } from '../context/ChaptersContext';
import { useChapters } from '../context/ChaptersContext';

interface StoryMenuProps {
  creatorOpen: boolean;
  toggleCreator: () => void;
}

// Unified story tools menu (bottom-left)
const StoryMenu: React.FC<StoryMenuProps> = ({ creatorOpen, toggleCreator }) => {
  const [open, setOpen] = useState<boolean>(false);
  // Creation / editing panels removed to avoid overlapping white forms
  const [importInfo, setImportInfo] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement|null>(null);
  const chaptersCtx = useChapters();

  const handleExport = () => {
    try {
      const data = chaptersCtx.exportChapters();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'maptelling_chapters.json';
      a.click();
      URL.revokeObjectURL(url);
    } catch {/* ignore */}
  };
  const handleImportClick = () => fileInputRef.current?.click();
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const json = JSON.parse(reader.result as string);
        const res = chaptersCtx.importChapters(json);
        setImportInfo(`Import: ${res.imported} gesamt, Overrides: ${res.overrides}, Extras: ${res.extras}`);
        e.target.value = '';
      } catch(err:any) {
        setImportInfo('Import Fehler');
      }
    };
    reader.readAsText(file);
  };

  return (
  <div style={{ position:'fixed', left:8, top:8, zIndex:40, fontSize:12, fontFamily:'system-ui, sans-serif' }}>
      {/* Main toggle button */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        <button
          onClick={()=>setOpen(o=>!o)}
          style={{ padding:'6px 10px', borderRadius:4, background:'#222', color:'#fff', border:'none', cursor:'pointer', boxShadow:'0 2px 6px rgba(0,0,0,0.25)' }}
        >{open ? 'Menü schließen' : 'Story Menü'}</button>
        {open && (
          <>
            <span style={{ alignSelf:'center', fontWeight:600, color:'#222', background:'#fff', padding:'6px 10px', borderRadius:4 }}>Story</span>
            <button
              onClick={toggleCreator}
              style={{ padding:'6px 10px', borderRadius:4, background: creatorOpen ? '#b5179e' : '#3FB1CE', color:'#fff', border:'none', cursor:'pointer' }}
            >{creatorOpen ? 'Abbrechen' : 'Neues Kapitel'}</button>
            <button
              onClick={()=>{ resetStoredChapters(); localStorage.removeItem('maptelling.chapters.overrides'); window.location.reload(); }}
              style={{ padding:'6px 10px', borderRadius:4, background:'#555', color:'#fff', border:'none', cursor:'pointer' }}
            >Reset Overrides</button>
            <button
              onClick={handleExport}
              style={{ padding:'6px 10px', borderRadius:4, background:'#2d6a4f', color:'#fff', border:'none', cursor:'pointer' }}
            >Export</button>
            <button
              onClick={handleImportClick}
              style={{ padding:'6px 10px', borderRadius:4, background:'#bc6c25', color:'#fff', border:'none', cursor:'pointer' }}
            >Import</button>
            <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImport} style={{ display:'none' }} />
          </>
        )}
      </div>
      {importInfo && open && (
        <div style={{ marginTop:6, background:'rgba(0,0,0,0.35)', padding:'4px 8px', borderRadius:4, color:'#fff', fontSize:11 }}>{importInfo}</div>
      )}
    </div>
  );
};

export default StoryMenu;

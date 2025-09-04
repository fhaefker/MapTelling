import React, { useState } from 'react';
import StoryCreator from './StoryCreator';
import StoryEditor from './StoryEditor';
import { resetStoredChapters } from '../context/ChaptersContext';

// Unified story tools menu (bottom-left)
const StoryMenu: React.FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const [creatorOpen, setCreatorOpen] = useState<boolean>(false);
  const [editorOpen, setEditorOpen] = useState<boolean>(false);

  return (
    <div style={{ position:'fixed', left:8, bottom:8, zIndex:40, fontSize:12, fontFamily:'system-ui, sans-serif' }}>
      {/* Main toggle button */}
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        <button
          onClick={()=>setOpen(o=>!o)}
          style={{ padding:'6px 10px', borderRadius:4, background:'#222', color:'#fff', border:'none', cursor:'pointer', boxShadow:'0 2px 6px rgba(0,0,0,0.25)' }}
        >{open ? 'Menü schließen' : 'Story Menü'}</button>
        {open && (
          <>
            <button
              onClick={()=>setCreatorOpen(o=>!o)}
              style={{ padding:'6px 10px', borderRadius:4, background: creatorOpen? '#3FB1CE':'#3FB1CE', color:'#fff', border:'none', cursor:'pointer' }}
            >{creatorOpen ? 'Neu (–)' : 'Neues Kapitel'}</button>
            <button
              onClick={()=>setEditorOpen(o=>!o)}
              style={{ padding:'6px 10px', borderRadius:4, background: editorOpen? '#8a4fff':'#8a4fff', color:'#fff', border:'none', cursor:'pointer' }}
            >{editorOpen ? 'Editor (–)' : 'Kapitel Editor'}</button>
            <button
              onClick={()=>{ resetStoredChapters(); localStorage.removeItem('maptelling.chapters.overrides'); window.location.reload(); }}
              style={{ padding:'6px 10px', borderRadius:4, background:'#555', color:'#fff', border:'none', cursor:'pointer' }}
            >Reset Overrides</button>
          </>
        )}
      </div>
      {open && (
        <div style={{ marginTop:8, display:'flex', gap:12 }}>
          {creatorOpen && <StoryCreator embedded open={creatorOpen} onToggleOpen={setCreatorOpen} />}
          {editorOpen && <StoryEditor floating={false} />}
        </div>
      )}
    </div>
  );
};

export default StoryMenu;

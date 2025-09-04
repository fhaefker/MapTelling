import React, { useState } from 'react';
import type { Chapter } from '../types/story';
import { useRenderLog } from '../hooks/useRenderLog';
import { useInView } from 'react-intersection-observer';
import { useChapters } from '../context/ChaptersContext';

interface StoryScrollerProps {
  currentChapter: number;
  onEnterChapter: (index: number) => void;
  disabled?: boolean; // when true, ignore scroll-based chapter changes
  passThrough?: boolean; // when true, let pointer events hit map (free navigation mode)
}

const StoryScrollerComponent: React.FC<StoryScrollerProps> = ({ currentChapter, onEnterChapter, disabled, passThrough }) => {
  const { chapters, addChapter, updateChapter } = useChapters() as any;
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [editId, setEditId] = useState<string|undefined>();
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const startEdit = (id:string, title:string, desc:string) => { setEditId(id); setEditTitle(title); setEditDesc(desc); };
  const saveEdit = () => { if (editId) { updateChapter(editId, { title: editTitle, description: editDesc }); setEditId(undefined); } };
  const createChapter = () => {
    if (!newTitle.trim()) return;
    const base = chapters[chapters.length-1];
    addChapter({ title: newTitle, description: newDesc, alignment: 'left', location: base?.location || { center:[0,0], zoom:5 } });
    setNewTitle(''); setNewDesc(''); setCreatorOpen(false);
  };
  useRenderLog('StoryScroller');
  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
  overflowY: passThrough ? 'hidden' : 'auto',
  pointerEvents: passThrough ? 'none' : 'auto',
        zIndex: 5,
        padding: '16px',
      }}
    >
      {/* Inline Header + Creator Toggle */}
      <div style={{ maxWidth: 720, margin:'16px auto 8px', display:'flex', gap:12, alignItems:'center' }}>
        <h1 style={{ margin:0, fontSize:22 }}>Story</h1>
        <button onClick={()=>setCreatorOpen(o=>!o)} style={{ padding:'6px 10px', borderRadius:6, border:'1px solid #ccc', background:'#fff', cursor:'pointer' }}>{creatorOpen ? 'Abbrechen' : 'Neues Kapitel'}</button>
      </div>
      {creatorOpen && (
        <div style={{ maxWidth:720, margin:'0 auto 16px', background:'rgba(255,255,255,0.95)', padding:16, borderRadius:8, boxShadow:'0 4px 12px rgba(0,0,0,0.1)', display:'flex', flexDirection:'column', gap:8 }}>
          <input placeholder="Titel" value={newTitle} onChange={e=>setNewTitle(e.target.value)} style={{ padding:8, borderRadius:4, border:'1px solid #ccc' }} />
          <textarea placeholder="Beschreibung" value={newDesc} onChange={e=>setNewDesc(e.target.value)} style={{ padding:8, borderRadius:4, border:'1px solid #ccc', minHeight:80 }} />
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={createChapter} style={{ flex:1, background:'#3FB1CE', color:'#fff', border:'none', padding:'8px 12px', borderRadius:4, cursor:'pointer' }}>Speichern</button>
            <button onClick={()=>{ setCreatorOpen(false); setNewTitle(''); setNewDesc(''); }} style={{ background:'#eee', border:'1px solid #ccc', padding:'8px 12px', borderRadius:4, cursor:'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Chapters (dynamic from context) */}
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
  {chapters.map((ch: Chapter, idx: number) => {
          const handleEnter = () => { if (!disabled) onEnterChapter(idx); };
          return (
            <MemoChapterStep
              key={ch.id}
              index={idx}
              active={idx === currentChapter}
              title={editId===ch.id ? editTitle : ch.title}
              description={editId===ch.id ? editDesc : ch.description}
              onEnter={handleEnter}
              onEdit={() => startEdit(ch.id, ch.title, ch.description)}
              editing={editId===ch.id}
              editTitle={editTitle}
              editDesc={editDesc}
              setEditTitle={setEditTitle}
              setEditDesc={setEditDesc}
              saveEdit={saveEdit}
              cancelEdit={()=>setEditId(undefined)}
            />
          );
        })}
      </div>

      {/* Footer */}
      <div style={{ height: '30vh' }} />
    </div>
  );
};

const ChapterStep: React.FC<{
  index: number;
  active: boolean;
  title: string;
  description: string;
  onEnter: () => void;
  onEdit: () => void;
  editing: boolean;
  editTitle: string;
  editDesc: string;
  setEditTitle: (v:string)=>void;
  setEditDesc: (v:string)=>void;
  saveEdit: () => void;
  cancelEdit: () => void;
}> = ({ active, title, description, onEnter, onEdit, editing, editTitle, editDesc, setEditTitle, setEditDesc, saveEdit, cancelEdit }) => {
  const { ref } = useInView({
    threshold: 0.6,
    onChange: (inView) => {
      if (inView) onEnter();
    },
  });

  return (
    <div ref={ref} style={{ margin: '48vh 0' }}>
      <div style={{
          background: 'rgba(255,255,255,0.95)',
          borderRadius: 10,
          padding: 20,
          boxShadow: active ? '0 6px 16px rgba(63,177,206,0.4)' : '0 4px 12px rgba(0,0,0,0.1)',
          borderLeft: active ? '4px solid #3FB1CE' : '4px solid transparent',
          position:'relative'
        }}>
        {!editing && (
          <button onClick={onEdit} style={{ position:'absolute', top:8, right:8, background:'#eee', border:'1px solid #ccc', borderRadius:4, fontSize:11, padding:'4px 6px', cursor:'pointer' }}>Edit</button>
        )}
        {editing ? (
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            <input value={editTitle} onChange={e=>setEditTitle(e.target.value)} style={{ padding:8, borderRadius:4, border:'1px solid #ccc' }} />
            <textarea value={editDesc} onChange={e=>setEditDesc(e.target.value)} style={{ padding:8, borderRadius:4, border:'1px solid #ccc', minHeight:80 }} />
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={saveEdit} style={{ flex:1, background:'#3FB1CE', color:'#fff', border:'none', padding:'8px 12px', borderRadius:4, cursor:'pointer' }}>Save</button>
              <button onClick={cancelEdit} style={{ background:'#eee', border:'1px solid #ccc', padding:'8px 12px', borderRadius:4, cursor:'pointer' }}>Cancel</button>
            </div>
          </div>
        ) : (
          <>
            <h3 style={{ marginTop: 0 }}>{title}</h3>
            <p style={{ marginBottom: 0 }}>{description}</p>
          </>
        )}
      </div>
    </div>
  );
};

const MemoChapterStep = React.memo(ChapterStep, (a, b) => a.active === b.active && a.title === b.title && a.description === b.description && a.editing === b.editing && a.editTitle === b.editTitle && a.editDesc === b.editDesc);
const StoryScroller = React.memo(StoryScrollerComponent);
export default StoryScroller;

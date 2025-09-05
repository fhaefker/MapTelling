import React, { useState, useEffect } from 'react';
import type { Chapter } from '../types/story';
import { useRenderLog } from '../hooks/useRenderLog';
import useImageStore from '../hooks/useImageStore';
import { useInView } from 'react-intersection-observer';
import { useChapters } from '../context/ChaptersContext';
import { useMap } from '@mapcomponents/react-maplibre';

interface StoryScrollerProps {
  currentChapter: number;
  onEnterChapter: (index: number) => void;
  disabled?: boolean; // when true, ignore scroll-based chapter changes
  passThrough?: boolean; // when true, let pointer events hit map (free navigation mode)
  creatorOpen: boolean;
  onToggleCreator: () => void; // kept for potential future use (not used internally now)
}

const StoryScrollerComponent: React.FC<StoryScrollerProps> = ({ currentChapter, onEnterChapter, disabled, passThrough, creatorOpen }) => {
  const { chapters, addChapter, updateChapter } = useChapters() as any;
  const { map } = useMap({ mapId: 'maptelling-map' });
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [panelWidth, setPanelWidth] = useState<number>(400);
  const [editId, setEditId] = useState<string|undefined>();
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const startEdit = (id:string, title:string, desc:string) => { setEditId(id); setEditTitle(title); setEditDesc(desc); };
  const saveEdit = () => { if (editId) { updateChapter(editId, { title: editTitle, description: editDesc }); setEditId(undefined); } };
  const createChapter = () => {
    if (!newTitle.trim()) return;
    let center:[number, number] = [0,0];
    let zoom = 5;
    try {
      if (map?.map) {
        const c = map.map.getCenter();
        center = [c.lng, c.lat];
        zoom = map.map.getZoom();
      } else if (chapters.length) {
        center = chapters[chapters.length-1].location.center;
        zoom = chapters[chapters.length-1].location.zoom;
      }
    } catch {/* ignore */}
    addChapter({ title: newTitle, description: newDesc, alignment: 'left', location: { center, zoom }, marker: { coordinates: center } });
    setNewTitle(''); setNewDesc('');
  };
  // Responsive width
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 480) setPanelWidth(Math.max(260, w - 32));
      else if (w < 768) setPanelWidth(320);
      else if (w < 1024) setPanelWidth(360);
      else setPanelWidth(400);
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  useRenderLog('StoryScroller');
  // Auto-scroll when currentChapter changes via external navigation (next/prev/play)
  useEffect(() => {
    if (passThrough) return; // in free navigation mode we don't manage scrolling
    const ch = chapters[currentChapter];
    if (!ch) return;
    const el = document.getElementById(`chapter-card-${ch.id}`);
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const vh = window.innerHeight || 800;
    // Only scroll if card is substantially out of a central band
    const outOfView = rect.top < vh * 0.15 || rect.bottom > vh * 0.85;
    if (outOfView && typeof (el as any).scrollIntoView === 'function') {
      try { el.scrollIntoView({ behavior: 'smooth', block: 'center' }); } catch {/* ignore */}
    }
  }, [currentChapter, chapters, passThrough]);
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
      {creatorOpen && (
  <div style={{ width:panelWidth, margin:'16px 0 16px 16px', background:'rgba(255,255,255,0.95)', padding:16, borderRadius:8, boxShadow:'0 4px 12px rgba(0,0,0,0.1)', display:'flex', flexDirection:'column', gap:8 }}>
          <input placeholder="Titel" value={newTitle} onChange={e=>setNewTitle(e.target.value)} style={{ padding:8, borderRadius:4, border:'1px solid #ccc' }} />
          <textarea placeholder="Beschreibung" value={newDesc} onChange={e=>setNewDesc(e.target.value)} style={{ padding:8, borderRadius:4, border:'1px solid #ccc', minHeight:80 }} />
          <div style={{ display:'flex', gap:8 }}>
            <button onClick={createChapter} style={{ flex:1, background:'#3FB1CE', color:'#fff', border:'none', padding:'8px 12px', borderRadius:4, cursor:'pointer' }}>Speichern</button>
            <button onClick={()=>{ setNewTitle(''); setNewDesc(''); }} style={{ background:'#eee', border:'1px solid #ccc', padding:'8px 12px', borderRadius:4, cursor:'pointer' }}>Reset</button>
          </div>
        </div>
      )}

      {/* Chapters (dynamic from context) */}
  <div style={{ width:panelWidth, margin:'0 0 0 16px' }}>
  {chapters.map((ch: Chapter, idx: number) => {
          const handleEnter = () => { if (!disabled) onEnterChapter(idx); };
          return (
            <MemoChapterStep
                key={ch.id}
              index={idx}
                chapterId={ch.id}
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
  chapterId: string;
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
}> = ({ chapterId, active, title, description, onEnter, onEdit, editing, editTitle, editDesc, setEditTitle, setEditDesc, saveEdit, cancelEdit }) => {
  const { ref } = useInView({
    threshold: 0.6,
    onChange: (inView) => {
      if (inView) onEnter();
    },
  });

  return (
  <div ref={ref} id={`chapter-card-${chapterId}`} style={{ margin: '48vh 0' }}>
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
            <ChapterImage chapterId={chapterId} />
            <p style={{ marginBottom: 0 }}>{description}</p>
          </>
        )}
      </div>
    </div>
  );
};

// Renders chapter image if configured; resolves data URL if key stored in image store
const ChapterImage: React.FC<{ chapterId: string }> = ({ chapterId }) => {
  const { chapters } = useChapters();
  const ch = chapters.find(c=>c.id===chapterId);
  const { getUrl } = useImageStore();
  if (!ch?.image) return null;
  const imgSrc = ch.image.startsWith('img:') ? (getUrl(ch.image) || undefined) : ch.image;
  if (!imgSrc) return null;
  return <img src={imgSrc} alt={ch.title} style={{ maxWidth:'100%', borderRadius:6, margin:'8px 0' }} />;
};

const MemoChapterStep = React.memo(ChapterStep, (a, b) => a.chapterId === b.chapterId && a.active === b.active && a.title === b.title && a.description === b.description && a.editing === b.editing && a.editTitle === b.editTitle && a.editDesc === b.editDesc);
const StoryScroller = React.memo(StoryScrollerComponent);
export default StoryScroller;

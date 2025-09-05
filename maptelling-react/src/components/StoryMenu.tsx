import React, { useState, useRef } from 'react';
import { resetStoredChapters } from '../context/ChaptersContext';
import { useChapters } from '../context/ChaptersContext';
import { useMap } from '@mapcomponents/react-maplibre';
import useImageStore from '../hooks/useImageStore';
import ImagePicker from './ImagePicker';
import exportProject from '../utils/exportProject';
import importProject from '../utils/importProject';

interface StoryMenuProps {
  creatorOpen: boolean;
  toggleCreator: () => void;
  onMarkerCaptureChange?: (active: boolean) => void;
}

// Unified story tools menu (bottom-left)
const StoryMenu: React.FC<StoryMenuProps> = ({ creatorOpen, toggleCreator, onMarkerCaptureChange }) => {
  const [open, setOpen] = useState<boolean>(false);
  const [panel, setPanel] = useState<'none'|'edit'>('none');
  const [importInfo, setImportInfo] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement|null>(null);
  const imageInputRef = useRef<HTMLInputElement|null>(null);
  const chaptersCtx = useChapters();
  const { map } = useMap({ mapId: 'maptelling-map' });
  const { images, addFiles, remove, getUrl } = useImageStore();
  const [embedImages, setEmbedImages] = useState(false);
  const [onlyUsed, setOnlyUsed] = useState(true);
  const [editingId, setEditingId] = useState<string|null>(null);
  const [draft, setDraft] = useState<{ title: string; description: string; alignment: string; image?: string; marker?: string; _loc?: any }|null>(null);
  const [captureMode, setCaptureMode] = useState<'none'|'marker'>('none');
  React.useEffect(()=>{ onMarkerCaptureChange && onMarkerCaptureChange(captureMode==='marker'); }, [captureMode, onMarkerCaptureChange]);
  const [showCrosshair, setShowCrosshair] = useState(true);

  const handleExport = () => {
    try {
      const payload = exportProject({ chapters: chaptersCtx.exportChapters(), images, embedImages, onlyUsedImages: onlyUsed });
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'maptelling_project.json';
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
        if (json && json.chapters && Array.isArray(json.chapters)) {
          const proj = importProject(json);
          const res = chaptersCtx.importChapters(proj.chapters);
          setImportInfo(`Import: ${res.imported} gesamt, Overrides: ${res.overrides}, Extras: ${res.extras}${proj.images?`, Images: ${proj.images.length}`:''}`);
          // merge images (avoid duplicates)
          if (proj.images && proj.images.length) {
            const existingKeys = new Set(images.map(i=>i.key));
            const newOnes = proj.images.filter(i=>!existingKeys.has(i.key));
            if (newOnes.length) {
              // quick merge by reusing addFiles persistence logic – simulate direct append
              // (simpler: localStorage already updated through setImages in hook, but we can't directly call persist
              try {
                const lsKey = 'maptelling.images.v1';
                const merged = [...images, ...newOnes];
                localStorage.setItem(lsKey, JSON.stringify(merged));
              } catch {/* ignore */}
            }
          }
        } else {
          const res = chaptersCtx.importChapters(json);
          setImportInfo(`Import: ${res.imported} gesamt, Overrides: ${res.overrides}, Extras: ${res.extras}`);
        }
        e.target.value = '';
      } catch(err:any) {
        setImportInfo('Import Fehler');
      }
    };
    reader.readAsText(file);
  };

  const startNew = () => {
    setEditingId(null);
    setDraft({ title:'Neues Kapitel', description:'', alignment:'left' });
    setPanel('edit');
  };
  const editChapter = (id: string) => {
    const ch = chaptersCtx.chapters.find(c=>c.id===id);
    if(!ch) return;
    setEditingId(id);
    setDraft({ title: ch.title, description: ch.description, alignment: ch.alignment || 'left', image: ch.image, marker: ch.marker ? ch.marker.coordinates.join(',') : '' });
    setPanel('edit');
  };
  const captureView = () => {
    if(!map?.map || !draft) return;
    try {
      const c = map.map.getCenter();
      const zoom = map.map.getZoom();
      const pitch = map.map.getPitch();
      const bearing = map.map.getBearing();
      // store in temp state by mutating draft (we finalize on save)
      setDraft(d => d ? { ...d, _loc: { center:[c.lng, c.lat], zoom, pitch, bearing } as any } : d);
    } catch {/* ignore */}
  };
  // Map click marker capture handler
  React.useEffect(()=>{
    if(!map?.map) return;
    const m:any = map.map;
    if(captureMode==='marker'){
      const handler = (e:any) => {
        const lng = e?.lngLat?.lng ?? e?.lngLat?.[0];
        const lat = e?.lngLat?.lat ?? e?.lngLat?.[1];
        if (typeof lng === 'number' && typeof lat === 'number') {
          setDraft(d=> d? { ...d, marker: `${lng.toFixed(5)},${lat.toFixed(5)}` }:d);
          setCaptureMode('none');
        }
      };
      m.on && m.on('click', handler);
  const esc = (ev:KeyboardEvent) => { if (ev.key === 'Escape') { setCaptureMode('none'); } };
  window.addEventListener('keydown', esc);
      return ()=>{ m.off && m.off('click', handler); };
    }
  }, [map, captureMode]);
  const triggerImage = () => imageInputRef.current?.click();
  const handleImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const added = await addFiles(e.target.files);
    if (added.length && draft) {
      setDraft(d => d ? { ...d, image: added[0].key } : d);
    }
    e.target.value='';
  };
  const saveDraft = () => {
    if(!draft) return;
    const location = (draft as any)._loc || { center:[0,0], zoom:5, pitch:0, bearing:0 };
    const marker = draft.marker && draft.marker.includes(',') ? { coordinates: draft.marker.split(',').map(n=>parseFloat(n.trim())) as [number, number] } : undefined;
    if (editingId) {
      chaptersCtx.updateChapter(editingId, { title:draft.title, description:draft.description, alignment:draft.alignment as any, image: draft.image, location, marker });
    } else {
      chaptersCtx.addChapter({ id: undefined, title:draft.title, description:draft.description, alignment:draft.alignment as any, image: draft.image, location, marker });
    }
    setPanel('none'); setDraft(null); setEditingId(null);
  };
  const imageUrl = draft?.image ? getUrl(draft.image) || draft.image : undefined;

  return (
    <div style={{ position:'fixed', left:8, top:8, zIndex:40, fontSize:12, fontFamily:'system-ui, sans-serif' }}>
      <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
        <button onClick={()=>setOpen(o=>!o)} style={{ padding:'6px 10px', borderRadius:4, background:'#222', color:'#fff', border:'none', cursor:'pointer', boxShadow:'0 2px 6px rgba(0,0,0,0.25)' }}>{open ? 'Menü schließen' : 'Story Menü'}</button>
        {open && (
          <>
            <button onClick={startNew} style={{ padding:'6px 10px', borderRadius:4, background:'#3FB1CE', color:'#fff', border:'none' }}>Neu</button>
            <button onClick={handleExport} style={{ padding:'6px 10px', borderRadius:4, background:'#2d6a4f', color:'#fff', border:'none' }}>Export</button>
            <button onClick={handleImportClick} style={{ padding:'6px 10px', borderRadius:4, background:'#bc6c25', color:'#fff', border:'none' }}>Import</button>
      {open && panel==='none' && (
        <div style={{ marginTop:6, background:'rgba(0,0,0,0.6)', padding:10, borderRadius:6, color:'#fff', maxWidth:360 }}>
          <div style={{ fontWeight:600, marginBottom:6 }}>Export Optionen</div>
          <label style={{ display:'flex', gap:6, alignItems:'center', fontSize:11, marginBottom:4 }}>
            <input type="checkbox" checked={embedImages} onChange={e=>setEmbedImages(e.target.checked)} /> Bilder einbetten
          </label>
          <label style={{ display:'flex', gap:6, alignItems:'center', fontSize:11, marginBottom:8, opacity: embedImages?1:0.5 }}>
            <input type="checkbox" checked={onlyUsed} disabled={!embedImages} onChange={e=>setOnlyUsed(e.target.checked)} /> Nur verwendete Bilder
          </label>
          <div style={{ fontSize:10, opacity:0.65, lineHeight:1.3 }}>Einbetten speichert Base64 Daten der Bilder im exportierten JSON. Das erhöht die Dateigröße.</div>
        </div>
      )}
            <button onClick={()=>{ resetStoredChapters(); localStorage.removeItem('maptelling.chapters.overrides'); window.location.reload(); }} style={{ padding:'6px 10px', borderRadius:4, background:'#555', color:'#fff', border:'none' }}>Reset</button>
            <input ref={fileInputRef} type="file" accept="application/json" onChange={handleImport} style={{ display:'none' }} />
            <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImages} style={{ display:'none' }} />
          </>
        )}
      </div>
      {open && panel==='none' && (
        <div style={{ marginTop:6, background:'rgba(0,0,0,0.6)', padding:10, borderRadius:6, color:'#fff', maxWidth:340 }}>
          <div style={{ fontWeight:600, marginBottom:6 }}>Kapitel</div>
          <div style={{ maxHeight:220, overflowY:'auto', display:'grid', gap:4 }}>
            {chaptersCtx.chapters.map((ch, idx) => (
              <div key={ch.id} style={{ display:'flex', alignItems:'center', gap:4, background:'rgba(255,255,255,0.08)', padding:'4px 6px', borderRadius:4 }}>
                <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{idx+1}. {ch.title}</span>
                <div style={{ display:'flex', gap:4 }}>
                  <button disabled={idx===0} onClick={()=>chaptersCtx.moveChapter(ch.id,-1)} style={{ padding:'2px 6px', fontSize:11, border:'1px solid #666', background:'transparent', color: idx===0 ? '#555':'#ccc', borderRadius:4, cursor: idx===0?'default':'pointer' }}>↑</button>
                  <button disabled={idx===chaptersCtx.chapters.length-1} onClick={()=>chaptersCtx.moveChapter(ch.id,1)} style={{ padding:'2px 6px', fontSize:11, border:'1px solid #666', background:'transparent', color: idx===chaptersCtx.chapters.length-1 ? '#555':'#ccc', borderRadius:4, cursor: idx===chaptersCtx.chapters.length-1?'default':'pointer' }}>↓</button>
                  <button onClick={()=>editChapter(ch.id)} style={{ padding:'2px 6px', fontSize:11, border:'1px solid #3FB1CE', background:'transparent', color:'#3FB1CE', borderRadius:4, cursor:'pointer' }}>Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
  {open && panel==='edit' && draft && (
        <div style={{ marginTop:6, background:'rgba(0,0,0,0.75)', padding:12, borderRadius:8, color:'#fff', width:360 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
            <strong>{editingId ? 'Kapitel bearbeiten' : 'Kapitel erstellen'}</strong>
            <button onClick={()=>{ setPanel('none'); setDraft(null); setEditingId(null); }} style={{ background:'transparent', border:'none', color:'#fff', cursor:'pointer' }}>×</button>
          </div>
          <label style={{ display:'block', marginBottom:8 }}>Titel
            <input value={draft.title} onChange={e=>setDraft(d=> d? { ...d, title:e.target.value }:d)} style={{ width:'100%', padding:4, borderRadius:4, border:'1px solid #444', background:'#111', color:'#fff' }} />
          </label>
          <label style={{ display:'block', marginBottom:8 }}>Beschreibung
            <textarea value={draft.description} onChange={e=>setDraft(d=> d? { ...d, description:e.target.value }:d)} rows={3} style={{ width:'100%', padding:4, borderRadius:4, border:'1px solid #444', background:'#111', color:'#fff' }} />
          </label>
          <label style={{ display:'block', marginBottom:8 }}>Alignment
            <select value={draft.alignment} onChange={e=>setDraft(d=> d? { ...d, alignment:e.target.value }:d)} style={{ width:'100%', padding:4, borderRadius:4, border:'1px solid #444', background:'#111', color:'#fff' }}>
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
              <option value="full">full</option>
            </select>
          </label>
          <div style={{ display:'flex', gap:8, marginBottom:8 }}>
            <button onClick={captureView} style={{ flex:1, padding:'6px 8px', borderRadius:4, background:'#3FB1CE', color:'#fff', border:'none', cursor:'pointer' }}>Karte übernehmen</button>
            <button onClick={triggerImage} style={{ flex:1, padding:'6px 8px', borderRadius:4, background:'#b5179e', color:'#fff', border:'none', cursor:'pointer' }}>Bild wählen</button>
          </div>
          {imageUrl && <div style={{ marginBottom:8 }}><img src={imageUrl} alt="Kapitel" style={{ maxWidth:'100%', borderRadius:4 }} /></div>}
          <div style={{ marginBottom:10 }}>
            <ImagePicker images={images} current={draft.image} onSelect={key=>setDraft(d=> d? { ...d, image:key }:d)} onRemove={remove} />
          </div>
          <label style={{ display:'block', marginBottom:8 }}>Marker (lng,lat)
            <input value={draft.marker||''} onChange={e=>setDraft(d=> d? { ...d, marker:e.target.value }:d)} placeholder="-5.12,56.99" style={{ width:'100%', padding:4, borderRadius:4, border:'1px solid #444', background:'#111', color:'#fff' }} />
          </label>
          <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:8 }}>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={()=>setCaptureMode(c=> c==='marker'?'none':'marker')} style={{ flex:1, padding:'6px 8px', borderRadius:4, background: captureMode==='marker' ? '#ff6b6b':'#444', color:'#fff', border:'none', cursor:'pointer' }}>{captureMode==='marker' ? 'Marker: Klick… (Esc)' : 'Marker von Karte'}</button>
              <button disabled={!draft.marker} onClick={()=>setDraft(d=> d? { ...d, marker: undefined }:d)} style={{ padding:'6px 8px', borderRadius:4, background: draft.marker ? '#e63946':'#555', color:'#fff', border:'none', cursor: draft.marker?'pointer':'default' }}>X</button>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <label style={{ display:'flex', alignItems:'center', gap:4, fontSize:11, background:'#222', padding:'4px 6px', borderRadius:4 }}>
                <input type="checkbox" checked={showCrosshair} onChange={e=>setShowCrosshair(e.target.checked)} /> Crosshair
              </label>
              {draft._loc && <span style={{ flex:1, fontSize:10, lineHeight:1.3, background:'#222', padding:'6px 8px', borderRadius:4 }}><strong>View:</strong><br />{draft._loc.center[0].toFixed(3)},{draft._loc.center[1].toFixed(3)} z{draft._loc.zoom.toFixed(2)}</span>}
            </div>
          </div>
          <div style={{ display:'flex', justifyContent:'space-between', gap:8 }}>
            {editingId && <button onClick={()=>{ chaptersCtx.resetChapter(editingId); setPanel('none'); }} style={{ flex:1, padding:'6px 8px', borderRadius:4, background:'#777', color:'#fff', border:'none', cursor:'pointer' }}>Reset</button>}
            <button onClick={saveDraft} style={{ flex:2, padding:'6px 8px', borderRadius:4, background:'#2d6a4f', color:'#fff', border:'none', cursor:'pointer' }}>Speichern</button>
          </div>
        </div>
      )}
      {importInfo && open && (
        <div style={{ marginTop:6, background:'rgba(0,0,0,0.35)', padding:'4px 8px', borderRadius:4, color:'#fff', fontSize:11 }}>{importInfo}</div>
      )}
    </div>
  );
};

export default StoryMenu;

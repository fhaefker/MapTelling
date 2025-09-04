import React, { useState, useEffect } from 'react';
import { useChapters } from '../context/ChaptersContext';
import type { Chapter } from '../types/story';
import { useMap } from '@mapcomponents/react-maplibre';

interface StoryEditorProps {
  floating?: boolean;
}

// Lightweight inline editor for existing chapters (title, description, location, marker, alignment, image replace)
const StoryEditor: React.FC<StoryEditorProps> = ({ floating = true }) => {
  const { chapters, updateChapter, resetChapter, removeChapter, getOriginal } = useChapters() as any;
  const mapCtx: any = useMap({ mapId: 'maptelling-map' });
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string>('');
  const [draft, setDraft] = useState<Partial<Chapter>>({});
  const [picking, setPicking] = useState<null | 'center' | 'marker'>(null);
  const [msg, setMsg] = useState('');
  const [history, setHistory] = useState<Partial<Chapter>[]>([]);
  const [errors, setErrors] = useState<Record<string,string>>({});

  useEffect(() => {
    if (!selectedId) return;
    const ch = chapters.find((c: Chapter) => c.id === selectedId);
    if (ch) {
      const snapshot = {
        title: ch.title,
        description: ch.description,
        alignment: ch.alignment,
        image: ch.image,
        location: { ...ch.location },
        marker: ch.marker ? { coordinates: [...ch.marker.coordinates] as [number, number] } : undefined
      } as Partial<Chapter>;
      setDraft(snapshot);
      setHistory([snapshot]);
      setErrors({});
    }
  }, [selectedId]);

  // one-off map click picking
  useEffect(() => {
    const core = mapCtx.map?.map; if (!core || !picking) return;
    const handler = (e: any) => {
      if (picking === 'center') {
        setDraft(d => ({ ...d, location: { ...(d.location||{ center:[0,0], zoom:5 }), center:[e.lngLat.lng, e.lngLat.lat] } as any }));
      } else if (picking === 'marker') {
        setDraft(d => ({ ...d, marker: { coordinates:[e.lngLat.lng, e.lngLat.lat] } as any }));
      }
      setPicking(null);
    };
    core.once('click', handler);
    return () => { core.off && core.off('click', handler); };
  }, [mapCtx.map, picking]);

  const applyCurrentView = () => {
    const core = mapCtx.map?.map; if (!core) return;
    const c = core.getCenter();
    setDraft(d => ({ ...d, location: { ...(d.location||{ center:[c.lng, c.lat], zoom: core.getZoom() }), center:[c.lng, c.lat], zoom: core.getZoom() } as any }));
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader(); reader.onload = () => setDraft(d => ({ ...d, image: reader.result as string })); reader.readAsDataURL(file);
  };

  const validate = () => {
    const e: Record<string,string> = {};
    if (draft.location) {
      const { center, zoom } = draft.location as any;
      if (!Array.isArray(center) || center.length !== 2 || center.some((v:any)=> typeof v !== 'number' || isNaN(v))) e.center = 'Ungültiges Center';
      if (typeof zoom !== 'number' || isNaN(zoom) || zoom < 0 || zoom > 22) e.zoom = 'Zoom 0–22';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const save = () => {
    if (!selectedId) return;
    if (!validate()) { setMsg('Fehler, nicht gespeichert'); setTimeout(()=>setMsg(''), 2000); return; }
    updateChapter(selectedId, draft);
    setMsg('Gespeichert');
    setTimeout(()=> setMsg(''), 2000);
  };

  const undo = () => {
    if (history.length <= 1) return;
    setHistory(h => {
      const next = [...h];
      next.pop();
      const prev = next[next.length -1];
      setDraft(prev);
      return next;
    });
  };
  const pushHistory = (next: Partial<Chapter>) => {
    setHistory(h => h.length > 30 ? [...h.slice(h.length-30), next] : [...h, next]);
  };
  const onDraftChange = (mut: (d:Partial<Chapter>)=>Partial<Chapter>) => {
    setDraft(d => {
      const updated = mut({ ...d });
      pushHistory(updated);
      return updated;
    });
  };
  const reset = () => { if (!selectedId) return; const r = resetChapter(selectedId); if (r) { setDraft(r); setHistory([r]); setMsg('Zurückgesetzt'); setTimeout(()=>setMsg(''),1500);} };
  const remove = () => { if (!selectedId) return; const orig = getOriginal(selectedId); if (orig) { setMsg('Basis-Kapitel kann nicht gelöscht werden'); setTimeout(()=>setMsg(''),2000); return; } removeChapter(selectedId); setSelectedId(''); setDraft({}); setHistory([]); setMsg('Gelöscht'); setTimeout(()=>setMsg(''),2000); };
  const preview = () => {
    if (!selectedId) return; const core = mapCtx.map?.map; if (!core || !draft.location) return;
    const loc:any = draft.location;
    try { core.flyTo({ center: loc.center, zoom: loc.zoom, bearing: loc.bearing||0, pitch: loc.pitch||0, speed:0.8 }); } catch {}
  };

  const panel = (
    <div style={{ background:'#fff', padding:12, borderRadius:6, boxShadow:'0 4px 14px rgba(0,0,0,0.15)', width:340, maxHeight:'70vh', overflow:'auto', fontSize:12 }}>
      <h3 style={{ marginTop:0 }}>Kapitel bearbeiten</h3>
      <label style={{ display:'block', marginBottom:6 }}>Kapitel
        <select value={selectedId} onChange={e=>setSelectedId(e.target.value)} style={{ width:'100%' }}>
          <option value="">-- wählen --</option>
          {chapters.map((c:Chapter)=> <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
      </label>
      {selectedId && (
        <>
          <label style={{ display:'block', marginBottom:4 }}>Titel
            <input value={draft.title||''} onChange={e=>onDraftChange(d=>({...d,title:e.target.value}))} style={{ width:'100%' }} />
          </label>
          <label style={{ display:'block', marginBottom:4 }}>Beschreibung
            <textarea value={draft.description||''} onChange={e=>onDraftChange(d=>({...d,description:e.target.value}))} style={{ width:'100%', minHeight:60 }} />
          </label>
          <label style={{ display:'block', marginBottom:4 }}>Alignment
            <select value={draft.alignment||''} onChange={e=>onDraftChange(d=>({...d,alignment:e.target.value as any}))} style={{ width:'100%' }}>
              <option value="">(default)</option>
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
              <option value="full">full</option>
            </select>
          </label>
          <fieldset style={{ border:'1px solid #ddd', padding:6, marginBottom:6 }}>
            <legend style={{ fontSize:11 }}>Location</legend>
            <div style={{ display:'flex', gap:4, marginBottom:4 }}>
              <button type="button" onClick={applyCurrentView} style={{ flex:1, padding:'4px 6px', border:'1px solid #ccc', background:'#f5f5f5', cursor:'pointer' }}>Kartenansicht</button>
              <button type="button" onClick={()=>setPicking('center')} style={{ flex:1, padding:'4px 6px', border:'1px solid #ccc', background: picking==='center'? '#3FB1CE':'#f5f5f5', color: picking==='center'? '#fff':'#000', cursor:'pointer' }}>Pick</button>
            </div>
            <label style={{ display:'block', marginBottom:4 }}>Lng<input value={draft.location?.center[0] ?? ''} onChange={e=>onDraftChange(d=>({ ...d, location:{ ...(d.location||{ center:[0,0], zoom:5 }), center:[parseFloat(e.target.value)||0, d.location?.center[1]||0], zoom: d.location?.zoom||5 } as any }))} style={{ width:'100%' , borderColor: errors.center? '#d33':'#ccc'}} /></label>
            <label style={{ display:'block', marginBottom:4 }}>Lat<input value={draft.location?.center[1] ?? ''} onChange={e=>onDraftChange(d=>({ ...d, location:{ ...(d.location||{ center:[0,0], zoom:5 }), center:[d.location?.center[0]||0, parseFloat(e.target.value)||0], zoom: d.location?.zoom||5 } as any }))} style={{ width:'100%', borderColor: errors.center? '#d33':'#ccc' }} /></label>
            <label style={{ display:'block', marginBottom:4 }}>Zoom<input value={draft.location?.zoom ?? ''} onChange={e=>onDraftChange(d=>({ ...d, location:{ ...(d.location||{ center:[0,0], zoom:5 }), center:[...(d.location?.center||[0,0])], zoom: parseFloat(e.target.value)||0 } as any }))} style={{ width:'100%', borderColor: errors.zoom? '#d33':'#ccc' }} />{errors.zoom && <span style={{ color:'#d33' }}>{errors.zoom}</span>}</label>
          </fieldset>
          <fieldset style={{ border:'1px solid #ddd', padding:6, marginBottom:6 }}>
            <legend style={{ fontSize:11 }}>Marker</legend>
            <div style={{ display:'flex', gap:4, marginBottom:4 }}>
              <button type="button" onClick={()=>setPicking('marker')} style={{ flex:1, padding:'4px 6px', border:'1px solid #ccc', background: picking==='marker'? '#3FB1CE':'#f5f5f5', color: picking==='marker'? '#fff':'#000', cursor:'pointer' }}>Pick</button>
              <button type="button" onClick={()=>setDraft(d=>({...d, marker: undefined}))} style={{ flex:1, padding:'4px 6px', border:'1px solid #ccc', background:'#f5f5f5' }}>Entfernen</button>
            </div>
            <label style={{ display:'block', marginBottom:4 }}>Lng<input value={draft.marker?.coordinates[0] ?? ''} onChange={e=>onDraftChange(d=>({ ...d, marker:{ coordinates:[parseFloat(e.target.value)||0, d.marker?.coordinates[1]||0] } as any }))} style={{ width:'100%' }} /></label>
            <label style={{ display:'block', marginBottom:4 }}>Lat<input value={draft.marker?.coordinates[1] ?? ''} onChange={e=>onDraftChange(d=>({ ...d, marker:{ coordinates:[d.marker?.coordinates[0]||0, parseFloat(e.target.value)||0] } as any }))} style={{ width:'100%' }} /></label>
          </fieldset>
          <label style={{ display:'block', marginBottom:6 }}>Bild ersetzen<input type="file" accept="image/*" onChange={onFile} /></label>
          {draft.image && <div style={{ marginBottom:8 }}><img src={draft.image} alt="preview" style={{ maxWidth:'100%' }} /></div>}
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
            <button type="button" onClick={save} style={{ flex:1, background:'#222', color:'#fff', padding:'6px 10px', border:'none', borderRadius:4, cursor:'pointer' }}>Speichern</button>
            <button type="button" onClick={undo} style={{ flex:1, background:'#555', color:'#fff', padding:'6px 10px', border:'none', borderRadius:4, cursor:'pointer' }} disabled={history.length<=1}>Undo</button>
            <button type="button" onClick={preview} style={{ flex:1, background:'#3FB1CE', color:'#fff', padding:'6px 10px', border:'none', borderRadius:4, cursor:'pointer' }}>Preview</button>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:6 }}>
            <button type="button" onClick={reset} style={{ flex:1, background:'#8a4fff', color:'#fff', padding:'6px 10px', border:'none', borderRadius:4, cursor:'pointer' }}>Reset</button>
            <button type="button" onClick={remove} style={{ flex:1, background:'#c43131', color:'#fff', padding:'6px 10px', border:'none', borderRadius:4, cursor:'pointer' }}>Löschen</button>
          </div>
          {msg && <div style={{ color:'#2b7a2b', fontSize:11 }}>{msg}</div>}
        </>
      )}
    </div>
  );

  return (
    <div style={{ position: floating? 'fixed':'static', right:8, bottom:8, zIndex:30 }}>
      <button onClick={()=>setOpen(o=>!o)} style={{ padding:'6px 10px', borderRadius:4, background:'#8a4fff', color:'#fff', border:'none', cursor:'pointer', marginBottom:6 }}>
        {open ? 'Editor schließen' : 'Kapitel Editor'}
      </button>
      {open && panel}
    </div>
  );
};

export default StoryEditor;

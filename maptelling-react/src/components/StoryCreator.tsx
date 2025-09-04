import React, { useState, useCallback, useEffect } from 'react';
import { useChapters, resetStoredChapters } from '../context/ChaptersContext';
import type { ChapterLocation } from '../types/story';
import { useMap } from '@mapcomponents/react-maplibre';
import { useT } from '../i18n/I18nProvider';

interface StoryCreatorProps {
  onCreated?: (id: string) => void;
  embedded?: boolean; // eingebettet in StoryMenu
  open?: boolean; // kontrollierter Zustand bei embedded
  onToggleOpen?: (next: boolean) => void; // callback bei toggle (embedded ignoriert eigenen Button)
}

// Simple inline story creation panel (demo). In a real app this might be a modal.
const StoryCreator: React.FC<StoryCreatorProps> = ({ onCreated, embedded, open, onToggleOpen }) => {
  const { addChapter } = useChapters();
  const t = useT();
  const mapCtx: any = useMap({ mapId: 'maptelling-map' });
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [alignment, setAlignment] = useState<'left'|'center'|'right'|'full'>('left');
  const [imageData, setImageData] = useState<string | undefined>();
  const [centerLng, setCenterLng] = useState<string>('0');
  const [centerLat, setCenterLat] = useState<string>('0');
  const [zoom, setZoom] = useState<string>('5');
  const [markerLng, setMarkerLng] = useState<string>('');
  const [markerLat, setMarkerLat] = useState<string>('');
  const [selfOpen, setSelfOpen] = useState(false);
  const isControlled = !!embedded && typeof open === 'boolean';
  const actualOpen = isControlled ? open : selfOpen;
  const [picking, setPicking] = useState<null | 'center' | 'marker'>(null);
  const [message, setMessage] = useState<string>('');
  const [errors, setErrors] = useState<Record<string,string>>({});

  const toggle = () => {
    if (isControlled) {
      onToggleOpen && onToggleOpen(!actualOpen);
    } else {
      setSelfOpen(o => !o);
    }
  };

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  // Map picking (one-off)
  useEffect(() => {
    const core = mapCtx.map?.map;
    if (!core || !picking) return;
    const handler = (e: any) => {
      if (picking === 'center') {
        setCenterLng(e.lngLat.lng.toFixed(5));
        setCenterLat(e.lngLat.lat.toFixed(5));
      } else if (picking === 'marker') {
        setMarkerLng(e.lngLat.lng.toFixed(5));
        setMarkerLat(e.lngLat.lat.toFixed(5));
      }
      setPicking(null);
    };
    core.once('click', handler);
    return () => { core.off && core.off('click', handler); };
  }, [mapCtx.map, picking]);

  const useCurrentView = () => {
    const core = mapCtx.map?.map; if (!core) return;
    const c = core.getCenter();
    setCenterLng(c.lng.toFixed(5));
    setCenterLat(c.lat.toFixed(5));
    setZoom(core.getZoom().toFixed(2));
  };

  const validate = () => {
    const errs: Record<string,string> = {};
    const num = (v:string) => !v.trim() || isNaN(Number(v));
    if (num(centerLng)) errs.centerLng = t('creator.error.numeric');
    if (num(centerLat)) errs.centerLat = t('creator.error.numeric');
    if (num(zoom)) errs.zoom = t('creator.error.numeric');
    const zv = parseFloat(zoom); if (!isNaN(zv) && (zv < 0 || zv > 22)) errs.zoom = t('creator.error.zoomRange');
    if (markerLng && num(markerLng)) errs.markerLng = t('creator.error.numeric');
    if (markerLat && num(markerLat)) errs.markerLat = t('creator.error.numeric');
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const location: ChapterLocation = {
      center: [parseFloat(centerLng), parseFloat(centerLat)],
      zoom: parseFloat(zoom)
    };
    const marker = markerLng && markerLat ? { coordinates: [parseFloat(markerLng), parseFloat(markerLat)] as [number, number] } : undefined;
    const chapter = addChapter({
      title: title || 'Untitled',
      description: description || '',
      alignment,
      image: imageData,
      location,
      marker
    });
    if (onCreated) onCreated(chapter.id);
    if (isControlled) {
      onToggleOpen && onToggleOpen(false);
    } else {
      setSelfOpen(false);
    }
    setTitle(''); setDescription(''); setImageData(undefined); setMarkerLng(''); setMarkerLat('');
    setMessage(t('creator.saved'));
    setTimeout(()=> setMessage(''), 2500);
  };

  const panel = actualOpen && (
    <form onSubmit={submit} style={{ marginTop: embedded ? 0 : 8, background:'#fff', padding:12, width:320, maxHeight:'70vh', overflow:'auto', borderRadius:6, boxShadow:'0 4px 14px rgba(0,0,0,0.15)', fontSize:12 }}>
          <label style={{ display:'block', marginBottom:4 }}>{t('creator.title')}<input value={title} onChange={e=>setTitle(e.target.value)} style={{ width:'100%' }} /></label>
          <label style={{ display:'block', marginBottom:4 }}>{t('creator.description')}<textarea value={description} onChange={e=>setDescription(e.target.value)} style={{ width:'100%', minHeight:60 }} /></label>
          <label style={{ display:'block', marginBottom:4 }}>{t('creator.alignment')}
            <select value={alignment} onChange={e=>setAlignment(e.target.value as any)} style={{ width:'100%' }}>
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
              <option value="full">full</option>
            </select>
          </label>
          <fieldset style={{ border:'1px solid #ddd', padding:6, marginBottom:6 }}>
            <legend style={{ fontSize:11 }}>Location</legend>
            <div style={{ display:'flex', gap:4 }}>
              <button type="button" onClick={useCurrentView} style={{ flex:1, padding:'4px 6px', border:'1px solid #ccc', background:'#f5f5f5', cursor:'pointer' }}>{t('creator.useCurrentView')}</button>
              <button type="button" onClick={()=>setPicking('center')} style={{ flex:1, padding:'4px 6px', border:'1px solid #ccc', background: picking==='center' ? '#3FB1CE' : '#f5f5f5', color: picking==='center'? '#fff':'#000', cursor:'pointer' }}>{t('creator.pick')}</button>
            </div>
            <label style={{ display:'block', marginBottom:4 }}>{t('creator.location.lng')}<input value={centerLng} onChange={e=>setCenterLng(e.target.value)} style={{ width:'100%', borderColor: errors.centerLng? '#d33':'#ccc' }} />{errors.centerLng && <span style={{ color:'#d33' }}>{errors.centerLng}</span>}</label>
            <label style={{ display:'block', marginBottom:4 }}>{t('creator.location.lat')}<input value={centerLat} onChange={e=>setCenterLat(e.target.value)} style={{ width:'100%', borderColor: errors.centerLat? '#d33':'#ccc' }} />{errors.centerLat && <span style={{ color:'#d33' }}>{errors.centerLat}</span>}</label>
            <label style={{ display:'block', marginBottom:4 }}>{t('creator.location.zoom')}<input value={zoom} onChange={e=>setZoom(e.target.value)} style={{ width:'100%', borderColor: errors.zoom? '#d33':'#ccc' }} />{errors.zoom && <span style={{ color:'#d33' }}>{errors.zoom}</span>}</label>
          </fieldset>
            <fieldset style={{ border:'1px solid #ddd', padding:6, marginBottom:6 }}>
            <legend style={{ fontSize:11 }}>Marker</legend>
            <div style={{ display:'flex', gap:4 }}>
              <button type="button" onClick={()=>setPicking('marker')} style={{ flex:1, padding:'4px 6px', border:'1px solid #ccc', background: picking==='marker' ? '#3FB1CE' : '#f5f5f5', color: picking==='marker'? '#fff':'#000', cursor:'pointer' }}>{t('creator.pick')}</button>
            </div>
            <label style={{ display:'block', marginBottom:4 }}>{t('creator.marker.lng')}<input value={markerLng} onChange={e=>setMarkerLng(e.target.value)} style={{ width:'100%', borderColor: errors.markerLng? '#d33':'#ccc' }} />{errors.markerLng && <span style={{ color:'#d33' }}>{errors.markerLng}</span>}</label>
            <label style={{ display:'block', marginBottom:4 }}>{t('creator.marker.lat')}<input value={markerLat} onChange={e=>setMarkerLat(e.target.value)} style={{ width:'100%', borderColor: errors.markerLat? '#d33':'#ccc' }} />{errors.markerLat && <span style={{ color:'#d33' }}>{errors.markerLat}</span>}</label>
          </fieldset>
          <label style={{ display:'block', marginBottom:8 }}>{t('creator.image')}<input type="file" accept="image/*" onChange={onFile} /></label>
          {imageData && <div style={{ marginBottom:8 }}><img src={imageData} alt="preview" style={{ maxWidth:'100%' }} /></div>}
          <button type="submit" style={{ background:'#222', color:'#fff', padding:'6px 10px', border:'none', borderRadius:4, cursor:'pointer', width:'100%' }}>{t('creator.submit')}</button>
          {message && <div style={{ marginTop:6, color:'#2b7a2b', fontSize:11 }}>{message}</div>}
        </form>
  );

  if (embedded) {
    return (
      <div>
        {panel}
      </div>
    );
  }
  return (
    <div style={{ position:'fixed', left:8, bottom:8, zIndex:20 }}>
      <button onClick={toggle} style={{ padding:'6px 10px', borderRadius:4, background:'#3FB1CE', color:'#fff', border:'none', cursor:'pointer', marginRight:6 }}>
        {actualOpen ? t('creator.close') : t('creator.open')}
      </button>
      {actualOpen && (
        <button onClick={() => { resetStoredChapters(); window.location.reload(); }} style={{ padding:'6px 10px', borderRadius:4, background:'#555', color:'#fff', border:'none', cursor:'pointer' }}>{t('creator.clearStored')}</button>
      )}
      {panel}
    </div>
  );
};

export default StoryCreator;
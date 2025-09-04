import React, { useState, useCallback } from 'react';
import { useChapters } from '../context/ChaptersContext';
import type { ChapterLocation } from '../types/story';

interface StoryCreatorProps {
  onCreated?: (id: string) => void;
}

// Simple inline story creation panel (demo). In a real app this might be a modal.
const StoryCreator: React.FC<StoryCreatorProps> = ({ onCreated }) => {
  const { addChapter } = useChapters();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [alignment, setAlignment] = useState<'left'|'center'|'right'|'full'>('left');
  const [imageData, setImageData] = useState<string | undefined>();
  const [centerLng, setCenterLng] = useState<string>('0');
  const [centerLat, setCenterLat] = useState<string>('0');
  const [zoom, setZoom] = useState<string>('5');
  const [markerLng, setMarkerLng] = useState<string>('');
  const [markerLat, setMarkerLat] = useState<string>('');
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen(o => !o);

  const onFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result as string);
    reader.readAsDataURL(file);
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
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
    setOpen(false);
    setTitle(''); setDescription(''); setImageData(undefined); setMarkerLng(''); setMarkerLat('');
  };

  return (
    <div style={{ position:'fixed', left:8, bottom:8, zIndex:20 }}>
      <button onClick={toggle} style={{ padding:'6px 10px', borderRadius:4, background:'#3FB1CE', color:'#fff', border:'none', cursor:'pointer' }}>
        {open ? 'Close Creator' : 'Add Story'}
      </button>
      {open && (
        <form onSubmit={submit} style={{ marginTop:8, background:'#fff', padding:12, width:300, maxHeight:'70vh', overflow:'auto', borderRadius:6, boxShadow:'0 4px 14px rgba(0,0,0,0.15)', fontSize:12 }}>
          <label style={{ display:'block', marginBottom:4 }}>Title<input value={title} onChange={e=>setTitle(e.target.value)} style={{ width:'100%' }} /></label>
          <label style={{ display:'block', marginBottom:4 }}>Description<textarea value={description} onChange={e=>setDescription(e.target.value)} style={{ width:'100%', minHeight:60 }} /></label>
          <label style={{ display:'block', marginBottom:4 }}>Alignment
            <select value={alignment} onChange={e=>setAlignment(e.target.value as any)} style={{ width:'100%' }}>
              <option value="left">left</option>
              <option value="center">center</option>
              <option value="right">right</option>
              <option value="full">full</option>
            </select>
          </label>
          <fieldset style={{ border:'1px solid #ddd', padding:6, marginBottom:6 }}>
            <legend style={{ fontSize:11 }}>Location</legend>
            <label style={{ display:'block', marginBottom:4 }}>Lng<input value={centerLng} onChange={e=>setCenterLng(e.target.value)} style={{ width:'100%' }} /></label>
            <label style={{ display:'block', marginBottom:4 }}>Lat<input value={centerLat} onChange={e=>setCenterLat(e.target.value)} style={{ width:'100%' }} /></label>
            <label style={{ display:'block', marginBottom:4 }}>Zoom<input value={zoom} onChange={e=>setZoom(e.target.value)} style={{ width:'100%' }} /></label>
          </fieldset>
            <fieldset style={{ border:'1px solid #ddd', padding:6, marginBottom:6 }}>
            <legend style={{ fontSize:11 }}>Optional Marker</legend>
            <label style={{ display:'block', marginBottom:4 }}>Marker Lng<input value={markerLng} onChange={e=>setMarkerLng(e.target.value)} style={{ width:'100%' }} /></label>
            <label style={{ display:'block', marginBottom:4 }}>Marker Lat<input value={markerLat} onChange={e=>setMarkerLat(e.target.value)} style={{ width:'100%' }} /></label>
          </fieldset>
          <label style={{ display:'block', marginBottom:8 }}>Image<input type="file" accept="image/*" onChange={onFile} /></label>
          {imageData && <div style={{ marginBottom:8 }}><img src={imageData} alt="preview" style={{ maxWidth:'100%' }} /></div>}
          <button type="submit" style={{ background:'#222', color:'#fff', padding:'6px 10px', border:'none', borderRadius:4, cursor:'pointer', width:'100%' }}>Create Chapter</button>
        </form>
      )}
    </div>
  );
};

export default StoryCreator;
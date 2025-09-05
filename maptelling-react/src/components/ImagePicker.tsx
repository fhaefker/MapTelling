import React from 'react';

export interface ImageRecord { key: string; dataUrl: string; name?: string; size?: number; type?: string; }
interface ImagePickerProps {
  images: ImageRecord[];
  current?: string;
  onSelect: (key: string) => void;
  onRemove?: (key: string) => void;
}

const ImagePicker: React.FC<ImagePickerProps> = ({ images, current, onSelect, onRemove }) => {
  if (!images.length) return <div style={{ fontSize:11, opacity:0.6 }}>Noch keine Bilder hochgeladen.</div>;
  return (
    <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(72px,1fr))', gap:6, maxHeight:180, overflowY:'auto' }}>
      {images.map(img => (
        <div key={img.key} style={{ position:'relative', border: img.key===current ? '2px solid #3FB1CE':'1px solid #333', borderRadius:4, cursor:'pointer', background:'#111' }}>
          <img src={img.dataUrl} alt={img.name||img.key} style={{ width:'100%', height:56, objectFit:'cover', borderTopLeftRadius:4, borderTopRightRadius:4 }} onClick={()=>onSelect(img.key)} />
          <div style={{ padding:'2px 4px', fontSize:10, whiteSpace:'nowrap', textOverflow:'ellipsis', overflow:'hidden', color:'#eee' }}>{img.name||img.key}</div>
          {onRemove && <button onClick={()=>onRemove(img.key)} style={{ position:'absolute', top:2, right:2, background:'rgba(0,0,0,0.6)', border:'none', color:'#fff', fontSize:10, borderRadius:3, padding:'2px 4px', cursor:'pointer' }}>×</button>}
        </div>
      ))}
    </div>
  );
};

export default ImagePicker;
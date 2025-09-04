import React, { useEffect } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';

export interface GeoJsonLineProps {
  mapId: string;
  id: string; // unique id for both source & layer
  data: GeoJSON.FeatureCollection | GeoJSON.Feature | any;
  paint?: any;
  before?: string;
  lineCap?: 'round'|'butt'|'square';
}

// Minimal upstream-aligned declarative line layer (replaces local CompositeGeoJsonLine addSource/addLayer usage for single line case)
const GeoJsonLine: React.FC<GeoJsonLineProps> = ({ mapId, id, data, paint, before, lineCap='round' }) => {
  const { map } = useMap({ mapId });
  useEffect(()=>{
    const m:any = map?.map; if(!m) return;
    if(!m.getSource(id)) {
      m.addSource(id, { type:'geojson', data });
    } else {
      try { const src:any = m.getSource(id); src.setData && src.setData(data); } catch {}
    }
    if(!m.getLayer(id)) {
      m.addLayer({ id, type:'line', source:id, layout:{ 'line-cap': lineCap, 'line-join':'round' }, paint }, before);
    } else if(paint) {
      Object.entries(paint).forEach(([k,v])=>{ try { m.setPaintProperty(id, k, v as any); } catch {} });
    }
    return () => { try { if(m.getLayer(id)) m.removeLayer(id); } catch{} }; // keep source for quick re-enable
  }, [map?.map, id, JSON.stringify(paint), data, before, lineCap]);
  return null;
};

export default GeoJsonLine;

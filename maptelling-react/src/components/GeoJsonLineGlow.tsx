import React from 'react';
import GeoJsonLine, { GeoJsonLineProps } from './GeoJsonLine';

/**
 * GeoJsonLineGlow
 * Convenience wrapper to emulate deprecated CompositeGeoJsonLine glow behavior using two GeoJsonLine instances.
 */
export interface GeoJsonLineGlowProps extends Omit<GeoJsonLineProps,'id'|'paint'> {
  idBase?: string; // base id used for glow + main
  color?: string;
  width?: number;
  glow?: { width?: number; color?: string; opacity?: number } | false;
}

export const GeoJsonLineGlow:React.FC<GeoJsonLineGlowProps> = ({ mapId, data, idBase='line', color='#ff6b6b', width=4, glow={ width:8, color:'#ff6b6b', opacity:0.3 }, before }) => {
  const glowWidth = glow ? (glow.width ?? width*2) : 0;
  return <>
    {glow && <GeoJsonLine mapId={mapId} data={data} id={`${idBase}-glow`} before={before} paint={{ 'line-color': glow.color || color, 'line-width': glowWidth, 'line-opacity': glow.opacity ?? 0.3 }} />}
    <GeoJsonLine mapId={mapId} data={data} id={`${idBase}-main`} before={before} paint={{ 'line-color': color, 'line-width': width, 'line-opacity': 0.9 }} />
  </>;
};
export default GeoJsonLineGlow;

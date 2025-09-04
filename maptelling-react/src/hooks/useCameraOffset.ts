import { useCallback } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';

/**
 * useCameraOffset
 * Projects a lng/lat to screen space, applies pixel offset, unprojects back.
 * Safe guarded for tests / map not ready.
 */
export const useCameraOffset = (mapId:string, offsetPxLeft:number) => {
  const { map } = useMap({ mapId });
  const applyOffset = useCallback((center:[number,number]):[number,number] => {
    if(!map?.map || !offsetPxLeft) return center;
    try {
      const p = map.map.project(center as any);
      p.x += offsetPxLeft;
      return map.map.unproject(p) as any;
    } catch { return center; }
  }, [map?.map, offsetPxLeft]);
  return applyOffset;
};
export default useCameraOffset;

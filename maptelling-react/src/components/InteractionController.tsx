import { useEffect } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';

interface InteractionControllerProps {
  mapId: string;
  interactive: boolean;
}

// Centralises enabling/disabling user interaction (see anti-duplication & lifecycle guidance sec40/sec48)
export const InteractionController = ({ mapId, interactive }: InteractionControllerProps) => {
  const { map } = useMap({ mapId });

  useEffect(() => {
    if (!map?.map) return;
    const m = map.map;
    const enable = () => {
      m.scrollZoom.enable();
      m.dragPan.enable();
      m.keyboard.enable();
      m.doubleClickZoom.enable();
      m.touchZoomRotate.enable();
    };
    const disable = () => {
      m.scrollZoom.disable();
      m.dragPan.disable();
      m.keyboard.disable();
      m.doubleClickZoom.disable();
      m.touchZoomRotate.disable();
    };
    if (interactive) enable(); else disable();
  }, [interactive, map?.map]);

  return null;
};

export default InteractionController;

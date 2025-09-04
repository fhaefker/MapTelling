import React, { useEffect } from 'react';
import { useMap } from '@mapcomponents/react-maplibre';

export interface TerrainConfig {
  enabled?: boolean;
  // Either provide a tiles template array or a URL to a style/source
  tiles?: string[]; // e.g. ["https://api.maptiler.com/tiles/terrain-rgb-v2/{z}/{x}/{y}.png?key=YOUR_KEY"]
  url?: string; // e.g. "https://demotiles.maplibre.org/terrain.json" (only if compatible)
  tileSize?: 256 | 512;
  exaggeration?: number; // default ~1.5
}

interface TerrainManagerProps {
  mapId: string;
  config?: TerrainConfig;
}

// TerrainManager deprecated (terrain handled in MapShell + MlTerrain). Stub only.
export default function TerrainManager() {
  return null;
}

import type { MapConfig } from '../types/story';

// Extended base map configuration supporting multiple vector style candidates
// and a WMS fallback (if all vector styles fail). The WMS endpoint here is
// a placeholder; replace with a verified WhereGroup OSM WMS once available.
export interface ExtendedMapConfig extends MapConfig {
  vectorStyleCandidates?: string[]; // Ordered preference list
  wmsFallback?: {
    baseUrl: string; // WMS service endpoint without parameters
    layers: string;  // Comma separated layer list
    format?: string; // Default image/png
    version?: '1.1.1' | '1.3.0';
    attribution?: string;
  };
  osmDemo?: {
    baseUrl: string;
    version?: '1.1.1' | '1.3.0';
  }
}

// Note: Use a token-free, public demo style to avoid Mapbox. Replace with your own style if needed.
export const config: ExtendedMapConfig = {
  // WhereGroup tileserver demo style (corrected URL)
  style: 'https://wms.wheregroup.com/tileserver/styles/bright/style.json',
  // Additional candidate style URLs (first that loads wins). Include MapLibre demo as safe final vector fallback.
  vectorStyleCandidates: [
    'https://wms.wheregroup.com/tileserver/styles/bright/style.json',
    // Potential alternative style names (guessed common OpenMapTiles presets) - kept for future verification
    'https://wms.wheregroup.com/tileserver/styles/basic/style.json',
    'https://wms.wheregroup.com/tileserver/styles/openmaptiles/style.json',
    // Public demo fallback
    'https://demotiles.maplibre.org/style.json'
  ],
  // WMS fallback (replace baseUrl & layers with a confirmed WhereGroup endpoint when available)
  // WMS fallback entfernt bis eine eigene / WhereGroup OSM WMS Quelle verifiziert ist.
  wmsFallback: undefined,
  // WhereGroup OSM demo root remembered by user; capabilities at /ows?service=WMS&request=GetCapabilities
  // We'll reference it elsewhere when implementing dynamic WMS layer injection.
  // Just storing base for future use.
  // Not yet wired to runtime style fallback logic.
  osmDemo: {
    baseUrl: 'https://osm-demo.wheregroup.com/ows?',
    version: '1.3.0'
  },
  chapters: [
    {
      id: 'Day00_Overview',
      alignment: 'left',
      title: 'Cape Wrath Overview',
  image: '/assets/day00.jpg',
      description: '17 Tage, Distanz: 433km, Aufstieg: 11.857m',
      location: {
        center: [-5.38018, 57.53349],
        zoom: 5,
        pitch: 0,
        bearing: 0,
      },
    },
    {
      id: 'Day01_FortWilliam',
      alignment: 'right',
      title: 'The Start in Fort William',
  image: '/assets/day01.jpg',
      description:
        'The first steps on 18.10.2024 around 10am. This shows the unofficial start (after ~12 km from the ferry).',
      location: {
        center: [-5.18589, 56.80544],
        zoom: 10.8,
        pitch: 0,
        bearing: 0,
      },
  marker: { coordinates: [-5.26066, 56.77998] },
    },
    {
      id: 'Day02-b_theMud',
      alignment: 'center',
      title: 'The Cape Wrath Trail is a story of mud',
  image: '/assets/day02_b.jpg',
      description:
        'To show what I literally mean by "up to my knees in mud". Backpack weight ~24kg at this time.',
      location: {
        center: [-5.37895, 56.9576],
        zoom: 10,
        pitch: 0,
        bearing: 0,
      },
  marker: { coordinates: [-5.36124, 56.94596] },
    },
    {
      id: 'Day02_goldenGrass',
      alignment: 'right',
      title: 'A field of golden grass',
  image: '/assets/day02.jpg',
      description:
        'Photo from day two, approx. 50 km after leaving Fort William. Reaching this place and camping by the river was incredible.',
      location: {
        center: [-5.35729, 56.96189],
        zoom: 12,
        pitch: 0,
        bearing: 0,
      },
    },
    {
      id: 'Day03_InverieBay',
      alignment: 'full',
      title: 'The sunset over Inverie Bay',
  image: '/assets/day03.jpg',
      description:
        'Day three detour to Inverie. Hardest day with knee-deep mud at Loch Nevis, but the camp spot was worth it.',
      location: {
        center: [-5.63052, 57.02287],
        zoom: 12,
        pitch: 0,
        bearing: 0,
      },
    },
  ],
  showInset: true,
  terrain: {
    enabled: false,
    // Example for MapTiler Terrain RGB (requires your own key):
    // tiles: [
    //   'https://api.maptiler.com/tiles/terrain-rgb-v2/{z}/{x}/{y}.png?key=YOUR_KEY'
    // ],
    // tileSize: 512,
    // exaggeration: 1.5,
  },
};

import type { MapConfig } from '../types/story';

// Minimal extended map config focusing ONLY on the WhereGroup OSM demo WMS.
// All vector style / fallback logic has been removed per user request.
export interface WmsOnlyMapConfig extends MapConfig {
  wms: {
    baseUrl: string; // ends with ? or & for param appending
    version: '1.1.1' | '1.3.0';
    layers: string; // Chosen confirmed layer (first valid from earlier candidates)
    format?: string;
    attribution?: string;
  };
}

// We still have to satisfy MapConfig.style (string) although it is unused now; provide a sentinel.
export const config: WmsOnlyMapConfig = {
  style: 'wms-only', // sentinel (never used directly)
  wms: {
    baseUrl: 'https://osm-demo.wheregroup.com/ows?',
    version: '1.3.0',
    // Selected primary candidate. Adjust if capabilities later show a different canonical layer name.
    layers: 'osm_auto:all',
    format: 'image/png',
    attribution: '© OpenStreetMap contributors / WhereGroup Demo WMS'
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
    enabled: true,
    // AWS Terrarium PNG tiles (public). Provides elevations in RGB encoded Terrarium scheme.
    tiles: [
      'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
    ],
    tileSize: 256,
    exaggeration: 1.4,
    encoding: 'terrarium',
  },
};

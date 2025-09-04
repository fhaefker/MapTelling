import type { MapConfig } from '../types/story';

// Note: Use a token-free, public demo style to avoid Mapbox. Replace with your own style if needed.
export const config: MapConfig = {
  // Using WhereGroup (demo) vector tiles style. Adjust if a different WhereGroup style endpoint is preferred.
  // Assumption: public accessible style.json endpoint. Replace with the exact provided demo URL if different.
  style: 'https://maps.wheregroup.com/styles/bright/style.json',
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

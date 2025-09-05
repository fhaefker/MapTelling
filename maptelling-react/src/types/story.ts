// Central story/narrative related types (ARCH-03)
import type { FeatureCollection, LineString } from 'geojson';

export interface ChapterLocation {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
}

export interface Chapter {
  id: string;
  title: string;
  description: string;
  alignment?: 'left' | 'center' | 'right' | 'full';
  image?: string;
  location: ChapterLocation;
  marker?: { coordinates: [number, number] };
}

export interface MapConfig {
  style: string;
  chapters: Chapter[];
  trackData?: FeatureCollection<LineString>;
  showInset?: boolean;
  terrain?: {
    enabled?: boolean;
    tiles?: string[];
    url?: string;
    tileSize?: 256 | 512;
    exaggeration?: number;
  encoding?: 'terrarium' | 'mapbox';
  };
}

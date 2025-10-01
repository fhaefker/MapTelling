/**
 * MapTelling Story Types
 * 
 * Konforme GeoJSON FeatureCollection (RFC 7946)
 * für foto-basierte Story-Erzählungen
 * 
 * @version 2.0
 * @standard OGC GeoJSON RFC 7946
 */

/**
 * Photo Story als GeoJSON FeatureCollection
 */
export interface PhotoStory {
  type: "FeatureCollection";
  features: PhotoFeature[];
  metadata: StoryMetadata;
}

/**
 * Story Metadaten (ISO 19115 inspiriert)
 */
export interface StoryMetadata {
  /** UUID v4 */
  id: string;
  
  /** Story-Titel */
  title: string;
  
  /** Beschreibung (optional, Markdown-fähig) */
  description?: string;
  
  /** Autor (optional) */
  author?: string;
  
  /** Erstellungsdatum (ISO 8601) */
  created: string;
  
  /** Letzte Änderung (ISO 8601) */
  updated: string;
  
  /** Schema-Version */
  version: "1.0";
}

/**
 * Photo Feature (GeoJSON Point Feature)
 */
export interface PhotoFeature {
  type: "Feature";
  geometry: {
    type: "Point";
    coordinates: [number, number]; // [lng, lat] - WGS84
  };
  properties: PhotoProperties;
}

/**
 * Photo Properties
 */
export interface PhotoProperties {
  // Identifikation
  /** UUID v4 */
  id: string;
  
  /** Reihenfolge in Story (0-based) */
  order: number;
  
  // Media
  /** IndexedDB Key für Full-Size Foto */
  photoId: string;
  
  /** Data URL für Thumbnail (~400px) */
  thumbnailUrl: string;
  
  /** Data URL für Full-Size (optional, für Export) */
  photoUrl?: string;
  
  // Content
  /** Foto-Titel */
  title: string;
  
  /** Beschreibung (Markdown-fähig) */
  description: string;
  
  /** Zeitstempel (ISO 8601) */
  timestamp: string;
  
  // Kamera-Animation Settings
  /** MapLibre Kamera-Einstellungen */
  camera: CameraSettings;
  
  // EXIF Metadaten (optional)
  /** EXIF-Daten falls vorhanden */
  exif?: ExifData;
  
  // Position Source
  /** Herkunft der Position */
  positionSource: "exif" | "manual";
}

/**
 * MapLibre Kamera-Einstellungen
 */
export interface CameraSettings {
  /** Zoom-Level (1-22, empfohlen: 12-15) */
  zoom: number;
  
  /** Rotation in Grad (0-360, optional) */
  bearing?: number;
  
  /** Neigung in Grad (0-60, optional) */
  pitch?: number;
  
  /** Animations-Dauer in ms (default: 2000) */
  duration?: number;
  
  /** Easing-Funktion (default: "easeInOut") */
  easing?: "linear" | "easeInOut" | "easeOut";
}

/**
 * EXIF Metadaten (ISO EXIF Standard)
 */
export interface ExifData {
  /** Kamera-Modell (z.B. "Canon EOS R5") */
  camera?: string;
  
  /** Objektiv */
  lens?: string;
  
  /** Original EXIF DateTime */
  dateTime?: string;
  
  /** GPS-Höhe in Metern */
  gpsAltitude?: number;
  
  /** GPS-Genauigkeit in Metern */
  gpsAccuracy?: number;
  
  /** EXIF Orientation (1-8) */
  orientation?: number;
  
  /** Brennweite in mm */
  focalLength?: number;
  
  /** Blende (f-Nummer) */
  aperture?: number;
  
  /** Belichtungszeit */
  shutterSpeed?: string;
  
  /** ISO-Wert */
  iso?: number;
}

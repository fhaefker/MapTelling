/**
 * Camera Configuration Types
 * 
 * MapLibre-kompatible Kamera-Einstellungen für foto-spezifische Ansichten.
 * 
 * ✅ WhereGroup Principles:
 * - Transparency: Klare Interface-Definitionen
 * - Standards: MapLibre Camera Options kompatibel
 * - Maintainability: Type-Safe mit TypeScript
 * 
 * ✅ MapComponents Compliance:
 * - Kompatibel mit map.flyTo() / map.jumpTo()
 * - GeoJSON [lng, lat] Koordinaten
 * 
 * @module types/camera
 * @see https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/CameraOptions/
 */

import type { PhotoFeature } from './story';

// ========================================
// CAMERA CONFIG
// ========================================

/**
 * Kamera-Konfiguration für ein Foto
 * 
 * Kompatibel mit MapLibre CameraOptions
 */
export interface CameraConfig {
  /** Zoom-Level (0-22, typisch 8-18) */
  zoom: number;
  
  /** Rotation in Grad (0-359, 0 = Nord oben) */
  bearing: number;
  
  /** Neigung in Grad (0-60, 0 = von oben) */
  pitch: number;
  
  /** Optional: Animation-Dauer in ms */
  duration?: number;
}

/**
 * Auto-Zoom Konfigurations-Optionen
 */
export interface AutoZoomConfig {
  /** Minimaler Zoom-Level */
  minZoom: number;
  
  /** Maximaler Zoom-Level */
  maxZoom: number;
  
  /** Padding um BBox in Pixel */
  padding: number;
  
  /** Density-Faktor (0.5-1.0, niedriger = weiter rausgezoomt) */
  densityFactor: number;
}

// ========================================
// DEFAULTS
// ========================================

/** Standard Kamera-Config */
export const DEFAULT_CAMERA: CameraConfig = {
  zoom: 14,
  bearing: 0,
  pitch: 0,
  duration: 1000
};

/** Standard Auto-Zoom Config */
export const DEFAULT_AUTO_ZOOM: AutoZoomConfig = {
  minZoom: 8,
  maxZoom: 18,
  padding: 50,
  densityFactor: 0.7
};

// ========================================
// UTILITY FUNCTIONS
// ========================================

/**
 * Berechnet optimalen Zoom basierend auf Foto-Verteilung
 * 
 * Algorithmus:
 * 1. Berechne BBox aller Fotos
 * 2. Berechne max. Distanz (lat/lng)
 * 3. Zoom = log2(360 / distance) - 1
 * 4. Multipliziere mit densityFactor
 * 5. Clampe zwischen minZoom und maxZoom
 * 
 * @param photos - Array von Foto-Features
 * @param config - Auto-Zoom Konfiguration
 * @returns Optimaler Zoom-Level
 * 
 * @example
 * const zoom = calculateOptimalZoom(story.features, DEFAULT_AUTO_ZOOM);
 * // => 12.5 (bei mittlerer Foto-Dichte)
 */
export function calculateOptimalZoom(
  photos: PhotoFeature[],
  config: AutoZoomConfig = DEFAULT_AUTO_ZOOM
): number {
  // Edge Cases
  if (photos.length === 0) return config.minZoom;
  if (photos.length === 1) return DEFAULT_CAMERA.zoom;
  
  // Extrahiere Koordinaten
  const coords = photos.map(p => p.geometry.coordinates);
  const lngs = coords.map(c => c[0]);
  const lats = coords.map(c => c[1]);
  
  // Berechne BBox
  const minLng = Math.min(...lngs);
  const minLat = Math.min(...lats);
  const maxLng = Math.max(...lngs);
  const maxLat = Math.max(...lats);
  
  // Berechne max. Distanz
  const latDist = maxLat - minLat;
  const lngDist = maxLng - minLng;
  const maxDist = Math.max(latDist, lngDist);
  
  // Zoom-Formel: log2(360 / distance) - 1
  let zoom = Math.log2(360 / maxDist) - 1;
  
  // Density-Faktor anwenden (engere Verteilung = höherer Zoom)
  zoom = zoom * config.densityFactor;
  
  // Clamp zwischen min/max
  return Math.max(
    config.minZoom,
    Math.min(config.maxZoom, Math.round(zoom * 10) / 10) // Auf 0.1 runden
  );
}

/**
 * Validiert Kamera-Config
 * 
 * @param camera - Zu validierende Kamera-Config
 * @returns true wenn gültig
 */
export function isValidCamera(camera: CameraConfig): boolean {
  return (
    camera.zoom >= 0 && camera.zoom <= 22 &&
    camera.bearing >= 0 && camera.bearing <= 359 &&
    camera.pitch >= 0 && camera.pitch <= 60
  );
}

/**
 * Normalisiert Kamera-Config
 * 
 * Clampt Werte in gültige Bereiche
 * 
 * @param camera - Zu normalisierende Config
 * @returns Normalisierte Config
 */
export function normalizeCamera(camera: Partial<CameraConfig>): CameraConfig {
  return {
    zoom: Math.max(0, Math.min(22, camera.zoom ?? DEFAULT_CAMERA.zoom)),
    bearing: Math.max(0, Math.min(359, camera.bearing ?? DEFAULT_CAMERA.bearing)),
    pitch: Math.max(0, Math.min(60, camera.pitch ?? DEFAULT_CAMERA.pitch)),
    duration: camera.duration ?? DEFAULT_CAMERA.duration
  };
}
